import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const merchantId = "local-dev";

  const intents = await prisma.paymentIntent.findMany({
    where: { merchantId },
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
