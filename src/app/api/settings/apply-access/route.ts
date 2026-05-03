import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const merchant = await prisma.merchant.findFirst();
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
