"use client";

import React, { useState } from "react";
import { 
  Book, 
  Key, 
  Settings, 
  Code, 
  Terminal, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  Copy,
  CheckCircle2,
  Lock,
  Globe,
  Database
} from "lucide-react";

export default function DocsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-12 pb-32 max-w-5xl mx-auto px-4 md:px-6 animate-in fade-in duration-700">
      <div className="border-b border-slate-200 pb-8">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Developer Portal</h1>
        <p className="text-slate-500 font-bold text-sm mt-2">The definitive guide to integrating high-velocity UPI settlement.</p>
      </div>

      {/* Quick Start Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <DocQuickCard 
          icon={<Key className="w-5 h-5" />}
          title="Authentication"
          desc="Learn aboutwc_ API keys and security."
        />
        <DocQuickCard 
          icon={<Settings className="w-5 h-5" />}
          title="Account Setup"
          desc="Configure nodes and whitelisting."
        />
        <DocQuickCard 
          icon={<Code className="w-5 h-5" />}
          title="Checkout Flow"
          desc="Custom hosted or API payment flows."
        />
      </div>

      {/* Step 1: Account Setup */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">1</div>
           <h2 className="text-2xl font-black tracking-tight">Step 1: Node Authorization</h2>
        </div>
        <div className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-6 shadow-sm">
           <p className="text-slate-600 font-medium leading-relaxed">
             Before processing any live traffic, you must authorize your infrastructure. This is a one-time security gate to ensure only verified merchant nodes can interact with the settlement engine.
           </p>
           <ul className="space-y-4">
             <li className="flex items-start gap-3">
               <div className="p-1 bg-emerald-50 text-emerald-600 rounded-md mt-0.5"><CheckCircle2 size={14} /></div>
               <div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Request API Access</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">Navigate to <span className="text-blue-600 font-bold">Settings &gt; Control Center</span> and click "Apply for API Whitelisting". Our compliance team will audit your request within 24 hours.</p>
               </div>
             </li>
             <li className="flex items-start gap-3">
               <div className="p-1 bg-emerald-50 text-emerald-600 rounded-md mt-0.5"><CheckCircle2 size={14} /></div>
               <div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Configure Firewall</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">Enter your server IPv4 addresses in the "Infrastructure Whitelist". Requests from unauthorized IPs will be rejected with a 403 Forbidden response.</p>
               </div>
             </li>
           </ul>
        </div>
      </section>

      {/* Step 2: Key Provisioning */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">2</div>
           <h2 className="text-2xl font-black tracking-tight">Step 2: API Key Management</h2>
        </div>
        <div className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-6 shadow-sm">
           <p className="text-slate-600 font-medium leading-relaxed">
             Your API keys are the primary credentials for the WaveCollect engine. Treat them as sensitive secrets.
           </p>
           <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <Terminal className="w-5 h-5 text-blue-600" />
                 </div>
                 <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Key Prefix</p>
                    <p className="text-sm font-mono font-black text-slate-900 mt-1">wc_live_xxxxxxxxxxxxxxxx</p>
                 </div>
              </div>
              <ArrowRight className="text-slate-300" />
           </div>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Keys can be revoked or rotated instantly from the <span className="text-slate-900 underline decoration-blue-500">Security Credentials</span> tab.</p>
        </div>
      </section>

      {/* Step 3: Custom Checkout Integration */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">3</div>
           <h2 className="text-2xl font-black tracking-tight">Step 3: Custom Checkout Implementation</h2>
        </div>
        <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
           <div className="p-8 border-b border-slate-100 space-y-4">
              <p className="text-slate-600 font-medium leading-relaxed">
                To create a seamless payment experience, use our <span className="font-black text-slate-900">Payment Intent API</span>. This allows you to generate a dynamic UPI deep-link and QR code for your customers.
              </p>
              <div className="flex items-center gap-4">
                 <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100 uppercase tracking-widest">POST /api/v1/create-intent</span>
              </div>
           </div>

           <div className="bg-slate-950 p-8 space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Node.js / Express Integration</span>
                 </div>
                 <button 
                  onClick={() => copyToClipboard(snippet, 'code1')}
                  className="text-slate-500 hover:text-white transition-colors"
                 >
                    {copied === 'code1' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                 </button>
              </div>
              <pre className="text-blue-100 text-[13px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {snippet}
              </pre>
           </div>

           <div className="p-8 bg-blue-50/50 border-t border-slate-100">
              <div className="flex gap-4">
                 <div className="p-2 bg-blue-600 rounded-lg shrink-0 h-fit">
                    <Zap className="w-4 h-4 text-white" />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Real-time Verification</h4>
                    <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                      After redirecting the customer, our system will poll the GPay node every 2 seconds. Once settlement is detected, we dispatch a cryptographically signed webhook to your <span className="text-blue-600 font-bold underline">Event Stream URI</span>.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Compliance & Support */}
      <div className="bg-slate-900 rounded-[40px] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
         <div className="space-y-6 relative z-10 max-w-lg">
            <h2 className="text-3xl font-black tracking-tight">Need Enterprise Support?</h2>
            <p className="text-slate-400 font-medium leading-relaxed">
              Our engineering team is available 24/7 for high-throughput integration audits and custom node deployments.
            </p>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live SLA: 99.9%</span>
               </div>
               <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Coverage</span>
               </div>
            </div>
         </div>
         <button className="px-10 py-5 bg-white text-slate-900 rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all relative z-10">
            Contact Engineering
         </button>
      </div>

    </div>
  );
}

function DocQuickCard({ icon, title, desc }: any) {
  return (
    <div className="bg-white rounded-[28px] border border-slate-200 p-6 space-y-4 hover:border-blue-500 transition-all group cursor-pointer shadow-sm">
      <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
        {icon}
      </div>
      <div>
         <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{title}</h3>
         <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

const snippet = `const axios = require('axios');

async function createPayment() {
  const payload = {
    amount: 1000.00,
    referenceId: "ORDER_12345",
    customerMobile: "9988776655",
    customerEmail: "dev@example.com",
    redirectUrl: "https://yoursite.com/done"
  };

  const response = await axios.post('https://api.wavecollect.com/api/v1/create-intent', payload, {
    headers: {
      'Authorization': 'Bearer wc_live_your_api_key_here',
      'Content-Type': 'application/json'
    }
  });

  if (response.data.status === 'success') {
    // Redirect customer to the hosted payment page
    window.location.href = response.data.data.checkoutUrl;
    
    // OR: Use raw deep-link for your mobile app
    // const deepLink = response.data.data.upiDeepLink;
  }
}`;
