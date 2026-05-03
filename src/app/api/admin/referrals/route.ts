import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        _count: { select: { merchants: true } },
        commissionLogs: {
          orderBy: { createdAt: "desc" },
          take: 50
        }
      }
    });

    return NextResponse.json({ status: "success", data: agents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, referralCode, commissionRate } = await req.json();

    const agent = await prisma.agent.create({
      data: {
        name,
        email,
        referralCode,
        commissionRate: parseFloat(commissionRate) || 0
      }
    });

    return NextResponse.json({ status: "success", data: agent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
