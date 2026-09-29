import { useEffect, useMemo, useState } from "react";
import {
  Activity, BarChart3, Bell, Bot, CalendarDays, CheckCircle2,
  ChevronRight, CircleDot, Command, GitBranch, LayoutDashboard,
  Menu, Plus, Search, Settings, ShieldCheck, Sparkles, Terminal, Ticket,
  Users, X
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

type Tab = "overview" | "tracker" | "sprints" | "scanner" | "labs" | "ai-productivity" | "analytics" | "tenants" | "auth" | "integrations" | "audits";

const nav: { id: Tab; label: string; icon: typeof LayoutDashboard; group: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "Workspace" },
  { id: "tracker", label: "Issues", icon: Ticket, group: "Workspace" },
  { id: "sprints", label: "Sprints", icon: CalendarDays, group: "Workspace" },
  { id: "scanner", label: "AI Code Scanner", icon: Bot, group: "AI Engineering" },
  { id: "labs", label: "Debugging Lab", icon: Terminal, group: "AI Engineering" },
  { id: "ai-productivity", label: "AI Copilot", icon: Sparkles, group: "AI Engineering" },
  { id: "analytics", label: "Analytics", icon: BarChart3, group: "Insights" },
  { id: "tenants", label: "Teams", icon: Users, group: "Administration" },
  { id: "auth", label: "Auth Center", icon: ShieldCheck, group: "Administration" },
  { id: "integrations", label: "Integrations", icon: GitBranch, group: "Administration" },
  { id: "audits", label: "Audit Log", icon: Activity, group: "Administration" }
];

const stats = [
  { label: "Open issues", value: "18", change: "+12.4%", icon: Ticket, tone: "cyan" },
  { label: "AI fixes proposed", value: "42", change: "+28.1%", icon: Bot, tone: "violet" },
  { label: "Security score", value: "A+", change: "Stable", icon: ShieldCheck, tone: "emerald" },
  { label: "Deploy health", value: "99.2%", change: "+0.8%", icon: Activity, tone: "amber" }
];

const incidents = [
  { title: "Null state in PollingWidget", repo: "web-dashboard", severity: "High", status: "AI fix ready", time: "8m ago" },
  { title: "Dependency vulnerability detected", repo: "api-gateway", severity: "Medium", status: "Review", time: "24m ago" },
  { title: "Slow query in reports endpoint", repo: "analytics-api", severity: "Low", status: "Monitoring", time: "1h ago" }
];

function toneClasses(tone: string) {
  return {
    cyan: "bg-cyan-400/10 text-cyan-300 border-cyan-400/15",
    violet: "bg-violet-400/10 text-violet-300 border-violet-400/15",
    emerald: "bg-emerald-400/10 text-emerald-300 border-emerald-400/15",
    amber: "bg-amber-400/10 text-amber-300 border-amber-400/15"
  }[tone] ?? "bg-white/5 text-slate-300 border-white/10";
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { method: "POST" })
      .then(async (res) => (res.ok ? (await res.json()).user : null))
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null))
      .finally(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((v) => !v);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeLabel = useMemo(() => nav.find((item) => item.id === activeTab)?.label ?? "Overview", [activeTab]);

  const renderModule = () => {
    if (activeTab === "overview") {
      return (
        <div className="space-y-6 animate-fadeIn">
          <section className="hero-card overflow-hidden">
            <div className="hero-grid" />
            <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> AI engineering workspace</div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Find the bug. Understand it. Ship the fix.
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
                  AutoBugFix brings issue triage, code diagnostics, AI-assisted fixes, security signals and delivery analytics into one focused control plane.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary" onClick={() => setActiveTab("scanner")}><Bot className="h-4 w-4" /> Run AI scan</button>
                <button className="btn-secondary" onClick={() => setActiveTab("tracker")}><Plus className="h-4 w-4" /> New issue</button>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="metric-card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{stat.value}</p>
                    </div>
                    <div className={`icon-tile ${toneClasses(stat.tone)}`}><Icon className="h-4 w-4" /></div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs">
                    <span className="text-emerald-400">{stat.change}</span>
                    <span className="text-slate-600">vs last cycle</span>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="surface-card">
              <div className="surface-header">
                <div><p className="eyebrow">Live queue</p><h2 className="surface-title">Recent incidents</h2></div>
                <button className="text-xs font-semibold text-cyan-300 hover:text-cyan-200" onClick={() => setActiveTab("tracker")}>View all <ChevronRight className="inline h-3.5 w-3.5" /></button>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {incidents.map((item) => (
                  <div key={item.title} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`status-dot ${item.severity === "High" ? "status-danger" : item.severity === "Medium" ? "status-warning" : "status-ok"}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.repo} · {item.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-6 sm:pl-0">
                      <span className="badge">{item.status}</span>
                      <span className="badge">{item.severity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-card">
              <div className="surface-header"><div><p className="eyebrow">System pulse</p><h2 className="surface-title">Delivery health</h2></div><Activity className="h-4 w-4 text-slate-500" /></div>
              <div className="space-y-5 p-5">
                {[
                  ["Production uptime", "99.92%", "Excellent"],
                  ["CI success rate", "97.4%", "Healthy"],
                  ["Mean time to fix", "38 min", "Improving"]
                ].map(([label, value, note]) => (
                  <div key={label}>
                    <div className="mb-2 flex items-center justify-between text-xs"><span className="text-slate-400">{label}</span><span className="text-slate-200">{value}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-cyan-400" style={{ width: label === "Mean time to fix" ? "78%" : label === "CI success rate" ? "97%" : "99%" }} /></div>
                    <p className="mt-1.5 text-[11px] text-emerald-400">{note}</p>
                  </div>
                ))}
                <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.04] p-4">
                  <div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" /><p className="text-xs leading-5 text-slate-400">No critical production incidents detected in the current monitoring window.</p></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      );
    }
    return (
      <div className="surface-card min-h-[620px] animate-fadeIn">
        {activeTab === "tracker" && <BugFlowTracker />}
        {activeTab === "sprints" && <SprintBoard />}
        {activeTab === "scanner" && <AIBugDetector onAddTicket={() => setActiveTab("tracker")} />}
        {activeTab === "labs" && <DebuggingLab />}
        {activeTab === "ai-productivity" && <AIPanel />}
        {activeTab === "analytics" && <AnalyticsDashboard />}
        {activeTab === "tenants" && <OrgTeamManager />}
        {activeTab === "auth" && <AuthCenter currentUser={currentUser} onUserChanged={() => window.location.reload()} />}
        {activeTab === "integrations" && <IntegrationsHub />}
        {activeTab === "audits" && <AdminPanel />}
      </div>
    );
  };

  const groups = [...new Set(nav.map((item) => item.group))];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="flex items-center justify-between px-4 py-5">
          <button onClick={() => setActiveTab("overview")} className="flex items-center gap-3 text-left">
            <div className="brand-mark"><ShieldCheck className="h-5 w-5" /></div>
            <div><p className="text-sm font-bold text-white">AutoBugFix</p><p className="text-[10px] text-slate-500">AI engineering OS</p></div>
          </button>
          <button className="icon-button lg:hidden" onClick={() => setMobileOpen(false)}><X className="h-4 w-4" /></button>
        </div>
        <div className="px-3 pb-4">
          <button className="search-button" onClick={() => setCommandOpen(true)} aria-label="Open command palette"><Search className="h-4 w-4" /><span>Search anything</span><kbd>Ctrl K</kbd></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-5">
          {groups.map((group) => (
            <div key={group} className="mb-5">
              <p className="nav-label">{group}</p>
              <div className="space-y-1">
                {nav.filter((item) => item.group === group).map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileOpen(false); }} className={`nav-item ${active ? "nav-item-active" : ""}`}><Icon className="h-4 w-4" /><span>{item.label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300" />}</button>;
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/[0.06] p-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.6)]" /><span className="text-xs font-medium text-slate-300">All systems operational</span></div>
            <p className="mt-2 text-[10px] leading-4 text-slate-600">AI services, integrations and workspace APIs are online.</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button className="icon-button lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="h-4 w-4" /></button>
            <div><p className="text-[11px] font-medium text-slate-500">Workspace / {activeLabel}</p><h2 className="mt-1 text-lg font-semibold text-white">{activeLabel}</h2></div>
          </div>
          <div className="flex items-center gap-2">
            <button className="icon-button" title="Notifications" aria-label="Notifications"><Bell className="h-4 w-4" /><span className="notification-dot" /></button>
            <button className="icon-button hidden sm:flex" title="Settings" aria-label="Settings"><Settings className="h-4 w-4" /></button>
            <div className="user-chip"><span className="avatar">{currentUser?.name?.slice(0, 1)?.toUpperCase() ?? "K"}</span><span className="hidden text-xs font-medium text-slate-300 md:block">{loadingUser ? "Loading..." : currentUser?.name ?? "Developer"}</span></div>
          </div>
        </header>

        <div className="content-wrap">
          <div className="workspace-strip mb-5"><div className="flex items-center gap-2 text-xs text-slate-500"><CircleDot className="h-3.5 w-3.5 text-emerald-400" /> Production connected <span className="text-slate-700">•</span> Last sync 2 min ago</div><button className="quick-command hidden items-center gap-2 md:flex" onClick={() => setCommandOpen(true)}><Command className="h-3.5 w-3.5" /> Quick actions <kbd>Ctrl K</kbd></button></div>
          {renderModule()}
        </div>
      </main>

      {mobileOpen && <button className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

      {commandOpen && (
        <div className="command-overlay" onClick={() => setCommandOpen(false)}>
          <div className="command-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3"><Search className="h-4 w-4 text-slate-500" /><input autoFocus className="!border-0 !bg-transparent !p-0 !outline-none" placeholder="Jump to a workspace tool..." /><kbd>ESC</kbd></div>
            <div className="command-list p-2">
              {nav.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => { setActiveTab(item.id); setCommandOpen(false); }} className="command-item"><Icon className="h-4 w-4 text-slate-500" /><span>{item.label}</span><span className="ml-auto text-[10px] text-slate-600">{item.group}</span></button>; })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
