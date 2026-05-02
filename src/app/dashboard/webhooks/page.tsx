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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
        <p className="text-muted-foreground">Configure real-time POST notifications for payment events.</p>
      </div>

      <div className="apple-card p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary">
            <Webhook className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Webhook Endpoint</h3>
            <p className="text-xs text-muted-foreground">We'll send a POST request with payment details on success.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Endpoint URL</label>
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://api.yourdomain.com/webhooks/wave-collect"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={saveWebhook}
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-full text-sm font-bold flex items-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> {loading ? "Saving..." : "Save"}</>}
          </button>
          <button
            onClick={testWebhook}
            disabled={!webhookUrl}
            className="px-6 py-2 bg-secondary text-foreground rounded-full text-sm font-bold hover:bg-gray-200 transition-all border border-gray-200 disabled:opacity-50"
          >
            Send Test
          </button>
        </div>
      </div>

      {/* Payload Example */}
      <div className="apple-card overflow-hidden">
        <div className="bg-gray-900 px-5 py-3 flex items-center gap-3 border-b border-gray-800">
          <span className="text-xs font-bold text-green-400 uppercase tracking-widest font-mono">Payload Schema</span>
        </div>
        <div className="bg-gray-950 p-5">
          <pre className="text-xs text-gray-300 font-mono leading-relaxed">
{`POST your-webhook-url

Content-Type: application/json

{
  "event": "payment.success",
  "status": "SUCCESS",
  "amount": 499.00,
  "txn_id": "8162837377597833216",
  "reference_id": "ORDER-12345",
  "utr": "050701155108",
  "payer_name": "John Doe",
  "payer_upi": "john@okaxis",
  "timestamp": "2026-05-02T12:00:00.000Z"
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
