export type Severity = "low" | "medium" | "high" | "critical";
export type BugStatus = "open" | "assigned" | "in-progress" | "ready-for-testing" | "testing" | "resolved" | "closed" | "duplicate" | "rejected" | "reopened";
export type UserRole = "super-admin" | "org-admin" | "project-manager" | "developer" | "qa-tester" | "reporter" | "guest";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
}

export interface UserSession {
  id: string;
  deviceName: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  members: OrganizationMember[];
  settings: {
    allowSelfSignUp: boolean;
    requireTwoFactor: boolean;
  };
}

export interface OrganizationMember {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  teamIds: string[];
}

export interface Team {
  id: string;
  orgId: string;
  name: string;
  description: string;
  memberIds: string[];
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  key: string;
  description: string;
  status: "active" | "archived";
  milestones: string[];
  versions: string[];
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "completed";
  ticketIds: string[];
}

export interface BugComment {
  id: string;
  bugId: string;
  authorName: string;
  authorRole: UserRole;
  avatar: string;
  text: string;
  createdAt: string;
  isEdited?: boolean;
}

export interface BugReport {
  id: string;
  projectId: string;
  sprintId?: string; // Optional sprint association
  title: string;
  description: string;
  severity: Severity;
  priority: "low" | "medium" | "high" | "urgent";
  status: BugStatus;
  assigneeId?: string;
  assigneeName?: string;
  testerId?: string;
  testerName?: string;
  reporterName: string;
  labels: string[];
  
  // Environment Details
  environment: string; // e.g., Production, Staging
  browser: string;
  operatingSystem: string;
  device: string;

  // Rich Steps
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;

  // Attachments & Traces
  attachments: { name: string; url: string; size: string; type: string }[];
  consoleLogs?: string;
  stackTraces?: string;

  // Relations
  relatedBugs: string[]; // List of Bug IDs
  isDuplicate?: boolean;
  duplicateOfId?: string;

  // AI-Assisted Triage Data
  aiClassified?: boolean;
  aiClassificationCategory?: string;
  aiRootCauseAnalysis?: string;
  aiSuggestedFix?: string;

  comments: BugComment[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string; // e.g., "USER_LOGIN", "BUG_STATUS_CHANGE"
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface GitHubRepo {
  id: string;
  fullName: string;
  url: string;
  linkedProjectId: string;
  syncedIssuesCount: number;
}

export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  isEnabled: boolean;
}

export interface Webhook {
  id: string;
  url: string;
  target: string;
  isEnabled: boolean;
}

export interface AIAnalysisResult {
  hasBugs: boolean;
  severity: Severity;
  bugType: string;
  summary: string;
  vulnerabilities: {
    line: number;
    issue: string;
    suggestion: string;
  }[];
  explanation: string;
  suggestedFix: string;
  metrics: {
    securityScore: number; // 0-100
    performanceRating: number; // 0-100
    readabilityScore: number; // 0-100
    complexityScore: number; // 0-100
  };
}

export interface LabChallenge {
  id: string;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  category: "security" | "performance" | "logic" | "architecture";
  vulnerableCode: string;
  securedCode: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  exploitSteps: string[];
}

