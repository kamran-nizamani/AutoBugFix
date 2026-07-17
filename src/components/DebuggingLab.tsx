import React, { useState, useEffect, useRef } from "react";
import { Terminal, Shield, Play, HelpCircle, FileCode2, Code, Zap, AlertTriangle, RefreshCw, RefreshCcw, CheckCircle } from "lucide-react";
import { labChallenges } from "../data/labChallenges";
import { LabChallenge } from "../types";

export default function DebuggingLab() {
  const [selectedLabId, setSelectedLabId] = useState(labChallenges[0].id);
  const [activeTab, setActiveTab] = useState<"vuln" | "secure">("vuln");
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Simulation State Variables
  const [exploitInput, setExploitInput] = useState("");
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<"idle" | "success" | "failure" | "running">("idle");

  // Specific simulation hook variables
  const [raceView, setRaceView] = useState<string>("No active tab loaded");
  const [leakMountedCount, setLeakMountedCount] = useState(0);
  const [activeIntervals, setActiveIntervals] = useState(0);
  const [simulatedMemory, setSimulatedMemory] = useState(12.5); // MB
  const [timeoutActive, setTimeoutActive] = useState(false);
  const [timeoutMode, setTimeoutMode] = useState<"vuln" | "secure">("vuln");
  const [timeoutTimer, setTimeoutTimer] = useState<number>(0);
  const [forgedToken, setForgedToken] = useState("");

  const activeLab = labChallenges.find((l) => l.id === selectedLabId) || labChallenges[0];

  // Sync default input values on lab change
  useEffect(() => {
    setAiExplanation(null);
    setSimulationLogs(["Terminal initialized. Ready for diagnostics run."]);
    setSimulationStatus("idle");
    setExploitInput("");
    setIsSimulating(false);

    if (activeLab.id === "sql-injection") {
      setExploitInput("");
    } else if (activeLab.id === "xss-vulnerability") {
      setExploitInput("");
    } else if (activeLab.id === "jwt-bypass") {
      setForgedToken("");
    }
  }, [selectedLabId]);

  // Interval memory leak simulator
  useEffect(() => {
    if (activeIntervals > 0) {
      const interval = setInterval(() => {
        setSimulatedMemory((m) => {
          const added = activeIntervals * 3.4;
          return parseFloat((m + added).toFixed(1));
        });
        setSimulationLogs((l) => [
          ...l,
          `[leak-watcher] MEM_TICK: Running ${activeIntervals} active un-cleared intervals. Heap allocated: +${(
            activeIntervals * 3.4
          ).toFixed(1)} MB`
        ]);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeIntervals]);

  const handleExplain = async () => {
    setIsExplaining(true);
    setAiExplanation(null);
    try {
      const response = await fetch("/api/lab-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labId: activeLab.id,
          title: activeLab.title,
          vulnerableCode: activeLab.vulnerableCode
        })
      });

      if (!response.ok) {
        throw new Error("Unable to contact AI engine.");
      }

      const data = await response.json();
      setAiExplanation(data.explanation);
    } catch (err) {
      setAiExplanation("### Connection Interrupted\nUnable to retrieve detailed AI insights. Please check that your server is active and AI API keys are configured.");
    } finally {
      setIsExplaining(false);
    }
  };

  const autofillExploit = () => {
    if (activeLab.id === "sql-injection") {
      setExploitInput("' OR '1'='1");
    } else if (activeLab.id === "xss-vulnerability") {
      setExploitInput(`<img src=x onerror="alert('Cookie Stolen: ' + document.cookie)">`);
    } else if (activeLab.id === "jwt-bypass") {
      setForgedToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImhhY2tlciIsInJvbGUiOiJhZG1pbiJ9.forged_signature_using_weak_key");
    }
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setSimulationStatus("running");
    setSimulationLogs(["[system] Booting Sandbox Compiler...", "[system] Linking dependencies..."]);

    setTimeout(() => {
      if (activeLab.id === "sql-injection") {
        const input = exploitInput.trim();
        setSimulationLogs((prev) => [
          ...prev,
          `[api-router] POST /api/login payload: { username: "${input}", password: "" }`,
          `[query-builder] Raw SQL Query: SELECT * FROM users WHERE username = '${input}' AND password = ''`
        ]);

        setTimeout(() => {
          if (input === "' OR '1'='1") {
            setSimulationLogs((prev) => [
              ...prev,
              `[db-mysql] Query Executed. Condition Evaluates: TRUE (Row matches all records!)`,
              `[db-mysql] Row 1 matched: admin (role: admin, pass_hash: $2b$12$K89s1ns09)`,
              `[db-mysql] Row 2 matched: manager (role: manager, pass_hash: $2b$12$Asa910sn0)`,
              `[api-router] Access Granted. Logged in as ADMINISTRATOR.`,
              `[api-router] Leaked admin data: { users_count: 125, secrets_env: "PROD_STRIPE_KEY=sk_prod_9918..." }`
            ]);
            setSimulationStatus("success");
          } else {
            setSimulationLogs((prev) => [
              ...prev,
              `[db-mysql] Query Executed. Condition Evaluates: FALSE (No passwords matched)`,
              `[api-router] Access Denied. Return Status Code: 401 Unauthorized.`
            ]);
            setSimulationStatus("failure");
          }
          setIsSimulating(false);
        }, 1200);
      } else if (activeLab.id === "xss-vulnerability") {
        const input = exploitInput.trim();
        setSimulationLogs((prev) => [
          ...prev,
          `[rendering-engine] Parsing layout searchQuery = "${input}"`,
          `[rendering-engine] DOM Write: document.getElementById('search-res').innerHTML = 'Results for: ${input}'`
        ]);

        setTimeout(() => {
          if (input.includes("<img") && input.includes("onerror")) {
            setSimulationLogs((prev) => [
              ...prev,
              `[browser-dom] Image render failed (src=x is invalid).`,
              `[browser-dom] onerror hook triggered! Executing script: alert('Cookie Stolen: ' + document.cookie)`,
              `[exploit-telem] MOCK WINDOW ALERT: Cookie Stolen: session_token=jwt_key_9918239a03912bs`,
              `[exploit-telem] Exfiltrating hijacked cookie to: http://attacker-server.net/collect?cookie=jwt_key_9918239a03912bs`,
              `[system] Hijack Successful. Session hijacked!`
            ]);
            setSimulationStatus("success");
          } else {
            setSimulationLogs((prev) => [
              ...prev,
              `[browser-dom] Plain string rendered safely as static text layout. No scripts triggered.`
            ]);
            setSimulationStatus("failure");
          }
          setIsSimulating(false);
        }, 1200);
      } else if (activeLab.id === "race-condition") {
        setSimulationLogs((prev) => [
          ...prev,
          `[browser-nav] Click 'Tab A' (Heavy statistical computation - latency 2000ms)`,
          `[api] Dispatching GET /api/users/analytics (Request ID: #101)`,
          `[browser-nav] (Quick Switch) Click 'Tab B' (Simple profile fetch - latency 400ms)`,
          `[api] Dispatching GET /api/users/profile (Request ID: #102)`
        ]);

        setTimeout(() => {
          setSimulationLogs((prev) => [
            ...prev,
            `[api] Request #102 Resolved (Tab B Profile) in 400ms. Displaying 'Viewing Profile: Sarah Jenkins'`
          ]);
          setRaceView("Viewing Profile: Sarah Jenkins");
        }, 600);

        setTimeout(() => {
          setSimulationLogs((prev) => [
            ...prev,
            `[api] Request #101 Resolved (Tab A Analytics) in 2000ms. Overwriting DOM view!`,
            `[system] BUG DETECTED: Profile View component now contains Tab A's Heavy Database Stats while Tab B is highlighted as active!`
          ]);
          setRaceView("Leaked System Report: Total Users = 1,421, Server RAM = 45% (HACKED VIEW)");
          setSimulationStatus("success");
          setIsSimulating(false);
        }, 2200);
      } else if (activeLab.id === "memory-leak") {
        // Mount count increases intervals
        setLeakMountedCount((c) => c + 1);
        setActiveIntervals((i) => i + 1);
        setSimulationLogs((prev) => [
          ...prev,
          `[mount-mgr] User double-clicked tab. Component Mounted/Unmounted.`,
          `[effect-runner] Running useEffect() listener initialization.`,
          `[effect-runner] setInterval registered with ID: ${Math.floor(Math.random() * 9000) + 1000}`,
          `[system] WARNING: Previous interval was NOT cleared on unmount. Stacking background listeners!`
        ]);
        setSimulationStatus("success");
        setIsSimulating(false);
      } else if (activeLab.id === "api-timeout") {
        setTimeoutActive(true);
        setTimeoutTimer(0);
        setSimulationLogs((prev) => [
          ...prev,
          `[fetch-client] Dispatching GET /api/reports/heavy`,
          `[system] Setting endpoint connection state to: HANGING (PACKET_LOSS)`
        ]);

        let elapsed = 0;
        const timer = setInterval(() => {
          elapsed += 1;
          setTimeoutTimer(elapsed);
          setSimulationLogs((prev) => [...prev, `[network-hang] Waiting... Connection elapsed: ${elapsed}s`]);

          if (timeoutMode === "secure" && elapsed >= 3) {
            clearInterval(timer);
            setSimulationLogs((prev) => [
              ...prev,
              `[fetch-client] Connection exceeded timeout limit (3000ms).`,
              `[fetch-client] AbortController.abort() issued successfully.`,
              `[api-fallback] Throwing: AbortError: Request timed out.`,
              `[browser-dom] Error Captured. Rendering warning card with 'Retry' CTA. UI remains active!`
            ]);
            setSimulationStatus("failure"); // Failure is safe here because it aborted cleanly!
            setIsSimulating(false);
            setTimeoutActive(false);
          } else if (timeoutMode === "vuln" && elapsed >= 6) {
            clearInterval(timer);
            setSimulationLogs((prev) => [
              ...prev,
              `[network-hang] 6 seconds elapsed. Loader STILL active. User cannot scroll or recover. Heap memory draining.`,
              `[system] BUG CONFIRMED: Dashboard is frozen in an infinite spinner loop.`
            ]);
            setSimulationStatus("success"); // Exploit success
            setIsSimulating(false);
            setTimeoutActive(false);
          }
        }, 1000);
      } else if (activeLab.id === "jwt-bypass") {
        setSimulationLogs((prev) => [
          ...prev,
          `[auth-api] GET /api/admin/system-logs`,
          `[auth-api] Authorization Header: Bearer ${forgedToken ? forgedToken.substring(0, 30) + "..." : "none"}`
        ]);

        setTimeout(() => {
          if (
            forgedToken &&
            forgedToken.includes("forged_signature_using_weak_key")
          ) {
            setSimulationLogs((prev) => [
              ...prev,
              `[auth-api] Verification Key: 'dev-secret-key-do-not-use-in-prod-123'`,
              `[jwt-verifier] Signature Match: VALID`,
              `[jwt-verifier] Decoded Payload: { username: "hacker", role: "admin" }`,
              `[auth-api] Verification Passed. Leaking secure system logs:`,
              `[leaked-logs] SERVER_LOG: Port 3000 successfully bound to 0.0.0.0`,
              `[leaked-logs] SECRET_KEY: AWS_SECRET_ACCESS_KEY=A398AJS1023...`
            ]);
            setSimulationStatus("success");
          } else {
            setSimulationLogs((prev) => [
              ...prev,
              `[auth-api] Verification Key: process.env.JWT_SECRET_KEY`,
              `[jwt-verifier] Signature Match: FAILED (Token was signed with weak key, server expects strong randomized key)`,
              `[auth-api] Verification Rejected. Response Status: 403 Forbidden`
            ]);
            setSimulationStatus("failure");
          }
          setIsSimulating(false);
        }, 1200);
      }
    }, 800);
  };

  const resetSimulationState = () => {
    setSimulationLogs(["Terminal re-initialized."]);
    setSimulationStatus("idle");
    setExploitInput("");
    setRaceView("No active tab loaded");
    setLeakMountedCount(0);
    setActiveIntervals(0);
    setSimulatedMemory(12.5);
    setForgedToken("");
  };

  // Helper to cleanly render simple markdown headers and bullet logs
  const renderMarkdownExplanation = (text: string) => {
    return text.split("\n").map((line, index) => {
      if (line.startsWith("### ")) {
        return <h4 key={index} className="text-xs font-bold text-white mt-4 mb-2 uppercase tracking-wide">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={index} className="text-sm font-bold text-cyan-400 mt-5 mb-2 border-b border-[#1E293B] pb-1 uppercase tracking-wider">{line.replace("## ", "")}</h3>;
      }
      if (line.startsWith("1. ") || line.startsWith("2. ") || line.startsWith("3. ")) {
        return <p key={index} className="text-xs font-semibold text-slate-200 mt-2">{line}</p>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return <li key={index} className="text-xs text-slate-300 ml-4 list-disc mt-1">{line.substring(2)}</li>;
      }
      if (line.trim().startsWith("```")) {
        return null; // Skip markdown block signs
      }
      return <p key={index} className="text-xs text-slate-400 mt-1.5 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 bg-[#0A0C10]">
      {/* Challenges sidebar list */}
      <div id="labs-selector-panel" className="lg:col-span-3 flex flex-col gap-2">
        <div className="bg-[#0F172A] border border-[#1E293B] rounded p-3 flex items-center gap-2 mb-1">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Debugging Sandbox</h3>
        </div>

        {labChallenges.map((lab) => {
          const isActive = lab.id === selectedLabId;
          return (
            <button
              id={`lab-select-${lab.id}`}
              key={lab.id}
              onClick={() => setSelectedLabId(lab.id)}
              className={`text-left p-3.5 rounded border transition flex flex-col gap-1.5 uppercase tracking-wide cursor-pointer ${
                isActive
                  ? "bg-cyan-500 border-cyan-500 text-black shadow-xs font-bold"
                  : "bg-[#0F172A] border-[#1E293B] hover:bg-[#1E293B] text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  isActive
                    ? "bg-cyan-950 text-cyan-400 border border-cyan-800"
                    : lab.category === "security" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                      lab.category === "performance" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}>
                  {lab.category}
                </span>
                <span className={`text-[9px] font-semibold ${isActive ? "text-cyan-950" : "text-slate-500"}`}>
                  {lab.difficulty}
                </span>
              </div>
              <h4 className={`text-xs font-bold leading-snug ${isActive ? "text-[#0A0C10]" : "text-white"}`}>{lab.title}</h4>
            </button>
          );
        })}
      </div>

      {/* Code Display Sandbox Workspace */}
      <div id="labs-code-panel" className="lg:col-span-5 panel-shell overflow-hidden flex flex-col h-[700px]">
        {/* Toggle between Vuln and Secure tab */}
        <div className="panel-header justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-slate-200 text-xs">Source Code Explorer</h3>
          </div>

          <div className="flex bg-[#0A0C10] p-0.5 rounded border border-[#1E293B]">
            <button
              id="view-vuln-tab-btn"
              onClick={() => setActiveTab("vuln")}
              className={`px-3 py-1 text-[10px] font-bold rounded uppercase transition tracking-wider cursor-pointer ${
                activeTab === "vuln"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "text-slate-500 hover:text-slate-400"
              }`}
            >
              Vulnerable Code
            </button>
            <button
              id="view-secure-tab-btn"
              onClick={() => setActiveTab("secure")}
              className={`px-3 py-1 text-[10px] font-bold rounded uppercase transition tracking-wider cursor-pointer ${
                activeTab === "secure"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-500 hover:text-slate-400"
              }`}
            >
              Secure Code
            </button>
          </div>
        </div>

        {/* Challenge details */}
        <div className="p-4 border-b border-[#1E293B] bg-[#0F172A]">
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {activeLab.shortDescription}
          </p>
          <div className="mt-2 text-[10px] text-slate-400 font-mono leading-relaxed bg-[#0A0C10] border border-[#1E293B] rounded p-2.5">
            <strong>Exploit Guide:</strong> {activeLab.detailedDescription}
          </div>
        </div>

        {/* Code Block display */}
        <div className="flex-1 bg-[#0A0C10] overflow-y-auto p-4 font-mono text-[11px] leading-relaxed relative">
          <pre className={activeTab === "vuln" ? "text-red-300" : "text-emerald-200"}>
            <code>{activeTab === "vuln" ? activeLab.vulnerableCode : activeLab.securedCode}</code>
          </pre>
          <span className={`absolute top-3 right-3 text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
            activeTab === "vuln" ? "bg-red-950/40 border-red-800/40 text-red-400" : "bg-emerald-950/40 border-emerald-800/40 text-emerald-400"
          }`}>
            {activeTab === "vuln" ? "vulnerable" : "remediated"}
          </span>
        </div>

        {/* Request AI Deep-dive */}
        <div className="p-3 bg-[#0F172A] border-t border-[#1E293B] flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Get immediate code analysis</span>
          <button
            id="ask-ai-lab-btn"
            onClick={handleExplain}
            disabled={isExplaining}
            className="px-3.5 py-1.5 bg-white hover:bg-cyan-500 text-black font-bold uppercase tracking-widest rounded text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            {isExplaining ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Generating breakdown...</span>
              </>
            ) : (
              <>
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Ask AI Deep-Dive</span>
              </>
            )}
          </button>
        </div>

        {/* AI Markdown presentation block */}
        {aiExplanation && (
          <div id="ai-explanation-drawer" className="bg-[#0A0C10] border-t border-[#1E293B] p-4 max-h-[300px] overflow-y-auto animate-slideUp">
            <div className="flex items-center gap-1.5 text-cyan-400 mb-2">
              <Shield className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">AI Code Auditor Response</span>
            </div>
            <div className="bg-[#0F172A] border border-[#1E293B] rounded p-4 text-slate-300 text-xs leading-relaxed">
              {renderMarkdownExplanation(aiExplanation)}
            </div>
          </div>
        )}
      </div>

      {/* Exploit Simulator terminal */}
      <div id="labs-sandbox-panel" className="lg:col-span-4 panel-shell overflow-hidden flex flex-col h-[700px]">
        <div className="panel-header px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-xs font-mono">exploit_console.sh</h3>
          </div>
          <button
            id="clear-sandbox-console-btn"
            onClick={resetSimulationState}
            className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition cursor-pointer"
          >
            reset_env
          </button>
        </div>

        {/* Interactive Play controls based on lab challenge type */}
        <div className="p-4 border-b border-[#1E293B] bg-[#0F172A] flex flex-col gap-3">
          <span className="text-[10px] font-bold font-mono text-cyan-400 uppercase tracking-wide">
            [Interactive Exploit Controller]
          </span>

          {/* 1. SQL Injection Sandbox inputs */}
          {activeLab.id === "sql-injection" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="exploit-payload-sql" className="text-[9px] font-mono text-slate-400">Username input payload:</label>
              <div className="flex gap-2">
                <input
                  id="exploit-payload-sql"
                  type="text"
                  placeholder="Type OR '1'='1"
                  value={exploitInput}
                  onChange={(e) => setExploitInput(e.target.value)}
                  className="flex-grow px-2 py-1 bg-[#0A0C10] border border-[#1E293B] text-xs font-mono text-slate-200 rounded focus:outline-hidden focus:border-cyan-500"
                />
                <button
                  id="autofill-sql-btn"
                  onClick={autofillExploit}
                  className="px-2 py-1 bg-[#0F172A] hover:bg-[#1E293B] text-[10px] font-mono text-cyan-400 rounded border border-[#1E293B] cursor-pointer"
                  title="Autofill bypass payload"
                >
                  autofill
                </button>
              </div>
            </div>
          )}

          {/* 2. XSS Sandbox inputs */}
          {activeLab.id === "xss-vulnerability" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="exploit-payload-xss" className="text-[9px] font-mono text-slate-400">Malicious Search Payload:</label>
              <div className="flex gap-2">
                <input
                  id="exploit-payload-xss"
                  type="text"
                  placeholder="Search phrase..."
                  value={exploitInput}
                  onChange={(e) => setExploitInput(e.target.value)}
                  className="flex-grow px-2 py-1 bg-[#0A0C10] border border-[#1E293B] text-xs font-mono text-slate-200 rounded focus:outline-hidden focus:border-cyan-500"
                />
                <button
                  id="autofill-xss-btn"
                  onClick={autofillExploit}
                  className="px-2 py-1 bg-[#0F172A] hover:bg-[#1E293B] text-[10px] font-mono text-cyan-400 rounded border border-[#1E293B] cursor-pointer"
                >
                  autofill
                </button>
              </div>
            </div>
          )}

          {/* 3. Race condition interactive container */}
          {activeLab.id === "race-condition" && (
            <div className="bg-[#0A0C10] border border-[#1E293B] rounded p-3 flex flex-col gap-2">
              <span className="text-[9px] font-mono text-slate-400 block">Simulated Profile Component View:</span>
              <div className="bg-[#0F172A] p-2.5 rounded font-mono text-[10px] border border-[#1E293B] text-cyan-400 h-10 flex items-center justify-center">
                {raceView}
              </div>
              <p className="text-[9px] font-mono text-slate-500 italic">Click 'Simulate Exploit' to fire Tab A and Tab B sequentially and test racing.</p>
            </div>
          )}

          {/* 4. Memory Leak interactive counters */}
          {activeLab.id === "memory-leak" && (
            <div className="bg-[#0A0C10] border border-[#1E293B] rounded p-3 grid grid-cols-2 gap-2 font-mono">
              <div>
                <span className="text-[9px] text-slate-500 block">Mount Repeatedly:</span>
                <span className="text-xs font-bold text-slate-300">{leakMountedCount} times</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">Dangling Intervals:</span>
                <span className="text-xs font-bold text-red-500">{activeIntervals} active</span>
              </div>
              <div className="col-span-2 border-t border-[#1E293B] pt-1.5 flex items-center justify-between">
                <span className="text-[9px] text-slate-500">Simulated HEAP leak:</span>
                <span className={`text-xs font-bold ${activeIntervals > 2 ? "text-red-500 animate-pulse" : "text-emerald-400"}`}>
                  {simulatedMemory} MB
                </span>
              </div>
            </div>
          )}

          {/* 5. API Timeout slider */}
          {activeLab.id === "api-timeout" && (
            <div className="flex flex-col gap-2 font-mono">
              <div className="flex justify-between items-center text-[9px] text-slate-400">
                <span>Select Component Version:</span>
                <span className="font-bold uppercase text-cyan-400">{timeoutMode} version</span>
              </div>
              <div className="flex bg-[#0A0C10] border border-[#1E293B] p-0.5 rounded">
                <button
                  id="api-timeout-vuln-btn"
                  onClick={() => setTimeoutMode("vuln")}
                  className={`flex-1 text-center py-1 text-[9px] rounded uppercase font-bold cursor-pointer transition ${timeoutMode === "vuln" ? "bg-red-950/40 text-red-400 border border-red-900/40" : "text-slate-500"}`}
                >
                  Unchecked Vuln
                </button>
                <button
                  id="api-timeout-secure-btn"
                  onClick={() => setTimeoutMode("secure")}
                  className={`flex-1 text-center py-1 text-[9px] rounded uppercase font-bold cursor-pointer transition ${timeoutMode === "secure" ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40" : "text-slate-500"}`}
                >
                  Safe Timeout Controller
                </button>
              </div>
            </div>
          )}

          {/* 6. JWT auth forgery tool */}
          {activeLab.id === "jwt-bypass" && (
            <div className="flex flex-col gap-2 font-mono">
              <label htmlFor="jwt-token-input" className="text-[9px] text-slate-400 block">Session JSON Web Token (JWT):</label>
              <textarea
                id="jwt-token-input"
                placeholder="Session JWT signature..."
                value={forgedToken}
                onChange={(e) => setForgedToken(e.target.value)}
                className="w-full bg-[#0A0C10] border border-[#1E293B] text-[10px] text-slate-300 p-2 rounded h-12 resize-none focus:outline-hidden focus:border-cyan-500"
              />
              <button
                id="forge-jwt-btn"
                onClick={autofillExploit}
                className="w-full py-1 bg-[#0F172A] border border-[#1E293B] hover:bg-[#1E293B] text-[9px] text-slate-300 rounded transition cursor-pointer"
              >
                Sign Forged Admin Token
              </button>
            </div>
          )}

          {/* Launch trigger button */}
          <button
            id="launch-exploit-sim-btn"
            onClick={runSimulation}
            disabled={isSimulating || timeoutActive}
            className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-[#0A0C10] text-xs font-bold rounded flex items-center justify-center gap-2 cursor-pointer transition font-mono uppercase tracking-widest"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Exploit</span>
              </>
            )}
          </button>
        </div>

        {/* Live dynamic visual logs list */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-1.5 font-mono text-[10px] text-slate-300 leading-normal bg-[#0A0C10]">
          {simulationLogs.map((log, i) => {
            let textColor = "text-slate-300";
            if (log.startsWith("[system]")) textColor = "text-cyan-400";
            else if (log.startsWith("[exploit") || log.startsWith("[db-mysql] Row") || log.includes("Leaked")) textColor = "text-red-400 font-semibold";
            else if (log.startsWith("[api-router]") || log.includes("GET") || log.includes("POST")) textColor = "text-sky-400";
            else if (log.includes("REJECTED") || log.includes("Signature Verification FAILED") || log.includes("Access Denied")) textColor = "text-orange-500 font-bold";
            else if (log.includes("Passed") || log.includes("SUCCESS") || log.includes("VALID") || log.includes("cleared successfully")) textColor = "text-emerald-400 font-semibold";

            return (
              <div key={i} className={`whitespace-pre-wrap ${textColor}`}>
                &gt; {log}
              </div>
            );
          })}
        </div>

        {/* Console visual footer status */}
        <div className="bg-[#0F172A] border-t border-[#1E293B] px-4 py-3 flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-500 font-bold">SANDBOX_COMPILE: ONLINE</span>
          <span className={`flex items-center gap-1 font-bold ${
            simulationStatus === "success" ? "text-red-400" :
            simulationStatus === "failure" ? "text-emerald-400" : "text-slate-500"
          }`}>
            {simulationStatus === "success" ? "⚠️ EXPLOIT_SUCCESS" :
             simulationStatus === "failure" ? "🛡️ SAFE_PROTECTION" : "● STANDBY"}
          </span>
        </div>
      </div>
    </div>
  );
}
