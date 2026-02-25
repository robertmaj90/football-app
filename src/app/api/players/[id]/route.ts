import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const player = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      balance: true,
      roles: true,
      isActive: true,
    },
  });

  if (!player) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(player);
}

// PATCH /api/players/:id - edytuj gracza
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
  if (body.email !== undefined) data.email = body.email;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.roles !== undefined) data.roles = body.roles;
  if (body.isActive !== undefined) data.isActive = body.isActive;

  const player = await prisma.user.update({
    where: { id: params.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      balance: true,
      roles: true,
      isActive: true,
    },
  });

  return NextResponse.json(player);
}
