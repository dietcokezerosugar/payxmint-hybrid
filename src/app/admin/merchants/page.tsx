"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink, 
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Percent
} from "lucide-react";

export default function AdminMerchants() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const res = await fetch("/api/admin/merchants");
      const data = await res.json();
      setMerchants(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/admin/merchants", {
      method: "POST",
      body: JSON.stringify({ id, status })
    });
    fetchMerchants();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Merchant Fleet</h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">Manage platform participants</p>
        </div>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
          + Add New Merchant
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by name, email, or MID..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-12 pr-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <button className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
            <Filter size={18} />
          </button>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-xs font-black text-slate-500 uppercase">Status:</span>
           <select className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-black text-white focus:outline-none">
              <option>ALL</option>
              <option>ACTIVE</option>
              <option>PENDING</option>
              <option>SUSPENDED</option>
           </select>
        </div>
      </div>

      {/* Merchants Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800">
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Merchant / MID</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Wallets & Fees</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Assets</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {merchants.map((m) => (
              <tr key={m.id} className="hover:bg-slate-800/20 transition-all group">
                <td className="p-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-blue-500 text-xl border border-slate-700">
                        {m.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{m.name}</p>
                        <p className="text-[10px] font-bold text-slate-500">{m.email}</p>
                        <div className="mt-1 flex items-center gap-2">
                           <span className="text-[8px] font-black text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">MID: {m.id.slice(-8).toUpperCase()}</span>
                        </div>
                      </div>
                   </div>
                </td>
                <td className="p-6">
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-500">
                        <Wallet size={14} />
                        <span className="text-xs font-black">₹{m.walletBalance.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-500">
                        <Percent size={14} />
                        <span className="text-xs font-black">{m.commissionRate}% Fee</span>
                      </div>
                   </div>
                </td>
                <td className="p-6">
                   <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs font-black text-white">{m._count?.gpayAccounts || 0}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase">Bots</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-black text-white">{m._count?.paymentIntents || 0}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase">Txns</p>
                      </div>
                   </div>
                </td>
                <td className="p-6">
                   <StatusBadge status={m.status} />
                </td>
                <td className="p-6 text-right">
                   <div className="flex items-center justify-end gap-2">
                      {m.status === "PENDING" && (
                        <button onClick={() => updateStatus(m.id, "ACTIVE")} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                           <ShieldCheck size={18} />
                        </button>
                      )}
                      {m.status === "ACTIVE" && (
                        <button onClick={() => updateStatus(m.id, "SUSPENDED")} className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                           <ShieldAlert size={18} />
                        </button>
                      )}
                      <button className="p-2 bg-slate-950 text-slate-500 rounded-xl hover:bg-slate-800 hover:text-white transition-all">
                         <MoreVertical size={18} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-20 text-center font-black text-slate-600 uppercase tracking-widest animate-pulse">Loading Merchants...</div>}
        {!loading && merchants.length === 0 && <div className="p-20 text-center font-black text-slate-600 uppercase tracking-widest">No Merchants Found</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    ACTIVE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    SUSPENDED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  };

  return (
    <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${styles[status] || styles.PENDING}`}>
      {status}
    </span>
  );
}
