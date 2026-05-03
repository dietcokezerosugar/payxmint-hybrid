"use client";

import { useState, useEffect } from "react";
import { 
  Globe, 
  Bell, 
  Smartphone, 
  CheckCircle2, 
  Save, 
  Zap, 
  Plus, 
  XCircle, 
  ShieldAlert, 
  ShieldCheck,
  Activity,
  Lock,
  ArrowUpRight,
  Server
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [redirectUrl, setRedirectUrl] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookWhitelist, setWebhookWhitelist] = useState("");
  const [ipWhitelist, setIpWhitelist] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [apiAccessStatus, setApiAccessStatus] = useState("NOT_REQUESTED");
  const [saved, setSaved] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setRedirectUrl(d.data.redirectUrl || "");
          setWebhookUrl(d.data.webhookUrl || "");
          setWebhookWhitelist(d.data.webhookWhitelist || "");
          setIpWhitelist(d.data.ipWhitelist || "");
          setTelegramBotToken(d.data.telegramBotToken || "");
          setTelegramChatId(d.data.telegramChatId || "");
          setApiAccessStatus(d.data.apiAccessStatus || "NOT_REQUESTED");
        }
      });
  }, []);

  async function saveConfig() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        redirectUrl, 
        webhookUrl, 
        webhookWhitelist,
        ipWhitelist,
        telegramBotToken, 
        telegramChatId 
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function applyForAccess() {
    setApplying(true);
    try {
      const res = await fetch("/api/settings/apply-access", { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        setApiAccessStatus("PENDING");
      }
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-20 font-sans max-w-5xl mx-auto px-4 md:px-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Control Center</h1>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Global platform architecture & environment security</p>
        </div>
        <div className="flex items-center gap-3">
           <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${
             apiAccessStatus === "APPROVED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
             apiAccessStatus === "PENDING" ? "bg-amber-50 text-amber-600 border-amber-100" :
             "bg-slate-50 text-slate-400 border-slate-200"
           }`}>
              <Activity className={`w-3.5 h-3.5 ${apiAccessStatus === "PENDING" ? "animate-pulse" : ""}`} />
              API Status: {apiAccessStatus.replace("_", " ")}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          {/* API Access Approval Section */}
          {apiAccessStatus !== "APPROVED" && (
            <section className="bg-blue-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-600/20">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <Lock className="w-6 h-6 text-white" />
                     </div>
                     <div>
                        <h2 className="text-xl font-black tracking-tight">API Access Request</h2>
                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest">One-time compliance verification</p>
                     </div>
                  </div>
                  <p className="text-blue-50 text-sm font-medium leading-relaxed max-w-md">
                    To maintain ecosystem integrity, external API access requires a one-time verification. Applying will notify our compliance team to audit your account nodes.
                  </p>
                  <button 
                    onClick={applyForAccess}
                    disabled={applying || apiAccessStatus === "PENDING"}
                    className="px-8 py-4 bg-white text-blue-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl disabled:opacity-50 active:scale-95"
                  >
                    {applying ? "Processing..." : apiAccessStatus === "PENDING" ? "Application Under Review" : "Apply for API Whitelisting"}
                  </button>
               </div>
            </section>
          )}

          {/* Core Integration Details */}
          <section className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-8 shadow-sm">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                   <Server className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Network Architecture</h3>
             </div>

             <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Callback URL (Redirect)</label>
                   <input 
                      value={redirectUrl}
                      onChange={(e) => setRedirectUrl(e.target.value)}
                      placeholder="https://yoursite.com/done"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all outline-none"
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Event Stream (Webhook)</label>
                   <input 
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://api.yoursite.com/webhook"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all outline-none"
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Webhook Origin Whitelist</label>
                   <input 
                      value={webhookWhitelist}
                      onChange={(e) => setWebhookWhitelist(e.target.value)}
                      placeholder="1.2.3.4, 5.6.7.8 (Optional)"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all outline-none"
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Infrastructure Whitelist (IPs)</label>
                   <input 
                      value={ipWhitelist}
                      onChange={(e) => setIpWhitelist(e.target.value)}
                      placeholder="Your server IPs (comma separated)"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all outline-none"
                   />
                </div>
             </div>
          </section>

          {/* Telegram Notifications */}
          <section className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-8 shadow-sm">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                   <Bell className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Real-time Telemetry</h3>
             </div>

             <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bot Token</label>
                   <input 
                      type="password"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      placeholder="123456789:ABC..."
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all outline-none"
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Chat ID</label>
                   <input 
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="-100123456789"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all outline-none"
                   />
                </div>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed">
                Critical alerts for system health, payout settlement, and suspicious activities will be dispatched to this Telegram endpoint.
             </p>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[32px] p-8 text-white space-y-6 shadow-xl shadow-slate-900/10">
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
             </div>
             <h3 className="text-xl font-black tracking-tight">Security Hardening</h3>
             <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Ensure your callback endpoints are secured with TLS 1.3. For high-throughput environments, we recommend IP whitelisting to prevent unauthorized request injection.
             </p>
             <div className="pt-4 border-t border-white/5">
                <button
                  onClick={saveConfig}
                  disabled={saved}
                  className={`w-full py-5 rounded-[24px] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${
                    saved ? "bg-emerald-500 text-white" : "bg-white text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {saved ? "Configuration Committed" : "Save All Changes"}
                </button>
             </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-6">
             <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Environment Info</h3>
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Tier</span>
                   <span className="text-[11px] font-black text-slate-900">ENTERPRISE</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latency Avg</span>
                   <span className="text-[11px] font-black text-emerald-600">42ms</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SSL Status</span>
                   <span className="text-[11px] font-black text-blue-600 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> SECURE
                   </span>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
