import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/players - lista graczy
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const players = await prisma.user.findMany({
    where: { roles: { has: "PLAYER" } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      balance: true,
      roles: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(players);
}

// POST /api/players - dodaj gracza
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { email, name, phone, password } = body;

  if (!email || !name || !phone || !password) {
    return NextResponse.json(
      { error: "Wszystkie pola są wymagane" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Użytkownik z tym emailem już istnieje" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const player = await prisma.user.create({
    data: {
      email,
      name,
      phone,
      passwordHash,
      roles: ["PLAYER"],
      balance: 0,
    },
  });

  return NextResponse.json({ id: player.id }, { status: 201 });
}
