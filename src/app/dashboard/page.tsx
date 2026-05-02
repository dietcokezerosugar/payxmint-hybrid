import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  // SaaS Optimization: Fetch first merchant for demo (will use Auth session in prod)
  const merchant = await prisma.merchant.findFirst({
    include: {
      _count: { select: { paymentIntents: true, gpayAccounts: true } }
    }
  });

  if (!merchant) return <div className="p-20 text-center font-black text-slate-500 uppercase tracking-widest">No Merchant Account Found</div>;

  // Fetch initial ledger entries
  const ledgerEntries = await prisma.walletLedger.findMany({
    where: { merchantId: merchant.id },
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
