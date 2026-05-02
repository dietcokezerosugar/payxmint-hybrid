import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logApi } from "@/lib/log";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ status: "failure", message: "Missing API key" }, { status: 401 });
    }

    const apiKey = authHeader.replace("Bearer ", "");
    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ status: "failure", message: "Missing order_id" }, { status: 400 });
    }

    // Validate API key
    const keyData = await prisma.apiKey.findUnique({ where: { key: apiKey } });
    if (!keyData) {
      return NextResponse.json({ status: "failure", message: "Invalid API Key" }, { status: 401 });
    }

    const intent = await prisma.paymentIntent.findUnique({
      where: { referenceId: order_id },
      include: { transaction: true },
    });

    if (!intent || intent.merchantId !== keyData.merchantId) {
      return NextResponse.json({ status: "failure", message: "Order not found" }, { status: 404 });
    }

    await logApi("INFO", "Check status", { orderId: order_id, status: intent.status });

    return NextResponse.json({
      status: "success",
      data: {
        order_id: intent.referenceId,
        amount: intent.amount,
        status: intent.status,
        payer_name: intent.payerName || intent.transaction?.payerName || null,
        payer_upi: intent.payerUpiId || intent.transaction?.payerUpiId || null,
        utr: intent.transaction?.utr || null,
        txn_id: intent.transaction?.externalId || null,
        created_at: intent.createdAt,
        expire_at: intent.expireAt,
      },
    });
  } catch (error: any) {
    await logApi("ERROR", "Check status failed", { error: error.message });
    return NextResponse.json({ status: "failure", message: error.message }, { status: 500 });
  }
}
