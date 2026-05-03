import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ 
        status: "failure", 
        error: "AUTHENTICATION_FAILED",
        message: "Missing or invalid Bearer token." 
      }, { status: 401 });
    }

    const apiKey = authHeader.replace("Bearer ", "");
    const keyData = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { merchant: true },
    });

    if (!keyData) {
      return NextResponse.json({ 
        status: "failure", 
        error: "INVALID_API_KEY",
        message: "The provided API key is not recognized." 
      }, { status: 401 });
    }

    return NextResponse.json({
      status: "success",
      data: {
        merchant: {
          name: keyData.merchant.name,
          business_name: keyData.merchant.businessName,
          status: keyData.merchant.status,
        },
        key: {
          monthly_limit: keyData.monthlyLimit,
          used_amount: keyData.usedAmount,
          is_blocked: keyData.isBlocked,
        },
        environment: process.env.NODE_ENV === "production" ? "PRODUCTION" : "DEVELOPMENT"
      },
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: "failure", 
      error: "INTERNAL_ERROR" 
    }, { status: 500 });
  }
}
