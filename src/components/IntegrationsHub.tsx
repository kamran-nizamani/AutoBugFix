import React, { useState, useEffect } from "react";
import { Github, Sliders, ExternalLink, RefreshCw, Plus, CheckCircle2, Bot, Bell } from "lucide-react";
import { GitHubRepo, Project } from "../types";

export default function IntegrationsHub() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [activeProjId, setActiveProjId] = useState("");

  // Repo Form
  const [repoFullName, setRepoFullName] = useState("");

  // Webhooks State
  const [hooks, setHooks] = useState<any[]>([]);
  const [whUrl, setWhUrl] = useState("");
  const [whTarget, setWhTarget] = useState("slack");

  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchRepos();
    fetchWebhooks();
  }, [activeProjId]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects);
      if (data.projects.length > 0 && !activeProjId) {
        setActiveProjId(data.projects[0].id);
      }
    } catch {}
  };

  const fetchRepos = async () => {
    try {
      const res = await fetch("/api/integrations/github");
      const data = await res.json();
      setRepos(data.repos);
    } catch {}
  };

  const fetchWebhooks = async () => {
    try {
      const res = await fetch("/api/integrations/webhooks");
      const data = await res.json();
      setHooks(data.webhooks);
    } catch {}
  };

  const handleLinkRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoFullName.trim() || !activeProjId) return;
    try {
      const res = await fetch("/api/integrations/github/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: repoFullName, linkedProjectId: activeProjId })
      });
      if (res.ok) {
        setRepoFullName("");
        fetchRepos();
        setMsg(`GitHub Repository [${repoFullName}] successfully bound to project.`);
      }
    } catch {}
  };

  const handleSyncRepo = async (repoId: string) => {
    try {
      const res = await fetch("/api/integrations/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: repoId })
      });
      if (res.ok) {
        fetchRepos();
        setMsg("GitHub webhook sync complete. Synchronized latest commit hashes.");
      }
    } catch {}
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whUrl.trim()) return;
    try {
      const res = await fetch("/api/integrations/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: whUrl, target: whTarget })
      });
      if (res.ok) {
        setWhUrl("");
        fetchWebhooks();
        setMsg(`Outbound notification socket established for ${whTarget}.`);
      }
    } catch {}
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 bg-[#0A0C10]">
      
      {/* Github link module */}
      <div className="lg:col-span-6 flex flex-col h-[650px] bg-[#0F172A] border border-[#1E293B] rounded overflow-hidden">
        <div className="bg-[#0F172A] px-4 py-3 border-b border-[#1E293B] flex items-center gap-2">
          <Github className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">GitHub CI/CD Code Sync</h3>
        </div>

        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure bi-directional sync with your GitHub repositories. When issues are closed on GitHub via commits (e.g. <code className="text-cyan-400 font-mono text-[10px]">Fixes #14</code>), BugFlow automatically triggers QA tests and marks corresponding tickets as testing.
          </p>

          <form onSubmit={handleLinkRepo} className="bg-[#0A0C10] border border-[#1E293B] p-4 rounded flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connect Repository Source</span>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="integration-proj" className="text-[9px] text-slate-500 font-bold uppercase">Bind Project</label>
                <select
                  id="integration-proj"
                  value={activeProjId}
                  onChange={(e) => setActiveProjId(e.target.value)}
                  className="px-2 py-1.5 bg-[#0F172A] border border-[#1E293B] rounded text-xs text-slate-300"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="repo-full-name" className="text-[9px] text-slate-500 font-bold uppercase">Repo Path</label>
                <input
                  id="repo-full-name"
                  type="text"
                  value={repoFullName}
                  onChange={(e) => setRepoFullName(e.target.value)}
                  placeholder="kamran/bugflow-saas"
                  className="px-2 py-1.5 bg-[#0F172A] border border-[#1E293B] rounded text-xs text-slate-200 focus:outline-hidden font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-1.5 bg-white text-black hover:bg-cyan-500 font-bold uppercase rounded text-[10px] tracking-wider transition cursor-pointer"
            >
              Bind GitHub Repo
            </button>
          </form>

          <div className="border-t border-[#1E293B]/60 pt-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Linked Repositories</span>
            <div className="flex flex-col gap-2.5">
              {repos.map(r => (
                <div key={r.id} className="bg-[#0A0C10] border border-[#1E293B] p-3 rounded flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                      {r.fullName}
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">Issues Synced: {r.syncedIssuesCount}</span>
                  </div>

                  <button
                    onClick={() => handleSyncRepo(r.id)}
                    className="p-1.5 bg-[#0F172A] hover:bg-[#1E293B] text-slate-400 hover:text-white rounded border border-[#1E293B] transition cursor-pointer"
                    title="Sync Latest Commits"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {msg && (
          <div className="p-3 bg-emerald-500/10 border-t border-[#1E293B] text-emerald-400 text-[10px] font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> {msg}
          </div>
        )}
      </div>

      {/* Webhooks outbound module */}
      <div className="lg:col-span-6 flex flex-col h-[650px] bg-[#0F172A] border border-[#1E293B] rounded overflow-hidden">
        <div className="bg-[#0F172A] px-4 py-3 border-b border-[#1E293B] flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">Outbound Event Webhooks</h3>
        </div>

        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Publish transactional event payloads instantly into external Slack workspaces, Discord server channels, or developer API sockets. Fires on ticket status alterations, critical crash updates, or deployment logs uploads.
          </p>

          <form onSubmit={handleCreateWebhook} className="bg-[#0A0C10] border border-[#1E293B] p-4 rounded flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deploy Outbound Event Hook</span>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1 flex flex-col gap-1">
                <label htmlFor="webhook-target" className="text-[9px] text-slate-500 font-bold uppercase">Socket Host</label>
                <select
                  id="webhook-target"
                  value={whTarget}
                  onChange={(e) => setWhTarget(e.target.value)}
                  className="px-2 py-1.5 bg-[#0F172A] border border-[#1E293B] rounded text-xs text-slate-300"
                >
                  <option value="slack">Slack Channel</option>
                  <option value="discord">Discord Webhook</option>
                  <option value="custom">Custom Webhook</option>
                </select>
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="webhook-url" className="text-[9px] text-slate-500 font-bold uppercase">Payload Delivery URL</label>
                <input
                  id="webhook-url"
                  type="url"
                  value={whUrl}
                  onChange={(e) => setWhUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/T00/B00/X"
                  className="px-2.5 py-1.5 bg-[#0F172A] border border-[#1E293B] rounded text-xs text-slate-200 focus:outline-hidden font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-1.5 bg-white text-black hover:bg-cyan-500 font-bold uppercase rounded text-[10px] tracking-wider transition cursor-pointer"
            >
              Configure Active Webhook
            </button>
          </form>

          <div className="border-t border-[#1E293B]/60 pt-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Live Webhooks Delivery</span>
            <div className="flex flex-col gap-2.5">
              {hooks.map(h => (
                <div key={h.id} className="bg-[#0A0C10] border border-[#1E293B] p-3 rounded flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-cyan-400" />
                      {h.target.toUpperCase()} Socket Receiver
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono block mt-1 truncate max-w-xs">{h.url}</span>
                  </div>
                  <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 rounded uppercase font-mono font-bold">
                    Connected
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
