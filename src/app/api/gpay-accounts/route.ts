import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const accounts = await prisma.googlePayAccount.findMany({
    where: { merchantId: "local-dev", status: { not: "INACTIVE" } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ status: "success", data: accounts });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, upiId, reportId } = body;

  if (!name || !email || !upiId) {
    return NextResponse.json({ status: "failure", message: "name, email, upiId are required" }, { status: 400 });
  }

  const account = await prisma.googlePayAccount.create({
    data: {
      merchantId: "local-dev",
      name,
      email,
      upiId,
      reportId: reportId || null,
    },
  });

  return NextResponse.json({ status: "success", data: account });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ status: "failure", message: "Missing id" }, { status: 400 });
  }

  await prisma.googlePayAccount.update({
    where: { id },
    data: { status: "INACTIVE" },
  });

  return NextResponse.json({ status: "success" });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, status, monthlyLimit } = body;

  if (!id) {
    return NextResponse.json({ status: "failure", message: "id is required" }, { status: 400 });
  }

  const updateData: any = {};
  if (status !== undefined) updateData.status = status;
  if (monthlyLimit !== undefined) updateData.monthlyLimit = parseFloat(monthlyLimit);

  const account = await prisma.googlePayAccount.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ status: "success", data: account });
}
