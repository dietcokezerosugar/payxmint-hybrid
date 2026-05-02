import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET: Fetch all Gateway Accounts across all merchants
 */
export async function GET(req: NextRequest) {
  try {
    const accounts = await prisma.googlePayAccount.findMany({
      include: {
        merchant: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ status: "success", data: accounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST: Toggle Status or Reset Limits
 */
export async function POST(req: NextRequest) {
  try {
    const { id, action, status } = await req.json();

    if (action === "TOGGLE_STATUS") {
      const updated = await prisma.googlePayAccount.update({
        where: { id },
        data: { status }
      });
      return NextResponse.json({ status: "success", data: updated });
    }

    if (action === "RESET_LIMITS") {
      const updated = await prisma.googlePayAccount.update({
        where: { id },
        data: { currentDaily: 0, currentWeekly: 0, currentMonthly: 0 }
      });
      return NextResponse.json({ status: "success", data: updated });
    }

    return NextResponse.json({ error: "Invalid Action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
