"use client";

import { useState, useEffect } from "react";
import { Webhook, CheckCircle2, Save } from "lucide-react";

export default function WebhooksPage() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.webhookUrl) setWebhookUrl(d.data.webhookUrl);
      });
  }, []);

  async function saveWebhook() {
    setLoading(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookUrl }),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function testWebhook() {
    if (!webhookUrl) return;
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "payment.test",
          status: "SUCCESS",
          amount: 100,
          txn_id: "TEST-12345",
          reference_id: "test-order-001",
          timestamp: new Date().toISOString(),
        }),
      });
      alert(res.ok ? "Webhook delivered successfully!" : `Webhook returned ${res.status}`);
    } catch (e: any) {
      alert("Webhook test failed: " + e.message);
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-12 font-sans px-2 md:px-0 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Event Dispatch</h1>
        <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mt-1">Configure real-time POST delivery infrastructure</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 space-y-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
              <Webhook className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5">Destination Endpoint</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">System will dispatch high-integrity event objects to this URI.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Integrity URI</label>
            <input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://api.yourdomain.com/webhooks/wave"
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-200"
            />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <button
              onClick={saveWebhook}
              disabled={loading}
              className="w-full md:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-slate-900/10 active:scale-95 disabled:opacity-50"
            >
              {saved ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Endpoint Synced</> : <><Save className="w-4 h-4" /> {loading ? "Syncing..." : "Commit Endpoint"}</>}
            </button>
            <button
              onClick={testWebhook}
              disabled={!webhookUrl}
              className="w-full md:w-auto px-8 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              Dispatch Test Packet
            </button>
          </div>
        </div>
      </div>

      {/* Payload Example */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Packet Schema (POST JSON)</h3>
        <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
          <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
               <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500/20 border border-rose-500/30" />
                  <div className="w-2 h-2 rounded-full bg-amber-500/20 border border-amber-500/30" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
               </div>
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] font-mono">application/json</span>
            </div>
          </div>
          <div className="p-6 md:p-8 overflow-x-auto">
            <pre className="text-[11px] md:text-[13px] text-blue-200 font-mono leading-relaxed">
{`{
  "event": "payment.success",
  "status": "SUCCESS",
  "amount": 499.00,
  "txn_id": "8162837377597833216",
  "reference_id": "ORDER-12345",
  "utr": "050701155108",
  "payer_name": "John Doe",
  "payer_upi": "john@okaxis",
  "timestamp": "2024-05-02T16:30:28.423Z"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
