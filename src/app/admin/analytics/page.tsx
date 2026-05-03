"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Smartphone,
  CreditCard,
  Clock,
  Zap,
  ShieldCheck,
  AlertCircle,
  Activity,
  Wifi,
  Globe,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      const json = await res.json();
      if (json.data) setData(json.data);
    } catch (e) {
      console.error("Analytics fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest animate-pulse text-[11px]">
        Loading Intelligence Engine...
      </div>
    );
  }

  const maxDailyVolume = Math.max(...data.dailyVolume.map((d: any) => d.amount), 1);
  const maxHourlyCount = Math.max(...data.hourlyHeatmap.map((h: any) => h.count), 1);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            System Intelligence
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">
              Real-time platform analytics
            </p>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 shadow-sm w-fit">
          <Wifi className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
            LIVE: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Volume"
          value={`₹${(data.totalVolume || 0).toLocaleString()}`}
          icon={<TrendingUp className="text-emerald-500" size={18} />}
          color="emerald"
        />
        <StatCard
          label="Success Rate"
          value={`${data.successRate}%`}
          icon={<ShieldCheck className="text-blue-500" size={18} />}
          color="blue"
        />
        <StatCard
          label="Active Bots"
          value={`${data.activeBots}/${data.totalBots}`}
          icon={<Smartphone className="text-purple-500" size={18} />}
          color="purple"
        />
        <StatCard
          label="Merchants"
          value={`${data.activeMerchants}/${data.totalMerchants}`}
          icon={<Users className="text-amber-500" size={18} />}
          color="amber"
        />
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Success</p>
          <p className="text-xl font-black text-emerald-700">{data.successTxns}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Pending</p>
          <p className="text-xl font-black text-blue-700">{data.pendingTxns}</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-center">
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Failed</p>
          <p className="text-xl font-black text-rose-700">{data.failedTxns}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expired</p>
          <p className="text-xl font-black text-slate-500">{data.expiredTxns}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* 7 Day Volume */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2.5">
              <BarChart3 className="text-blue-600" size={20} /> 7-Day Volume
            </h3>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
              <p className="text-sm font-black text-slate-900">
                ₹{data.dailyVolume.reduce((s: number, d: any) => s + d.amount, 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 px-2">
            {data.dailyVolume.map((d: any, idx: number) => {
              const heightPct = maxDailyVolume > 0 ? (d.amount / maxDailyVolume) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                  <div className="relative w-full flex flex-col items-center h-full justify-end">
                    <div
                      className="w-full max-w-[40px] bg-blue-50 group-hover:bg-blue-600 rounded-t-lg transition-all cursor-pointer border-x border-t border-blue-100"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase">{d.day}</p>
                    <p className="text-[9px] font-bold text-slate-500 tracking-tighter">{d.count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hourly Heatmap */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2.5">
              <Clock className="text-indigo-600" size={20} /> Hourly Heatmap
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today</p>
          </div>

          <div className="grid grid-cols-12 gap-1.5 h-32">
            {data.hourlyHeatmap.map((h: any) => {
              const intensity = maxHourlyCount > 0 ? h.count / maxHourlyCount : 0;
              return (
                <div key={h.hour} className="flex flex-col gap-1">
                  <div
                    className="flex-1 rounded-md transition-all hover:scale-110 cursor-help border border-indigo-100/20 shadow-sm"
                    style={{
                      backgroundColor: `rgba(79, 70, 229, ${0.05 + intensity * 0.95})`,
                    }}
                    title={`${h.hour}:00 — ${h.count} txns`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>00:00</span>
            <span>12:00</span>
            <span>23:59</span>
          </div>
        </div>
      </div>

      {/* Merchant Leaderboard + Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Merchant Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2.5">
              <Users className="text-emerald-600" size={20} /> Merchant Rankings
            </h3>
          </div>
          <div className="space-y-3">
            {data.merchantStats.length === 0 ? (
              <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-[11px]">No merchants found</p>
            ) : (
              data.merchantStats.slice(0, 6).map((m: any, i: number) => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-300 transition-all group shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                      i === 0 ? "bg-amber-50 text-amber-600 border border-amber-100" :
                      i === 1 ? "bg-slate-50 text-slate-600 border border-slate-200" :
                      "bg-slate-50 text-slate-400 border border-slate-100"
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900 leading-tight mb-0.5">{m.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{m.txns} txns · {m.bots} bots</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">₹{m.volume.toLocaleString()}</p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border mt-1 inline-block ${
                      m.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                    }`}>{m.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Transaction Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2.5">
              <Activity className="text-blue-600 animate-pulse" size={20} /> Live Feed
            </h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase">Streaming</span>
            </div>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
            {data.recentLive.length === 0 ? (
              <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-[11px]">No recent transactions</p>
            ) : (
              data.recentLive.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-slate-300 transition-all shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      t.status === "SUCCESS" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      t.status === "PENDING" ? "bg-blue-50 text-blue-600 border-blue-100" :
                      "bg-rose-50 text-rose-600 border-rose-100"
                    }`}>
                      {t.status === "SUCCESS" ? <CheckCircle2 size={14} /> :
                       t.status === "PENDING" ? <Clock size={14} /> :
                       <XCircle size={14} />}
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-slate-900 leading-tight">₹{t.amount.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-400">{t.merchant?.name} · {t.referenceId?.slice(-8)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={t.status} />
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                      {new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* IP Requests Alert */}
      {data.pendingIpRequests > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center border border-amber-200">
              <Globe className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">IP Whitelist Requests Pending</p>
              <p className="text-[11px] font-bold text-slate-500">{data.pendingIpRequests} request(s) awaiting approval</p>
            </div>
          </div>
          <a href="/admin/merchants" className="px-6 py-3 bg-amber-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-md shadow-amber-600/10 text-center">
            Review Now
          </a>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    purple: "bg-indigo-50 border-indigo-100 text-indigo-600",
    amber: "bg-amber-50 border-amber-100 text-amber-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm group hover:border-slate-300 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg border ${colorMap[color]}`}>{icon}</div>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 leading-none">{label}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    SUCCESS: "bg-emerald-50 text-emerald-600 border-emerald-100",
    PENDING: "bg-blue-50 text-blue-600 border-blue-100",
    FAILED: "bg-rose-50 text-rose-600 border-rose-100",
    EXPIRED: "bg-slate-50 text-slate-400 border-slate-200",
  };
  return (
    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border uppercase inline-block ${styles[status] || styles.PENDING}`}>
      {status}
    </span>
  );
}
