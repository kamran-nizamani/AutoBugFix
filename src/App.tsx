import React, { useState, useEffect } from "react";
import {
  ShieldAlert, Ticket, Calendar, Sparkles, BarChart3,
  Building2, UserCheck, Fingerprint, GitBranch,
  Terminal, ShieldCheck, Heart, Power, BellRing, Settings
} from "lucide-react";
import AIBugDetector from "./components/AIBugDetector";
import DebuggingLab from "./components/DebuggingLab";
import BugFlowTracker from "./components/BugFlowTracker";
import SprintBoard from "./components/SprintBoard";
import AIPanel from "./components/AIPanel";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import OrgTeamManager from "./components/OrgTeamManager";
import AuthCenter from "./components/AuthCenter";
import AdminPanel from "./components/AdminPanel";
import IntegrationsHub from "./components/IntegrationsHub";
import { User } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "scanner" | "labs" | "tracker" | "sprints" | "ai-productivity" | "analytics" | "tenants" | "auth" | "audits" | "integrations"
  >("tracker");

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    setLoadingUser(true);
    try {
      const res = await fetch("/api/auth/me", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleLogout = async () => {
    // Simulate clear session
    try {
      setCurrentUser(null);
      setActiveTab("auth");
    } catch {}
  };

  // Nav categories for sidebar
  const navigationItems = [
    { id: "tracker" as const, label: "Issue Board", desc: "SRE ticket Kanban & tables", icon: Ticket },
    { id: "sprints" as const, label: "Sprint Planner", desc: "Milestones & burndown charts", icon: Calendar },
    { id: "scanner" as const, label: "AI Code Scanner", desc: "Continuous security audit", icon: ShieldAlert },
    { id: "labs" as const, label: "Sandbox Labs", desc: "Vulnerability simulation lab", icon: Terminal },
    { id: "ai-productivity" as const, label: "Productivity AI", desc: "PRs, Commits & Jest tests", icon: Sparkles },
    { id: "analytics" as const, label: "Analytics Reports", desc: "Charts & real CSV exporters", icon: BarChart3 },
    { id: "tenants" as const, label: "Workspace Tenants", desc: "Organizations & team logs", icon: Building2 },
    { id: "auth" as const, label: "Credentials Gateway", desc: "Profile security & 2FA setups", icon: UserCheck },
    { id: "integrations" as const, label: "Integrations Hub", desc: "CI/CD GitHub & webhook sockets", icon: GitBranch },
    { id: "audits" as const, label: "Security Audits", desc: "Feature toggles & audit trails", icon: Fingerprint }
  ];

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E2E8F0] font-sans flex flex-col selection:bg-cyan-950 selection:text-cyan-100">
      
      {/* Top Banner Bar */}
      <header className="bg-[#0F172A] border-b border-[#1E293B] px-6 py-3.5 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center font-bold text-[#0A0C10] tracking-tighter italic">
            BF
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              BugFlow <span className="text-cyan-500">AI</span> 
              <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800/40 px-1.5 py-0.5 rounded font-mono font-bold tracking-normal uppercase">
                v2.1-Enterprise
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Autonomous Triage & Site Reliability Intelligence Suite
            </p>
          </div>
        </div>

        {/* Current Active User Status Indicator */}
        <div className="flex items-center gap-3 bg-[#0A0C10] border border-[#1E293B] px-3 py-1.5 rounded">
          {loadingUser ? (
            <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          ) : currentUser ? (
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-cyan-500 text-black font-bold flex items-center justify-center text-[9px]">
                {currentUser.avatarUrl}
              </div>
              <div className="text-left">
                <span className="text-[10px] font-bold text-white block leading-tight">{currentUser.name}</span>
                <span className="text-[8px] text-cyan-400 font-mono uppercase font-bold tracking-wider block">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-400 transition ml-1"
                title="Disconnect Gateway Session"
              >
                <Power className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab("auth")}
              className="text-[9px] font-bold text-cyan-400 hover:text-white uppercase tracking-wider cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main split dashboard layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-8xl w-full mx-auto">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-[#0A0C10] border-r border-[#1E293B]/70 p-4 flex flex-col justify-between">
          <div className="flex flex-col gap-5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] block pl-2">
              Workspace Scope
            </span>

            <nav className="flex flex-col gap-1">
              {navigationItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`text-left px-3 py-2 rounded-md flex items-start gap-3 transition cursor-pointer group ${
                      isActive
                        ? "bg-[#1E293B] text-cyan-400 border border-cyan-900/30"
                        : "text-slate-400 hover:text-white hover:bg-[#0F172A]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                    <div>
                      <span className="text-xs font-bold block">{item.label}</span>
                      <span className="text-[9px] text-slate-500 block leading-normal mt-0.5 group-hover:text-slate-400 font-sans">
                        {item.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* SRE Nodes Status */}
          <div className="mt-8 border-t border-[#1E293B]/60 pt-4 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>Diagnostic Cluster Live</span>
            </div>
            <p className="text-[9px] text-slate-600 font-mono leading-normal uppercase">
              Node: cloudrun-aether-us-east<br />
              Ingress IP: routing.prod
            </p>
          </div>
        </aside>

        {/* Content canvas container */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="bg-[#0A0C10] border border-[#1E293B] rounded-lg overflow-hidden min-h-[680px]">
            
            {/* Header description dynamic panel */}
            <div className="px-5 py-4 border-b border-[#1E293B] bg-[#0F172A] flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  {activeTab === "tracker" && <>Operational Kanban & Board</>}
                  {activeTab === "sprints" && <>Sprint Cycles & Burndown Progress</>}
                  {activeTab === "scanner" && <>Automated Code Scanner Workbench</>}
                  {activeTab === "labs" && <>Vulnerability Simulation Sandbox</>}
                  {activeTab === "ai-productivity" && <>Developer Automation & Assets Builder</>}
                  {activeTab === "analytics" && <>SaaS Performance & CSV Export Center</>}
                  {activeTab === "tenants" && <>Workspace Tenants & Team Allocations</>}
                  {activeTab === "auth" && <>Identity Security Profile Panel</>}
                  {activeTab === "integrations" && <>CI/CD Pipelines & Slack Notifications</>}
                  {activeTab === "audits" && <>Operational Audits & Flags</>}
                </h2>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">
                  {activeTab === "tracker" && "Filter, file, and transition operational issue tickets"}
                  {activeTab === "sprints" && "Track sprint backlogs and burndowns using dynamic charts"}
                  {activeTab === "scanner" && "Input source files for instant AI-powered OWASP auditing"}
                  {activeTab === "labs" && "Test vulnerable versus secure implementations with simulate exploits"}
                  {activeTab === "ai-productivity" && "Assemble Pull Request templates, test files, andConventional commit messages"}
                  {activeTab === "analytics" && "Monitor team velocity and download operational log spreadsheets"}
                  {activeTab === "tenants" && "Manage multi-tenant organizations and engineering groups"}
                  {activeTab === "auth" && "Toggle Two-Factor authentication security, verify tokens, and swap session profiles"}
                  {activeTab === "integrations" && "Connect GitHub and configure Discord outbound webhooks"}
                  {activeTab === "audits" && "Review actor audit logs and toggle system feature flags"}
                </p>
              </div>
            </div>

            {/* Content modules router */}
            <div className="p-1">
              {activeTab === "tracker" && <BugFlowTracker />}
              {activeTab === "sprints" && <SprintBoard />}
              {activeTab === "scanner" && (
                <AIBugDetector onAddTicket={() => setActiveTab("tracker")} />
              )}
              {activeTab === "labs" && <DebuggingLab />}
              {activeTab === "ai-productivity" && <AIPanel />}
              {activeTab === "analytics" && <AnalyticsDashboard />}
              {activeTab === "tenants" && <OrgTeamManager />}
              {activeTab === "auth" && (
                <AuthCenter currentUser={currentUser} onUserChanged={fetchCurrentUser} />
              )}
              {activeTab === "integrations" && <IntegrationsHub />}
              {activeTab === "audits" && <AdminPanel />}
            </div>

          </div>
        </main>

      </div>

      {/* Swiss-minimalist humble footer */}
      <footer className="bg-[#0A0C10] border-t border-[#1E293B] py-5 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-slate-500">
        <span>BugFlow AI • Enterprise Diagnostic Operations Hub</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> SSL SECURED</span>
          <span className="text-slate-600">•</span>
          <span>SAML_SSO: ENABLED</span>
        </div>
      </footer>

    </div>
  );
}
