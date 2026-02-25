import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/schedules/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schedule = await prisma.gameSchedule.findUnique({
    where: { id: params.id },
  });

  if (!schedule) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(schedule);
}

// PATCH /api/schedules/:id - edytuj harmonogram
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data: any = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.dayOfWeek !== undefined) data.dayOfWeek = Number(body.dayOfWeek);
  if (body.time !== undefined) data.time = body.time;
  if (body.location !== undefined) data.location = body.location;
  if (body.maxPlayers !== undefined) data.maxPlayers = Number(body.maxPlayers);
  if (body.pricePerGame !== undefined)
    data.pricePerGame = Math.round(Number(body.pricePerGame));
  if (body.isActive !== undefined) data.isActive = body.isActive;

  const schedule = await prisma.gameSchedule.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(schedule);
}
