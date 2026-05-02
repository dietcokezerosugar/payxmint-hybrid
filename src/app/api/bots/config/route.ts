import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  try {
    const account = await prisma.googlePayAccount.findFirst({
      where: { name }
    });

    if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      data: {
        report_id: account.reportId,
        email: account.email,
        download_interval_sec: 40
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, report_id } = await req.json();
    if (!name || !report_id) return NextResponse.json({ error: "Name and report_id required" }, { status: 400 });

    const account = await prisma.googlePayAccount.updateMany({
      where: { name },
      data: { reportId: report_id }
    });

    return NextResponse.json({ data: account });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
