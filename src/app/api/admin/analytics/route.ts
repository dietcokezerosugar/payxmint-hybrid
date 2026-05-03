import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    // 1. Core Platform Stats
    const [
      totalMerchants,
      totalSuccessfulTxns,
      totalVolume,
      totalWalletFloat,
      pendingIpRequests
    ] = await Promise.all([
      prisma.merchant.count(),
      prisma.paymentIntent.count({ where: { status: "SUCCESS" } }),
      prisma.paymentIntent.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true }
      }),
      prisma.merchant.aggregate({
        _sum: { walletBalance: true }
      }),
      prisma.ipWhitelistRequest.count({ where: { status: "PENDING" } })
    ]);

    // 2. Daily Volume Chart (Last 14 Days)
    const dailyVolume = [];
    for (let i = 13; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const nextDate = startOfDay(subDays(new Date(), i - 1));
      
      const stats = await prisma.paymentIntent.aggregate({
        where: {
          status: "SUCCESS",
          createdAt: { gte: date, lt: nextDate }
        },
        _sum: { amount: true },
        _count: { id: true }
      });

      dailyVolume.push({
        date: format(date, "MMM dd"),
        amount: stats._sum.amount || 0,
        count: stats._count.id || 0
      });
    }

    // 3. Top Merchants (by volume)
    const topMerchants = await prisma.merchant.findMany({
      include: {
        _count: {
          select: { paymentIntents: { where: { status: "SUCCESS" } } }
        }
      },
      orderBy: { walletBalance: "desc" }, // Proxy for volume if they keep funds
      take: 5
    });

    return NextResponse.json({
      status: "success",
      data: {
        stats: {
          totalMerchants,
          totalSuccessfulTxns,
          totalVolume: totalVolume._sum.amount || 0,
          totalWalletFloat: totalWalletFloat._sum.walletBalance || 0,
          pendingIpRequests
        },
        charts: {
          dailyVolume
        },
        topMerchants
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
