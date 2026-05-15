import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const merchant = await prisma.merchant.findUnique({ where: { id: session.user.merchantId } });
  if (!merchant) return NextResponse.json({ status: "failure", message: "No merchant found" }, { status: 404 });

  if (merchant.apiAccessStatus === "APPROVED") {
    return NextResponse.json({ status: "failure", message: "API Access already approved" }, { status: 400 });
  }

  const updated = await prisma.merchant.update({
    where: { id: merchant.id },
    data: {
      apiAccessStatus: "PENDING",
    },
  });

  return NextResponse.json({ status: "success", data: updated });
}
