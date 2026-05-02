import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const merchant = await prisma.merchant.findFirst();
    if (!merchant) return NextResponse.json({ status: "success", data: [] });

    // 1. Fetch Latest Intents (Matched or Pending)
    const intents = await prisma.paymentIntent.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { transaction: true },
    });

    // 2. Fetch Recent Transactions that are NOT linked to an intent (Orphans)
    // In our schema, Transaction.paymentIntent is the reverse relation.
    // We'll find txns where no intent points to them.
    const unlinkedTxns = await prisma.transaction.findMany({
      where: {
        paymentIntent: null
      },
      orderBy: { timestamp: "desc" },
      take: 5
    });

    // 3. Merge and Sort
    const activity = [
      ...intents.map(i => ({ ...i, type: 'INTENT' })),
      ...unlinkedTxns.map(t => ({ 
        id: t.id,
        amount: t.amount,
        status: 'DETECTED_UNMATCHED',
        createdAt: t.timestamp,
        referenceId: t.note || 'No Note',
        type: 'ORPHAN',
        utr: t.utr
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ status: "success", data: activity });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
