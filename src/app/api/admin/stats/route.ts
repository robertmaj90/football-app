import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [playersCount, lowBalancePlayers] = await Promise.all([
    prisma.user.count({ where: { roles: { has: "PLAYER" } } }),
    prisma.user.findMany({
      where: { balance: { lt: 0 } },
      orderBy: { balance: "asc" },
      take: 10,
      select: { id: true, name: true, balance: true },
    }),
  ]);

  return NextResponse.json({ playersCount, lowBalancePlayers });
}
