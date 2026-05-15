import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MatchingEngine } from "@/services/matching/MatchingEngine";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized Admin" }, { status: 401 });

  try {
    // 1. Fetch floating transactions (not linked to any intent)
    const floatingTransactions = await prisma.transaction.findMany({
      where: {
        paymentIntent: null
      },
      orderBy: { timestamp: "desc" },
      take: 100
    });

    // 2. Fetch pending intents for reconciliation selection
    const pendingIntents = await prisma.paymentIntent.findMany({
      where: { status: "PENDING" },
      include: { merchant: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    return NextResponse.json({ status: "success", floatingTransactions, pendingIntents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, transactionId, intentId } = await req.json();

    if (action === "MANUAL_MATCH") {
      const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
      const intent = await prisma.paymentIntent.findUnique({ 
        where: { id: intentId },
        include: { merchant: true }
      });

      if (!transaction || !intent) {
        return NextResponse.json({ error: "Transaction or Intent not found" }, { status: 404 });
      }

      if (intent.status !== "PENDING") {
        return NextResponse.json({ error: "Intent is already processed" }, { status: 400 });
      }

      // We use a simplified version of onTransactionDetected or a direct update
      // For reconciliation, we force the match
      await prisma.$transaction(async (tx) => {
        // 1. Update Intent
        await tx.paymentIntent.update({
          where: { id: intentId },
          data: {
            status: "SUCCESS",
            transactionId: transactionId,
            payerName: transaction.payerName,
            payerUpiId: transaction.payerUpiId,
          }
        });

        // 2. Logic for settlement creation (similar to MatchingEngine)
        const isHighRisk = intent.customerRiskTier === "HIGH";
        await tx.settlement.create({
          data: {
            merchantId: intent.merchantId,
            totalAmount: transaction.amount,
            holdAmount: isHighRisk ? transaction.amount : 0,
            releasedAmount: 0,
            status: isHighRisk ? "HELD" : "UNSETTLED",
          }
        });

        // 3. Log the audit
        await tx.auditLog.create({
          data: {
            userId: "ADMIN",
            action: "MANUAL_RECONCILIATION",
            metadata: JSON.stringify({ transactionId, intentId, amount: transaction.amount })
          }
        });
      });

      return NextResponse.json({ status: "success" });
    }

    return NextResponse.json({ error: "Invalid Action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
