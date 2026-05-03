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
  Percent,
  Globe,
  CheckCircle2,
  XCircle
} from "lucide-react";

export default function AdminMerchants() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [ipRequests, setIpRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMerchants();
    fetchIpRequests();
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

  const fetchIpRequests = async () => {
    try {
      const res = await fetch("/api/admin/ip-whitelist");
      const data = await res.json();
      setIpRequests(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/admin/merchants", {
      method: "POST",
      body: JSON.stringify({ id, status })
    });
    fetchMerchants();
  };

  const handleIpRequest = async (id: string, action: "APPROVE" | "REJECT") => {
    await fetch("/api/admin/ip-whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action })
    });
    fetchIpRequests();
    fetchMerchants(); // Refresh merchants to see updated IP list
  };

  const pendingIpRequests = ipRequests.filter(r => r.status === "PENDING");

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Merchant Fleet</h2>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mt-1">Manage platform participants</p>
        </div>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/10 active:scale-95 transition-all">
          + Add New Merchant
        </button>
      </div>

      {/* IP Whitelist Requests Section */}
      {pendingIpRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-sm">
          <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center gap-3">
            <Globe className="text-amber-600 w-5 h-5" />
            <h3 className="text-sm font-black text-amber-900">Pending IP Whitelist Requests</h3>
            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-md">{pendingIpRequests.length}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingIpRequests.map((req) => (
              <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-black text-slate-900">{req.ipAddress}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5">Merchant: <span className="text-slate-700">{req.merchant?.name}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleIpRequest(req.id, "APPROVE")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[11px] font-black transition-all border border-emerald-100"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button 
                    onClick={() => handleIpRequest(req.id, "REJECT")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[11px] font-black transition-all border border-rose-100"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 flex-1 w-full max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or MID..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-all shadow-sm">
            <Filter size={18} />
          </button>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
           <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm">
              <option>ALL</option>
              <option>ACTIVE</option>
              <option>PENDING</option>
              <option>SUSPENDED</option>
           </select>
        </div>
      </div>

      {/* Merchants Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant / MID</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Wallets & Fees</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assets & Security</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {merchants.map((m) => {
              const ipCount = m.ipWhitelist ? m.ipWhitelist.split(",").filter(Boolean).length : 0;
              return (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="p-4 px-6">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-600 border border-slate-200">
                          {m.name[0]}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-900 leading-tight">{m.name}</p>
                          <p className="text-[11px] font-medium text-slate-500">{m.email}</p>
                          <div className="mt-1 flex items-center gap-2">
                             <span className="text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">MID: {m.id.slice(-8).toUpperCase()}</span>
                          </div>
                        </div>
                     </div>
                  </td>
                  <td className="p-4 px-6">
                     <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <Wallet size={14} />
                          <span className="text-[11px] font-black tracking-tight">₹{m.walletBalance.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-600">
                          <Percent size={14} />
                          <span className="text-[11px] font-bold">{m.commissionRate}% Fee</span>
                        </div>
                     </div>
                  </td>
                  <td className="p-4 px-6">
                     <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm font-black text-slate-900">{m._count?.gpayAccounts || 0}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Bots</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black text-slate-900">{ipCount}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">IPs</p>
                        </div>
                     </div>
                  </td>
                  <td className="p-4 px-6">
                     <StatusBadge status={m.status} />
                  </td>
                  <td className="p-4 px-6 text-right">
                     <div className="flex items-center justify-end gap-2">
                        {m.status === "PENDING" && (
                          <button onClick={() => updateStatus(m.id, "ACTIVE")} className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all shadow-sm">
                             <ShieldCheck size={16} />
                          </button>
                        )}
                        {m.status === "ACTIVE" && (
                          <button onClick={() => updateStatus(m.id, "SUSPENDED")} className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition-all shadow-sm">
                             <ShieldAlert size={16} />
                          </button>
                        )}
                        <button className="p-2 bg-white text-slate-400 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
                           <MoreVertical size={16} />
                        </button>
                     </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <div className="p-16 text-center font-bold text-slate-400 uppercase tracking-widest animate-pulse text-[11px]">Loading Merchants...</div>}
        {!loading && merchants.length === 0 && <div className="p-16 text-center font-bold text-slate-400 uppercase tracking-widest text-[11px]">No Merchants Found</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    ACTIVE: "bg-emerald-50 text-emerald-600 border-emerald-100",
    PENDING: "bg-amber-50 text-amber-600 border-amber-100",
    SUSPENDED: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border inline-block ${styles[status] || styles.PENDING}`}>
      {status}
    </span>
  );
}
