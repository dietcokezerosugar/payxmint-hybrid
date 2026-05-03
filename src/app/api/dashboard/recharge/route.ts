import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentEngine } from "@/services/payment-engine/PaymentEngine";

export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json();

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Minimum recharge amount is ₹1" }, { status: 400 });
    }

    // SaaS: In production, get merchantId from auth session
    const merchant = await prisma.merchant.findFirst(); 
    if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });

    const intent = await PaymentEngine.createRechargeIntent(merchant.id, amount);

    return NextResponse.json({ 
      success: true, 
      paymentToken: intent.paymentToken 
    });

  } catch (error: any) {
    console.error("[RECHARGE_API_ERR]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
