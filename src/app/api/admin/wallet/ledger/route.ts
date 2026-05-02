import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WalletService } from "@/services/wallet/WalletService";

/**
 * GET: Fetch Global Ledger History
 */
export async function GET(req: NextRequest) {
  try {
    const ledger = await prisma.walletLedger.findMany({
      include: {
        merchant: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return NextResponse.json({ status: "success", data: ledger });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST: Process Manual Recharge (Admin Credit)
 */
export async function POST(req: NextRequest) {
  try {
    const { merchantId, amount, description, referenceId } = await req.json();

    if (!merchantId || !amount) {
      return NextResponse.json({ error: "Merchant ID and Amount required" }, { status: 400 });
    }

    // Use the atomic WalletService to process the credit
    const result = await WalletService.credit(
      merchantId,
      parseFloat(amount),
      description || "Manual Admin Recharge",
      "RECHARGE",
      referenceId || `ADM-${Date.now()}`
    );

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: "SYSTEM_ADMIN",
        action: "WALLET_RECHARGE_APPROVED",
        metadata: JSON.stringify({ merchantId, amount, referenceId })
      }
    });

    return NextResponse.json({ status: "success", data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
