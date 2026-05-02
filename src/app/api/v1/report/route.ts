import { NextRequest, NextResponse } from "next/server";
import { MatchingEngine } from "@/services/matching/MatchingEngine";
import { logApi } from "@/lib/log";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { account, transactions } = body;

    if (!account || !transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ status: "failure", message: "Invalid payload" }, { status: 400 });
    }

    await logApi("INFO", "Received bot report", { account, count: transactions.length });

    let newCount = 0;
    for (const trx of transactions) {
      const isNew = await MatchingEngine.onTransactionDetected(trx);
      if (isNew) newCount++;
    }

    return NextResponse.json({ status: "success", newCount });
  } catch (error: any) {
    await logApi("ERROR", "Bot report processing failed", { error: error.message });
    return NextResponse.json({ status: "failure", message: error.message }, { status: 500 });
  }
}
