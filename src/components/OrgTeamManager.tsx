import React, { useState, useEffect } from "react";
import { Building2, UserPlus, Users, Settings, FolderGit, Check, Shield } from "lucide-react";
import { Organization, Team } from "../types";

export default function OrgTeamManager() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);

  // Invite member form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("developer");

  // Create organization form
  const [newOrgName, setNewOrgName] = useState("");

  // Create team form
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");

  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchOrgs();
    fetchTeams();
  }, [activeOrgId]);

  const fetchOrgs = async () => {
    try {
      const res = await fetch("/api/orgs");
      const data = await res.json();
      setOrgs(data.organizations);
      setActiveOrgId(data.activeOrgId);
    } catch {}
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams");
      const data = await res.json();
      setTeams(data.teams);
    } catch {}
  };

  const handleSwitchOrg = async (orgId: string) => {
    try {
      const res = await fetch("/api/orgs/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orgId })
      });
      if (res.ok) {
        setActiveOrgId(orgId);
        fetchOrgs();
        setMsg("Switched current active organization workspace.");
      }
    } catch {}
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    try {
      const res = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName })
      });
      if (res.ok) {
        setNewOrgName("");
        fetchOrgs();
        setMsg("New enterprise organization tenant created successfully.");
      }
    } catch {}
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;
    try {
      const res = await fetch("/api/orgs/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole })
      });
      if (res.ok) {
        setInviteEmail("");
        setInviteName("");
        fetchOrgs();
        setMsg(`Invitation and automatic user account created for ${inviteName}!`);
      }
    } catch {}
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName, description: newTeamDesc })
      });
      if (res.ok) {
        setNewTeamName("");
        setNewTeamDesc("");
        fetchTeams();
        setMsg(`Development team "${newTeamName}" structured under current workspace.`);
      }
    } catch {}
  };

  const activeOrg = orgs.find(o => o.id === activeOrgId) || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 bg-[#0A0C10]">
      
      {/* Organizations List / Creator */}
      <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] rounded p-5 flex flex-col h-[650px] justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-[#1E293B] pb-3">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Enterprise Workspace Tenants</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Construct and partition multiple organization nodes. Switch profiles instantly to reload teams, repositories, projects, and sprint goals.
          </p>

          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[300px] mb-4 pr-1">
            {orgs.map(org => (
              <button
                key={org.id}
                onClick={() => handleSwitchOrg(org.id)}
                className={`text-left p-3 rounded border flex items-center justify-between transition cursor-pointer ${
                  org.id === activeOrgId
                    ? "bg-[#1E293B] border-cyan-500 text-cyan-400"
                    : "bg-[#0A0C10] border-[#1E293B] text-slate-300 hover:text-white"
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold">{org.name}</h4>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{org.members.length} Authorized Members</span>
                </div>
                {org.id === activeOrgId && <Check className="w-4 h-4 text-cyan-400" />}
              </button>
            ))}
          </div>

          {/* Create Org Form */}
          <form onSubmit={handleCreateOrg} className="border-t border-[#1E293B]/60 pt-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Deploy New Org Node</span>
            <div className="flex gap-2">
              <input
                id="new-org-name"
                type="text"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="e.g. Acme Corp Labs"
                className="flex-1 px-2.5 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-200 focus:outline-hidden focus:border-cyan-400"
                required
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-white text-black hover:bg-cyan-500 font-bold uppercase rounded text-[10px] tracking-wider transition cursor-pointer"
              >
                Provision
              </button>
            </div>
          </form>
        </div>

        <div className="text-[9px] font-mono text-slate-600 uppercase bg-[#0A0C10] border border-[#1E293B] p-2.5 rounded">
          ACTIVE_ORG_ID: {activeOrgId}
        </div>
      </div>

      {/* Organization Members list / Invitor */}
      <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] rounded p-5 flex flex-col h-[650px] justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-[#1E293B] pb-3">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Member Roles & Authorizations</h3>
          </div>

          {activeOrg ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-1">
                {activeOrg.members.map((member, idx) => (
                  <div key={idx} className="bg-[#0A0C10] border border-[#1E293B] p-2.5 rounded flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{member.name}</h4>
                      <span className="text-[10px] text-slate-500 block font-mono">{member.email}</span>
                    </div>
                    <span className="text-[9px] font-bold bg-[#1E293B] border border-slate-700/60 px-1.5 py-0.5 rounded text-cyan-400 uppercase tracking-wide">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>

              {/* Invite member form */}
              <form onSubmit={handleInviteMember} className="border-t border-[#1E293B]/60 pt-4 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block"><UserPlus className="w-3.5 h-3.5 inline mr-1 text-cyan-400" /> Invite Collaborator</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="invite-name" className="text-[9px] text-slate-500 font-bold uppercase">Name</label>
                    <input
                      id="invite-name"
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="Jane Smith"
                      className="px-2 py-1 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-200 focus:outline-hidden focus:border-cyan-400"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="invite-role" className="text-[9px] text-slate-500 font-bold uppercase">Work Role</label>
                    <select
                      id="invite-role"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="px-2 py-1 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300 focus:outline-hidden"
                    >
                      <option value="developer">Developer</option>
                      <option value="qa-tester">QA Tester</option>
                      <option value="project-manager">Project Manager</option>
                      <option value="reporter">Reporter</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="invite-email" className="text-[9px] text-slate-500 font-bold uppercase">Email</label>
                  <input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="jane@company.ai"
                    className="px-2.5 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-200 focus:outline-hidden focus:border-cyan-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 bg-white text-black hover:bg-cyan-500 font-bold uppercase rounded text-[10px] tracking-wider transition cursor-pointer"
                >
                  Send Org Invitation
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center p-8 text-slate-500 font-mono text-xs">
              WORKSPACE_UNSELECTED
            </div>
          )}
        </div>

        {msg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] p-2 rounded font-mono animate-fadeIn">
            {msg}
          </div>
        )}
      </div>

      {/* Teams list & Creator */}
      <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] rounded p-5 flex flex-col h-[650px] justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-[#1E293B] pb-3">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Functional Development Teams</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Group developers, QA testing analysts, and product leads under dedicated cross-functional teams.
          </p>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] mb-4 pr-1">
            {teams.map(team => (
              <div key={team.id} className="bg-[#0A0C10] border border-[#1E293B] p-3 rounded">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  {team.name}
                  <span className="text-[9px] text-slate-500 font-mono font-normal">Team ID: {team.id}</span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">{team.description}</p>
                <div className="mt-2 border-t border-[#1E293B]/40 pt-1.5 flex items-center justify-between text-[9px] text-slate-500">
                  <span className="font-mono uppercase font-semibold">Active Members: {team.memberIds.length}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Create Team Form */}
          <form onSubmit={handleCreateTeam} className="border-t border-[#1E293B]/60 pt-4 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Assemble Team Group</span>
            <div className="flex flex-col gap-1.5">
              <input
                id="new-team-name"
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Frontend Core, CyberSec"
                className="px-2.5 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-200 focus:outline-hidden focus:border-cyan-400"
                required
              />
              <input
                id="new-team-desc"
                type="text"
                value={newTeamDesc}
                onChange={(e) => setNewTeamDesc(e.target.value)}
                placeholder="Responsible for UI/UX testing"
                className="px-2.5 py-1.5 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-200 focus:outline-hidden focus:border-cyan-400"
              />
              <button
                type="submit"
                className="w-full py-1.5 bg-white text-black hover:bg-cyan-500 font-bold uppercase rounded text-[10px] tracking-wider transition cursor-pointer"
              >
                Assemble Team
              </button>
            </div>
          </form>
        </div>

        <div className="text-[9px] font-mono text-slate-600 bg-[#0A0C10] border border-[#1E293B] p-2.5 rounded uppercase">
          RBAC Permissions: Active
        </div>
      </div>

    </div>
  );
}
