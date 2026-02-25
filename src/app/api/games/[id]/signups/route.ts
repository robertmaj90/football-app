import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/games/:id/signups - zapisz gracza na gierkę
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const userId = body.userId || session.user.id;

  // Sprawdź czy gierka istnieje i jest otwarte
  const game = await prisma.game.findUnique({
    where: { id: params.id },
    include: { signups: { orderBy: { position: "asc" } } },
  });

  if (!game || game.status !== "OPEN") {
    return NextResponse.json(
      { error: "Gierka nie jest otwarte" },
      { status: 400 }
    );
  }

  // Sprawdź czy gracz już nie jest zapisany
  const existing = game.signups.find((s) => s.userId === userId);
  if (existing) {
    return NextResponse.json({ error: "Już zapisany" }, { status: 400 });
  }

  const nextPosition = game.signups.length + 1;
  const isReserve = nextPosition > game.maxPlayers;

  const signup = await prisma.gameSignup.create({
    data: {
      gameId: params.id,
      userId,
      position: nextPosition,
      isReserve,
    },
  });

  return NextResponse.json(signup, { status: 201 });
}

// DELETE /api/games/:id/signups - wypisz gracza
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || session.user.id;

  const game = await prisma.game.findUnique({
    where: { id: params.id },
  });

  if (!game || game.status !== "OPEN") {
    return NextResponse.json(
      { error: "Gierka nie jest otwarte" },
      { status: 400 }
    );
  }

  // Usuń zapis
  await prisma.gameSignup.deleteMany({
    where: { gameId: params.id, userId },
  });

  // Przelicz pozycje i rezerwy
  const remaining = await prisma.gameSignup.findMany({
    where: { gameId: params.id },
    orderBy: { position: "asc" },
  });

  for (let i = 0; i < remaining.length; i++) {
    await prisma.gameSignup.update({
      where: { id: remaining[i].id },
      data: {
        position: i + 1,
        isReserve: i + 1 > game.maxPlayers,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
