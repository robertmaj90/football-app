import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/players/:id/games - historia grań gracza
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.roles?.includes("ADMIN") && session.user.id !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const signups = await prisma.gameSignup.findMany({
    where: { userId: params.id },
    orderBy: { game: { date: "desc" } },
    include: {
      game: {
        include: {
          schedule: true,
          _count: { select: { signups: true } },
          signups: {
            where: { isReserve: false },
            select: { id: true },
          },
        },
      },
    },
  });

  // Mapuj na czytelny format
  const games = signups.map((s) => ({
    gameId: s.game.id,
    date: s.game.date,
    status: s.game.status,
    scheduleName: s.game.schedule.name,
    location: s.game.schedule.location,
    time: s.game.schedule.time,
    pricePerGame: s.game.pricePerGame,
    maxPlayers: s.game.maxPlayers,
    totalSignups: s.game._count.signups,
    mainListCount: s.game.signups.length,
    // Mój status
    position: s.position,
    isReserve: s.isReserve,
    attended: s.attended,
    charged: s.charged,
  }));

  return NextResponse.json(games);
}
