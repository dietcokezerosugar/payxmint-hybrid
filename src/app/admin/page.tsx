"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Smartphone, 
  CreditCard, 
  Zap, 
  TrendingUp, 
  AlertCircle,
  Clock
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalVolume: 0,
    totalTxns: 0,
    successRate: 0,
    activeMerchants: 0,
    activeBots: 0,
    pendingRecharges: 0
  });

  // Mock data for initial build
  useEffect(() => {
    setStats({
      totalVolume: 1254300,
      totalTxns: 8432,
      successRate: 94.2,
      activeMerchants: 12,
      activeBots: 45,
      pendingRecharges: 3
    });
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Mission Control</h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">Global System Overview</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-2xl border border-slate-800">
          <Clock className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-black text-slate-300">SYSTEM TIME: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Processing Volume" 
          value={`₹${stats.totalVolume.toLocaleString()}`} 
          sub="Across all merchants" 
          icon={<TrendingUp className="text-emerald-500" />} 
          color="emerald"
        />
        <StatCard 
          label="Global Success Rate" 
          value={`${stats.successRate}%`} 
          sub="Last 24 hours" 
          icon={<Zap className="text-blue-500" />} 
          color="blue"
        />
        <StatCard 
          label="Active Engine Fleet" 
          value={stats.activeBots} 
          sub="Running GPay/Paytm bots" 
          icon={<Smartphone className="text-purple-500" />} 
          color="purple"
        />
      </div>

      {/* Secondary Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Merchant Activity */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-white flex items-center gap-3">
              <Users className="text-blue-500" /> Merchant Performance
            </h3>
            <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="space-y-4">
             <MerchantRow name="Sudarshan Merchant" volume="₹450,000" txns="2,140" status="ACTIVE" />
             <MerchantRow name="Global Tech Soft" volume="₹120,500" txns="840" status="ACTIVE" />
             <MerchantRow name="Elite Retailers" volume="₹89,200" txns="450" status="ACTIVE" />
          </div>
        </div>

        {/* System Health & Alerts */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-white flex items-center gap-3">
              <AlertCircle className="text-rose-500" /> System Alerts
            </h3>
          </div>
          <div className="space-y-4">
             <AlertItem type="WARNING" msg="GPay-7 limit reached for Merchant: Sudarshan" time="2m ago" />
             <AlertItem type="DANGER" msg="Session expired for pine-labs-01" time="15m ago" />
             <AlertItem type="INFO" msg="New recharge request: ₹50,000 from Elite Retailers" time="1h ago" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-500",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-500",
  };

  return (
    <div className="bg-slate-900 rounded-[32px] border border-slate-800 p-8 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 blur-[80px] opacity-20 ${color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'}`} />
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-4xl font-black text-white tracking-tighter">{value}</h4>
        <p className="text-xs font-bold text-slate-500 mt-2">{sub}</p>
      </div>
    </div>
  );
}

function MerchantRow({ name, volume, txns, status }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-all cursor-pointer">
       <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-blue-500">{name[0]}</div>
          <div>
            <p className="text-sm font-black text-white">{name}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase">{txns} Transactions</p>
          </div>
       </div>
       <div className="text-right">
          <p className="text-sm font-black text-white">{volume}</p>
          <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{status}</span>
       </div>
    </div>
  );
}

function AlertItem({ type, msg, time }: any) {
  const color = type === 'DANGER' ? 'bg-rose-500' : type === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500';
  return (
    <div className="flex items-start gap-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
       <div className={`w-2 h-2 rounded-full mt-1.5 ${color} shadow-[0_0_8px_rgba(244,63,94,0.4)]`} />
       <div className="flex-1">
          <p className="text-xs font-bold text-slate-300 leading-relaxed">{msg}</p>
          <p className="text-[9px] font-black text-slate-500 uppercase mt-1">{time}</p>
       </div>
    </div>
  );
}
