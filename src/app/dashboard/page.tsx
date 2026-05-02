import { prisma } from "@/lib/prisma";
import { History, Link as LinkIcon, ShieldCheck, Zap, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const merchantId = "local-dev";

  const [totalIntents, successfulIntents, volumeAgg, activeKey, recentIntents] = await prisma.$transaction([
    prisma.paymentIntent.count({ where: { merchantId } }),
    prisma.paymentIntent.count({ where: { merchantId, status: "SUCCESS" } }),
    prisma.paymentIntent.aggregate({
      where: { merchantId, status: "SUCCESS" },
      _sum: { amount: true },
    }),
    prisma.apiKey.findFirst({ where: { merchantId, isBlocked: false } }),
    prisma.paymentIntent.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { transaction: true },
    }),
  ]);

  const totalVolume = volumeAgg._sum.amount || 0;

  const cards = [
    { label: "Total Volume", value: `₹${totalVolume.toLocaleString()}`, icon: Zap, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Success Rate", value: totalIntents > 0 ? `${((successfulIntents / totalIntents) * 100).toFixed(1)}%` : "—", icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Intents", value: totalIntents.toString(), icon: History, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Monthly Used", value: activeKey ? `₹${activeKey.usedAmount.toLocaleString()}` : "₹0", icon: LinkIcon, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  function statusBadge(status: string) {
    switch (status) {
      case "SUCCESS": return "bg-green-100 text-green-700";
      case "PENDING": return "bg-yellow-100 text-yellow-700";
      case "FAILED": return "bg-red-100 text-red-700";
      case "EXPIRED": return "bg-gray-100 text-gray-500";
      default: return "bg-gray-100 text-gray-500";
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Welcome back, Wave Collect Dev.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="apple-card p-6 flex flex-col gap-4">
            <div className={`w-12 h-12 ${card.bg} rounded-2xl flex items-center justify-center ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
              <p className="text-3xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="apple-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold">Recent Payment Intents</h3>
          <Link href="/dashboard/transactions" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            View All <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentIntents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                    No payment intents yet. Use the API to create your first one.
                  </td>
                </tr>
              ) : (
                recentIntents.map((intent) => (
                  <tr key={intent.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-6 py-4 font-mono font-medium text-gray-900">{intent.referenceId}</td>
                    <td className="px-6 py-4 font-bold">₹{intent.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${statusBadge(intent.status)}`}>
                        {intent.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {intent.createdAt.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
