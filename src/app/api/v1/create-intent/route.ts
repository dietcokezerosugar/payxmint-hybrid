import { NextRequest, NextResponse } from "next/server";
import { PaymentEngine } from "@/services/payment-engine/PaymentEngine";
import { logApi } from "@/lib/log";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      await logApi("WARN", "Create intent: missing auth header", { ip: req.headers.get("x-forwarded-for") });
      return NextResponse.json({ status: "failure", message: "Missing or invalid API key" }, { status: 401 });
    }

    const apiKey = authHeader.replace("Bearer ", "");
    const body = await req.json();

    const { amount, order_id, customer_mobile, customer_email, redirect_url } = body;

    if (!amount || !order_id) {
      await logApi("WARN", "Create intent: missing required fields", { body });
      return NextResponse.json({ status: "failure", message: "Missing required fields: amount, order_id" }, { status: 400 });
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json({ status: "failure", message: "Invalid amount" }, { status: 400 });
    }

    const intent = await PaymentEngine.createIntent({
      amount: parseFloat(amount),
      orderId: order_id,
      customerMobile: customer_mobile,
      customerEmail: customer_email,
      apiKey,
      redirectUrl: redirect_url,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    await logApi("INFO", "Payment intent created", {
      intentId: intent.id,
      amount: intent.amount,
      referenceId: intent.referenceId,
    });

    return NextResponse.json({
      status: "success",
      message: "Payment intent created",
      data: {
        id: intent.id,
        amount: intent.amount,
        reference_id: intent.referenceId,
        status: intent.status,
        payment_url: `${appUrl}/pay/${intent.paymentToken}`,
        payment_token: intent.paymentToken,
        upi_link: intent.upiDeepLink,
        qr_data: intent.qrData,
        expire_at: intent.expireAt,
      },
    });
  } catch (error: any) {
    await logApi("ERROR", "Create intent failed", { error: error.message });
    const status = error.message.includes("Invalid API Key") ? 401
      : error.message.includes("limit") ? 402
      : error.message.includes("already exists") ? 409
      : 400;
    return NextResponse.json({ status: "failure", message: error.message }, { status });
  }
}
