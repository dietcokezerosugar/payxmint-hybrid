import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalVolumeAgg = await prisma.paymentIntent.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true }
    });

    const totalTxns = await prisma.paymentIntent.count();
    const successTxns = await prisma.paymentIntent.count({ where: { status: "SUCCESS" } });
    const activeMerchants = await prisma.merchant.count({ where: { status: "ACTIVE" } });
    const activeBots = await prisma.googlePayAccount.count({ where: { status: "ACTIVE" } });
    
    // Recent Merchants for the list
    const merchants = await prisma.merchant.findMany({
      take: 5,
      include: {
        _count: {
          select: { paymentIntents: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const merchantStats = await Promise.all(merchants.map(async (m) => {
        const volume = await prisma.paymentIntent.aggregate({
            where: { merchantId: m.id, status: "SUCCESS" },
            _sum: { amount: true }
        });
        return {
            id: m.id,
            name: m.name,
            volume: volume._sum.amount || 0,
            txns: m._count.paymentIntents,
            status: m.status
        };
    }));

    return NextResponse.json({
      status: "success",
      data: {
        totalVolume: totalVolumeAgg._sum.amount || 0,
        totalTxns,
        successRate: totalTxns > 0 ? (successTxns / totalTxns * 100).toFixed(1) : 100,
        activeMerchants,
        activeBots,
        merchantStats
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
