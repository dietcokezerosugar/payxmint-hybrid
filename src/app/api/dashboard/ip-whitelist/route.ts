import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET: List merchant's own IP whitelist requests
 */
export async function GET() {
  try {
    const merchant = await prisma.merchant.findFirst();
    if (!merchant) return NextResponse.json({ status: "success", data: [], currentIps: "" });

    const requests = await prisma.ipWhitelistRequest.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      status: "success",
      data: requests,
      currentIps: merchant.ipWhitelist || "",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST: Submit a new IP whitelist request
 */
export async function POST(req: NextRequest) {
  try {
    const merchant = await prisma.merchant.findFirst();
    if (!merchant) return NextResponse.json({ error: "No merchant found" }, { status: 404 });

    const { ipAddress } = await req.json();

    if (!ipAddress) {
      return NextResponse.json({ error: "ipAddress is required" }, { status: 400 });
    }

    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(ipAddress.trim())) {
      return NextResponse.json({ error: "Invalid IP address format" }, { status: 400 });
    }

    // Check if already requested
    const existing = await prisma.ipWhitelistRequest.findFirst({
      where: { merchantId: merchant.id, ipAddress: ipAddress.trim(), status: "PENDING" },
    });

    if (existing) {
      return NextResponse.json({ error: "This IP is already pending approval" }, { status: 409 });
    }

    const request = await prisma.ipWhitelistRequest.create({
      data: {
        merchantId: merchant.id,
        ipAddress: ipAddress.trim(),
      },
    });

    return NextResponse.json({ status: "success", data: request });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
