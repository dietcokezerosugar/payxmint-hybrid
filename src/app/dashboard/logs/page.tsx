"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, RefreshCw, Trash2 } from "lucide-react";

interface LogEntry {
  id: string;
  level: string;
  message: string;
  metadata: string | null;
  timestamp: string;
}

export default function ApiLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogs();
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 3000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [autoRefresh]);

  async function fetchLogs() {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      setLogs(data.data || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  }

  function getLevelColor(level: string) {
    switch (level) {
      case "INFO": return "text-blue-600 bg-blue-50";
      case "WARN": return "text-orange-600 bg-orange-50";
      case "ERROR": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "short",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Logs</h1>
          <p className="text-muted-foreground">Live view of intent creation, verification, and errors.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all border ${
              autoRefresh
                ? "bg-green-50 text-green-600 border-green-200"
                : "bg-gray-50 text-gray-400 border-gray-200"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
            {autoRefresh ? "Live" : "Paused"}
          </button>
          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-secondary text-foreground rounded-full text-sm font-bold hover:bg-gray-200 transition-all border border-gray-200"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="apple-card overflow-hidden">
        <div className="bg-gray-900 border-b border-gray-800 px-5 py-3 flex items-center gap-3">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-xs font-bold text-green-400 uppercase tracking-widest font-mono">~/logs/wave-collect.log</span>
          <span className="ml-auto text-[10px] text-gray-500 font-mono">{logs.length} entries</span>
        </div>

        <div className="bg-gray-950 max-h-[600px] overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-gray-600 italic">
              No log entries yet. Create a payment intent to see logs appear here.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-2.5 border-b border-gray-900 hover:bg-gray-900/50 transition-colors">
                <span className="text-gray-600 shrink-0 w-32">{formatTime(log.timestamp)}</span>
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getLevelColor(log.level)}`}>
                  {log.level}
                </span>
                <span className="text-gray-300 flex-1">{log.message}</span>
                {log.metadata && (
                  <span className="text-gray-600 truncate max-w-[250px]" title={log.metadata}>
                    {log.metadata}
                  </span>
                )}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
