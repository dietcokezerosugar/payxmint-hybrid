import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

    const merchant = await prisma.merchant.findFirst();
    if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });

    const agent = await prisma.agent.findUnique({
      where: { referralCode: code.toUpperCase().trim() }
    });

    if (!agent) {
      return NextResponse.json({ error: "Invalid referral code. Please check with your agent." }, { status: 404 });
    }

    const updated = await prisma.merchant.update({
      where: { id: merchant.id },
      data: { agentId: agent.id },
      include: { agent: true }
    });

    return NextResponse.json({ status: "success", agent: updated.agent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
