import React from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Smartphone, 
  CreditCard, 
  BarChart3,
  LogOut,
  Settings,
  Calculator,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  RefreshCcw,
  Webhook,
  Terminal
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#FDFDFD] text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-50">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-blue-600 w-5 h-5 fill-current/10" />
            <h1 className="text-sm font-black tracking-tight text-slate-900">
              Wave Admin
            </h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <AdminNavLink href="/admin" icon={<LayoutDashboard size={16} />} label="Overview" />
          <AdminNavLink href="/admin/merchants" icon={<Users size={16} />} label="Merchants & IPs" />
          <AdminNavLink href="/admin/ip-whitelist" icon={<ShieldCheck size={16} />} label="IP Whitelist" />
          <AdminNavLink href="/admin/gateways" icon={<Smartphone size={16} />} label="Global Fleet" />
          <AdminNavLink href="/admin/customers" icon={<ShieldAlert size={16} />} label="Risk Entities" />
          <AdminNavLink href="/admin/staff" icon={<ShieldCheck size={16} />} label="Staff Hub" />
          <AdminNavLink href="/admin/transactions" icon={<CreditCard size={16} />} label="Transactions" />
          <AdminNavLink href="/admin/settlements" icon={<Wallet size={16} />} label="Settlement Custody" />
          <AdminNavLink href="/admin/reconciliation" icon={<RefreshCcw size={16} />} label="Reconciliation Hub" />
          <AdminNavLink href="/admin/webhooks" icon={<Webhook size={16} />} label="Webhooks Queue" />
          <AdminNavLink href="/admin/logs" icon={<Terminal size={16} />} label="System Logs" />
          <AdminNavLink href="/admin/referrals" icon={<Users size={16} />} label="Referral Hub" />
          <AdminNavLink href="/admin/analytics" icon={<BarChart3 size={16} />} label="System Health" />
          <AdminNavLink href="/admin/calculator" icon={<Calculator size={16} />} label="Cost Planner" />
          <AdminNavLink href="/admin/settings" icon={<Settings size={16} />} label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-all text-[11px] font-bold text-slate-500 hover:text-slate-900">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#FDFDFD]">
        <header className="h-16 border-b border-slate-200 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-40">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Platform Administration</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">All Systems Normal</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-black border border-blue-100 text-xs shadow-sm">
              AD
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function AdminNavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold rounded-lg transition-all text-slate-500 hover:text-slate-900 hover:bg-slate-50"
    >
      {icon}
      {label}
    </Link>
  );
}
