import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WebhookService } from "@/services/webhook/WebhookService";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const merchant = await prisma.merchant.findUnique({ where: { id: session.user.merchantId } });
  if (!merchant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.webhookLog.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return NextResponse.json({ status: "success", data: logs });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const merchant = await prisma.merchant.findUnique({ where: { id: session.user.merchantId } }); // In real app, get from session
  if (!merchant || !merchant.webhookUrl) return NextResponse.json({ error: "No webhook configured" }, { status: 400 });

  const body = await req.json();
  const { action } = body;

  if (action === "TEST") {
    // Test payload mirrors the production webhook schema exactly
    const payload = {
      event: "payment.test",
      status: "SUCCESS",
      amount: 100.00,
      order_id: "TEST-" + Math.random().toString(36).substring(7).toUpperCase(),
      utr: "000000000000",
      payer_name: "Test Customer",
      timestamp: new Date().toISOString(),
    };

    // Use queueEvent which handles HMAC signing, dispatch, and logging
    try {
      await WebhookService.queueEvent(merchant.id, "payment.test", payload);
      return NextResponse.json({ status: "success" });
    } catch (e: any) {
      return NextResponse.json({ status: "failure", error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

