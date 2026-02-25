import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/games/:id/settle - rozlicz granie
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const game = await prisma.game.findUnique({
    where: { id: params.id },
    include: { signups: true, schedule: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Znajdź wszystkich którzy mają być obciążeni:
  // PRESENT lub ABSENT (nie UNKNOWN) i jeszcze nie charged i nie są na liście rezerwowej
  const toCharge = game.signups.filter(
    (s) =>
      !s.charged &&
      (s.attended === "PRESENT" || s.attended === "ABSENT") &&
      !s.isReserve
  );

  if (toCharge.length === 0) {
    return NextResponse.json(
      { error: "Brak graczy do rozliczenia. Zaznacz obecność." },
      { status: 400 }
    );
  }

  // pricePerGame = koszt całego grania (np. wynajem boiska)
  // dzielimy przez liczbę graczy do obciążenia
  const perPlayerAmount = Math.round(game.pricePerGame / toCharge.length);
  const chargeAmount = -perPlayerAmount; // ujemna kwota = obciążenie

  await prisma.$transaction(async (tx) => {
    for (const signup of toCharge) {
      await tx.payment.create({
        data: {
          userId: signup.userId,
          amount: chargeAmount,
          type: "GAME_CHARGE",
          description: `Granie ${new Date(game.date).toLocaleDateString("pl-PL")} - ${game.schedule.name} (${toCharge.length} graczy)`,
          gameId: game.id,
          createdBy: session.user.id,
        },
      });

      await tx.user.update({
        where: { id: signup.userId },
        data: { balance: { increment: chargeAmount } },
      });

      await tx.gameSignup.update({
        where: { id: signup.id },
        data: { charged: true },
      });
    }

    await tx.game.update({
      where: { id: game.id },
      data: { status: "COMPLETED" },
    });
  });

  return NextResponse.json({
    charged: toCharge.length,
    totalCost: game.pricePerGame,
    perPlayer: perPlayerAmount,
  });
}
