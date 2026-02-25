import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/payments - dodaj wpłatę/korektę
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { userId, amount, type, description } = body;

  if (!userId || amount === undefined || !type) {
    return NextResponse.json(
      { error: "Brakuje wymaganych pól" },
      { status: 400 }
    );
  }

  // Transakcja: dodaj payment + aktualizuj bilans
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        userId,
        amount: Math.round(amount), // grosze
        type,
        description: description || null,
        createdBy: session.user.id,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { balance: { increment: Math.round(amount) } },
    });

    return payment;
  });

  return NextResponse.json(result, { status: 201 });
}
