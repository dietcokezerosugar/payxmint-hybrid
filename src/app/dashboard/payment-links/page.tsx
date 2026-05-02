"use client";

import { useState, useEffect } from "react";
import { Link as LinkIcon, Plus, ExternalLink, Copy, Trash2 } from "lucide-react";

interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  description: string | null;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

export default function PaymentLinksPage() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  async function fetchLinks() {
    const res = await fetch("/api/payment-links");
    const data = await res.json();
    setLinks(data.data || []);
  }

  async function createLink() {
    if (!title || !amount) return;
    setLoading(true);
    await fetch("/api/payment-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, amount, description }),
    });
    setTitle(""); setAmount(""); setDescription(""); setShowCreate(false);
    await fetchLinks();
    setLoading(false);
  }

  async function deleteLink(id: string) {
    await fetch(`/api/payment-links?id=${id}`, { method: "DELETE" });
    await fetchLinks();
  }

  function copyUrl(slug: string) {
    const url = `${window.location.origin}/link/${slug}`;
    navigator.clipboard.writeText(url);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Links</h1>
          <p className="text-muted-foreground">Create shareable hosted payment pages.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold flex items-center gap-2 hover:bg-blue-600 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Link
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="apple-card p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold">New Payment Link</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Monthly Subscription"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount (₹)</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                placeholder="499"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description (optional)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Access to premium features"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={createLink}
              disabled={loading || !title || !amount}
              className="px-6 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Link"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-6 py-2 bg-gray-100 text-foreground rounded-full text-sm font-bold hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Links List */}
      <div className="grid gap-4">
        {links.length === 0 ? (
          <div className="apple-card p-12 text-center">
            <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground italic">No payment links yet. Create your first one!</p>
          </div>
        ) : (
          links.map((link) => (
            <div key={link.id} className="apple-card p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-primary">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">{link.title}</p>
                  <p className="text-xs text-muted-foreground">{link.description || "No description"}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-lg font-extrabold">₹{link.amount.toLocaleString()}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${link.isActive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                  {link.isActive ? "Active" : "Inactive"}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => copyUrl(link.slug)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-muted-foreground hover:text-primary" title="Copy Link">
                    <Copy className="w-4 h-4" />
                  </button>
                  <a href={`/link/${link.slug}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-muted-foreground hover:text-primary" title="Open Link">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={() => deleteLink(link.id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors text-muted-foreground hover:text-red-500" title="Deactivate">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
