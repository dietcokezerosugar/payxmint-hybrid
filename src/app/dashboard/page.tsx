import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  let session = await getServerSession(authOptions);
  
  // BYPASS AUTH FOR CLIENT DEMO
  if (!session || !session.user) {
    session = {
      user: {
        name: "Demo User",
        email: "merchant@wavecollect.com",
        role: "MERCHANT",
        merchantId: "local-dev"
      }
    } as any;
  }

  // @ts-ignore - Bypass session null check for demo mode
  const merchantId = session.user.merchantId;

  if (!merchantId) {
    return <div className="p-20 text-center font-black text-slate-500 uppercase tracking-widest">No Merchant Account Linked</div>;
  }

  // SaaS Optimization: Fetch the merchant linked to the current user
  let merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: {
      _count: { select: { paymentIntents: true, gpayAccounts: true } }
    }
  });

  // FALLBACK FOR DEMO: If specific merchant not found, take the first one available
  if (!merchant) {
    merchant = await prisma.merchant.findFirst({
      include: {
        _count: { select: { paymentIntents: true, gpayAccounts: true } }
      }
    });
  }

  if (!merchant) return <div className="p-20 text-center font-black text-slate-500 uppercase tracking-widest">No Merchants in Database</div>;

  // Fetch initial ledger entries for this merchant
  const ledgerEntries = await prisma.walletLedger.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return (
    <DashboardClient 
      initialMerchant={merchant} 
      initialLedgerEntries={ledgerEntries} 
    />
  );
}
