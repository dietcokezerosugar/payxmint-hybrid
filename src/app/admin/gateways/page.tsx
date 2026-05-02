"use client";

import React, { useState, useEffect } from "react";
import { 
  Smartphone, 
  Search, 
  RefreshCcw, 
  ToggleRight, 
  ToggleLeft,
  AlertTriangle,
  Activity,
  User
} from "lucide-react";

export default function GlobalFleetMonitor() {
  const [gateways, setGateways] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      const res = await fetch("/api/admin/gateways");
      const data = await res.json();
      setGateways(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Global Fleet Monitor</h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">Cross-merchant gateway oversight</p>
        </div>
        <button onClick={fetchGateways} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-blue-500 hover:bg-slate-800 transition-all">
          <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Fleet Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <FleetStat label="Total Accounts" value={gateways.length} icon={<Smartphone size={16} />} color="blue" />
         <FleetStat label="Active Engines" value={gateways.filter(g => g.status === 'ACTIVE').length} icon={<Activity size={16} />} color="emerald" />
         <FleetStat label="Limit Warnings" value={gateways.filter(g => g.currentDaily > (g.dailyLimit * 0.8) && g.dailyLimit > 0).length} icon={<AlertTriangle size={16} />} color="amber" />
         <FleetStat label="Offline/Suspended" value={gateways.filter(g => g.status !== 'ACTIVE').length} icon={<AlertTriangle size={16} />} color="rose" />
      </div>

      {/* Fleet Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800">
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Gateway / Merchant</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Daily Limit Usage</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ticket Range</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {gateways.map((g) => (
              <tr key={g.id} className="hover:bg-slate-800/20 transition-all group">
                <td className="p-6">
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white border ${g.status === 'ACTIVE' ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-800 border-slate-700'}`}>
                        <Smartphone size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{g.name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                           <User size={10} className="text-blue-500" /> {g.merchant?.name || 'Unknown Merchant'}
                        </div>
                      </div>
                   </div>
                </td>
                <td className="p-6">
                   <div className="w-full max-w-[200px] space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span className="text-slate-500">₹{g.currentDaily.toLocaleString()}</span>
                        <span className="text-slate-300">₹{g.dailyLimit === 0 ? "∞" : g.dailyLimit.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className={`h-full transition-all duration-1000 ${g.currentDaily >= g.dailyLimit && g.dailyLimit > 0 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} 
                          style={{ width: `${g.dailyLimit === 0 ? 0 : Math.min((g.currentDaily / g.dailyLimit) * 100, 100)}%` }} 
                        />
                      </div>
                   </div>
                </td>
                <td className="p-6">
                   <div className="text-[10px] font-black text-slate-300 space-y-0.5">
                      <p>MIN: ₹{g.minTicket.toLocaleString()}</p>
                      <p>MAX: ₹{g.maxTicket.toLocaleString()}</p>
                   </div>
                </td>
                <td className="p-6 text-right">
                   <button className={`p-2 rounded-xl transition-all ${g.status === 'ACTIVE' ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-slate-600 hover:bg-slate-800'}`}>
                      {g.status === 'ACTIVE' ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-20 text-center font-black text-slate-600 uppercase tracking-widest animate-pulse">Scanning Fleet...</div>}
      </div>
    </div>
  );
}

function FleetStat({ label, value, icon, color }: any) {
  const colors: any = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  };

  return (
    <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex items-center gap-4">
       <div className={`p-3 rounded-2xl border ${colors[color]}`}>{icon}</div>
       <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
          <p className="text-xl font-black text-white">{value}</p>
       </div>
    </div>
  );
}
