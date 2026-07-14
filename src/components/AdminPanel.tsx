import React, { useState, useEffect } from "react";
import { ShieldAlert, Fingerprint, ToggleLeft, ToggleRight, CheckCircle, Search } from "lucide-react";
import { AuditLog, FeatureFlag, User } from "../types";

export default function AdminPanel() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  // Search filter
  const [auditSearch, setAuditSearch] = useState("");

  useEffect(() => {
    fetchAuditLogs();
    fetchFeatureFlags();
    fetchUsers();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/admin/audit-logs");
      const data = await res.json();
      setAuditLogs(data.auditLogs);
    } catch {}
  };

  const fetchFeatureFlags = async () => {
    try {
      const res = await fetch("/api/admin/feature-flags");
      const data = await res.json();
      setFeatureFlags(data.featureFlags);
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/auth/users");
      const data = await res.json();
      setUsers(data.users);
    } catch {}
  };

  const handleToggleFlag = async (flagId: string) => {
    try {
      const res = await fetch("/api/admin/feature-flags/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: flagId })
      });
      const data = await res.json();
      if (res.ok) {
        fetchFeatureFlags();
        fetchAuditLogs(); // Refresh audits too
        setMsg(`Feature flag "${data.flag.name}" status updated.`);
      }
    } catch {}
  };

  const filteredAudits = auditLogs.filter(log =>
    log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.details.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 bg-[#0A0C10]">
      
      {/* Feature Flags Module */}
      <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] rounded p-5 flex flex-col h-[650px] justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-[#1E293B] pb-3">
            <ToggleLeft className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Operational Feature Toggles</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Toggle global system parameters dynamically without redeploying Node clusters. Control active Sentry OCR ingestion engines and AI diagnostic layers instantly.
          </p>

          <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[420px] pr-1">
            {featureFlags.map(flag => (
              <div key={flag.id} className="bg-[#0A0C10] border border-[#1E293B] rounded p-3 flex items-start justify-between">
                <div className="flex-1 pr-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">{flag.name}</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-1">{flag.description}</p>
                  <span className="text-[9px] font-mono text-slate-500 block mt-1">Key: {flag.key}</span>
                </div>

                <button
                  onClick={() => handleToggleFlag(flag.id)}
                  className="text-cyan-400 hover:text-white transition cursor-pointer"
                >
                  {flag.isEnabled ? (
                    <ToggleRight className="w-8 h-8 text-cyan-400" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-600" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {msg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] p-2.5 rounded font-mono flex items-center gap-1 animate-fadeIn">
            <CheckCircle className="w-3.5 h-3.5" /> {msg}
          </div>
        )}
      </div>

      {/* Security Audit Trail Log */}
      <div className="lg:col-span-8 flex flex-col h-[650px] bg-[#0F172A] border border-[#1E293B] rounded overflow-hidden">
        <div className="bg-[#0F172A] px-4 py-3 border-b border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Enterprise Security Audit Log Trail</h3>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
            <input
              id="audit-search"
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search actions or actors..."
              className="px-3 py-1 pl-8 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300 focus:outline-hidden font-mono"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 font-mono text-[10px]">
          <div className="min-w-[600px] flex flex-col gap-2">
            <div className="grid grid-cols-12 bg-[#0A0C10] border border-[#1E293B] p-2 rounded text-slate-400 font-bold uppercase tracking-wider">
              <span className="col-span-3">Actor / Principal</span>
              <span className="col-span-3">Action Type</span>
              <span className="col-span-4">Operation Details</span>
              <span className="col-span-2 text-right">Timestamp</span>
            </div>

            {filteredAudits.map(log => (
              <div key={log.id} className="grid grid-cols-12 bg-[#0A0C10]/40 border border-[#1E293B]/40 hover:bg-[#0A0C10]/80 p-2.5 rounded text-slate-300 transition items-center">
                <div className="col-span-3 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-[9px] border border-cyan-800/40">
                    {log.userName.charAt(0)}
                  </div>
                  <span className="truncate">{log.userName}</span>
                </div>
                <span className="col-span-3 text-cyan-400 truncate">{log.action}</span>
                <span className="col-span-4 text-slate-400 truncate pr-2">{log.details}</span>
                <span className="col-span-2 text-right text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}

            {filteredAudits.length === 0 && (
              <div className="text-center py-8 text-slate-500 uppercase">
                NO_AUDIT_LOGS_MATCHING_FILTER
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
