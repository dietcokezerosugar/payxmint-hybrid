import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const logs = await prisma.apiLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 200,
  });
  return NextResponse.json({ status: "success", data: logs });
}
