import React from "react";
import { CheckCircle2, Shield, Zap, RefreshCcw, AlertTriangle } from "lucide-react";

export default function BestPracticesDocs() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <section className="space-y-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Best Practices</h1>
        <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
          Follow these guidelines to ensure your integration is secure, resilient, and fast.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <PracticeCard 
          icon={<Shield className="text-blue-600" />}
          title="Security First"
          rules={[
            "Never expose API keys in frontend code.",
            "Always verify webhook HMAC signatures.",
            "Enable IP Whitelisting for all production keys.",
            "Use different keys for Dev and Prod environments."
          ]}
        />

        <PracticeCard 
          icon={<RefreshCcw className="text-emerald-600" />}
          title="Resilient Webhooks"
          rules={[
            "Respond with 200 OK immediately before processing.",
            "Make your webhook handler idempotent.",
            "Handle duplicate webhooks gracefully.",
            "Use the provided retry queue for local failures."
          ]}
        />

        <PracticeCard 
          icon={<Zap className="text-amber-600" />}
          title="Performance"
          rules={[
            "Cache payment status for polling for 1 minute.",
            "Use native UPI intents for mobile apps.",
            "Minimize redirect chains on your site.",
            "Pre-generate intents for high-traffic carts."
          ]}
        />

        <PracticeCard 
          icon={<AlertTriangle className="text-rose-600" />}
          title="Error Handling"
          rules={[
            "Always log the request_id on failures.",
            "Implement exponential backoff for polling.",
            "Show clear status messages to customers.",
            "Monitor your webhook delivery health."
          ]}
        />
      </div>

      <section className="p-10 bg-slate-900 rounded-[40px] text-white space-y-6">
        <h3 className="text-2xl font-black tracking-tight">Ready for Production?</h3>
        <p className="text-slate-400 font-medium leading-relaxed max-w-2xl">
          Before going live, we recommend performing at least 5 test transactions in a staging environment to ensure your webhook handler and redirect logic are perfectly synced.
        </p>
        <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
          Request Production Access
        </button>
      </section>
    </div>
  );
}

function PracticeCard({ icon, title, rules }: { icon: React.ReactNode; title: string; rules: string[] }) {
  return (
    <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">{icon}</div>
      <h3 className="text-xl font-black text-slate-900">{title}</h3>
      <ul className="space-y-3">
        {rules.map((rule, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-slate-500 font-medium leading-tight">
            <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
            {rule}
          </li>
        ))}
      </ul>
    </div>
  );
}
