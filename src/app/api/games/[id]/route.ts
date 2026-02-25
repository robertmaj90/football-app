import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/games/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const game = await prisma.game.findUnique({
    where: { id: params.id },
    include: {
      schedule: true,
      signups: {
        include: {
          user: {
            select: { id: true, name: true, phone: true, balance: true },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(game);
}

// PATCH /api/games/:id - zmień status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { status } = body;

  const game = await prisma.game.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.json(game);
}
