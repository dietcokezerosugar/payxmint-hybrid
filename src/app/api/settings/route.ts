import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const merchant = await prisma.merchant.findFirst({
    select: { webhookUrl: true, redirectUrl: true },
  });
  return NextResponse.json({ status: "success", data: merchant });
}

export async function POST(req: NextRequest) {
  const merchant = await prisma.merchant.findFirst();
  if (!merchant) return NextResponse.json({ status: "failure", message: "No merchant found" }, { status: 404 });

  const body = await req.json();
  const { webhookUrl, redirectUrl } = body;

  const updated = await prisma.merchant.update({
    where: { id: merchant.id },
    data: {
      ...(webhookUrl !== undefined && { webhookUrl }),
      ...(redirectUrl !== undefined && { redirectUrl }),
    },
  });

  return NextResponse.json({ status: "success", data: updated });
}
