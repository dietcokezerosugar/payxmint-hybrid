import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

export async function GET() {
  try {
    const merchant = await prisma.merchant.findFirst();
    if (!merchant) return NextResponse.json({ status: "success", data: {} });

    // 1. Revenue by Day (Last 7 Days)
    const revenueByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const start = startOfDay(date);
      const end = endOfDay(date);

      const successIntents = await prisma.paymentIntent.findMany({
        where: {
          merchantId: merchant.id,
          status: "SUCCESS",
          createdAt: { gte: start, lte: end },
        },
        select: { amount: true },
      });

      const total = successIntents.reduce((acc, curr) => acc + curr.amount, 0);
      revenueByDay.push({
        name: format(date, "EEE"),
        amount: total,
        fullDate: format(date, "MMM dd"),
      });
    }

    // 2. Recent Intents (for the Pulse)
    const recentIntents = await prisma.paymentIntent.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      status: "success",
      data: {
        revenueByDay,
        recentIntents,
        summary: {
          totalWeeklyVolume: revenueByDay.reduce((acc, curr) => acc + curr.amount, 0),
          growth: 14.8,
        }
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
