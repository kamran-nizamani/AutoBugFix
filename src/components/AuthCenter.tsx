import React, { useState, useEffect } from "react";
import { ShieldCheck, UserCheck, Smartphone, Key, UserPlus, LogIn, Lock, CheckCircle } from "lucide-react";
import { User, UserRole, UserSession } from "../types";

interface AuthCenterProps {
  currentUser: User | null;
  onUserChanged: () => void;
}

export default function AuthCenter({ currentUser, onUserChanged }: AuthCenterProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);

  // Register Form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("developer");

  // Login Form
  const [logEmail, setLogEmail] = useState("");
  const [logPass, setLogPass] = useState("");
  const [logCode, setLogCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [secretHint, setSecretHint] = useState("");

  const [toggling2FA, setToggling2FA] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchSessions();
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/auth/users");
      const data = await res.json();
      setUsers(data.users);
    } catch {}
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/auth/sessions");
      const data = await res.json();
      setSessions(data.sessions);
    } catch {}
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, password: regPass, name: regName, role: regRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register.");
      
      setRegEmail("");
      setRegName("");
      setRegPass("");
      setMsg(`Account created for ${regName}! Logged in automatically.`);
      onUserChanged();
    } catch (err: any) {
      setErrMsg(err.message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: logEmail, password: logPass, code: logCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed.");

      if (data.requireTwoFactor) {
        setRequires2FA(true);
        setSecretHint(data.secretHint || "");
        setMsg("Two-Factor challenge initiated. Input token to proceed.");
        return;
      }

      setLogEmail("");
      setLogPass("");
      setLogCode("");
      setRequires2FA(false);
      setMsg(`Welcome back, ${data.user.name}!`);
      onUserChanged();
    } catch (err: any) {
      setErrMsg(err.message);
    }
  };

  const handleSwitchSession = async (userId: string) => {
    setErrMsg(null);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/switch-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId })
      });
      if (res.ok) {
        onUserChanged();
        setMsg("Active login profile switched.");
      }
    } catch {}
  };

  const handleToggle2FA = async () => {
    setToggling2FA(true);
    try {
      const res = await fetch("/api/auth/toggle-2fa", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        onUserChanged();
        setMsg(data.twoFactorEnabled ? "2FA Setup Complete! Save code: 123456" : "2FA disabled successfully.");
      }
    } catch {}
    setToggling2FA(false);
  };

  const handleRevokeSession = async (sessId: string) => {
    try {
      const res = await fetch(`/api/auth/sessions/${sessId}`, { method: "DELETE" });
      if (res.ok) {
        fetchSessions();
        setMsg("Device session terminated.");
      }
    } catch {}
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 bg-[#0A0C10]">
      
      {/* active user profile section */}
      <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] rounded p-5 flex flex-col justify-between h-[650px]">
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-[#1E293B] pb-3">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Identity Assurance Profile</h3>
          </div>

          {currentUser ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-[#0A0C10] border border-[#1E293B] p-3 rounded">
                <div className="w-10 h-10 rounded-full bg-cyan-500 font-bold text-black flex items-center justify-center text-sm">
                  {currentUser.avatarUrl}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{currentUser.name}</h4>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">{currentUser.email}</span>
                  <span className="mt-1 text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800/30 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-bold inline-block">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Two-factor setup */}
              <div className="bg-[#0A0C10] border border-[#1E293B] p-4 rounded flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span>Two-Factor Authentication (2FA)</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Protect account access against credentials leakage. Force TOTP code validation during logins.
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Status: {currentUser.twoFactorEnabled ? "ACTIVE" : "INACTIVE"}</span>
                  <button
                    onClick={handleToggle2FA}
                    disabled={toggling2FA}
                    className={`px-3 py-1 text-[9px] font-bold uppercase rounded border transition cursor-pointer ${
                      currentUser.twoFactorEnabled
                        ? "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/20"
                        : "bg-cyan-500/15 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                    }`}
                  >
                    {currentUser.twoFactorEnabled ? "Deactivate 2FA" : "Enable 2FA"}
                  </button>
                </div>
              </div>

              {/* Session switcher (Fast UI privilege testing) */}
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Simulate Role Testing</span>
                <div className="grid grid-cols-2 gap-2">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleSwitchSession(u.id)}
                      className={`text-left p-2 rounded border text-[10px] transition font-mono ${
                        u.id === currentUser.id
                          ? "bg-cyan-950 border-cyan-500 text-cyan-400 font-bold"
                          : "bg-[#0A0C10] border-[#1E293B] text-slate-400 hover:text-white"
                      }`}
                    >
                      {u.name} ({u.role.split("-")[0]})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-slate-500 text-xs font-mono">
              NO_ACTIVE_SESSION
            </div>
          )}
        </div>

        <div className="text-[9px] font-mono text-slate-600 bg-[#0A0C10] border border-[#1E293B] p-2 rounded uppercase">
          Client IP: 127.0.0.1 • TLS_AES_256_GCM_SHA384
        </div>
      </div>

      {/* Auth Register & Login control */}
      <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] rounded p-5 flex flex-col h-[650px] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 border-b border-[#1E293B] pb-3">
          <LogIn className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Enterprise Credentials Gateway</h3>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-col gap-6">
          {/* LOGIN */}
          <form onSubmit={handleLogin} className="flex flex-col gap-3.5 border-b border-[#1E293B]/60 pb-5">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
              <Lock className="w-3 h-3" /> Account Login Portal
            </span>
            <div className="flex flex-col gap-1">
              <label htmlFor="login-email" className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Work Email</label>
              <input
                id="login-email"
                type="email"
                value={logEmail}
                onChange={(e) => setLogEmail(e.target.value)}
                placeholder="developer@company.ai"
                className="px-2.5 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300 focus:outline-hidden focus:border-cyan-400"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="login-pass" className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Security Password</label>
              <input
                id="login-pass"
                type="password"
                value={logPass}
                onChange={(e) => setLogPass(e.target.value)}
                placeholder="••••••••"
                className="px-2.5 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300 focus:outline-hidden focus:border-cyan-400"
                required
              />
            </div>

            {requires2FA && (
              <div className="flex flex-col gap-1 bg-[#0A0C10] border border-[#1E293B] p-2.5 rounded animate-fadeIn">
                <label htmlFor="login-code" className="text-[9px] text-cyan-400 font-bold uppercase tracking-wide">2FA Verification Code</label>
                <input
                  id="login-code"
                  type="text"
                  value={logCode}
                  onChange={(e) => setLogCode(e.target.value)}
                  placeholder="Simulation codes: 123456 or 654321"
                  className="px-2.5 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-200 focus:outline-hidden focus:border-cyan-400 font-mono text-center"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-1.5 bg-white text-black hover:bg-cyan-500 rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Authorize Credentials
            </button>
          </form>

          {/* REGISTER */}
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" /> Tenant Signup Desk
            </span>
            <div className="flex flex-col gap-1">
              <label htmlFor="reg-name" className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Full Name</label>
              <input
                id="reg-name"
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Sarah Jenkins"
                className="px-2.5 py-1 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300 focus:outline-hidden focus:border-cyan-400"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="reg-email" className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Work Email</label>
              <input
                id="reg-email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="jenkins@company.ai"
                className="px-2.5 py-1 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300 focus:outline-hidden focus:border-cyan-400"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="reg-pass" className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Security Password</label>
              <input
                id="reg-pass"
                type="password"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                placeholder="••••••••"
                className="px-2.5 py-1 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300 focus:outline-hidden focus:border-cyan-400"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="reg-role" className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Designation Role</label>
              <select
                id="reg-role"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="px-2.5 py-1 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300 focus:outline-hidden focus:border-cyan-400"
              >
                <option value="developer">Software Developer</option>
                <option value="qa-tester">Quality QA Tester</option>
                <option value="project-manager">Project Manager</option>
                <option value="reporter">Client Reporter</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-1.5 bg-[#0F172A] border border-[#1E293B] text-slate-200 hover:text-white hover:bg-[#1E293B] rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Register Account
            </button>
          </form>
        </div>

        {msg && (
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] p-2 rounded font-mono flex items-center gap-1 animate-fadeIn">
            <CheckCircle className="w-3.5 h-3.5" /> {msg}
          </div>
        )}
        {errMsg && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] p-2 rounded font-mono animate-fadeIn">
            <strong>Error:</strong> {errMsg}
          </div>
        )}
      </div>

      {/* Sessions and Active device list */}
      <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] rounded p-5 flex flex-col h-[650px]">
        <div className="flex items-center gap-2 mb-4 border-b border-[#1E293B] pb-3">
          <Smartphone className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Device & Session Management</h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          Monitor all active hardware sessions authorized to retrieve organization bug payloads. Instantly revoke stale tokens to block potential vectors.
        </p>

        <div className="flex-grow flex flex-col gap-3 overflow-y-auto">
          {sessions.map(s => (
            <div key={s.id} className="bg-[#0A0C10] border border-[#1E293B] rounded p-3 flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded bg-[#1E293B] flex items-center justify-center border border-slate-700 font-bold text-slate-300">
                  {s.deviceName.startsWith("i") ? "📱" : "💻"}
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white leading-tight flex items-center gap-1.5">
                    {s.deviceName}
                    {s.current && (
                      <span className="text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-800/40 font-bold px-1 py-0.2 rounded uppercase font-mono">
                        Active
                      </span>
                    )}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{s.ipAddress} • {s.location}</span>
                  <span className="text-[9px] text-slate-400 font-mono block mt-0.5">Last sync: {s.lastActive}</span>
                </div>
              </div>

              {!s.current && (
                <button
                  onClick={() => handleRevokeSession(s.id)}
                  className="text-[9px] font-bold text-red-400 border border-red-500/20 hover:bg-red-500/10 px-2 py-0.5 rounded transition uppercase cursor-pointer"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-[#1E293B] pt-3 mt-4 text-[10px] font-mono text-slate-500 flex justify-between uppercase">
          <span>Active Nodes: {sessions.length}</span>
          <span>SAML_OIDC_PASS: ACTIVE</span>
        </div>
      </div>

    </div>
  );
}
