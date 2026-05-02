import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { PaymentEngine } from "@/services/payment-engine/PaymentEngine";
import { Zap } from "lucide-react";
import Image from "next/image";

export default async function PaymentLinkPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;

  const link = await prisma.paymentLink.findUnique({
    where: { slug },
  });

  if (!link || !link.isActive) {
    notFound();
  }

  // Create a payment intent for this link
  const orderId = `PL-${link.slug}-${Date.now().toString(36)}`;

  const apiKey = await prisma.apiKey.findUnique({
    where: { id: link.apiKeyId },
  });

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600 font-bold">Configuration error: API key not found.</p>
      </div>
    );
  }

  const intent = await PaymentEngine.createIntent({
    amount: link.amount,
    orderId,
    apiKey: apiKey.key,
  });

  // Redirect to the standard payment page
  redirect(`/pay/${intent.paymentToken}`);
}
