import React, { useState, useEffect } from "react";
import { Kanban, List, Shield, Filter, Eye, MessageSquare, Tag, Terminal, Paperclip, Sparkles, UserPlus, Trash2, ArrowRightLeft, Plus, CheckCircle2, Loader2 } from "lucide-react";
import { BugReport, BugStatus, Severity, Project, Sprint, User } from "../types";

export default function BugFlowTracker() {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Filtering State
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [filterProject, setFilterProject] = useState("");
  const [filterSprint, setFilterSprint] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Presets
  const [activePreset, setActivePreset] = useState("all");

  // Selected ticket for modal
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [commentText, setCommentText] = useState("");

  // Form State for creating a new bug
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSeverity, setNewSeverity] = useState<Severity>("medium");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newProjectId, setNewProjectId] = useState("");
  const [newSprintId, setNewSprintId] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [newEnv, setNewEnv] = useState("Staging");
  const [newBrowser, setNewBrowser] = useState("Chrome 125");
  const [newOS, setNewOS] = useState("macOS Sonoma");
  const [newDevice, setNewDevice] = useState("Desktop");
  const [newSteps, setNewSteps] = useState("");
  const [newExpected, setNewExpected] = useState("");
  const [newActual, setNewActual] = useState("");
  const [newLogs, setNewLogs] = useState("");
  const [newTraces, setNewTraces] = useState("");

  // AI Triage Toggles
  const [isTriagingAI, setIsTriagingAI] = useState(false);
  const [aiTriageResult, setAiTriageResult] = useState<any | null>(null);

  // AI Bug Fix States
  const [isGeneratingFix, setIsGeneratingFix] = useState(false);
  const [aiFixResult, setAiFixResult] = useState<{ explanation: string; suggestedFixCode: string; validationSteps: string } | null>(null);
  const [aiFixError, setAiFixError] = useState<string | null>(null);
  const [copiedFixCode, setCopiedFixCode] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchBugs();
    fetchProjects();
    fetchSprints();
    fetchUsers();
  }, []);

  // Reset AI fix states when selected bug changes
  useEffect(() => {
    setAiFixResult(null);
    setAiFixError(null);
    setCopiedFixCode(false);
  }, [selectedBug?.id]);

  const handleRequestAIFix = async (bugId: string) => {
    setIsGeneratingFix(true);
    setAiFixError(null);
    setAiFixResult(null);
    try {
      const res = await fetch(`/api/bugs/${bugId}/fix-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) {
        throw new Error("Failed to contact the AI patch engine.");
      }
      const data = await res.json();
      setAiFixResult(data);
    } catch (err: any) {
      setAiFixError(err.message || "An unexpected error occurred.");
    } finally {
      setIsGeneratingFix(false);
    }
  };

  const handleApplyAIFix = async (bugId: string) => {
    if (!aiFixResult) return;
    try {
      const statusRes = await fetch(`/api/bugs/${bugId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" })
      });
      if (!statusRes.ok) throw new Error("Failed to update status.");

      const commentText = `[AI Auto-Patch Applied]\n\n**Analysis**:\n${aiFixResult.explanation}\n\n**Remediation Code**:\n\`\`\`typescript\n${aiFixResult.suggestedFixCode}\n\`\`\`\n\n**Validation Steps**:\n${aiFixResult.validationSteps}`;
      const commentRes = await fetch(`/api/bugs/${bugId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText })
      });
      if (!commentRes.ok) throw new Error("Failed to add automated comment.");

      await fetchBugs();
      
      const updatedStatus = await statusRes.json();
      setSelectedBug(updatedStatus.bug);
      
      setMsg("AI Remediation Patch applied. Bug status moved to Merged / Resolved.");
      setAiFixResult(null);
    } catch (err: any) {
      alert(err.message || "Failed to fully apply AI patch.");
    }
  };

  const handleCopyFixCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFixCode(true);
    setTimeout(() => setCopiedFixCode(false), 2000);
  };

  const fetchBugs = async () => {
    try {
      const res = await fetch("/api/bugs");
      const data = await res.json();
      setBugs(data.bugs);
    } catch {}
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects);
      if (data.projects.length > 0 && !newProjectId) {
        setNewProjectId(data.projects[0].id);
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

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/auth/users");
      const data = await res.json();
      setUsers(data.users);
    } catch {}
  };

  // Preset Filters
  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    if (preset === "blockers") {
      setFilterSeverity("critical");
      setFilterAssignee("");
    } else if (preset === "assigned-to-me") {
      setFilterSeverity("");
      setFilterAssignee("usr-1"); // Sarah Jenkins / Logged Admin usr-1
    } else {
      setFilterSeverity("");
      setFilterAssignee("");
    }
  };

  // AI auto-triage call
  const triggerAITriage = async () => {
    if (!newTitle.trim()) {
      alert("Please specify an issue title first.");
      return;
    }
    setIsTriagingAI(true);
    setAiTriageResult(null);
    try {
      const res = await fetch("/api/bugs/triage-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, description: newDesc })
      });
      if (res.ok) {
        const parsed = await res.json();
        setAiTriageResult(parsed);
        // Automatically fill fields
        setNewSeverity(parsed.severity || "medium");
        setNewPriority(parsed.priority || "medium");
        setNewSteps(parsed.rootCause || "");
        setNewExpected("Clean validation passing under unit layers.");
        setNewActual(parsed.suggestedFix || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTriagingAI(false);
    }
  };

  const handleCreateBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const payload: any = {
        projectId: newProjectId,
        sprintId: newSprintId || undefined,
        title: newTitle,
        description: newDesc,
        severity: newSeverity,
        priority: newPriority,
        status: "open",
        assigneeId: newAssigneeId || undefined,
        environment: newEnv,
        browser: newBrowser,
        operatingSystem: newOS,
        device: newDevice,
        stepsToReproduce: newSteps,
        expectedResult: newExpected,
        actualResult: newActual,
        consoleLogs: newLogs,
        stackTraces: newTraces,
        labels: aiTriageResult ? [aiTriageResult.category] : ["bug"]
      };

      const res = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setNewTitle("");
        setNewDesc("");
        setNewSteps("");
        setNewExpected("");
        setNewActual("");
        setNewLogs("");
        setNewTraces("");
        setAiTriageResult(null);
        setIsCreating(false);
        fetchBugs();
        setMsg("Operational ticket filed, synchronized with active sprints.");
      }
    } catch {}
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedBug) return;

    try {
      const res = await fetch(`/api/bugs/${selectedBug.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText })
      });
      if (res.ok) {
        setCommentText("");
        // Reload details
        const detailsRes = await fetch("/api/bugs");
        const detailsData = await detailsRes.json();
        setBugs(detailsData.bugs);
        const updated = detailsData.bugs.find((b: any) => b.id === selectedBug.id);
        if (updated) setSelectedBug(updated);
      }
    } catch {}
  };

  const handleStatusChange = async (bugId: string, nextStatus: BugStatus) => {
    try {
      const res = await fetch(`/api/bugs/${bugId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchBugs();
        if (selectedBug && selectedBug.id === bugId) {
          const data = await res.json();
          setSelectedBug(data.bug);
        }
      }
    } catch {}
  };

  const handleDeleteBug = async (bugId: string) => {
    if (!confirm("Are you sure you want to permanently purge this bug ticket?")) return;
    try {
      const res = await fetch(`/api/bugs/${bugId}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedBug(null);
        fetchBugs();
        setMsg("Bug ticket purged successfully.");
      }
    } catch {}
  };

  // Filter application
  const filteredBugs = bugs.filter(bug => {
    if (filterProject && bug.projectId !== filterProject) return false;
    if (filterSprint && bug.sprintId !== filterSprint) return false;
    if (filterSeverity && bug.severity !== filterSeverity) return false;
    if (filterAssignee && bug.assigneeId !== filterAssignee) return false;
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      const inTitle = bug.title.toLowerCase().includes(term);
      const inDesc = bug.description.toLowerCase().includes(term);
      const inId = bug.id.toLowerCase().includes(term);
      if (!inTitle && !inDesc && !inId) return false;
    }
    return true;
  });

  // Kanban Columns
  const columns: { status: BugStatus; label: string; bg: string }[] = [
    { status: "open", label: "Backlog / Inbox", bg: "border-slate-800" },
    { status: "assigned", label: "Triage / Allocated", bg: "border-blue-900/50" },
    { status: "in-progress", label: "Active Diagnostics", bg: "border-amber-900/50" },
    { status: "testing", label: "QA Validation", bg: "border-purple-900/50" },
    { status: "resolved", label: "Merged / Resolved", bg: "border-emerald-900/50" }
  ];

  const getSeverityBadgeColor = (sev: Severity) => {
    switch (sev) {
      case "critical": return "bg-red-950 text-red-400 border border-red-800/40";
      case "high": return "bg-orange-950 text-orange-400 border border-orange-800/40";
      case "medium": return "bg-yellow-950 text-yellow-400 border border-yellow-800/40";
      case "low": return "bg-cyan-950 text-cyan-400 border border-cyan-800/40";
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 bg-[#0A0C10] text-slate-200">
      
      {/* Search and Filters Header */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Operational Filters Engine</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => applyPreset("all")}
              className={`px-3 py-1 text-[10px] uppercase font-bold rounded cursor-pointer ${activePreset === "all" ? "bg-white text-black" : "text-slate-400 hover:text-white"}`}
            >
              All Tickets
            </button>
            <button
              onClick={() => applyPreset("blockers")}
              className={`px-3 py-1 text-[10px] uppercase font-bold rounded cursor-pointer ${activePreset === "blockers" ? "bg-red-500/15 text-red-400 border border-red-950" : "text-slate-400 hover:text-white"}`}
            >
              Critical Blockers
            </button>
            <button
              onClick={() => applyPreset("assigned-to-me")}
              className={`px-3 py-1 text-[10px] uppercase font-bold rounded cursor-pointer ${activePreset === "assigned-to-me" ? "bg-cyan-500/15 text-cyan-400 border border-cyan-950" : "text-slate-400 hover:text-white"}`}
            >
              My Assigned
            </button>
          </div>
        </div>

        {/* Dynamic Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 pt-2 border-t border-[#1E293B]/60">
          <div className="flex flex-col gap-1">
            <label htmlFor="search-tickets" className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Search Keywords</label>
            <input
              id="search-tickets"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter title, ID..."
              className="px-2 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filter-project-id" className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Scope Project</label>
            <select
              id="filter-project-id"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="px-2 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300"
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filter-sprint-id" className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Target Sprint</label>
            <select
              id="filter-sprint-id"
              value={filterSprint}
              onChange={(e) => setFilterSprint(e.target.value)}
              className="px-2 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300"
            >
              <option value="">All Sprints</option>
              {sprints.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filter-severity-level" className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Severity Level</label>
            <select
              id="filter-severity-level"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-2 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Create ticket trigger & view switchers */}
          <div className="flex items-end gap-2">
            <div className="flex bg-[#0A0C10] border border-[#1E293B] p-0.5 rounded flex-grow">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex-1 py-1 flex items-center justify-center rounded cursor-pointer ${viewMode === "kanban" ? "bg-[#1E293B] text-cyan-400" : "text-slate-400"}`}
                title="Board View"
              >
                <Kanban className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex-1 py-1 flex items-center justify-center rounded cursor-pointer ${viewMode === "list" ? "bg-[#1E293B] text-cyan-400" : "text-slate-400"}`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-white text-black hover:bg-cyan-500 rounded text-xs font-bold uppercase tracking-widest transition cursor-pointer flex items-center gap-1 flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> TICKET
            </button>
          </div>
        </div>
      </div>

      {/* Main Board View */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto select-none">
          {columns.map(col => {
            const colBugs = filteredBugs.filter(b => b.status === col.status);
            return (
              <div key={col.status} className="bg-[#0F172A]/80 border border-[#1E293B] rounded flex flex-col h-[520px] w-full min-w-[200px]">
                <div className={`px-3 py-2.5 border-b-2 ${col.bg} flex items-center justify-between bg-[#0F172A]`}>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{col.label}</span>
                  <span className="text-[10px] font-mono font-bold bg-[#1E293B] px-1.5 py-0.2 rounded text-slate-400">
                    {colBugs.length}
                  </span>
                </div>

                {/* Draggable-like cards container */}
                <div className="p-2 flex-1 overflow-y-auto flex flex-col gap-2.5">
                  {colBugs.map(bug => (
                    <div
                      key={bug.id}
                      onClick={() => setSelectedBug(bug)}
                      className="bg-[#0A0C10] border border-[#1E293B] hover:border-cyan-500/60 p-3 rounded cursor-pointer transition flex flex-col gap-2 relative group"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[9px] font-mono text-slate-500 font-bold">{bug.id}</span>
                        <span className={`text-[8px] font-mono uppercase font-bold px-1.5 py-0.2 rounded ${getSeverityBadgeColor(bug.severity)}`}>
                          {bug.severity}
                        </span>
                      </div>

                      <h4 className="text-[11px] font-bold text-white leading-tight line-clamp-2">
                        {bug.title}
                      </h4>

                      <div className="flex items-center justify-between border-t border-[#1E293B]/40 pt-2 mt-1">
                        <div className="flex items-center gap-1.5">
                          {bug.comments.length > 0 && (
                            <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                              <MessageSquare className="w-3 h-3 text-slate-500" /> {bug.comments.length}
                            </span>
                          )}
                          {bug.labels.length > 0 && (
                            <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-1 py-0.2 rounded text-[8px] font-mono uppercase">
                              {bug.labels[0]}
                            </span>
                          )}
                        </div>

                        <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-[8px] border border-cyan-800/40">
                          {bug.assigneeName ? bug.assigneeName.charAt(0) : "U"}
                        </div>
                      </div>
                    </div>
                  ))}

                  {colBugs.length === 0 && (
                    <div className="flex-1 flex items-center justify-center border border-dashed border-[#1E293B]/40 rounded p-4 text-center">
                      <span className="text-[9px] font-mono text-slate-600 uppercase">Empty State</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table View */
        <div className="bg-[#0F172A] border border-[#1E293B] rounded overflow-hidden">
          <div className="overflow-x-auto font-mono text-[10px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0C10] border-b border-[#1E293B] text-slate-400 uppercase tracking-wider font-bold">
                  <th className="p-3">ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Assignee</th>
                  <th className="p-3">Environment</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBugs.map(bug => (
                  <tr key={bug.id} className="border-b border-[#1E293B]/40 hover:bg-[#0A0C10]/40 transition">
                    <td className="p-3 text-slate-500 font-bold">{bug.id}</td>
                    <td className="p-3 font-sans font-bold text-white truncate max-w-xs">{bug.title}</td>
                    <td className="p-3">
                      <span className="text-[9px] bg-[#1E293B] text-cyan-400 px-1.5 py-0.5 rounded font-bold uppercase border border-cyan-900/40">
                        {bug.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${getSeverityBadgeColor(bug.severity)}`}>
                        {bug.severity}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{bug.assigneeName || "Unassigned"}</td>
                    <td className="p-3 text-slate-400">{bug.environment}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedBug(bug)}
                        className="p-1 text-cyan-400 hover:text-white transition cursor-pointer"
                        title="Inspect Ticket Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED ISSUE MODAL */}
      {selectedBug && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden relative">
            
            {/* Modal header */}
            <div className="bg-[#0F172A] p-4 border-b border-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 font-bold">{selectedBug.id}</span>
                <span className="text-slate-600">•</span>
                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${getSeverityBadgeColor(selectedBug.severity)}`}>
                  {selectedBug.severity}
                </span>
                {selectedBug.status === "duplicate" && (
                  <span className="text-[9px] bg-red-950 text-red-400 border border-red-900 px-1.5 py-0.5 rounded font-mono uppercase">
                    Duplicate
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedBug(null)}
                className="text-slate-400 hover:text-white text-xs font-bold font-mono cursor-pointer uppercase tracking-wider"
              >
                Close ESC
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Context & Logs */}
              <div className="md:col-span-8 flex flex-col gap-5">
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">{selectedBug.title}</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">{selectedBug.description}</p>
                </div>

                {/* Steps to Reproduce */}
                {selectedBug.stepsToReproduce && (
                  <div className="bg-[#0A0C10] border border-[#1E293B] rounded p-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Reproduction Run Steps</h4>
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                      {selectedBug.stepsToReproduce}
                    </pre>
                  </div>
                )}

                {/* Expected vs Actual */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#0A0C10] border border-[#1E293B] rounded p-3">
                    <h5 className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Expected Outcome</h5>
                    <p className="text-xs text-slate-400 mt-1 leading-normal">{selectedBug.expectedResult || "N/A"}</p>
                  </div>
                  <div className="bg-[#0A0C10] border border-[#1E293B] rounded p-3">
                    <h5 className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Observed Crash</h5>
                    <p className="text-xs text-slate-400 mt-1 leading-normal">{selectedBug.actualResult || "N/A"}</p>
                  </div>
                </div>

                {/* Console traces & terminal logs */}
                {(selectedBug.consoleLogs || selectedBug.stackTraces) && (
                  <div className="bg-[#05070B] border border-red-500/10 rounded p-4">
                    <div className="flex items-center gap-1.5 mb-2 text-red-400">
                      <Terminal className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Fatal Stack Trace / Logger Console</span>
                    </div>
                    {selectedBug.consoleLogs && (
                      <pre className="text-[10px] text-red-300 font-mono overflow-x-auto leading-relaxed pb-2">
                        {selectedBug.consoleLogs}
                      </pre>
                    )}
                    {selectedBug.stackTraces && (
                      <pre className="text-[10px] text-slate-400 border-t border-[#1E293B] pt-2 font-mono overflow-x-auto leading-relaxed">
                        {selectedBug.stackTraces}
                      </pre>
                    )}
                  </div>
                )}

                {/* Comments Section */}
                <div className="border-t border-[#1E293B] pt-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Collaborator Comments</h4>
                  
                  <div className="flex flex-col gap-3.5 max-h-[220px] overflow-y-auto mb-4 pr-1">
                    {selectedBug.comments.map(c => (
                      <div key={c.id} className="bg-[#0A0C10] border border-[#1E293B] p-3 rounded">
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{c.authorName}</span>
                            <span className="text-[8px] uppercase bg-slate-900 border border-slate-800 text-slate-400 px-1 py-0.2 rounded font-mono">
                              {c.authorRole}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono">{c.createdAt}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{c.text}</p>
                      </div>
                    ))}

                    {selectedBug.comments.length === 0 && (
                      <span className="text-xs text-slate-500 font-mono italic">No commentary logged yet.</span>
                    )}
                  </div>

                  <form onSubmit={handleCommentSubmit} className="flex gap-2">
                    <input
                      id="comment-input"
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Contribute core diagnostic insight..."
                      className="flex-1 px-3 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-200 focus:outline-hidden"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-white text-black hover:bg-cyan-500 font-bold uppercase rounded text-[10px] tracking-wider transition cursor-pointer"
                    >
                      Comment
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Metadata / Actions */}
              <div className="md:col-span-4 flex flex-col gap-4 border-l border-[#1E293B] pl-4">
                
                {/* State controllers */}
                <div className="flex flex-col gap-3.5 bg-[#0A0C10] border border-[#1E293B] p-3.5 rounded">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operational State</span>
                  
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="modal-status" className="text-[9px] text-slate-500 font-bold uppercase">Status</label>
                    <select
                      id="modal-status"
                      value={selectedBug.status}
                      onChange={(e) => handleStatusChange(selectedBug.id, e.target.value as BugStatus)}
                      className="px-2 py-1 bg-[#0F172A] border border-[#1E293B] rounded text-xs text-slate-300"
                    >
                      <option value="open">Backlog / Inbox</option>
                      <option value="assigned">Triage / Allocated</option>
                      <option value="in-progress">Active Diagnostics</option>
                      <option value="testing">QA Validation</option>
                      <option value="resolved">Merged / Resolved</option>
                      <option value="duplicate">Duplicate Issue</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Allocated SRE Analyst</span>
                    <span className="text-xs text-white">{selectedBug.assigneeName || "Unassigned"}</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Reporter Actor</span>
                    <span className="text-xs text-slate-300">{selectedBug.reporterName}</span>
                  </div>
                </div>

                {/* AI Healing & Remediation Panel */}
                <div className="flex flex-col gap-3 bg-[#090D16] border border-[#1E293B] p-3.5 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> AI Patch Engine
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-cyan-950/40 text-cyan-400 border border-cyan-900/40 rounded uppercase font-semibold font-mono">
                      AI ENGINE v3.5
                    </span>
                  </div>

                  {selectedBug.status !== "resolved" ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Request a precise AI remediation patch based on reproduction steps, logs, and stack traces.
                      </p>

                      {!aiFixResult ? (
                        <button
                          onClick={() => handleRequestAIFix(selectedBug.id)}
                          disabled={isGeneratingFix}
                          className="w-full py-2 bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-400 hover:text-cyan-300 hover:from-cyan-900 hover:to-blue-900 disabled:opacity-50 border border-cyan-800/40 rounded text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {isGeneratingFix ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing & Healing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" /> Generate AI Code Fix
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex flex-col gap-2.5 mt-1">
                          <div className="bg-[#030712] border border-[#1E293B] p-2 rounded max-h-[220px] overflow-y-auto flex flex-col gap-2">
                            <div>
                              <span className="text-[9px] text-cyan-400 font-bold uppercase block mb-1">Root Cause Analysis</span>
                              <p className="text-[10px] text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">{aiFixResult.explanation}</p>
                            </div>
                            
                            <div>
                              <span className="text-[9px] text-cyan-400 font-bold uppercase block mb-1">Remediation Code</span>
                              <pre className="text-[9px] bg-[#020617] p-1.5 border border-[#1E293B]/60 rounded font-mono text-cyan-300 overflow-x-auto whitespace-pre">
                                {aiFixResult.suggestedFixCode}
                              </pre>
                            </div>

                            <div>
                              <span className="text-[9px] text-cyan-400 font-bold uppercase block mb-1">Validation Steps</span>
                              <p className="text-[10px] text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">{aiFixResult.validationSteps}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCopyFixCode(aiFixResult.suggestedFixCode)}
                              className="flex-1 py-1.5 bg-[#1E293B] hover:bg-[#334155] border border-[#334155] rounded text-[9px] text-slate-300 font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                            >
                              {copiedFixCode ? "Copied!" : "Copy Code"}
                            </button>
                            <button
                              onClick={() => handleApplyAIFix(selectedBug.id)}
                              className="flex-1 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/40 rounded text-[9px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                            >
                              Apply & Resolve
                            </button>
                          </div>
                        </div>
                      )}

                      {aiFixError && (
                        <span className="text-[9px] text-red-400 mt-1 block">Error: {aiFixError}</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 text-center py-2 bg-emerald-950/20 border border-emerald-900/30 rounded p-2">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                        ✓ Ticket Healed By AI
                      </span>
                      <p className="text-[9px] text-slate-400 leading-relaxed">
                        This issue is successfully resolved. View comment history to inspect the remediation code patch.
                      </p>
                    </div>
                  )}
                </div>

                {/* System Properties */}
                <div className="flex flex-col gap-3.5 bg-[#0A0C10] border border-[#1E293B] p-3.5 rounded font-mono text-[10px]">
                  <span className="text-[10px] font-bold text-slate-500 font-sans uppercase tracking-widest">Hardware Target Specs</span>
                  
                  <div className="flex justify-between border-b border-[#1E293B]/40 pb-1.5">
                    <span className="text-slate-500">ENVIRONMENT:</span>
                    <span className="text-slate-300">{selectedBug.environment}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1E293B]/40 pb-1.5">
                    <span className="text-slate-500">BROWSER:</span>
                    <span className="text-slate-300 truncate max-w-[120px]">{selectedBug.browser}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1E293B]/40 pb-1.5">
                    <span className="text-slate-500">OS TARGET:</span>
                    <span className="text-slate-300">{selectedBug.operatingSystem}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DEVICE TYPE:</span>
                    <span className="text-slate-300">{selectedBug.device}</span>
                  </div>
                </div>

                {/* Attachments */}
                {selectedBug.attachments && selectedBug.attachments.length > 0 && (
                  <div className="bg-[#0A0C10] border border-[#1E293B] p-3.5 rounded flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5 text-cyan-400" /> Attached Logs</span>
                    {selectedBug.attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[10px] font-mono border-b border-[#1E293B]/40 pb-1">
                        <span className="text-slate-300 truncate max-w-[140px]">{file.name}</span>
                        <span className="text-slate-500">{file.size}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Purge trigger */}
                <button
                  onClick={() => handleDeleteBug(selectedBug.id)}
                  className="w-full mt-2 py-1.5 bg-red-950/25 text-red-400 border border-red-900/35 hover:bg-red-950/40 rounded text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Purge Bug Ticket
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CREATE BUG MODAL */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <form onSubmit={handleCreateBug} className="bg-[#0F172A] border border-[#1E293B] rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden relative">
            
            <div className="bg-[#0F172A] p-4 border-b border-[#1E293B] flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 fill-cyan-400/20" /> File Enterprise Bug Ticket
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white text-xs font-bold font-mono cursor-pointer uppercase"
              >
                Close ESC
              </button>
            </div>

            {/* Scrollable form controls */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="new-bug-title" className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Summary Title</label>
                  <button
                    type="button"
                    onClick={triggerAITriage}
                    disabled={isTriagingAI || !newTitle.trim()}
                    className="text-[9px] bg-cyan-950 text-cyan-400 hover:bg-cyan-900 border border-cyan-800/40 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {isTriagingAI ? "Autotriage Running..." : "AI Auto-Triage Prediction"}
                  </button>
                </div>
                <input
                  id="new-bug-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="State leak inside unmounted PollingWidget causing browser freeze"
                  className="px-3 py-2 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-200 focus:outline-hidden focus:border-cyan-400"
                  required
                />
              </div>

              {/* AI Auto-triage Prediction Feedback Banner */}
              {aiTriageResult && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded flex flex-col gap-1 animate-fadeIn">
                  <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> AI Automated Triage Analysis
                  </span>
                  <div className="grid grid-cols-3 gap-3 font-mono text-[9px] text-slate-300 mt-1 pb-1 border-b border-cyan-950">
                    <div>SEVERITY: <strong className="text-orange-400">{aiTriageResult.severity?.toUpperCase()}</strong></div>
                    <div>PRIORITY: <strong className="text-cyan-400">{aiTriageResult.priority?.toUpperCase()}</strong></div>
                    <div>CATEGORY: <strong className="text-white">{aiTriageResult.category?.toUpperCase()}</strong></div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">
                    <strong>Root Cause Analysis:</strong> {aiTriageResult.rootCause}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-bug-desc" className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Operational Ticket Context</label>
                <textarea
                  id="new-bug-desc"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detailed description of active thread leaks or memory buffers..."
                  className="px-3 py-2 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-200 h-20 focus:outline-hidden focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Scoping and routing */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="new-bug-proj" className="text-[9px] text-slate-500 font-bold uppercase">Bind Project Code</label>
                  <select
                    id="new-bug-proj"
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="px-2 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300"
                    required
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="new-bug-sprint" className="text-[9px] text-slate-500 font-bold uppercase">Bind Sprint Cycle</label>
                  <select
                    id="new-bug-sprint"
                    value={newSprintId}
                    onChange={(e) => setNewSprintId(e.target.value)}
                    className="px-2 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300"
                  >
                    <option value="">No Active Sprint</option>
                    {sprints.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Severity / priority / Allocations */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="new-bug-severity" className="text-[9px] text-slate-500 font-bold uppercase">Severity Level</label>
                  <select
                    id="new-bug-severity"
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as Severity)}
                    className="px-2 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="new-bug-priority" className="text-[9px] text-slate-500 font-bold uppercase">Resolution Priority</label>
                  <select
                    id="new-bug-priority"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="px-2 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="new-bug-assignee" className="text-[9px] text-slate-500 font-bold uppercase">Allocated SRE</label>
                  <select
                    id="new-bug-assignee"
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="px-2 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Environmental parameters */}
              <div className="bg-[#0A0C10] border border-[#1E293B] p-4 rounded flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Environmental Profile Target</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="new-bug-env" className="text-[9px] text-slate-500 font-bold uppercase">Environment</label>
                    <select
                      id="new-bug-env"
                      value={newEnv}
                      onChange={(e) => setNewEnv(e.target.value)}
                      className="px-2 py-1 bg-[#0F172A] border border-[#1E293B] rounded text-xs text-slate-300"
                    >
                      <option value="Production">Production Instance</option>
                      <option value="Staging">Staging Sandpit</option>
                      <option value="Dev-Local">Dev Local Host</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="new-bug-browser" className="text-[9px] text-slate-500 font-bold uppercase">Client Browser</label>
                    <input
                      id="new-bug-browser"
                      type="text"
                      value={newBrowser}
                      onChange={(e) => setNewBrowser(e.target.value)}
                      placeholder="e.g. Chrome 125"
                      className="px-2 py-1 bg-[#0F172A] border border-[#1E293B] rounded text-xs text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Replication parameters */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-bug-steps" className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Steps To Reproduce (One Per Line)</label>
                <textarea
                  id="new-bug-steps"
                  value={newSteps}
                  onChange={(e) => setNewSteps(e.target.value)}
                  placeholder="1. Navigate to dashboard...&#10;2. Paste heavy script log..."
                  className="px-3 py-2 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-200 h-16 focus:outline-hidden focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Exception tracing */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="new-bug-logs" className="text-[9px] text-slate-500 font-bold uppercase">Console Traces</label>
                  <textarea
                    id="new-bug-logs"
                    value={newLogs}
                    onChange={(e) => setNewLogs(e.target.value)}
                    placeholder="Uncaught TypeError: Cannot read state of null..."
                    className="px-2.5 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-[10px] text-slate-300 h-16 focus:outline-hidden focus:border-cyan-400 resize-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="new-bug-traces" className="text-[9px] text-slate-500 font-bold uppercase">Fatal Stack Trace</label>
                  <textarea
                    id="new-bug-traces"
                    value={newTraces}
                    onChange={(e) => setNewTraces(e.target.value)}
                    placeholder="at dispatch (react-dom.js:12)"
                    className="px-2.5 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-[10px] text-slate-300 h-16 focus:outline-hidden focus:border-cyan-400 resize-none"
                  />
                </div>
              </div>

            </div>

            {/* Form footer */}
            <div className="p-4 bg-[#0F172A] border-t border-[#1E293B] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-xs font-bold font-mono text-slate-400 hover:text-white uppercase transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white text-black hover:bg-cyan-500 rounded text-xs font-bold uppercase tracking-widest transition"
              >
                Submit Ticket
              </button>
            </div>

          </form>
        </div>
      )}

      {msg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded font-mono flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </div>
      )}

    </div>
  );
}
