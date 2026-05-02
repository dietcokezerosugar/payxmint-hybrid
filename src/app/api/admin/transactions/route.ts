import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET: Fetch all Transactions for Admin Oversight
 */
export async function GET(req: NextRequest) {
  try {
    const transactions = await prisma.paymentIntent.findMany({
      include: {
        merchant: {
          select: { name: true }
        },
        transaction: true // Real bank verification data
      },
      orderBy: { createdAt: "desc" },
      take: 100 // Optimization: Latest 100
    });

    return NextResponse.json({ status: "success", data: transactions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST: Manual Status Update (Admin Override)
 */
export async function POST(req: NextRequest) {
  try {
    const { id, status, utr, note } = await req.json();

    // 1. Update PaymentIntent
    const updatedIntent = await prisma.paymentIntent.update({
      where: { id },
      data: { status },
      include: { merchant: true }
    });

    // 2. If marking SUCCESS, ensure a Transaction record exists
    if (status === "SUCCESS" && utr) {
      await prisma.transaction.upsert({
        where: { externalId: `MANUAL-${id}` },
        update: { utr, amount: updatedIntent.amount, note: note || "Manual Admin Override" },
        create: { 
          externalId: `MANUAL-${id}`, 
          utr, 
          amount: updatedIntent.amount,
          note: note || "Manual Admin Override"
        }
      });
    }

    // 3. Log Audit Trail
    await prisma.auditLog.create({
      data: {
        userId: "SYSTEM_ADMIN", // In prod, get current user session
        action: `MANUAL_OVERRIDE_${status}`,
        metadata: JSON.stringify({ intentId: id, utr, note })
      }
    });

    return NextResponse.json({ status: "success", data: updatedIntent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
