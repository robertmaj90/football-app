import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/games - lista gierek
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const upcoming = searchParams.get("upcoming");

  const where: any = {};
  if (status) where.status = status;
  if (upcoming === "true") {
    where.date = { gte: new Date() };
    where.status = { in: ["OPEN", "LOCKED"] };
  }

  const games = await prisma.game.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      schedule: true,
      _count: { select: { signups: true } },
      signups: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { position: "asc" },
      },
    },
  });

  return NextResponse.json(games);
}

// POST /api/games - utwórz gierkę z harmonogramu
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { scheduleId, date } = body;

  if (!scheduleId || !date) {
    return NextResponse.json({ error: "Brakuje danych" }, { status: 400 });
  }

  const schedule = await prisma.gameSchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    return NextResponse.json(
      { error: "Harmonogram nie istnieje" },
      { status: 404 }
    );
  }

  const game = await prisma.game.create({
    data: {
      scheduleId,
      date: new Date(date),
      maxPlayers: schedule.maxPlayers,
      pricePerGame: schedule.pricePerGame,
      status: "OPEN",
    },
  });

  return NextResponse.json(game, { status: 201 });
}
