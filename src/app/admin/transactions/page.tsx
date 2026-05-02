"use client";

import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Edit3
} from "lucide-react";

export default function MasterTransactionLedger() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/admin/transactions");
      const data = await res.json();
      setTransactions(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Global Transaction Ledger</h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">Audit-ready platform payment feed</p>
        </div>
      </div>

      {/* Global Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by UTR, Order ID, or Mobile..." 
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <select className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-3 text-xs font-black text-white focus:outline-none">
           <option>ALL STATUSES</option>
           <option>SUCCESS</option>
           <option>PENDING</option>
           <option>FAILED</option>
        </select>
        <button className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-3 text-xs font-black text-slate-400 hover:text-white transition-all">
           <Filter size={16} /> Advanced Filters
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900 rounded-[32px] border border-slate-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800">
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction / Order</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Merchant</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/20 transition-all group">
                <td className="p-6">
                   <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 ${t.status === 'SUCCESS' ? 'text-emerald-500' : 'text-slate-600'}`}>
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{t.referenceId || "TXN-"+t.id.slice(-6).toUpperCase()}</p>
                        <p className="text-[10px] font-bold text-slate-500">UTR: {t.transaction?.utr || 'NOT_YET_VERIFIED'}</p>
                      </div>
                   </div>
                </td>
                <td className="p-6">
                   <p className="text-xs font-black text-slate-300">{t.merchant?.name}</p>
                   <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">MID: {t.merchantId.slice(-8).toUpperCase()}</p>
                </td>
                <td className="p-6">
                   <p className="text-sm font-black text-white">₹{t.amount.toLocaleString()}</p>
                </td>
                <td className="p-6">
                   <StatusBadge status={t.status} />
                </td>
                <td className="p-6">
                   <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold">{new Date(t.createdAt).toLocaleString()}</span>
                   </div>
                </td>
                <td className="p-6 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <button className="p-2 bg-slate-950 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                         <Edit3 size={16} />
                      </button>
                      <button className="p-2 bg-slate-950 text-slate-500 rounded-xl hover:bg-slate-800 hover:text-white transition-all">
                         <ExternalLink size={16} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-20 text-center font-black text-slate-600 uppercase tracking-widest animate-pulse">Syncing Master Ledger...</div>}
        {!loading && transactions.length === 0 && <div className="p-20 text-center font-black text-slate-600 uppercase tracking-widest">No transactions found</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    SUCCESS: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    PENDING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    FAILED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    EXPIRED: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  };

  return (
    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${styles[status] || styles.PENDING}`}>
      {status}
    </span>
  );
}
