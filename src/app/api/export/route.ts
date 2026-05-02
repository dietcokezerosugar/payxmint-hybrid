import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const merchant = await prisma.merchant.findFirst();
  if (!merchant) return new NextResponse("No merchant found", { status: 404 });

  const intents = await prisma.paymentIntent.findMany({
    where: { merchantId: merchant.id },
    include: { transaction: true },
    orderBy: { createdAt: "desc" },
  });

  // CSV header
  const header = "Reference ID,Amount,Status,Payer Name,Payer UPI,UTR,Created At,Expire At\n";

  const rows = intents.map((i) => {
    return [
      i.referenceId,
      i.amount,
      i.status,
      i.payerName || i.transaction?.payerName || "",
      i.payerUpiId || i.transaction?.payerUpiId || "",
      i.transaction?.utr || "",
      i.createdAt.toISOString(),
      i.expireAt?.toISOString() || "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });

  const csv = header + rows.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="wavecollect-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
