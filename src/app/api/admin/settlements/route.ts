import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SettlementEngine } from "@/services/settlement/SettlementEngine";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized Admin" }, { status: 401 });

  try {
    const settlements = await prisma.settlement.findMany({
      include: {
        merchant: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    const stats = await prisma.settlement.groupBy({
      by: ['status'],
      _sum: { totalAmount: true },
      _count: { id: true }
    });

    return NextResponse.json({ status: "success", data: settlements, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, settlementId } = await req.json();

    if (action === "RELEASE_HOLD") {
      const netAmount = await SettlementEngine.releaseHold(settlementId);
      return NextResponse.json({ status: "success", released: netAmount });
    }

    if (action === "PROCESS_BATCH") {
      // Process all UNSETTLED
      const result = await SettlementEngine.processBatch(0); // 0 hours for instant testing
      return NextResponse.json({ status: "success", result });
    }

    return NextResponse.json({ error: "Invalid Action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
