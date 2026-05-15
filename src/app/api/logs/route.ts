import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const merchant = await prisma.merchant.findUnique({ where: { id: session.user.merchantId } });
    if (!merchant) return NextResponse.json({ status: "success", data: [] });

    // Fallback: If merchantId column is missing due to Prisma sync issue, fetch all logs
    try {
      const logs = await prisma.apiLog.findMany({
        where: { 
          OR: [
            { merchantId: merchant.id },
            { merchantId: null }
          ]
        },
        orderBy: { timestamp: "desc" },
        take: 200,
      });
      return NextResponse.json({ status: "success", data: logs });
    } catch (dbError) {
      console.warn("[API] Falling back to global logs due to schema mismatch:", dbError);
      const logs = await prisma.apiLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 100,
      });
      return NextResponse.json({ status: "success", data: logs });
    }
  } catch (error: any) {
    console.error("[API] Logs fetch failed:", error);
    return NextResponse.json({ status: "failure", message: error.message }, { status: 500 });
  }
}
