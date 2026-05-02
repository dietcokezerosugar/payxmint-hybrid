import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET: Fetch all merchants for Admin
 */
export async function GET(req: NextRequest) {
  try {
    // In production, add Admin Role Check here
    const merchants = await prisma.merchant.findMany({
      include: {
        _count: {
          select: { gpayAccounts: true, paymentIntents: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ status: "success", data: merchants });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST: Create/Update Merchant (Admin Side)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, businessName, email, status, walletBalance, commissionRate } = body;

    if (id) {
      // Update
      const updated = await prisma.merchant.update({
        where: { id },
        data: { name, businessName, email, status, walletBalance, commissionRate }
      });
      return NextResponse.json({ status: "success", data: updated });
    }

    // Create
    const created = await prisma.merchant.create({
      data: { name, businessName, email, status: status || "PENDING", walletBalance: walletBalance || 0, commissionRate: commissionRate || 0 }
    });
    return NextResponse.json({ status: "success", data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
