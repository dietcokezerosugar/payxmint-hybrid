"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Clock, 
  QrCode, 
  AtSign, 
  CreditCard, 
  Copy, 
  Check, 
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  token: string;
  amount: number;
  merchantName: string;
  referenceId: string;
  upiDeepLink: string;
  qrData: string;
  status: string;
  expireAt?: string;
}

export default function PaymentPageClient({ 
  token, 
  amount, 
  merchantName, 
  referenceId, 
  upiDeepLink, 
  qrData, 
  status: initialStatus,
  expireAt
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [payerName, setPayerName] = useState<string | null>(null);
  const [utr, setUtr] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("qr");
  
  // Calculate initial time left based on expireAt
  const getInitialTimeLeft = () => {
    if (!expireAt) return 600; // default 10 minutes
    const diff = new Date(expireAt).getTime() - new Date().getTime();
    return diff > 0 ? Math.floor(diff / 1000) : 0;
  };

  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft());
  const [copied, setCopied] = useState(false);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Timer countdown
  useEffect(() => {
    if (status !== "PENDING" || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  // Poll for payment status every 3 seconds
  useEffect(() => {
    if (status !== "PENDING") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pay/status?token=${token}`);
        const data = await res.json();

        if (data.data?.payment_status === "SUCCESS") {
          setStatus("SUCCESS");
          setPayerName(data.data.payer_name);
          setUtr(data.data.utr);
          clearInterval(interval);

          // Auto-redirect after 5 seconds
          if (data.data.redirect_url) {
            setTimeout(() => {
              window.location.href = data.data.redirect_url;
            }, 5000);
          }
        } else if (data.data?.payment_status === "EXPIRED" || timeLeft <= 0) {
          setStatus("EXPIRED");
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [token, status, timeLeft]);

  // Handle expired display
  if (status === "EXPIRED" || timeLeft <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-3xl">⚠️</div>
          <h2 className="text-2xl font-bold">Payment Expired</h2>
          <p className="text-slate-500">This payment link has expired. Please request a new one.</p>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Masking functions
  const maskedOrderId = referenceId.length > 8 
    ? referenceId.substring(0, 4) + '***' + referenceId.substring(referenceId.length - 4) 
    : referenceId;
    
  // Fake a masked UPI for display (or extract from deep link if possible, but we don't have the merchant upi exactly here)
  const upiMatch = upiDeepLink.match(/pa=([^&]+)/);
  const merchantUpi = upiMatch ? decodeURIComponent(upiMatch[1]) : "merchant@upi";
  const maskedUpi = merchantUpi.length > 11 
    ? merchantUpi.substring(0, 5) + '***' + merchantUpi.substring(merchantUpi.length - 6) 
    : merchantUpi;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px] relative">
        
        {/* Left Side: Order Summary */}
        <div className="w-full md:w-[40%] bg-gradient-to-br from-indigo-700 to-indigo-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="bg-white/95 p-3 rounded-xl inline-block shadow-sm">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xl">W</div>
            </div>

            <div>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Total Payable</p>
              <h1 className="text-5xl font-extrabold flex items-baseline">
                <span className="text-2xl font-medium opacity-80 mr-1">₹</span>
                {amount.toLocaleString()}
              </h1>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Order ID</span>
                <span className="font-bold flex items-center gap-2">
                  {maskedOrderId} 
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 cursor-pointer opacity-70 hover:opacity-100" onClick={() => handleCopy(referenceId)} />}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Merchant</span>
                <span className="font-bold">{merchantName}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 text-xs font-medium opacity-80 mt-12 md:mt-0">
            <ShieldCheck className="w-4 h-4" /> Secured by Wave Collect
          </div>
        </div>

        {/* Right Side: Payment Methods */}
        <div className="w-full md:w-[60%] p-8 bg-white flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-800">Select Payment Mode</h2>
            <div className="bg-rose-50 text-rose-600 border border-rose-100 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-2">
              <Clock className="w-3 h-3" />
              {minutes}:{seconds < 10 ? '0' + seconds : seconds}
            </div>
          </div>

          <div className="flex gap-2 mb-8 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            {[
              { id: "qr", label: "UPI QR", icon: QrCode },
              { id: "upi", label: "UPI Apps", icon: AtSign },
              { id: "card", label: "Card", icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            {activeTab === "qr" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col items-center space-y-6"
              >
                <p className="text-slate-500 text-sm font-bold">Scan with any UPI App</p>
                
                <div className="p-4 bg-white border-2 border-dashed border-slate-200 rounded-[24px] relative shadow-sm">
                  <img src={qrData} alt="QR Code" className="w-48 h-48 rounded-xl" />
                </div>

                <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200 flex items-center justify-between w-full max-w-sm">
                  <span className="text-slate-700 font-bold tracking-wide">{maskedUpi}</span>
                  <div className="flex items-center gap-3">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400 cursor-pointer hover:text-indigo-600" onClick={() => handleCopy(merchantUpi)} />}
                  </div>
                </div>

                <div className="flex gap-4 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default pb-4">
                  <img src="https://business.phonepe.com/website-static/_astro/phonepe-logo.BN7z0l5j_1m7H6I.png" className="h-4" alt="PhonePe" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/1280px-Google_Pay_Logo.svg.png" className="h-4" alt="Google Pay" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/cd/Paytm_logo.jpg" className="h-4" alt="Paytm" />
                </div>
              </motion.div>
            )}

            {activeTab === "upi" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col items-center space-y-6"
              >
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                  <AtSign className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold">Pay via Installed Apps</h3>
                  <p className="text-sm text-slate-500 max-w-xs">Tap the button below to open your preferred UPI app directly on this device.</p>
                </div>
                <a 
                  href={upiDeepLink}
                  className="w-full max-w-xs py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200"
                >
                  Pay ₹{amount.toLocaleString()} Now
                </a>
              </motion.div>
            )}

            {activeTab === "card" && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">Card Payment currently disabled.</p>
                <button onClick={() => setActiveTab("qr")} className="text-indigo-600 text-sm font-bold hover:underline">Use UPI Instead</button>
              </div>
            )}
          </div>
        </div>

        {/* Success Overlay */}
        <AnimatePresence>
          {status === "SUCCESS" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 bg-indigo-900/60 backdrop-blur-md flex items-end"
            >
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full bg-white rounded-t-[40px] p-10 text-center shadow-[0_-20px_50px_rgba(0,0,0,0.2)]"
              >
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto -mt-20 border-4 border-white text-4xl shadow-lg mb-6">
                  <Check className="w-10 h-10 stroke-[3]" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-600 mb-1">Paid Successfully</h3>
                <h2 className="text-4xl font-black mb-8">₹{amount.toLocaleString()}</h2>
                
                <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-3 mb-8 border border-slate-100">
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                    <span className="text-slate-500 text-sm">Order ID</span>
                    <span className="font-bold text-sm font-mono">{referenceId}</span>
                  </div>
                  {payerName && (
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                      <span className="text-slate-500 text-sm">Payer Name</span>
                      <span className="font-bold text-sm">{payerName}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                    <span className="text-slate-500 text-sm">UTR / Ref No</span>
                    <span className="font-bold text-sm font-mono text-emerald-600">{utr || "Auto-Verified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Timestamp</span>
                    <span className="font-bold text-sm">{new Date().toLocaleString()}</span>
                  </div>
                </div>
                
                <p className="text-slate-400 text-sm animate-pulse font-medium">Redirecting to merchant in 5 seconds...</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
