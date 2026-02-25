import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/finance - podsumowanie finansowe
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Wszystkie płatności
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  // Wpłaty graczy (DEPOSIT)
  const deposits = payments
    .filter((p) => p.type === "DEPOSIT")
    .map((p) => ({
      id: p.id,
      userId: p.userId,
      userName: p.user.name,
      amount: p.amount,
      type: "DEPOSIT" as const,
      description: p.description,
      createdAt: p.createdAt,
    }));

  // Gierki z opłatami - agregowane per gra
  const completedGames = await prisma.game.findMany({
    where: { status: "COMPLETED" },
    orderBy: { date: "desc" },
    include: {
      schedule: { select: { name: true, location: true } },
    },
  });

  const gameEntries = completedGames.map((game) => {
    // Suma opłat za tę gierkę
    const gamePayments = payments.filter(
      (p) => p.type === "GAME_CHARGE" && p.gameId === game.id
    );
    const totalCharged = gamePayments.reduce(
      (sum, p) => sum + Math.abs(p.amount),
      0
    );
    const playersCharged = gamePayments.length;

    return {
      id: game.id,
      type: "GAME" as const,
      date: game.date,
      scheduleName: game.schedule.name,
      location: game.schedule.location,
      totalCharged,
      pricePerGame: game.pricePerGame,
      playersCharged,
      venuePaid: game.venuePaid,
    };
  });

  // Podsumowania
  const totalDeposits = payments
    .filter((p) => p.type === "DEPOSIT")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunds = payments
    .filter((p) => p.type === "REFUND")
    .reduce((sum, p) => sum + Math.abs(p.amount), 0);

  const totalGameCharges = payments
    .filter((p) => p.type === "GAME_CHARGE")
    .reduce((sum, p) => sum + Math.abs(p.amount), 0);

  const usersAggregate = await prisma.user.aggregate({
    _sum: { balance: true },
  });
  const totalBalance = usersAggregate._sum.balance || 0;

  const cashCollected = totalDeposits - totalRefunds;
  const cashSpentOnGames = totalGameCharges;
  const cashBalance = cashCollected - cashSpentOnGames;

  // Ile zapłacone na zewnątrz
  const venuePaidTotal = gameEntries
    .filter((g) => g.venuePaid)
    .reduce((sum, g) => sum + g.totalCharged, 0);
  const venueUnpaidTotal = gameEntries
    .filter((g) => !g.venuePaid)
    .reduce((sum, g) => sum + g.totalCharged, 0);

  return NextResponse.json({
    summary: {
      totalDeposits,
      totalRefunds,
      totalGameCharges,
      totalBalance,
      cashCollected,
      cashSpentOnGames,
      cashBalance,
      venuePaidTotal,
      venueUnpaidTotal,
    },
    deposits,
    gameEntries,
  });
}
