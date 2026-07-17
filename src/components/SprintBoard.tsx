import React, { useState, useEffect } from "react";
import { Calendar, Play, ListTodo, Plus, Target, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Sprint, Project } from "../types";

export default function SprintBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeProjId, setActiveProjId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchProjects();
    fetchSprints();
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

  const fetchSprints = async () => {
    try {
      const res = await fetch("/api/sprints");
      const data = await res.json();
      setSprints(data.sprints);
    } catch {}
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await fetch("/api/sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProjId, name, goal, startDate, endDate })
      });
      if (res.ok) {
        setName("");
        setGoal("");
        setStartDate("");
        setEndDate("");
        fetchSprints();
        setMsg(`Planned sprint "${name}" compiled successfully.`);
      }
    } catch {}
  };

  const handleStartSprint = async (sprId: string) => {
    try {
      const res = await fetch("/api/sprints/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sprId })
      });
      if (res.ok) {
        fetchSprints();
        setMsg("Sprint timeline activated.");
      }
    } catch {}
  };

  // Mock burndown chart points data for Sprint 14
  const burndownData = [
    { day: "Day 1", Ideal: 10, Actual: 10 },
    { day: "Day 3", Ideal: 8.5, Actual: 9 },
    { day: "Day 5", Ideal: 7, Actual: 7.5 },
    { day: "Day 7", Ideal: 5.5, Actual: 5 },
    { day: "Day 9", Ideal: 4, Actual: 4 },
    { day: "Day 11", Ideal: 2.5, Actual: 2 },
    { day: "Day 13", Ideal: 1, Actual: 1 },
    { day: "Day 14", Ideal: 0, Actual: 0 }
  ];

  const projectSprints = sprints.filter(s => s.projectId === activeProjId);
  const activeSprint = projectSprints.find(s => s.status === "active") || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 bg-[#0A0C10]">
      
      {/* Project selector + Sprint creation */}
      <div className="lg:col-span-4 panel-shell p-5 flex flex-col h-[650px] justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3">
            <Target className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Sprint Planner Workspace</h3>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="active-proj-id" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Selected Project Domain</label>
            <select
              id="active-proj-id"
              value={activeProjId}
              onChange={(e) => setActiveProjId(e.target.value)}
              className="px-2.5 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300 focus:outline-hidden"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name} [{p.key}]</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleCreateSprint} className="border-t border-[#1E293B]/60 pt-4 flex flex-col gap-2.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Schedule New Sprint Cycle</span>
            
            <div className="flex flex-col gap-1">
              <label htmlFor="new-sprint-name" className="text-[9px] text-slate-500 font-bold uppercase">Sprint Name</label>
              <input
                id="new-sprint-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sprint 15 - OAuth Sync"
                className="px-2 py-1 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-200 focus:outline-hidden focus:border-cyan-400"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="new-sprint-goal" className="text-[9px] text-slate-500 font-bold uppercase">Main Sprint Goal</label>
              <textarea
                id="new-sprint-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Synchronize issues, configure login cookies, and setup MFA workflows."
                className="px-2 py-1 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-200 h-16 focus:outline-hidden focus:border-cyan-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="sprint-start" className="text-[9px] text-slate-500 font-bold uppercase">Start Date</label>
                <input
                  id="sprint-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300 focus:outline-hidden font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="sprint-end" className="text-[9px] text-slate-500 font-bold uppercase">End Date</label>
                <input
                  id="sprint-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-1.5 bg-white text-black hover:bg-cyan-500 font-bold uppercase rounded text-[10px] tracking-widest transition cursor-pointer"
            >
              Compile Sprint Node
            </button>
          </form>
        </div>

        {msg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] p-2 rounded font-mono animate-fadeIn">
            {msg}
          </div>
        )}
      </div>

      {/* Sprints logs/planner timeline */}
      <div className="lg:col-span-8 panel-shell overflow-hidden flex flex-col h-[650px]">
        <div className="panel-header justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Active Cycle Burndown & Backlog</h3>
          </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-6">
          {/* Active Sprint Info & Burndown chart */}
          {activeSprint ? (
            <div className="flex flex-col gap-4">
              <div className="bg-[#0A0C10] border border-[#1E293B] p-4 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
                      ACTIVE SPRINT RUNNING
                    </span>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-[10px] text-slate-400 font-mono font-semibold">{activeSprint.startDate} to {activeSprint.endDate}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider mt-2">{activeSprint.name}</h4>
                  <p className="text-xs text-slate-300 mt-1 italic">" {activeSprint.goal} "</p>
                </div>
                <div className="text-center bg-[#0F172A] border border-[#1E293B] p-3 rounded sm:w-28 flex-shrink-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Sprint Velocity</span>
                  <div className="text-xl font-bold text-cyan-400 mt-0.5">BF-92%</div>
                </div>
              </div>

              {/* Burndown Chart widget using Recharts */}
              <div className="bg-[#0A0C10] border border-[#1E293B] rounded p-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Sprint Issue Burndown Matrix (Tasks Remaining)</h4>
                <div className="w-full h-52 font-mono text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={burndownData}>
                      <defs>
                        <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1E293B" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#1E293B" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="day" stroke="#475569" />
                      <YAxis stroke="#475569" />
                      <Tooltip contentStyle={{ backgroundColor: "#0A0C10", borderColor: "#1E293B" }} />
                      <Legend />
                      <Area type="monotone" dataKey="Ideal" stroke="#475569" fillOpacity={1} fill="url(#colorIdeal)" strokeDasharray="5 5" />
                      <Area type="monotone" dataKey="Actual" stroke="#22D3EE" fillOpacity={1} fill="url(#colorActual)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-[#1E293B] rounded p-8 text-center bg-[#0A0C10]/20 flex flex-col items-center justify-center h-48">
              <Target className="w-8 h-8 text-slate-700 mb-2" />
              <h4 className="text-xs font-bold text-white uppercase">No active sprint running</h4>
              <p className="text-[10px] text-slate-500 mt-1 max-w-xs">Initialize or start one of your planned sprint nodes from the backlog list below.</p>
            </div>
          )}

          {/* Sprints Backlog list */}
          <div className="border-t border-[#1E293B] pt-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5" /> Backlog Sprint Timeline
            </h4>
            <div className="flex flex-col gap-2">
              {projectSprints.map(spr => (
                <div key={spr.id} className="bg-[#0A0C10] border border-[#1E293B] rounded p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-white uppercase tracking-wide">{spr.name}</h5>
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        spr.status === "active" ? "bg-cyan-950 text-cyan-400 border border-cyan-800/40" : "bg-slate-950 text-slate-500 border border-slate-900"
                      }`}>
                        {spr.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-1">{spr.goal}</span>
                    <span className="text-[9px] text-slate-500 font-mono block mt-1">Timeline: {spr.startDate} to {spr.endDate}</span>
                  </div>

                  {spr.status === "planned" && (
                    <button
                      onClick={() => handleStartSprint(spr.id)}
                      className="px-3 py-1 bg-white hover:bg-cyan-500 text-black rounded font-bold text-[9px] uppercase tracking-wide flex items-center gap-1 cursor-pointer transition"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" /> Start
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
