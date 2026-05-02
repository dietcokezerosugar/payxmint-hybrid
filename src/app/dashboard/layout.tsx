import Link from "next/link";
import { 
  LayoutDashboard, 
  Key, 
  Link as LinkIcon, 
  History, 
  Terminal, 
  Webhook, 
  Settings,
  Zap,
  ChevronRight
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Merchant Accounts", icon: Key, href: "/dashboard/merchant-accounts" },
    { label: "API Keys", icon: Key, href: "/dashboard/api-keys" },
    { label: "Payment Links", icon: LinkIcon, href: "/dashboard/payment-links" },
    { label: "Transactions", icon: History, href: "/dashboard/transactions" },
    { label: "API Logs", icon: Terminal, href: "/dashboard/logs" },
    { label: "Webhooks", icon: Webhook, href: "/dashboard/webhooks" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ];

  return (
    <div className="flex min-h-screen bg-secondary">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 z-50">
        <div className="p-6 flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="text-white w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight">Wave Collect</span>
        </div>
        
        <nav className="flex-grow px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-blue-50 rounded-xl transition-all group"
            >
              <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {item.label}
              <ChevronRight className="ml-auto w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-100">
          <div className="bg-blue-50 p-4 rounded-2xl">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Current Plan</p>
            <p className="text-sm font-bold text-foreground">Developer MVP</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
