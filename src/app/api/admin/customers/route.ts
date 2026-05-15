import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized Admin" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const riskTier = searchParams.get("riskTier");

    const where: any = {};
    if (riskTier) where.riskTier = riskTier;

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { lastTxnAt: "desc" },
      take: 100,
      include: {
          _count: {
              select: { paymentIntents: true }
          }
      }
    });

    return NextResponse.json({ status: "success", data: customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, action, riskTier } = await req.json();

    if (action === "UPDATE_RISK") {
      const updated = await prisma.customer.update({
        where: { id },
        data: { riskTier }
      });

      await prisma.auditLog.create({
        data: {
          userId: "ADMIN",
          action: "ADMIN_UPDATE_CUSTOMER_RISK",
          metadata: JSON.stringify({ customerId: id, newTier: riskTier })
        }
      });

      return NextResponse.json({ status: "success", data: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
