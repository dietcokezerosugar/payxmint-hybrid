"use client";

import { useState, useEffect } from "react";
import { Key, Copy, ShieldAlert, Plus, Check } from "lucide-react";

interface ApiKeyData {
  id: string;
  key: string;
  merchantId: string;
  monthlyLimit: number;
  usedAmount: number;
  isBlocked: boolean;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    const res = await fetch("/api/keys");
    const data = await res.json();
    setKeys(data.data || []);
  }

  async function generateKey() {
    setLoading(true);
    await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthly_limit: 100000 }),
    });
    await fetchKeys();
    setLoading(false);
  }

  async function toggleBlock(id: string, currentBlocked: boolean) {
    await fetch("/api/keys", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isBlocked: !currentBlocked }),
    });
    await fetchKeys();
  }

  function copyKey(key: string, id: string) {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">Manage keys to authenticate your payment requests.</p>
        </div>
        <button
          onClick={generateKey}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold flex items-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> {loading ? "Generating..." : "Generate New Key"}
        </button>
      </div>

      <div className="grid gap-4">
        {keys.map((key) => (
          <div key={key.id} className="apple-card p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold font-mono tracking-wider">{key.key}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      key.isBlocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                    }`}
                  >
                    {key.isBlocked ? "Blocked" : "Active"}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-right">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Limit Used</p>
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min((key.usedAmount / key.monthlyLimit) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs font-bold">
                  ₹{key.usedAmount.toLocaleString()} / ₹{key.monthlyLimit.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyKey(key.key, key.id)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-muted-foreground hover:text-primary"
                  title="Copy Key"
                >
                  {copiedId === key.id ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => toggleBlock(key.id, key.isBlocked)}
                  className={`p-2 rounded-xl transition-colors ${
                    key.isBlocked
                      ? "hover:bg-green-50 text-red-400 hover:text-green-500"
                      : "hover:bg-red-50 text-muted-foreground hover:text-red-500"
                  }`}
                  title={key.isBlocked ? "Unblock" : "Block"}
                >
                  <ShieldAlert className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
