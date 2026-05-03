import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Overall stats
    const totalVolumeAgg = await prisma.paymentIntent.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    });
    const totalTxns = await prisma.paymentIntent.count();
    const successTxns = await prisma.paymentIntent.count({ where: { status: "SUCCESS" } });
    const pendingTxns = await prisma.paymentIntent.count({ where: { status: "PENDING" } });
    const failedTxns = await prisma.paymentIntent.count({ where: { status: "FAILED" } });
    const expiredTxns = await prisma.paymentIntent.count({ where: { status: "EXPIRED" } });
    const activeMerchants = await prisma.merchant.count({ where: { status: "ACTIVE" } });
    const totalMerchants = await prisma.merchant.count();
    const activeBots = await prisma.googlePayAccount.count({ where: { status: "ACTIVE" } });
    const totalBots = await prisma.googlePayAccount.count({ where: { NOT: { status: "DELETED" } } });

    // Daily volume for last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentIntents = await prisma.paymentIntent.findMany({
      where: {
        status: "SUCCESS",
        createdAt: { gte: sevenDaysAgo },
      },
      select: { amount: true, createdAt: true },
    });

    // Build daily volume map
    const dailyVolume: { day: string; amount: number; count: number }[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().split("T")[0];
      const dayIntents = recentIntents.filter(
        (intent) => intent.createdAt.toISOString().split("T")[0] === dayStr
      );
      dailyVolume.push({
        day: dayNames[d.getDay()],
        amount: dayIntents.reduce((sum, i) => sum + i.amount, 0),
        count: dayIntents.length,
      });
    }

    // Hourly heatmap for today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayIntents = await prisma.paymentIntent.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { createdAt: true },
    });

    const hourlyHeatmap = Array.from({ length: 24 }).map((_, hour) => ({
      hour,
      count: todayIntents.filter((i) => i.createdAt.getHours() === hour).length,
    }));

    // Top merchants by volume
    const merchants = await prisma.merchant.findMany({
      include: {
        _count: { select: { paymentIntents: true, gpayAccounts: true } },
      },
    });

    const merchantStats = await Promise.all(
      merchants.map(async (m) => {
        const vol = await prisma.paymentIntent.aggregate({
          where: { merchantId: m.id, status: "SUCCESS" },
          _sum: { amount: true },
        });
        return {
          id: m.id,
          name: m.name,
          volume: vol._sum.amount || 0,
          txns: m._count.paymentIntents,
          bots: m._count.gpayAccounts,
          status: m.status,
        };
      })
    );

    merchantStats.sort((a, b) => b.volume - a.volume);

    // Recent live transactions (last 20)
    const recentLive = await prisma.paymentIntent.findMany({
      include: { merchant: { select: { name: true } }, transaction: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Pending IP whitelist requests count
    const pendingIpRequests = await prisma.ipWhitelistRequest.count({
      where: { status: "PENDING" },
    });

    return NextResponse.json({
      status: "success",
      data: {
        totalVolume: totalVolumeAgg._sum.amount || 0,
        totalTxns,
        successTxns,
        pendingTxns,
        failedTxns,
        expiredTxns,
        successRate: totalTxns > 0 ? parseFloat(((successTxns / totalTxns) * 100).toFixed(1)) : 100,
        activeMerchants,
        totalMerchants,
        activeBots,
        totalBots,
        dailyVolume,
        hourlyHeatmap,
        merchantStats,
        recentLive,
        pendingIpRequests,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
