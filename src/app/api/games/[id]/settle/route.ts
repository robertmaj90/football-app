import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/games/:id/settle - rozlicz gierkę
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const payingUserIds: string[] = body.payingUserIds || [];

  if (payingUserIds.length === 0) {
    return NextResponse.json(
      { error: "Brak graczy do rozliczenia." },
      { status: 400 }
    );
  }

  const game = await prisma.game.findUnique({
    where: { id: params.id },
    include: { signups: true, schedule: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Rozdziel koszt równo, reszta groszy trafia do pierwszych N graczy
  const count = payingUserIds.length;
  const baseAmount = Math.floor(game.pricePerGame / count);
  const remainder = game.pricePerGame - baseAmount * count; // ile groszy ekstra (0..count-1)

  // Mapuj signupId po userId dla tych co mają signup
  const signupByUserId = new Map(
    game.signups.map((s) => [s.userId, s])
  );

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < payingUserIds.length; i++) {
      const userId = payingUserIds[i];
      const perPlayer = baseAmount + (i < remainder ? 1 : 0);
      const chargeAmount = -perPlayer;

      // Utwórz płatność dla każdego
      await tx.payment.create({
        data: {
          userId,
          amount: chargeAmount,
          type: "GAME_CHARGE",
          description: `Gierka ${new Date(game.date).toLocaleDateString("pl-PL")} - ${game.schedule.name} (${count} graczy)`,
          gameId: game.id,
          createdBy: session.user.id,
        },
      });

      // Obciąż bilans
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: chargeAmount } },
      });

      // Oznacz signup jako rozliczony (jeśli gracz jest zapisany)
      const signup = signupByUserId.get(userId);
      if (signup) {
        await tx.gameSignup.update({
          where: { id: signup.id },
          data: { charged: true },
        });
      }
    }

    await tx.game.update({
      where: { id: game.id },
      data: { status: "COMPLETED" },
    });
  });

  return NextResponse.json({
    charged: payingUserIds.length,
    totalCost: game.pricePerGame,
    perPlayer: baseAmount,
  });
}
