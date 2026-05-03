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
  Server,
  Gift
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [redirectUrl, setRedirectUrl] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [ipWhitelist, setIpWhitelist] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [apiAccessStatus, setApiAccessStatus] = useState("NOT_REQUESTED");
  const [referralCode, setReferralCode] = useState("");
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setRedirectUrl(d.data.redirectUrl || "");
          setWebhookUrl(d.data.webhookUrl || "");
          setIpWhitelist(d.data.ipWhitelist || "");
          setTelegramBotToken(d.data.telegramBotToken || "");
          setTelegramChatId(d.data.telegramChatId || "");
          setApiAccessStatus(d.data.apiAccessStatus || "NOT_REQUESTED");
          setAgentInfo(d.data.agent || null);
        }
      });
  }, []);

  async function linkReferral() {
    setApplying(true);
    try {
      const res = await fetch("/api/settings/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: referralCode }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setAgentInfo(data.agent);
      } else {
        alert(data.error || "Invalid referral code");
      }
    } finally {
      setApplying(false);
    }
  }

  async function saveConfig() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        redirectUrl, 
        webhookUrl, 
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
                {/* Managed Infrastructure */}
                <div className="space-y-4 pt-4 border-t border-slate-50 col-span-2">
                   <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                         <ShieldCheck className="text-blue-600 w-4 h-4" />
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Managed Infrastructure</label>
                      </div>
                      <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg">
                         <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                         <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Verified System</span>
                      </div>
                   </div>
                   
                   <div className="p-6 bg-slate-50 border border-slate-100 rounded-[28px] flex items-center justify-between group hover:border-blue-200 transition-all shadow-inner">
                      <div className="space-y-1">
                         <p className="text-[11px] font-black text-slate-900 leading-none">
                            {ipWhitelist || "Awaiting First Request"}
                         </p>
                         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                            Active Traffic Origination Node
                         </p>
                      </div>
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-300 shadow-sm">
                         <Lock size={18} />
                      </div>
                   </div>
                   
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter px-1 leading-relaxed max-w-md">
                      This whitelist is automatically updated upon approval of your <a href="/dashboard/ip-whitelist" className="text-blue-600 hover:underline font-black">Security Access Requests</a>. Manual editing is restricted for platform integrity.
                   </p>
                </div>
             </div>
          </section>

          {/* Referral Program */}
          <section className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-8 shadow-sm">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100">
                   <Gift className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Referral Network</h3>
             </div>

             <div className="space-y-4">
                {agentInfo ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[24px] flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 font-black border border-emerald-200">
                           {agentInfo.name[0]}
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Linked Agent</p>
                           <p className="text-sm font-black text-slate-900">{agentInfo.name}</p>
                        </div>
                     </div>
                     <div className="px-3 py-1 bg-white rounded-lg border border-emerald-200 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                        Partner Active
                     </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                     <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-md">
                        Were you referred to WaveCollect? Enter your partner's referral code below to link your account to their network.
                     </p>
                     <div className="flex flex-col md:flex-row gap-3">
                        <input 
                           value={referralCode}
                           onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                           placeholder="Enter Referral Code (e.g. WAVE-123)"
                           className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all outline-none placeholder:font-bold placeholder:text-slate-300"
                        />
                        <button 
                           onClick={linkReferral}
                           disabled={!referralCode || applying}
                           className="px-8 py-4 bg-slate-900 text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
                        >
                           {applying ? "Verifying..." : "Link Account"}
                        </button>
                     </div>
                  </div>
                )}
             </div>
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
