import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const intent = await prisma.paymentIntent.findUnique({
    where: { paymentToken: token },
    include: { merchant: true },
  });

  if (!intent) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  const isActive = intent.status === "PENDING";
  const upiDeepLink = isActive ? (intent.upiDeepLink || "") : "";
  const qrData = isActive && upiDeepLink ? await QRCode.toDataURL(upiDeepLink, { width: 400, margin: 2 }) : null;

  return NextResponse.json({
    status: "success",
    data: {
      amount: intent.amount,
      reference_id: intent.referenceId,
      merchant_name: intent.merchant.brandName || intent.merchant.businessName || intent.merchant.name,
      brand_color: intent.merchant.brandColor || "#2563eb",
      brand_logo: intent.merchant.brandLogo,
      upi_link: isActive ? upiDeepLink : null,
      qr_data: qrData,
      status: intent.status,
      expire_at: intent.expireAt,
    }
  });
}
