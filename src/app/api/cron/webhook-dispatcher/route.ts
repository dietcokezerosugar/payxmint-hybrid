import { NextRequest, NextResponse } from "next/server";
import { WebhookService } from "@/services/webhook/WebhookService";

export async function POST(req: NextRequest) {
  try {
    await WebhookService.processQueue();
    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
