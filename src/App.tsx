import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Ticket,
  Calendar,
  Sparkles,
  BarChart3,
  Building2,
  UserCheck,
  Fingerprint,
  GitBranch,
  Terminal,
  ShieldCheck,
  Power,
  BellRing,
  Settings,
  Flame
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

const navigationItems = [
  { id: "tracker" as const, label: "Issue Board", desc: "Kanban, tickets & releases", icon: Ticket },
  { id: "sprints" as const, label: "Sprint Planner", desc: "Milestones & velocity", icon: Calendar },
  { id: "scanner" as const, label: "AI Scanner", desc: "Security triage", icon: ShieldAlert },
  { id: "labs" as const, label: "Lab Sandbox", desc: "Attack & defense", icon: Terminal },
  { id: "ai-productivity" as const, label: "AI Productivity", desc: "Automation workflows", icon: Sparkles },
  { id: "analytics" as const, label: "Analytics", desc: "Dashboards & exports", icon: BarChart3 },
  { id: "tenants" as const, label: "Tenants", desc: "Org structures", icon: Building2 },
  { id: "auth" as const, label: "Auth Center", desc: "Identity controls", icon: UserCheck },
  { id: "integrations" as const, label: "Integrations", desc: "GitOps & webhooks", icon: GitBranch },
  { id: "audits" as const, label: "Audits", desc: "Compliance logs", icon: Fingerprint }
];

const dashboardStats = [
  { label: "Open Issues", value: "18", delta: "+22%", icon: Ticket, accent: "from-cyan-500 to-sky-500" },
  { label: "Sprint Health", value: "92%", delta: "+8%", icon: Calendar, accent: "from-violet-500 to-fuchsia-500" },
  { label: "Security Score", value: "A+", delta: "+10%", icon: ShieldCheck, accent: "from-emerald-500 to-lime-500" }
];

const quickActions = [
  { label: "Run AI scan", description: "Scan latest branch for vulnerabilities", icon: ShieldAlert, accent: "from-cyan-500 to-sky-500" },
  { label: "Review backlog", description: "Triaged issues waiting for approval", icon: Ticket, accent: "from-violet-500 to-fuchsia-500" },
  { label: "Sync GitHub", description: "Import PR data and release notes", icon: GitBranch, accent: "from-emerald-500 to-lime-500" }
];

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
      if (res.ok) setCurrentUser(data.user);
    } catch {
      setCurrentUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    setActiveTab("auth");
  };

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 selection:bg-cyan-500/20 selection:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
          <div className="glass-card panel-shell p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-sky-500 text-black shadow-lg shadow-cyan-500/20">
                  <span className="text-lg font-black uppercase tracking-widest">BF</span>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300/90">BugFlow AI</p>
                  <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    Modern SRE intelligence for teams that ship fast.
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
                    A polished operational control plane for issue triage, sprint planning, security scanning and analytics — all in one modern workspace.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:w-[350px]">
                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Workspace</p>
                  <p className="mt-3 text-2xl font-semibold text-white">Aether Ops</p>
                  <p className="mt-2 text-sm text-slate-400">Cloud reliability environment with continuous deployment visibility.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Live status</p>
                  <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span>All systems nominal</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">No critical incidents detected in the past 24 hours.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {dashboardStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="glass-card panel-shell p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.45em] text-slate-500">{stat.label}</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br ${stat.accent} text-black shadow-lg shadow-cyan-500/20`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-emerald-300">{stat.delta} vs last cycle</p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <div key={action.label} className="group glass-card panel-shell p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-slate-950/95">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-gradient-to-br ${action.accent} text-black shadow-lg shadow-cyan-500/20`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-white">{action.label}</p>
                  <p className="mt-2 text-sm text-slate-400">{action.description}</p>
                </div>
              );
            })}
          </div>
        </header>

        <div className="grid flex-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="glass-card panel-shell p-5">
            <div className="panel-header">
              <div>
                <p className="text-[9px] uppercase tracking-[0.45em] text-slate-500">Navigation</p>
                <h2 className="mt-2 text-lg font-bold text-white">Workspace tools</h2>
              </div>
              <Settings className="h-5 w-5 text-slate-400" />
            </div>

            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`group flex w-full items-start gap-3 rounded-3xl border px-4 py-3 text-left transition duration-200 ${
                      active
                        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-200 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.18)]"
                        : "border-white/5 bg-white/5 text-slate-300 hover:border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <Icon className={`mt-1 h-5 w-5 flex-shrink-0 ${active ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </nav>

              <div className="mt-8 rounded-[28px] border border-cyan-500/10 bg-gradient-to-br from-cyan-500/10 to-slate-950/50 p-4 text-sm text-slate-300 shadow-[0_20px_50px_rgba(56,189,248,0.05)]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500 text-black">
                  <Flame className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-white">Pro mode enabled</p>
                  <p className="text-slate-400">Unlimited AI scans, premium templates, and instant deploy suggestions.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 text-[11px] text-slate-400">
                <div className="rounded-2xl bg-white/5 px-3 py-2">Next release: Q4 Ops Rollout</div>
                <div className="rounded-2xl bg-white/5 px-3 py-2">Data refreshed 2 min ago</div>
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            <div className="glass-card panel-shell p-5">
              <div className="panel-header flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300">Active module</p>
                  <h2 className="mt-3 text-2xl font-bold text-white">{navigationItems.find((item) => item.id === activeTab)?.label}</h2>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                  <div className="rounded-3xl bg-white/5 px-4 py-2">Updated 5 min ago</div>
                  <div className="rounded-3xl bg-white/5 px-4 py-2">80% uptime</div>
                  <div className="rounded-3xl bg-white/5 px-4 py-2">Integrated with GitHub</div>
                </div>
              </div>
            </div>

            <div className="glass-card panel-shell p-5">
              {activeTab === "tracker" && <BugFlowTracker />}
              {activeTab === "sprints" && <SprintBoard />}
              {activeTab === "scanner" && <AIBugDetector onAddTicket={() => setActiveTab("tracker")} />}
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
          </main>
        </div>

        <footer className="mt-6 rounded-[32px] border border-white/10 bg-slate-950/80 px-5 py-4 text-xs text-slate-500 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-slate-100">BugFlow AI</p>
            <p className="mt-1 text-slate-500">Operational reliability dashboard with AI-powered insights.</p>
          </div>
          <div className="mt-3 flex items-center gap-4 sm:mt-0">
            <div className="inline-flex items-center gap-2 text-slate-400">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>Secure by design</span>
            </div>
            <div className="inline-flex items-center gap-2 text-slate-400">
              <BellRing className="h-4 w-4 text-slate-400" />
              <span>Alerts configured</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
