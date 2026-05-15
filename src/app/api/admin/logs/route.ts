import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized Admin" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "api"; // 'api' or 'audit'

    if (type === "audit") {
      const logs = await prisma.auditLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 100
      });
      return NextResponse.json({ logs });
    }

    const logs = await prisma.apiLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 100
    });
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
