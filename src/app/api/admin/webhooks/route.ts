import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WebhookService } from "@/services/webhook/WebhookService";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized Admin" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const merchantId = searchParams.get("merchantId");

    const where: any = {};
    if (status) where.status = status;
    if (merchantId) where.merchantId = merchantId;

    const events = await prisma.webhookEvent.findMany({
      where,
      include: { 
        merchant: { select: { name: true } } 
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    const logs = await prisma.webhookLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { merchant: { select: { name: true } } },
      take: 50
    });

    return NextResponse.json({ events, logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, eventId } = await req.json();

    if (action === "RETRY") {
      await WebhookService.dispatch(eventId);
      return NextResponse.json({ success: true });
    }

    if (action === "RETRY_ALL_FAILED") {
      await WebhookService.processQueue();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
