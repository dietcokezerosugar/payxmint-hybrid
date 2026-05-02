import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PaymentPageClient from "./PaymentPageClient";

export default async function PaymentPage({ params }: { params: { token: string } }) {
  const { token } = await params;

  const intent = await prisma.paymentIntent.findUnique({
    where: { paymentToken: token },
    include: { merchant: true },
  });

  if (!intent) {
    notFound();
  }

  return (
    <PaymentPageClient
      token={token}
      amount={intent.amount}
      merchantName={intent.merchant.businessName || intent.merchant.name}
      referenceId={intent.referenceId}
      upiDeepLink={intent.upiDeepLink || ""}
      qrData={intent.qrData || ""}
      status={intent.status}
      expireAt={intent.expireAt ? intent.expireAt.toISOString() : undefined}
    />
  );
}
