import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function POST(req: NextRequest) {
  // Simple check for internal cron or admin
  // In production, use a secret header check: if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET)
  
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);

    // 1. Purge Audit Logs
    const auditPurge = await prisma.auditLog.deleteMany({
      where: { timestamp: { lt: thirtyDaysAgo } }
    });

    // 2. Purge API Logs
    const apiLogPurge = await prisma.apiLog.deleteMany({
      where: { timestamp: { lt: thirtyDaysAgo } }
    });

    // 3. Purge Webhook Logs (Keep WebhookEvents for audit, but purge execution logs)
    const webhookLogPurge = await prisma.webhookLog.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } }
    });

    // 4. Purge Old Routing Decisions
    const routingPurge = await prisma.routingDecision.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } }
    });

    // 5. Purge successful Transactions older than 60 days (optional)
    // const txnPurge = await prisma.transaction.deleteMany({
    //   where: { timestamp: { lt: subDays(new Date(), 60) } }
    // });

    return NextResponse.json({
      status: "success",
      purged: {
        auditLogs: auditPurge.count,
        apiLogs: apiLogPurge.count,
        webhookLogs: webhookLogPurge.count,
        routingDecisions: routingPurge.count
      }
    });

  } catch (error: any) {
    console.error("Purge Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
