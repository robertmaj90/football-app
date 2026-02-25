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

  // Gracz może zobaczyć tylko swoje, admin wszystko
  if (!session.user.roles?.includes("ADMIN") && session.user.id !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payments = await prisma.payment.findMany({
    where: { userId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(payments);
}
