import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schedules = await prisma.gameSchedule.findMany({
    orderBy: { dayOfWeek: "asc" },
    include: { _count: { select: { games: true } } },
  });

  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, dayOfWeek, time, location, maxPlayers, pricePerGame } = body;

  const schedule = await prisma.gameSchedule.create({
    data: {
      name,
      dayOfWeek: Number(dayOfWeek),
      time,
      location,
      maxPlayers: Number(maxPlayers),
      pricePerGame: Math.round(Number(pricePerGame)),
      isActive: true,
    },
  });

  return NextResponse.json(schedule, { status: 201 });
}
