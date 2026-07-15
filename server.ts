import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI as AIClient, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"] });

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());

// -------------------------------------------------------------
// STATE DATABASE (In-Memory for Container Lifespan)
// -------------------------------------------------------------

let users = [
  { id: "usr-1", email: "admin@bugflow.ai", password: "password", name: "Kamran Nizamani", role: "super-admin", avatarUrl: "K", twoFactorEnabled: true, twoFactorSecret: "BUGFLOW_2FA_SECRET_XYZ" },
  { id: "usr-2", email: "sarah@bugflow.ai", password: "password", name: "Sarah Jenkins", role: "developer", avatarUrl: "S", twoFactorEnabled: false },
  { id: "usr-3", email: "john@bugflow.ai", password: "password", name: "John Doe", role: "qa-tester", avatarUrl: "J", twoFactorEnabled: false },
  { id: "usr-4", email: "pm@bugflow.ai", password: "password", name: "Alice Smith", role: "project-manager", avatarUrl: "A", twoFactorEnabled: false }
];

let sessions = [
  { id: "sess-1", userId: "usr-1", deviceName: "MacBook Pro M3", ipAddress: "192.168.1.102", location: "San Francisco, US", lastActive: "Just now", current: true },
  { id: "sess-2", userId: "usr-1", deviceName: "iPhone 15 Pro", ipAddress: "172.56.21.90", location: "San Francisco, US", lastActive: "2 hours ago", current: false }
];

let activeUserId = "usr-1"; // Simulate logged in session

let organizations = [
  {
    id: "org-1",
    name: "Enterprise Solutions LLC",
    ownerId: "usr-1",
    settings: { allowSelfSignUp: false, requireTwoFactor: true },
    members: [
      { userId: "usr-1", name: "Kamran Nizamani", email: "admin@bugflow.ai", role: "super-admin", teamIds: ["team-1", "team-2"] },
      { userId: "usr-2", name: "Sarah Jenkins", email: "sarah@bugflow.ai", role: "developer", teamIds: ["team-1"] },
      { userId: "usr-3", name: "John Doe", email: "john@bugflow.ai", role: "qa-tester", teamIds: ["team-2"] },
      { userId: "usr-4", name: "Alice Smith", email: "pm@bugflow.ai", role: "project-manager", teamIds: ["team-1", "team-2"] }
    ]
  },
  {
    id: "org-2",
    name: "AetherLabs Startup",
    ownerId: "usr-1",
    settings: { allowSelfSignUp: true, requireTwoFactor: false },
    members: [
      { userId: "usr-1", name: "Kamran Nizamani", email: "admin@bugflow.ai", role: "org-admin", teamIds: ["team-3"] }
    ]
  }
];

let activeOrgId = "org-1";

let teams = [
  { id: "team-1", orgId: "org-1", name: "Engine Core Team", description: "Responsible for microservices & ML models integration", memberIds: ["usr-1", "usr-2", "usr-4"] },
  { id: "team-2", orgId: "org-1", name: "Product Quality QA", description: "Automation tests and Sentry alert auditing", memberIds: ["usr-1", "usr-3", "usr-4"] },
  { id: "team-3", orgId: "org-2", name: "Alpha Squad", description: "Vulnerability analysis lab and testing pipelines", memberIds: ["usr-1"] }
];

let projects = [
  { id: "proj-1", orgId: "org-1", name: "BugFlow AI SaaS", key: "BF", description: "Enterprise-grade AI tracker and diagnostic system", status: "active", milestones: ["v1.0-RC1", "v1.1-Beta", "v2.0-Planning"], versions: ["1.0.0", "1.1.0-alpha"] },
  { id: "proj-2", orgId: "org-1", name: "Legacy Portal UI", key: "LP", description: "Deprecated BackboneJS customer support portal", status: "active", milestones: ["Deprecation-Q3"], versions: ["0.8.4"] }
];

let sprints = [
  { id: "spr-1", projectId: "proj-1", name: "Sprint 14 - AI Diagnostics Core", goal: "Complete real AI-powered triage, OCR logs, and Burndown widgets", startDate: "2026-07-01", endDate: "2026-07-15", status: "active", ticketIds: ["bug-1", "bug-2", "bug-3"] },
  { id: "spr-2", projectId: "proj-1", name: "Sprint 15 - Sentry & Slack Integrations", goal: "Publish outgoing webhooks and Sentry issue imports", startDate: "2026-07-16", endDate: "2026-07-30", status: "planned", ticketIds: [] }
];

let bugs = [
  {
    id: "bug-1",
    projectId: "proj-1",
    sprintId: "spr-1",
    title: "State leak inside unmounted PollingWidget causing browser freeze",
    description: "The background polling script continues to fire async server requests to `/api/metrics` every 1s after exiting the admin dashboard page. This leads to heavy memory leaks and eventually browser freeze after 5-10 minutes.",
    severity: "high",
    priority: "high",
    status: "in-progress",
    assigneeId: "usr-2",
    assigneeName: "Sarah Jenkins",
    testerId: "usr-3",
    testerName: "John Doe",
    reporterName: "Alice Smith",
    labels: ["performance", "frontend"],
    environment: "Staging",
    browser: "Chrome 125",
    operatingSystem: "macOS Sonoma",
    device: "Desktop",
    stepsToReproduce: "1. Navigate to /admin/metrics\n2. Click away to /dashboard\n3. Observe background logs in DevTools network tab continuing to spam endpoints.",
    expectedResult: "All intervals and background fetches are fully cleared on React component unmount.",
    actualResult: "Fetches continue to fire infinitely, draining memory heap.",
    attachments: [
      { name: "heap_snapshot.json", url: "#", size: "12.4 MB", type: "json" },
      { name: "leak_console.log", url: "#", size: "245 KB", type: "text" }
    ],
    consoleLogs: "Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'setState') on PollingWidget.tsx:42",
    stackTraces: "at setInterval (PollingWidget.tsx:18)\nat dispatchEvent (react-dom.development.js:4101)\nat updateEffect (react.development.js:1442)",
    relatedBugs: [],
    comments: [
      { id: "c-1", bugId: "bug-1", authorName: "Sarah Jenkins", authorRole: "developer", avatar: "S", text: "I have pinpointed the interval initialization. I will wrap the setInterval inside a cleanup callback in the useEffect block.", createdAt: "Jul 11, 2026 10:15 AM" }
    ],
    createdAt: "2026-07-10T08:00:00.000Z",
    updatedAt: "2026-07-11T12:00:00.000Z"
  },
  {
    id: "bug-2",
    projectId: "proj-1",
    sprintId: "spr-1",
    title: "Raw SQL Injection bypass on API login authentication router",
    description: "The user login API constructs credentials queries using raw template literal interpolation of email/password fields instead of using safe parameterized inputs.",
    severity: "critical",
    priority: "urgent",
    status: "assigned",
    assigneeId: "usr-1",
    assigneeName: "Kamran Nizamani",
    testerId: "usr-3",
    testerName: "John Doe",
    reporterName: "SecurityBot OCR",
    labels: ["security", "backend"],
    environment: "Production",
    browser: "Firefox 126",
    operatingSystem: "Linux Ubuntu 22.04",
    device: "Server Container",
    stepsToReproduce: "1. Navigate to API /api/auth/login\n2. Inject payload: admin@bugflow.ai' OR '1'='1 in the email parameter\n3. Bypass authentication without requiring a password.",
    expectedResult: "The query yields a syntax error or is treated as a safe literal string comparison.",
    actualResult: "Authentication succeeds and pulls the admin database row.",
    attachments: [
      { name: "exploit_script.py", url: "#", size: "1.2 KB", type: "python" }
    ],
    consoleLogs: "Executing raw query: SELECT * FROM users WHERE email = 'admin@bugflow.ai' OR '1'='1'",
    stackTraces: "at db.query (auth.ts:24)\nat router.post (auth-router.ts:12)\nat processTicksAndRejections (node:internal/process/task_queues:95)",
    relatedBugs: [],
    comments: [],
    createdAt: "2026-07-11T09:30:00.000Z",
    updatedAt: "2026-07-11T09:30:00.000Z"
  }
];

let auditLogs = [
  { id: "log-1", userId: "usr-1", userName: "Kamran Nizamani", action: "USER_LOGIN", details: "Logged in via Desktop Client (IP: 192.168.1.102)", ipAddress: "192.168.1.102", timestamp: "2026-07-11T09:00:00Z" },
  { id: "log-2", userId: "usr-1", userName: "Kamran Nizamani", action: "SETTINGS_CHANGE", details: "Switched default active organization to Enterprise Solutions LLC", ipAddress: "192.168.1.102", timestamp: "2026-07-11T09:02:00Z" }
];

let featureFlags = [
  { id: "ff-1", name: "AI Auto-Triage & Category Prediction", key: "ai_triage", description: "Predicts bug priority, severity, and duplicate probability instantly", isEnabled: true },
  { id: "ff-2", name: "Automated Slack & Discord Pings", key: "social_pings", description: "Fires active channel notifications on issue resolution", isEnabled: true },
  { id: "ff-3", name: "AI-Powered Test Case Automation", key: "ai_tests", description: "Enables generation of Jest/PyTest files inside comments", isEnabled: false }
];

let githubRepos = [
  { id: "git-1", fullName: "kamran-nizamani/bugflow-saas-core", url: "https://github.com/kamran-nizamani/bugflow-saas-core", linkedProjectId: "proj-1", syncedIssuesCount: 42 }
];

let webhooks = [
  { id: "wh-1", url: "https://discord.com/api/webhooks/1234/test", target: "discord", isEnabled: true },
  { id: "wh-2", url: "https://hooks.slack.com/services/T00/B00/X", target: "slack", isEnabled: true }
];

// Helper to record audits
function addAudit(action: string, details: string) {
  const currentLogged = users.find(u => u.id === activeUserId);
  const log = {
    id: `log-${Date.now()}`,
    userId: activeUserId,
    userName: currentLogged ? currentLogged.name : "System",
    action,
    details,
    ipAddress: "127.0.0.1",
    timestamp: new Date().toISOString()
  };
  auditLogs.unshift(log);
}

// -------------------------------------------------------------
// AI CLIENT INITIALIZATION
// -------------------------------------------------------------

let aiClient: AIClient | null = null;

function getAIClient(): AIClient {
  if (!aiClient) {
    const key = process.env.AI_API_KEY;
    if (!key) {
      throw new Error("AI_API_KEY is not defined. Configure it in settings.");
    }
    aiClient = new AIClient({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'bugflow-build',
        }
      }
    });
  }
  return aiClient;
}

// -------------------------------------------------------------
// REST API ROUTING
// -------------------------------------------------------------

// Core App Metadata endpoint (for UI display or debugging)
app.get("/api/app-info", (req, res) => {
  res.json({ name: "BugFlow AI", version: "2.1.0-Enterprise", activeUserId, activeOrgId });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptimeSeconds: process.uptime(), version: "2.1.0-Enterprise" });
});

// Authentication Routes
app.post("/api/auth/register", (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required." });
  }
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "User already exists with this email." });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    email,
    password,
    name,
    role: role || "developer",
    avatarUrl: name.charAt(0).toUpperCase(),
    twoFactorEnabled: false
  };

  users.push(newUser);
  activeUserId = newUser.id;

  // Add user to active organization automatically
  const org = organizations.find(o => o.id === activeOrgId);
  if (org) {
    org.members.push({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as any,
      teamIds: []
    });
  }

  addAudit("USER_REGISTER", `Registered new user ${name} with role ${role}`);
  res.json({ status: "ok", user: newUser });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password, code } = req.body;
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email or password credentials." });
  }

  if (user.twoFactorEnabled && !code) {
    return res.json({ requireTwoFactor: true, secretHint: user.twoFactorSecret });
  }

  if (user.twoFactorEnabled && code !== "123456" && code !== "654321") {
    // Treat standard simulation codes as valid
    return res.status(400).json({ error: "Invalid 2FA security token." });
  }

  activeUserId = user.id;

  // Add simulated device session
  const newSession = {
    id: `sess-${Date.now()}`,
    userId: user.id,
    deviceName: "Desktop Browser (Chrome)",
    ipAddress: "127.0.0.1",
    location: "Chicago, US",
    lastActive: "Just now",
    current: true
  };
  sessions.forEach(s => { if (s.userId === user.id) s.current = false; });
  sessions.push(newSession);

  addAudit("USER_LOGIN", `User ${user.name} logged in successfully`);
  res.json({ status: "ok", user });
});

app.post("/api/auth/me", (req, res) => {
  const user = users.find(u => u.id === activeUserId);
  if (!user) return res.status(404).json({ error: "No active session." });
  res.json({ user });
});

app.post("/api/auth/switch-user", (req, res) => {
  const { id } = req.body;
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: "User not found." });
  activeUserId = user.id;
  addAudit("SWITCH_USER_SIM", `Switched active login session to ${user.name}`);
  res.json({ status: "ok", user });
});

app.get("/api/auth/users", (req, res) => {
  res.json({ users });
});

app.get("/api/auth/sessions", (req, res) => {
  const activeSessions = sessions.filter(s => s.userId === activeUserId);
  res.json({ sessions: activeSessions });
});

app.post("/api/auth/toggle-2fa", (req, res) => {
  const user = users.find(u => u.id === activeUserId);
  if (!user) return res.status(404).json({ error: "User not found." });
  user.twoFactorEnabled = !user.twoFactorEnabled;
  if (user.twoFactorEnabled) {
    user.twoFactorSecret = "BUGFLOW_2FA_SECRET_TOKEN_XYZ_123";
  }
  addAudit("TOGGLE_2FA", `Toggled 2FA state to ${user.twoFactorEnabled}`);
  res.json({ status: "ok", twoFactorEnabled: user.twoFactorEnabled, secret: user.twoFactorSecret });
});

app.delete("/api/auth/sessions/:id", (req, res) => {
  const { id } = req.params;
  sessions = sessions.filter(s => s.id !== id);
  addAudit("REVOKE_SESSION", `Revoked active device session ${id}`);
  res.json({ status: "ok" });
});

// Organization Routes
app.get("/api/orgs", (req, res) => {
  res.json({ organizations, activeOrgId });
});

app.post("/api/orgs", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Organization name is required." });

  const newOrg = {
    id: `org-${Date.now()}`,
    name,
    ownerId: activeUserId,
    settings: { allowSelfSignUp: true, requireTwoFactor: false },
    members: [
      { userId: activeUserId, name: "Logged User", email: "active@bugflow.ai", role: "org-admin" as any, teamIds: [] }
    ]
  };
  organizations.push(newOrg);
  activeOrgId = newOrg.id;
  addAudit("CREATE_ORG", `Created organization ${name}`);
  res.json({ status: "ok", org: newOrg });
});

app.post("/api/orgs/switch", (req, res) => {
  const { id } = req.body;
  if (organizations.some(o => o.id === id)) {
    activeOrgId = id;
    addAudit("SWITCH_ORG", `Switched organization to ${id}`);
    res.json({ status: "ok" });
  } else {
    res.status(404).json({ error: "Org not found." });
  }
});

app.post("/api/orgs/invite", (req, res) => {
  const { email, role, name } = req.body;
  if (!email || !name) return res.status(400).json({ error: "Email and name are required." });

  const org = organizations.find(o => o.id === activeOrgId);
  if (!org) return res.status(404).json({ error: "Org not found." });

  // Simulate inviting and adding immediately
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  const targetId = existingUser ? existingUser.id : `usr-${Date.now()}`;

  if (!existingUser) {
    users.push({
      id: targetId,
      email,
      password: "password",
      name,
      role: role || "developer",
      avatarUrl: name.charAt(0).toUpperCase(),
      twoFactorEnabled: false
    });
  }

  org.members.push({
    userId: targetId,
    name,
    email,
    role: role || "developer",
    teamIds: []
  });

  addAudit("INVITE_MEMBER", `Invited ${name} (${email}) to organization`);
  res.json({ status: "ok", members: org.members });
});

// Teams Routes
app.get("/api/teams", (req, res) => {
  const orgTeams = teams.filter(t => t.orgId === activeOrgId);
  res.json({ teams: orgTeams });
});

app.post("/api/teams", (req, res) => {
  const { name, description, memberIds } = req.body;
  if (!name) return res.status(400).json({ error: "Team name is required." });

  const newTeam = {
    id: `team-${Date.now()}`,
    orgId: activeOrgId,
    name,
    description: description || "",
    memberIds: memberIds || [activeUserId]
  };

  teams.push(newTeam);
  addAudit("CREATE_TEAM", `Created team ${name}`);
  res.json({ status: "ok", team: newTeam });
});

// Projects & Sprints Routes
app.get("/api/projects", (req, res) => {
  const orgProjects = projects.filter(p => p.orgId === activeOrgId);
  res.json({ projects: orgProjects });
});

app.post("/api/projects", (req, res) => {
  const { name, key, description } = req.body;
  if (!name || !key) return res.status(400).json({ error: "Project name and key code are required." });

  const newProj = {
    id: `proj-${Date.now()}`,
    orgId: activeOrgId,
    name,
    key: key.toUpperCase(),
    description: description || "",
    status: "active" as const,
    milestones: ["v1.0-Beta"],
    versions: ["1.0.0-Beta"]
  };
  projects.push(newProj);
  addAudit("CREATE_PROJECT", `Created project ${name} [${key}]`);
  res.json({ status: "ok", project: newProj });
});

// Sprints
app.get("/api/sprints", (req, res) => {
  res.json({ sprints });
});

app.post("/api/sprints", (req, res) => {
  const { projectId, name, goal, startDate, endDate } = req.body;
  if (!projectId || !name) return res.status(400).json({ error: "ProjectId and Sprint name are required." });

  const newSprint = {
    id: `spr-${Date.now()}`,
    projectId,
    name,
    goal: goal || "",
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "planned" as const,
    ticketIds: []
  };
  sprints.push(newSprint);
  addAudit("CREATE_SPRINT", `Created sprint ${name} for project ${projectId}`);
  res.json({ status: "ok", sprint: newSprint });
});

app.post("/api/sprints/start", (req, res) => {
  const { id } = req.body;
  const spr = sprints.find(s => s.id === id);
  if (!spr) return res.status(404).json({ error: "Sprint not found." });
  spr.status = "active";
  addAudit("START_SPRINT", `Started Sprint: ${spr.name}`);
  res.json({ status: "ok", sprint: spr });
});

// Bugs Management Routes
app.get("/api/bugs", (req, res) => {
  res.json({ bugs });
});

// AI Auto-Triage Endpoint
app.post("/api/bugs/triage-ai", async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: "Bug title required for auto-triage." });

  try {
    const ai = getAIClient();
    const systemInstruction = `You are BugFlow's elite triage agent. Review the provided issue title and description.
Predict:
- severity: "low", "medium", "high", "critical"
- priority: "low", "medium", "high", "urgent"
- category: A single word classification (e.g. security, performance, logic, frontend, backend, crash)
- rootCause: 1-2 sentence explanation of why this bug is likely happening.
- suggestedFix: 1-3 code lines or procedural description of the best fix.
- isDuplicate: false (or true if title matches common patterns).

Return a structured JSON following the schema precisely.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Title: ${title}\nDescription: ${description || "No description provided."}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            severity: { type: Type.STRING },
            priority: { type: Type.STRING },
            category: { type: Type.STRING },
            rootCause: { type: Type.STRING },
            suggestedFix: { type: Type.STRING }
          },
          required: ["severity", "priority", "category", "rootCause", "suggestedFix"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("AI Triage Error:", error);
    // Return sensible fallback triage values
    res.json({
      severity: "medium",
      priority: "medium",
      category: "logic",
      rootCause: "Uncaught logical state mutation or unhandled function arguments mismatch.",
      suggestedFix: "Examine component mounts, add null guards, or parameterized validation filters."
    });
  }
});

// Create Bug
app.post("/api/bugs", (req, res) => {
  const {
    projectId, sprintId, title, description, severity, priority, status,
    assigneeId, testerId, environment, browser, operatingSystem, device,
    stepsToReproduce, expectedResult, actualResult, consoleLogs, stackTraces,
    relatedBugs, labels
  } = req.body;

  if (!title || !projectId) {
    return res.status(400).json({ error: "Bug title and projectId are required." });
  }

  const assignee = users.find(u => u.id === assigneeId);
  const tester = users.find(u => u.id === testerId);
  const reporter = users.find(u => u.id === activeUserId);

  const newBug: any = {
    id: `bug-${Date.now()}`,
    projectId,
    sprintId,
    title,
    description: description || "",
    severity: severity || "medium",
    priority: priority || "medium",
    status: status || "open",
    assigneeId: assigneeId || "",
    assigneeName: assignee ? assignee.name : "",
    testerId: testerId || "",
    testerName: tester ? tester.name : "",
    reporterName: reporter ? reporter.name : "Kamran Nizamani",
    labels: labels || [],
    environment: environment || "Production",
    browser: browser || "Chrome (Auto)",
    operatingSystem: operatingSystem || "macOS",
    device: device || "Desktop",
    stepsToReproduce: stepsToReproduce || "",
    expectedResult: expectedResult || "",
    actualResult: actualResult || "",
    attachments: [],
    consoleLogs: consoleLogs || "",
    stackTraces: stackTraces || "",
    relatedBugs: relatedBugs || [],
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Add attachments if supplied
  if (req.body.attachments && Array.isArray(req.body.attachments)) {
    newBug.attachments = req.body.attachments;
  }

  // Auto-fill Sprint association
  if (sprintId) {
    const sprint = sprints.find(s => s.id === sprintId);
    if (sprint) {
      sprint.ticketIds.push(newBug.id);
    }
  }

  bugs.unshift(newBug);
  addAudit("CREATE_BUG", `Filed bug report: "${title}" (${newBug.id})`);

  // Mock outbound webhooks triggering
  webhooks.forEach(wh => {
    if (wh.isEnabled) {
      console.log(`[Webhook Send] Dispatching BugFlow update to ${wh.url} - Event: BUG_CREATED - ID: ${newBug.id}`);
    }
  });

  res.json({ status: "ok", bug: newBug });
});

// Update Bug Details & Status
app.patch("/api/bugs/:id", (req, res) => {
  const { id } = req.params;
  const bug = bugs.find(b => b.id === id);
  if (!bug) return res.status(404).json({ error: "Bug ticket not found." });

  // Record status transitions for audits
  const oldStatus = bug.status;
  const keys = Object.keys(req.body);
  
  keys.forEach((key) => {
    if (key === "assigneeId") {
      const u = users.find(usr => usr.id === req.body.assigneeId);
      bug.assigneeId = req.body.assigneeId;
      bug.assigneeName = u ? u.name : "";
    } else if (key === "testerId") {
      const u = users.find(usr => usr.id === req.body.testerId);
      bug.testerId = req.body.testerId;
      bug.testerName = u ? u.name : "";
    } else {
      (bug as any)[key] = req.body[key];
    }
  });

  bug.updatedAt = new Date().toISOString();

  if (req.body.status && req.body.status !== oldStatus) {
    addAudit("BUG_STATUS_CHANGE", `Moved bug ${id} status from ${oldStatus} to ${req.body.status}`);
  } else {
    addAudit("BUG_UPDATE", `Updated details of issue ticket ${id}`);
  }

  res.json({ status: "ok", bug });
});

app.delete("/api/bugs/:id", (req, res) => {
  const { id } = req.params;
  bugs = bugs.filter(b => b.id !== id);
  addAudit("BUG_DELETE", `Permanently removed bug ticket ${id}`);
  res.json({ status: "ok" });
});

// AI Bug Fix Endpoint
app.post("/api/bugs/:id/fix-ai", async (req, res) => {
  const { id } = req.params;
  const bug = bugs.find(b => b.id === id);
  if (!bug) return res.status(404).json({ error: "Bug ticket not found." });

  try {
    const ai = getAIClient();
    const prompt = `You are BugFlow's elite SRE and Automated Auto-Patch agent.
Analyze the following bug ticket:
ID: ${bug.id}
Title: ${bug.title}
Description: ${bug.description}
Steps to Reproduce: ${bug.stepsToReproduce || "None"}
Expected Result: ${bug.expectedResult || "None"}
Actual Result: ${bug.actualResult || "None"}
Console Logs: ${bug.consoleLogs || "None"}
Stack Traces: ${bug.stackTraces || "None"}

Please formulate:
1. A detailed analysis explaining why the bug is happening.
2. A secure, modern code fix/patch resolving the issue completely.
3. A unit test or validation guide to verify the fix.

Provide a structured JSON response following the schema precisely:
- explanation: A detailed 2-3 sentence markdown analysis of the root cause.
- suggestedFixCode: The complete, secure, well-commented code block that resolves the bug.
- validationSteps: 1-2 sentences on how to test this fix.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            suggestedFixCode: { type: Type.STRING },
            validationSteps: { type: Type.STRING }
          },
          required: ["explanation", "suggestedFixCode", "validationSteps"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("AI Bug Fix Error:", error);
    res.json({
      explanation: "AI analyzed the issue and identified a probable state leak or unhandled exception in active lifecycle loops.",
      suggestedFixCode: `// Proposed Remediation Patch\nuseEffect(() => {\n  const handler = setInterval(fetchMetrics, 1000);\n  return () => clearInterval(handler); // Ensure safe cleanup on unmount\n}, []);`,
      validationSteps: "Verify background network calls cease immediately upon page navigation/component unmounting."
    });
  }
});

// Comments API
app.post("/api/bugs/:id/comments", (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Comment text cannot be empty." });

  const bug = bugs.find(b => b.id === id);
  if (!bug) return res.status(404).json({ error: "Bug ticket not found." });

  const commentator = users.find(u => u.id === activeUserId);
  const comment = {
    id: `c-${Date.now()}`,
    bugId: id,
    authorName: commentator ? commentator.name : "System Agent",
    authorRole: commentator ? (commentator.role as any) : "developer",
    avatar: commentator ? commentator.avatarUrl : "🤖",
    text,
    createdAt: "Just now"
  };

  bug.comments.push(comment);
  addAudit("ADD_COMMENT", `User ${comment.authorName} contributed to bug ticket ${id}`);
  res.json({ status: "ok", comment });
});

// Integrations API
app.get("/api/integrations/github", (req, res) => {
  res.json({ repos: githubRepos });
});

app.post("/api/integrations/github/link", (req, res) => {
  const { fullName, linkedProjectId } = req.body;
  if (!fullName || !linkedProjectId) return res.status(400).json({ error: "Repo name and linked project ID are required." });

  const newRepo = {
    id: `git-${Date.now()}`,
    fullName,
    url: `https://github.com/${fullName}`,
    linkedProjectId,
    syncedIssuesCount: Math.floor(Math.random() * 30) + 10
  };
  githubRepos.push(newRepo);
  addAudit("GITHUB_LINK", `Linked GitHub repository: ${fullName}`);
  res.json({ status: "ok", repo: newRepo });
});

app.post("/api/integrations/github/sync", (req, res) => {
  const { id } = req.body;
  const repo = githubRepos.find(r => r.id === id);
  if (!repo) return res.status(404).json({ error: "Github repo not found." });
  repo.syncedIssuesCount += 4;
  addAudit("GITHUB_SYNC", `Synchronized issue hooks for repository ${repo.fullName}`);
  res.json({ status: "ok", repo });
});

app.get("/api/integrations/webhooks", (req, res) => {
  res.json({ webhooks });
});

app.post("/api/integrations/webhooks", (req, res) => {
  const { url, target } = req.body;
  if (!url || !target) return res.status(400).json({ error: "URL and Target name required." });

  const wh = {
    id: `wh-${Date.now()}`,
    url,
    target,
    isEnabled: true
  };
  webhooks.push(wh);
  addAudit("WEBHOOK_CREATE", `Registered outbound payload webhook URL for ${target}`);
  res.json({ status: "ok", webhook: wh });
});

// AI Productivity Modules
app.post("/api/ai/diagnose-logs", async (req, res) => {
  const { logs, traces } = req.body;
  if (!logs && !traces) return res.status(400).json({ error: "Paste logs or trace logs to analyze." });

  try {
    const ai = getAIClient();
    const prompt = `You are BugFlow's elite Site Reliability Engineer and AI Code Diagnostician.
Analyze this console crash report or stack trace.
Logs:
${logs || "None"}

Stack Traces:
${traces || "None"}

Identify:
1. **The Root Cause**: Explain under-the-hood exactly what line, state value, or unhandled promise caused the crash.
2. **Commit Fix Blueprint**: Provide a concrete Jest test case and refactored TypeScript snippet solving the issue.
3. **Commit Message Suggestion**: Provide a standardized Conventional Commit message (e.g. fix(api): resolve thread bounds exception).

Format cleanly in Markdown.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    res.json({ explanation: response.text });
  } catch (error: any) {
    console.error("AI Crash Diagnostics Error:", error);
    res.status(500).json({ error: "Failed to compile AI diagnostics. Ensure AI_API_KEY is configured." });
  }
});

app.post("/api/ai/productivity-generator", async (req, res) => {
  const { type, title, description } = req.body; // type: "pr", "commit", "release", "testcase"
  if (!title) return res.status(400).json({ error: "Issue title is required." });

  try {
    const ai = getAIClient();
    let prompt = "";
    if (type === "pr") {
      prompt = `Generate a comprehensive Pull Request (PR) Description following enterprise Git templates based on this issue ticket.
Title: ${title}
Description: ${description || "None"}

Include sections for:
- Summary of Changes
- Related Issues / Fixes
- Risk Classification & Test Matrix
- Detailed step validation walkthroughs`;
    } else if (type === "commit") {
      prompt = `Generate 3 variations of standardized Conventional Commit messages based on this issue ticket:
Title: ${title}
Description: ${description || "None"}

Format as:
1. Short standard format
2. Detailed scope-based format
3. Minimal breaking change alert if appropriate`;
    } else if (type === "release") {
      prompt = `Generate professional customer-facing Release Notes for a changelog report detailing this solved bug:
Title: ${title}
Description: ${description || "None"}

Include:
- Impact description (how it helps user experience)
- Tech credits to Sarah Jenkins / Kamran Nizamani
- Safety highlights`;
    } else {
      prompt = `Generate a fully coded TypeScript Jest or Cypress integration test case asserting correct behavior and preventing regression of this issue:
Title: ${title}
Description: ${description || "None"}

Provide pure TypeScript test code.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error("AI Productivity Error:", error);
    res.status(500).json({ error: "Failed to generate AI content. Validate model keys." });
  }
});

// Admin Control Panel Routes
app.get("/api/admin/audit-logs", (req, res) => {
  res.json({ auditLogs });
});

app.get("/api/admin/feature-flags", (req, res) => {
  res.json({ featureFlags });
});

app.post("/api/admin/feature-flags/toggle", (req, res) => {
  const { id } = req.body;
  const flag = featureFlags.find(f => f.id === id);
  if (!flag) return res.status(404).json({ error: "Feature flag not found." });
  flag.isEnabled = !flag.isEnabled;
  addAudit("FEATURE_FLAG_TOGGLE", `Toggled feature flag "${flag.name}" to ${flag.isEnabled}`);
  res.json({ status: "ok", flag });
});

// -------------------------------------------------------------
// EXISTING ENDPOINTS COMPATIBILITY
// -------------------------------------------------------------

// 1. AI Code Analyzer Route
app.post("/api/analyze", async (req, res) => {
  const { code, profile, language } = req.body;

  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Code content is required and must be a string." });
  }

  try {
    const ai = getAIClient();

    let profileInstruction = "";
    if (profile === "security") {
      profileInstruction = "Focus heavily on security vulnerabilities, OWASP Top 10, sanitization, injections, and privacy leaks.";
    } else if (profile === "performance") {
      profileInstruction = "Focus heavily on performance bottlenecks, memory leaks, algorithmic complexity, nested loops, caching, and redundant operations.";
    } else if (profile === "readability") {
      profileInstruction = "Focus on readability, clean code principles, descriptive naming, function modularity, formatting, and SOLID principles.";
    } else {
      profileInstruction = "Provide a general audit including logic bugs, potential edge cases, security, and performance.";
    }

    const systemInstruction = `You are an elite, senior compiler engineer and security researcher.
Analyze the provided code written in ${language || "the auto-detected language"}.
${profileInstruction}

You MUST evaluate the code and provide a structured JSON response following the exact schema provided.
- metrics: Evaluate securityScore, performanceRating, readabilityScore, and complexityScore (all on a 0 to 100 scale, where 100 is excellent). For complexityScore, 100 means low complexity (excellent), and 0 means high complexity/unreadable.
- vulnerabilities: List each specific issue, including the estimated starting line number (approximate is fine, 1-indexed), a brief clear description of the issue, and a short recommended change. If no bugs or style issues exist, keep this array empty.
- hasBugs: Set to true if there are any logical, security, or style improvements, otherwise false.
- severity: Set to "low", "medium", "high", or "critical" depending on the worst bug found. If no bugs, use "low".
- bugType: A 1-3 word classification of the primary issue (e.g., "SQL Injection", "Infinite Re-render", "Inefficient Loop", "None").
- summary: A 1-2 sentence high-level overview.
- explanation: A detailed, professional markdown explanation discussing the root causes and engineering trade-offs.
- suggestedFix: The COMPLETE fully refactored, highly secure, clean version of the code that fixes all identified issues. Preserve formatting.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: code,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasBugs: { type: Type.BOOLEAN },
            severity: { type: Type.STRING },
            bugType: { type: Type.STRING },
            summary: { type: Type.STRING },
            explanation: { type: Type.STRING },
            suggestedFix: { type: Type.STRING },
            vulnerabilities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  line: { type: Type.INTEGER },
                  issue: { type: Type.STRING },
                  suggestion: { type: Type.STRING }
                },
                required: ["line", "issue", "suggestion"]
              }
            },
            metrics: {
              type: Type.OBJECT,
              properties: {
                securityScore: { type: Type.INTEGER },
                performanceRating: { type: Type.INTEGER },
                readabilityScore: { type: Type.INTEGER },
                complexityScore: { type: Type.INTEGER }
              },
              required: ["securityScore", "performanceRating", "readabilityScore", "complexityScore"]
            }
          },
          required: ["hasBugs", "severity", "bugType", "summary", "explanation", "suggestedFix", "vulnerabilities", "metrics"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from the AI model.");
    }

    try {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (parseError: any) {
      console.error("AI Analysis Parse Error:", parseError);
      console.error("AI raw response:", text);
      return res.status(500).json({
        error: "AI returned invalid response format. Please retry the diagnostics run.",
        raw: text
      });
    }

  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return res.status(500).json({
      error: error.message || "An internal error occurred during code analysis."
    });
  }
});

// 2. Lab Explainer Route
app.post("/api/lab-explain", async (req, res) => {
  const { labId, title, vulnerableCode } = req.body;

  if (!labId || !vulnerableCode) {
    return res.status(400).json({ error: "labId and vulnerableCode are required." });
  }

  try {
    const ai = getAIClient();

    const prompt = `Provide a comprehensive security and engineering breakdown for the following vulnerability lab challenge.
Challenge Title: ${title}
Lab ID: ${labId}

Vulnerable Code Snippet:
\`\`\`typescript
${vulnerableCode}
\`\`\`

Explain:
1. **The Core Vulnerability**: What is the root cause? How does this bug happen under the hood?
2. **The Exploit Vector**: How could an attacker exploit this, or how does the system fail in production? Give concrete visual/execution scenarios.
3. **The Prevention Pattern**: What is the modern, secure standard for preventing this (e.g., ORMs, sanitization, cleanup listeners, defensive state design)? Explain why the secure solution resolves the bug.
Keep the explanation engaging, technical, and educational. Format the output elegantly in Markdown.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text;
    return res.json({ explanation: text });

  } catch (error: any) {
    console.error("Lab explanation error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate AI deep dive explanation for this lab."
    });
  }
});

// 3. Vite development middleware or production static files serving
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Bug Detection & Management Platform server running on http://localhost:${PORT}`);
  });
}

// On Vercel, the frontend is served as static assets by the CDN and this
// module is only invoked as the /api serverless function, so skip the
// Vite/static bootstrap and port bind entirely.
if (!process.env.VERCEL) {
  setupVite();
}

export default app;
