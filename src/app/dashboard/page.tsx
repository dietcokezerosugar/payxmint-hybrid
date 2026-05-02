import { prisma } from "@/lib/prisma";
import { 
  History, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight, 
  Wallet, 
  ArrowDownRight, 
  TrendingUp,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  // SaaS Optimization: Fetch first merchant for demo (will use Auth session in prod)
  const merchant = await prisma.merchant.findFirst({
    include: {
      _count: { select: { paymentIntents: true, gpayAccounts: true } },
      ledgerEntries: { orderBy: { createdAt: "desc" }, take: 5 }
    }
  });

  if (!merchant) return <div className="p-20 text-center font-black text-slate-500 uppercase tracking-widest">No Merchant Account Found</div>;

  const successfulTxns = await prisma.paymentIntent.count({ 
    where: { merchantId: merchant.id, status: "SUCCESS" } 
  });

  const volumeAgg = await prisma.paymentIntent.aggregate({
    where: { merchantId: merchant.id, status: "SUCCESS" },
    _sum: { amount: true },
  });

  const recentIntents = await prisma.paymentIntent.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { transaction: true },
  });

  const totalVolume = volumeAgg._sum.amount || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
             <LayoutDashboard className="text-blue-500" /> Command Center
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">Merchant: {merchant.name}</p>
        </div>
        <div className="flex gap-3">
           <Link href="/dashboard/recharge" className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">
              + Recharge Wallet
           </Link>
        </div>
      </div>

      {/* Financial Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          label="Wallet Balance" 
          value={`₹${merchant.walletBalance.toLocaleString()}`} 
          sub="Available for fees" 
          icon={<Wallet />} 
          color="emerald" 
        />
        <DashboardCard 
          label="Success Volume" 
          value={`₹${totalVolume.toLocaleString()}`} 
          sub={`${successfulTxns} Verified Txns`} 
          icon={<TrendingUp />} 
          color="blue" 
        />
        <DashboardCard 
          label="Active Bots" 
          value={merchant._count.gpayAccounts} 
          sub="Operational engines" 
          icon={<Zap />} 
          color="amber" 
        />
        <DashboardCard 
          label="Fee Rate" 
          value={`${merchant.commissionRate}%`} 
          sub="Current platform rate" 
          icon={<ShieldCheck />} 
          color="purple" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Intent Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
               <History className="text-blue-500" size={16} /> Recent Activity
            </h3>
            <Link href="/dashboard/transactions" className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">
              View All Ledger
            </Link>
          </div>
          
          <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden divide-y divide-slate-800/50 shadow-2xl">
            {recentIntents.length === 0 ? (
              <div className="p-20 text-center text-slate-600 italic text-sm font-bold">
                Awaiting your first transaction...
              </div>
            ) : (
              recentIntents.map((intent) => (
                <div key={intent.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${
                      intent.status === "SUCCESS" ? "bg-emerald-500 shadow-emerald-500/50" : 
                      intent.status === "PENDING" ? "bg-blue-500 shadow-blue-500/50" : "bg-slate-700"
                    }`} />
                    <div>
                      <p className="text-xs font-black text-white tracking-wider">{intent.referenceId}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">
                        {intent.createdAt.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">₹{intent.amount.toLocaleString()}</p>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                       intent.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                       intent.status === "PENDING" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-slate-800 text-slate-500 border-slate-700"
                    }`}>
                      {intent.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mini Ledger Widget */}
        <div className="space-y-4">
           <h3 className="text-sm font-black text-white uppercase tracking-widest px-2">Recent Fees</h3>
           <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full" />
              <div className="space-y-4 relative z-10">
                 {merchant.ledgerEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between pb-4 border-b border-slate-800/50 last:border-0 last:pb-0">
                       <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${entry.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                             {entry.type === 'CREDIT' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-white">{entry.description}</p>
                             <p className="text-[8px] font-bold text-slate-500 uppercase">{new Date(entry.createdAt).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <p className={`text-xs font-black ${entry.type === 'CREDIT' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {entry.type === 'CREDIT' ? '+' : '-'}₹{entry.amount}
                       </p>
                    </div>
                 ))}
                 {merchant.ledgerEntries.length === 0 && <p className="text-center text-[10px] font-black text-slate-600 uppercase py-8">No fees recorded</p>}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ label, value, sub, icon, color }: any) {
  const colors: any = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20 shadow-purple-500/5",
  };

  return (
    <div className={`bg-slate-900 rounded-[32px] border border-slate-800 p-8 shadow-xl hover:border-slate-700 transition-all group relative overflow-hidden`}>
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 opacity-10 blur-[50px] rounded-full bg-current ${colors[color].split(' ')[0]}`} />
      <div className="flex flex-col gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">{sub}</p>
        </div>
      </div>
    </div>
  );
}
