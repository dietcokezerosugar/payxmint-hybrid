import React from "react";
import { AlertCircle, XCircle, Info, ShieldAlert } from "lucide-react";

export default function ErrorCodesDocs() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <section className="space-y-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Error Codes</h1>
        <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
          A list of common error codes you might encounter when interacting with our API.
        </p>
      </section>

      <section className="space-y-8">
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 px-6 font-black text-[10px] text-slate-400 uppercase tracking-widest w-1/4">Status Code</th>
                <th className="p-4 px-6 font-black text-[10px] text-slate-400 uppercase tracking-widest w-1/4">Error Code</th>
                <th className="p-4 px-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Description & Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <ErrorRow 
                status="401" 
                code="UNAUTHORIZED" 
                desc="Missing or invalid API Key. Check your x-api-key header." 
                icon={<XCircle className="text-rose-500" size={16} />}
              />
              <ErrorRow 
                status="403" 
                code="IP_NOT_WHITELISTED" 
                desc="Request blocked because your server IP is not whitelisted in the dashboard." 
                icon={<ShieldAlert className="text-rose-500" size={16} />}
              />
              <ErrorRow 
                status="400" 
                code="INVALID_AMOUNT" 
                desc="Amount must be a positive number and within your VPA band limits." 
                icon={<AlertCircle className="text-amber-500" size={16} />}
              />
              <ErrorRow 
                status="429" 
                code="RATE_LIMIT_EXCEEDED" 
                desc="You are making too many requests. Slow down your integration." 
                icon={<Info className="text-blue-500" size={16} />}
              />
              <ErrorRow 
                status="503" 
                code="NO_VPAS_AVAILABLE" 
                desc="All VPAs in your pool have hit their daily transaction caps." 
                icon={<AlertCircle className="text-rose-500" size={16} />}
              />
            </tbody>
          </table>
        </div>
      </section>

      <div className="p-8 bg-slate-900 rounded-[32px] text-white space-y-4">
        <h3 className="text-xl font-black">Need help?</h3>
        <p className="text-sm text-slate-400 font-medium">
          If you receive an error code not listed here, please contact our technical support with the full JSON response and the `request_id` (found in headers).
        </p>
      </div>
    </div>
  );
}

function ErrorRow({ status, code, desc, icon }: { status: string; code: string; desc: string; icon: React.ReactNode }) {
  return (
    <tr className="hover:bg-slate-50 transition-all">
      <td className="p-4 px-6 font-mono text-[13px] text-slate-900">{status}</td>
      <td className="p-4 px-6 font-black text-[11px] text-slate-700 tracking-tight flex items-center gap-2">{icon} {code}</td>
      <td className="p-4 px-6 text-[13px] text-slate-500 font-medium">{desc}</td>
    </tr>
  );
}
