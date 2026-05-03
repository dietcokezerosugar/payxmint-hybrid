import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const merchant = await prisma.merchant.findFirst();
  if (!merchant) return NextResponse.json({ status: "success", data: [] });

  const accounts = await prisma.googlePayAccount.findMany({
    where: { 
      merchantId: merchant.id, 
      status: { not: "DELETED" } 
    },
    orderBy: { createdAt: "desc" },
  });
  console.log(`[API] Found ${accounts.length} accounts for merchant ${merchant.id}`);
  return NextResponse.json({ status: "success", data: accounts });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, upiId, reportId, minTicket, maxTicket } = body;

  if (!name || !email || !upiId) {
    return NextResponse.json({ status: "failure", message: "name, email, upiId are required" }, { status: 400 });
  }

  const merchant = await prisma.merchant.findFirst();
  if (!merchant) return NextResponse.json({ status: "failure", message: "No merchant found" }, { status: 404 });

  // GPay 9 Singleton Pattern: Check if account already exists
  const existing = await prisma.googlePayAccount.findFirst({
    where: { name, merchantId: merchant.id }
  });

  if (existing) {
    const updated = await prisma.googlePayAccount.update({
      where: { id: existing.id },
      data: { 
        email, upiId, 
        reportId: reportId || existing.reportId, 
        status: "ACTIVE",
        ...(minTicket !== undefined && { minTicket: parseFloat(minTicket) }),
        ...(maxTicket !== undefined && { maxTicket: parseFloat(maxTicket) }),
      }
    });
    return NextResponse.json({ status: "success", data: updated });
  }

  const account = await prisma.googlePayAccount.create({
    data: {
      merchantId: merchant.id,
      name,
      email,
      upiId,
      status: "ACTIVE",
      reportId: reportId || null,
      minTicket: minTicket ? parseFloat(minTicket) : 0,
      maxTicket: maxTicket ? parseFloat(maxTicket) : 1000000,
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

  // Truly hide from UI but keep in DB for history
  await prisma.googlePayAccount.update({
    where: { id },
    data: { status: "DELETED" },
  });

  return NextResponse.json({ status: "success" });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, status, monthlyLimit, minTicket, maxTicket } = body;

  if (!id) {
    return NextResponse.json({ status: "failure", message: "id is required" }, { status: 400 });
  }

  const updateData: any = {};
  if (status !== undefined) updateData.status = status;
  if (monthlyLimit !== undefined) updateData.monthlyLimit = parseFloat(monthlyLimit);
  if (minTicket !== undefined) updateData.minTicket = parseFloat(minTicket);
  if (maxTicket !== undefined) updateData.maxTicket = parseFloat(maxTicket);

  const account = await prisma.googlePayAccount.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ status: "success", data: account });
}
