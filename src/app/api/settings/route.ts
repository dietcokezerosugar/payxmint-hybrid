import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const merchant = await prisma.merchant.findUnique({
    where: { id: "local-dev" },
    select: { webhookUrl: true, redirectUrl: true },
  });
  return NextResponse.json({ status: "success", data: merchant });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { webhookUrl, redirectUrl } = body;

  const merchant = await prisma.merchant.update({
    where: { id: "local-dev" },
    data: {
      ...(webhookUrl !== undefined && { webhookUrl }),
      ...(redirectUrl !== undefined && { redirectUrl }),
    },
  });

  return NextResponse.json({ status: "success", data: merchant });
}
