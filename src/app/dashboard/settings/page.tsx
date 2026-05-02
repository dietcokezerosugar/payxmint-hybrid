"use client";

import { useState, useEffect } from "react";
import { Globe, Bell, Smartphone, Plus, CheckCircle2, Save, Trash2 } from "lucide-react";

interface GPayAccount {
  id: string;
  name: string;
  email: string;
  upiId: string;
  status: string;
  lastSync: string | null;
}

export default function SettingsPage() {
  const [redirectUrl, setRedirectUrl] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [accounts, setAccounts] = useState<GPayAccount[]>([]);
  const [saved, setSaved] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUpiId, setNewUpiId] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setRedirectUrl(d.data.redirectUrl || "");
          setWebhookUrl(d.data.webhookUrl || "");
        }
      });
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    const res = await fetch("/api/gpay-accounts");
    const data = await res.json();
    setAccounts(data.data || []);
  }

  async function saveConfig() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redirectUrl, webhookUrl }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function addAccount() {
    if (!newName || !newEmail || !newUpiId) return;
    await fetch("/api/gpay-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, email: newEmail, upiId: newUpiId }),
    });
    setNewName(""); setNewEmail(""); setNewUpiId(""); setShowAdd(false);
    await fetchAccounts();
  }

  async function removeAccount(id: string) {
    await fetch(`/api/gpay-accounts?id=${id}`, { method: "DELETE" });
    await fetchAccounts();
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your platform configuration and connected accounts.</p>
      </div>

      <div className="grid gap-8">
        {/* API Configuration */}
        <div className="apple-card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-bold">API Configuration</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Default Redirect URL</label>
              <input
                type="text"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder="https://yourdomain.com/callback"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Webhook Endpoint</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://api.yourdomain.com/webhooks/wave"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>
          <button
            onClick={saveConfig}
            className="px-6 py-2 bg-primary text-white rounded-full text-sm font-bold flex items-center gap-2 hover:bg-blue-600 transition-all"
          >
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Configuration</>}
          </button>
        </div>


        {/* Notifications Placeholder */}
        <div className="apple-card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-bold">Notifications</h3>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="text-sm font-bold">Email Alerts</p>
              <p className="text-xs text-muted-foreground">Receive daily summaries and critical alerts.</p>
            </div>
            <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
