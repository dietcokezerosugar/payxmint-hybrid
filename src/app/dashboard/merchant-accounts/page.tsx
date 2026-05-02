"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Smartphone, Plus, Play, Square, RefreshCw, Terminal as TerminalIcon, Power, CheckCircle2, ShieldCheck, AlertTriangle, Key, Loader2, ArrowRight
} from "lucide-react";

interface GPayAccount {
  id: string;
  name: string;
  email: string;
  upiId: string;
  reportId: string | null;
  status: string;
  monthlyLimit: number;
  usedAmount: number;
  pm2Status?: "online" | "stopped" | "errored" | "unknown";
}

export default function MerchantAccountsPage() {
  const [accounts, setAccounts] = useState<GPayAccount[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  
  // Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUpiId, setNewUpiId] = useState("");

  const [autoLoginLogs, setAutoLoginLogs] = useState<string[]>([]);
  const [isLoginComplete, setIsLoginComplete] = useState(false);
  const [isLoginSuccess, setIsLoginSuccess] = useState(false);

  useEffect(() => {
    fetchAccounts();
    const interval = setInterval(fetchAccounts, 10000); // Poll PM2 status
    return () => clearInterval(interval);
  }, []);

  // Poll progress logs when in Step 3
  useEffect(() => {
    let logInterval: NodeJS.Timeout;
    if (wizardStep === 3 && newName) {
      logInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/bots/login/progress?name=${newName}`);
          const data = await res.json();
          if (data.logs) {
            setAutoLoginLogs(data.logs);
            if (data.logs.some((l: string) => l.includes("[SUCCESS]"))) {
              setIsLoginComplete(true);
              setIsLoginSuccess(true);
              setWizardStep(4);
              fetchAccounts(); // Fetch immediately to show the new account
            } else if (data.logs.some((l: string) => l.includes("[ERROR]") || l.includes("[CRITICAL]"))) {
              setIsLoginComplete(true);
              setIsLoginSuccess(false);
              setWizardStep(4);
            }
          }
        } catch(e) {}
      }, 1500);
    }
    return () => clearInterval(logInterval);
  }, [wizardStep, newName]);

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/gpay-accounts");
      const data = await res.json();
      
      const statusRes = await fetch("/api/bots/control?action=status", { method: "POST" });
      const statusData = await statusRes.json();
      
      const merged = (data.data || []).map((acc: GPayAccount) => ({
        ...acc,
        pm2Status: statusData.bots?.[acc.name] || "unknown"
      }));
      
      setAccounts(merged);
    } catch (e) {
      console.error(e);
    }
  }

  async function updateAccount(id: string, updates: any) {
    await fetch("/api/gpay-accounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    fetchAccounts();
  }

  async function deleteAccount(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone and the PM2 bot will be removed.`)) return;
    
    // Attempt to delete PM2 bot
    try {
      await fetch("/api/bots/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, action: "delete" }),
      });
    } catch(e) {}

    // Delete from DB
    await fetch(`/api/gpay-accounts?id=${id}`, { method: "DELETE" });
    fetchAccounts();
  }

  async function botAction(name: string, action: string) {
    await fetch("/api/bots/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, action }),
    });
    fetchAccounts();
  }

  async function startAutoLogin() {
    // 1. Create DB Record first so it exists
    await fetch("/api/gpay-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, email: newEmail, upiId: newUpiId }),
    });

    // 2. Trigger auto login
    await fetch("/api/bots/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, action: "auto", email: newEmail, password: newPassword }),
    });
    
    setWizardStep(3);
  }

  async function manualLogin(name: string) {
    await fetch("/api/bots/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    alert("Manual login browser launched on the server. Please complete the login there.");
  }

  function resetWizard() {
    setShowWizard(false);
    setWizardStep(1);
    setNewName(""); setNewEmail(""); setNewPassword(""); setNewUpiId("");
    setAutoLoginLogs([]);
    setIsLoginComplete(false);
    setIsLoginSuccess(false);
  }

  return (
    <div className="space-y-8 pb-12 font-sans max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchant Accounts</h1>
          <p className="text-muted-foreground mt-1">Add and configure Google Pay business accounts for automated payment verification.</p>
        </div>
        {!showWizard && (
          <button
            onClick={() => setShowWizard(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-full text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20"
            disabled={accounts.length >= 10}
          >
            <Plus className="w-4 h-4" /> Add Google Pay Account
          </button>
        )}
      </div>

      {showWizard && (
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
          {/* Wizard Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-lg font-bold">Add New Account Wizard</h2>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <span className={`\${wizardStep >= 1 ? 'text-indigo-600' : ''}`}>1. Warning</span>
              <ArrowRight className="w-4 h-4" />
              <span className={`\${wizardStep >= 2 ? 'text-indigo-600' : ''}`}>2. Details</span>
              <ArrowRight className="w-4 h-4" />
              <span className={`\${wizardStep >= 3 ? 'text-indigo-600' : ''}`}>3. Progress</span>
            </div>
          </div>

          <div className="p-8">
            {wizardStep === 1 && (
              <div className="space-y-6 max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Important Security Requirement</h3>
                  <p className="text-slate-500 leading-relaxed">
                    To allow our system to automatically log into your Google Pay Business account, you <strong>must disable 2-Step Verification (2FA)</strong> and phone prompts on the Google Account. 
                  </p>
                  <p className="text-slate-500 leading-relaxed mt-2">
                    If Google detects the login as suspicious, the automated login will fail, and you will need to use the Manual Login fallback.
                  </p>
                </div>
                <div className="pt-4 flex items-center justify-center gap-4">
                  <button onClick={resetWizard} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                  <button onClick={() => setWizardStep(2)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">I Understand, Continue</button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="max-w-xl mx-auto space-y-6">
                <div className="grid gap-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Internal Alias (No Spaces)</label>
                    <input value={newName} onChange={(e) => setNewName(e.target.value.replace(/\s+/g, '-'))} placeholder="e.g. gpay-main" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Google Email</label>
                    <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="merchant@gmail.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Google Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all" />
                    <p className="text-[10px] text-slate-400 mt-1">We use this once to establish the session. It is not saved permanently.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Business UPI ID</label>
                    <input value={newUpiId} onChange={(e) => setNewUpiId(e.target.value)} placeholder="merchant@okaxis" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all" />
                  </div>
                </div>
                <div className="pt-4 flex items-center justify-between">
                  <button onClick={() => setWizardStep(1)} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-700 transition-colors">Back</button>
                  <button onClick={startAutoLogin} disabled={!newName || !newEmail || !newPassword || !newUpiId} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                    <Key className="w-4 h-4" /> Start Auto-Login
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="max-w-2xl mx-auto space-y-6 text-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <h3 className="text-xl font-bold">Establishing Secure Session</h3>
                <p className="text-slate-500">The VPS is currently attempting to log in autonomously. Please wait...</p>
                
                <div className="mt-8 bg-slate-950 rounded-xl p-6 text-left h-64 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-2 border border-slate-800 shadow-inner">
                  {autoLoginLogs.length === 0 && <p className="text-slate-500 italic">Waiting for terminal output...</p>}
                  {autoLoginLogs.map((log, i) => (
                    <div key={i} className={`\${log.includes('SUCCESS') ? 'text-emerald-400' : log.includes('ERROR') || log.includes('WARNING') ? 'text-amber-400' : ''}`}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="max-w-md mx-auto text-center space-y-6 py-8">
                {isLoginSuccess ? (
                  <>
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Account Linked!</h3>
                      <p className="text-slate-500">The automated script successfully bypassed the login and saved the session.</p>
                    </div>
                    <button onClick={resetWizard} className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                      Done
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                      <AlertTriangle className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Auto-Login Blocked</h3>
                      <p className="text-slate-500">Google requested a manual verification step (like a phone prompt or CAPTCHA) which the bot cannot skip.</p>
                    </div>
                    <div className="space-y-3 pt-4">
                      <button onClick={() => manualLogin(newName)} className="w-full px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20">
                        Launch Manual Login
                      </button>
                      <button onClick={resetWizard} className="w-full px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 transition-colors rounded-xl">
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account List */}
      {!showWizard && (
        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Configured Accounts ({accounts.length}/10)</h3>
          </div>
          
          {accounts.map(acc => {
            const isOnline = acc.pm2Status === "online";
            const isActive = acc.status === "ACTIVE";
            
            return (
              <div key={acc.id} className={`bg-white rounded-2xl border transition-all overflow-hidden \${isActive ? 'border-slate-200 shadow-sm' : 'border-slate-200 opacity-75 grayscale-[0.5]'}`}>
                <div className="p-6 flex items-start justify-between">
                  
                  {/* Info Section */}
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border \${isActive ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-bold text-slate-900">{acc.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest \${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {isOnline ? 'PM2 Online' : 'PM2 Offline'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{acc.email} • {acc.upiId}</p>
                      {acc.reportId && <p className="text-xs font-mono text-emerald-600 mt-2 bg-emerald-50 px-2 py-1 rounded w-fit">ID: {acc.reportId}</p>}
                    </div>
                  </div>

                  {/* Toggles & Limits */}
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">API Routing</label>
                      <button 
                        onClick={() => updateAccount(acc.id, { status: isActive ? "INACTIVE" : "ACTIVE" })}
                        className={`w-12 h-6 rounded-full relative transition-colors \${isActive ? 'bg-indigo-600' : 'bg-slate-200'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm \${isActive ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                    
                    <div className="text-right w-32">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Monthly Limit (₹)</label>
                      <input 
                        type="number" 
                        defaultValue={acc.monthlyLimit || 0}
                        onBlur={(e) => updateAccount(acc.id, { monthlyLimit: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-indigo-600/20 outline-none"
                        placeholder="0 = Unlimited"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 flex items-center justify-between">
                  <div className="flex gap-2">
                    {isOnline ? (
                      <button onClick={() => botAction(acc.name, 'stop')} className="px-4 py-1.5 bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5">
                        <Square className="w-3 h-3" /> Stop Verification Engine
                      </button>
                    ) : (
                      <button onClick={() => botAction(acc.name, 'start')} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm">
                        <Play className="w-3 h-3" /> Start Verification Engine
                      </button>
                    )}
                    {isOnline && (
                      <button onClick={() => botAction(acc.name, 'restart')} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Restart PM2 Process">
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => manualLogin(acc.name)} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                      Manual Login
                    </button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => alert("To reset, please delete the account via database or overwrite using manual login for now.")} className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">
                      Reset Session
                    </button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => deleteAccount(acc.id, acc.name)} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
                
                {/* Limit Progress Bar */}
                {acc.monthlyLimit > 0 && (
                  <div className="h-1 bg-slate-100 w-full overflow-hidden">
                    <div 
                      className={`h-full transition-all \${acc.usedAmount >= acc.monthlyLimit ? 'bg-red-500' : 'bg-indigo-500'}`} 
                      style={{ width: `\${Math.min((acc.usedAmount / acc.monthlyLimit) * 100, 100)}%` }} 
                    />
                  </div>
                )}
              </div>
            );
          })}

          {accounts.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[24px] border border-dashed border-slate-300">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">No Accounts configured</h3>
              <p className="text-sm text-slate-500">Click "Add Google Pay Account" to begin the automated setup.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
