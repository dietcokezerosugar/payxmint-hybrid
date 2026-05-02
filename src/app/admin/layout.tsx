import React from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Smartphone, 
  CreditCard, 
  ShieldCheck, 
  BarChart3,
  LogOut,
  Settings
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="text-blue-500" /> Wave Admin
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">SaaS Overlord</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <AdminNavLink href="/admin" icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <AdminNavLink href="/admin/merchants" icon={<Users size={18} />} label="Merchants" />
          <AdminNavLink href="/admin/gateways" icon={<Smartphone size={18} />} label="Global Fleet" />
          <AdminNavLink href="/admin/transactions" icon={<CreditCard size={18} />} label="All Transactions" />
          <AdminNavLink href="/admin/agents" icon={<Users size={18} />} label="Agents & Staff" />
          <AdminNavLink href="/admin/analytics" icon={<BarChart3 size={18} />} label="System Health" />
          <AdminNavLink href="/admin/settings" icon={<Settings size={18} />} label="Global Settings" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all text-sm font-bold">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-950">
        <header className="h-16 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">System Monitor</h2>
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-xs font-black text-white">System Admin</span>
              <span className="text-[10px] font-bold text-emerald-500">Node Status: HEALTHY</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black border-2 border-slate-800">
              A
            </div>
          </div>
        </header>

        <div className="p-8">
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
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-all text-sm font-bold text-slate-400 hover:text-white"
    >
      {icon}
      {label}
    </Link>
  );
}
