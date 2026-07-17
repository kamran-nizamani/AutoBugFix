import React, { useState } from "react";
import { Play, Sparkles, Shield, Zap, BookOpen, Layers, Check, Copy, Ticket } from "lucide-react";
import { motion } from "motion/react";
import { AIAnalysisResult, Severity } from "../types";

interface AIBugDetectorProps {
  onAddTicket: (ticketData: {
    title: string;
    description: string;
    severity: Severity;
    codeSnippet?: string;
  }) => void;
}

const DEFAULT_SAMPLE_CODE = `function processTransactions(transactions) {
  let processed = [];
  
  // Potential performance issue: O(N^2) double-loop
  for (let i = 0; i < transactions.length; i++) {
    let tx = transactions[i];
    let isDuplicate = false;
    
    for (let j = 0; j < processed.length; j++) {
      if (processed[j].id === tx.id) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      // Security flaw: directly rendering sensitive user logs
      console.log("Processing private billing data for account: " + tx.user.billingAddress);
      
      // Potential logic error: mutation of state argument
      tx.status = "COMPLETED";
      processed.push(tx);
    }
  }
  
  return processed;
}`;

export default function AIBugDetector({ onAddTicket }: AIBugDetectorProps) {
  const [code, setCode] = useState(DEFAULT_SAMPLE_CODE);
  const [language, setLanguage] = useState("javascript");
  const [profile, setProfile] = useState<"general" | "security" | "performance" | "readability">("general");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [ticketCreated, setTicketCreated] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setRawResponse(null);
    setTicketCreated(false);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, profile, language }),
      });

      const responseText = await response.text();
      if (!response.ok) {
        let errorMessage = "Failed to analyze code. Please check your connection or key setup.";
        try {
          const errData = JSON.parse(responseText);
          errorMessage = errData.error || errorMessage;
          if (typeof errData.raw === "string" && errData.raw.trim()) {
            setRawResponse(errData.raw);
          }
        } catch {
          if (responseText.trim()) {
            errorMessage = responseText;
            setRawResponse(responseText);
          }
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        setRawResponse(responseText);
        throw new Error("Invalid diagnostics response received from the AI service.");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyRawResponse = () => {
    if (!rawResponse) return;
    navigator.clipboard.writeText(rawResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateTicket = () => {
    if (!result) return;
    onAddTicket({
      title: `[AI] Fix ${result.bugType || "Detected Vulnerabilities"}`,
      description: `**AI Detected Issue Summary**:\n${result.summary}\n\n**Vulnerabilities found**:\n${result.vulnerabilities.map(v => `- Line ${v.line}: ${v.issue} (${v.suggestion})`).join("\n")}\n\n**AI Recommendation**:\n${result.explanation}`,
      severity: result.severity,
      codeSnippet: result.suggestedFix,
    });
    setTicketCreated(true);
  };

  const getSeverityBadgeClass = (sev: Severity) => {
    switch (sev) {
      case "critical":
        return "bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold";
      case "high":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold";
      case "medium":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold";
      case "low":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px] font-bold";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 bg-[#0A0C10]">
      {/* Code Input Panel */}
      <div id="ai-input-panel" className="lg:col-span-5 panel-shell overflow-hidden flex flex-col h-[650px]">
        <div className="panel-header px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-white text-xs uppercase tracking-wider">AI Analyzer Workbench</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              id="language-selector"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-2 py-1 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-300 focus:outline-hidden focus:border-cyan-400 font-mono"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="html">HTML / CSS</option>
            </select>
          </div>
        </div>

        {/* Focus Profiles */}
        <div className="p-3 bg-[#0A0C10] border-b border-[#1E293B] grid grid-cols-4 gap-2">
          <button
            id="profile-general"
            onClick={() => setProfile("general")}
            className={`flex flex-col items-center justify-center py-2 px-1 border rounded text-center transition uppercase tracking-wider ${
              profile === "general"
                ? "bg-[#1E293B] border-cyan-500 text-cyan-400"
                : "border-[#1E293B] bg-[#0A0C10] hover:bg-[#1E293B]/60 text-slate-400"
            }`}
          >
            <Layers className="w-4 h-4 mb-1" />
            <span className="text-[9px] font-bold">General</span>
          </button>
          <button
            id="profile-security"
            onClick={() => setProfile("security")}
            className={`flex flex-col items-center justify-center py-2 px-1 border rounded text-center transition uppercase tracking-wider ${
              profile === "security"
                ? "bg-[#1E293B] border-cyan-500 text-cyan-400"
                : "border-[#1E293B] bg-[#0A0C10] hover:bg-[#1E293B]/60 text-slate-400"
            }`}
          >
            <Shield className="w-4 h-4 mb-1" />
            <span className="text-[9px] font-bold">Security</span>
          </button>
          <button
            id="profile-performance"
            onClick={() => setProfile("performance")}
            className={`flex flex-col items-center justify-center py-2 px-1 border rounded text-center transition uppercase tracking-wider ${
              profile === "performance"
                ? "bg-[#1E293B] border-cyan-500 text-cyan-400"
                : "border-[#1E293B] bg-[#0A0C10] hover:bg-[#1E293B]/60 text-slate-400"
            }`}
          >
            <Zap className="w-4 h-4 mb-1" />
            <span className="text-[9px] font-bold">Performance</span>
          </button>
          <button
            id="profile-readability"
            onClick={() => setProfile("readability")}
            className={`flex flex-col items-center justify-center py-2 px-1 border rounded text-center transition uppercase tracking-wider ${
              profile === "readability"
                ? "bg-[#1E293B] border-cyan-500 text-cyan-400"
                : "border-[#1E293B] bg-[#0A0C10] hover:bg-[#1E293B]/60 text-slate-400"
            }`}
          >
            <BookOpen className="w-4 h-4 mb-1" />
            <span className="text-[9px] font-bold">Readability</span>
          </button>
        </div>

        {/* Text Area */}
        <div className="flex-1 relative font-mono text-sm p-1 bg-[#0A0C10]">
          <textarea
            id="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full bg-[#0A0C10] text-slate-100 p-4 font-mono text-xs focus:outline-hidden resize-none leading-relaxed"
            placeholder="// Paste or write your source code here..."
          />
        </div>

        <div className="p-3 bg-[#0F172A] border-t border-[#1E293B] flex items-center justify-between">
          <button
            id="clear-code-btn"
            onClick={() => setCode("")}
            className="px-3 py-1.5 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider transition"
          >
            Clear Editor
          </button>

          <button
            id="trigger-analysis-btn"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !code.trim()}
            className="px-4 py-2 bg-white text-black hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 font-bold rounded text-xs flex items-center gap-2 uppercase tracking-widest transition cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Running Diagnostics...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Scan for Bugs</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Output Panel */}
      <div id="ai-results-panel" className="lg:col-span-7 panel-shell flex flex-col h-[650px] overflow-y-auto">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center flex-grow p-12 text-center h-full">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
              <Sparkles className="w-6 h-6 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Synthesizing Code Diagnostics</h3>
            <p className="text-slate-400 text-xs max-w-sm mt-2 leading-relaxed">
              AI is auditing security vulnerabilities, performance spikes, read paths, and complexity indexes...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center flex-grow p-8 text-center h-full bg-[#0F172A]">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 font-bold text-lg">!</div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Diagnostics Scan Interrupted</h3>
            <p className="text-slate-400 text-xs max-w-md mt-2 leading-relaxed bg-[#0A0C10] p-3 border border-[#1E293B] rounded font-mono text-left">
              {error}
            </p>
            {rawResponse && (
              <div className="mt-4 p-3 text-left bg-[#071018] border border-[#1E293B] rounded max-h-48 overflow-y-auto text-xs text-slate-300 font-mono">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Raw AI Response</span>
                  <button
                    onClick={handleCopyRawResponse}
                    className="px-2 py-1 bg-slate-800 text-slate-200 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-slate-700"
                  >
                    Copy Raw
                  </button>
                </div>
                <pre>{rawResponse}</pre>
              </div>
            )}
            <button
              id="retry-diagnostics-btn"
              onClick={handleAnalyze}
              className="mt-4 px-4 py-2 bg-white text-black hover:bg-cyan-500 rounded text-xs font-bold uppercase tracking-widest transition cursor-pointer"
            >
              Retry Diagnostic Run
            </button>
          </div>
        ) : result ? (
          <div className="p-5 flex flex-col gap-6">
            {/* Header Metrics Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider rounded ${getSeverityBadgeClass(result.severity)}`}>
                    {result.severity} Priority
                  </span>
                  <span className="text-slate-600 text-xs">•</span>
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded uppercase tracking-wider">
                    {result.bugType || "Clean Audit"}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mt-3">
                  Scan Summary: {result.hasBugs ? "Action Advised" : "Clean Compilation"}
                </h3>
                <p className="text-xs text-slate-300 mt-1">{result.summary}</p>
              </div>

              {result.hasBugs && (
                <div>
                  <button
                    id="create-tracker-ticket-btn"
                    onClick={handleCreateTicket}
                    disabled={ticketCreated}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all border cursor-pointer ${
                      ticketCreated
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-cyan-500 border-transparent text-black hover:bg-cyan-400"
                    }`}
                  >
                    {ticketCreated ? (
                      <>
                        <Check className="w-3.5 h-3.5 inline mr-1" />
                        <span>Ticket Added</span>
                      </>
                    ) : (
                      <>
                        <Ticket className="w-3.5 h-3.5 inline mr-1" />
                        <span>File Bug Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Metrics Sliders */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">System Code Ratings</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Security", val: result.metrics.securityScore, color: "bg-red-500", track: "bg-red-950" },
                  { label: "Performance", val: result.metrics.performanceRating, color: "bg-orange-500", track: "bg-orange-950" },
                  { label: "Readability", val: result.metrics.readabilityScore, color: "bg-blue-500", track: "bg-blue-950" },
                  { label: "Clean Code", val: result.metrics.complexityScore, color: "bg-emerald-500", track: "bg-emerald-950" }
                ].map((m, idx) => (
                  <div key={idx} className="bg-[#0A0C10] border border-[#1E293B] rounded p-3">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider mb-1">{m.label}</span>
                    <div className="flex items-end justify-between">
                      <span className="text-lg font-bold text-white">{m.val}</span>
                      <span className="text-[9px] font-bold text-slate-600">/100</span>
                    </div>
                    <div className={`w-full ${m.track} h-1 rounded overflow-hidden mt-2`}>
                      <div className={`h-full ${m.color}`} style={{ width: `${m.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanatory breakdown */}
            <div className="bg-[#0A0C10] border border-[#1E293B] rounded p-4">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 mb-2">Architectural Breakdown</h4>
              <div className="prose prose-invert text-slate-300 text-xs leading-relaxed max-h-[150px] overflow-y-auto whitespace-pre-line border-t border-[#1E293B] pt-2">
                {result.explanation}
              </div>
            </div>

            {/* Vulnerability list */}
            {result.vulnerabilities.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Specific Highlights</h4>
                <div className="flex flex-col gap-2">
                  {result.vulnerabilities.map((v, index) => (
                    <div key={index} className="flex gap-3 p-3 border border-[#1E293B] bg-[#0A0C10] rounded hover:bg-[#1E293B]/50 transition">
                      <div className="flex-shrink-0 w-6 h-6 rounded bg-[#1E293B] border border-slate-700 flex items-center justify-center font-bold text-[10px] text-cyan-400">
                        {v.line || index + 1}
                      </div>
                      <div className="flex-1">
                        <h5 className="text-xs font-bold text-white uppercase tracking-wider">Potential Issue</h5>
                        <p className="text-xs text-slate-300 mt-0.5">{v.issue}</p>
                        <p className="text-[10px] text-cyan-400 mt-1 font-mono bg-cyan-950/40 border border-cyan-800/20 px-1.5 py-0.5 rounded inline-block">
                          Suggest: {v.suggestion}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Side-by-Side Diff comparator */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Secure Refactored Result</h4>
                <button
                  id="copy-fix-btn"
                  onClick={() => handleCopyCode(result.suggestedFix)}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-[#1E293B] rounded bg-[#0A0C10] hover:bg-[#1E293B] flex items-center gap-1.5 text-slate-300 transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Fix Code</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-[#0A0C10] border border-[#1E293B] text-slate-200 rounded p-4 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[300px]">
                <pre>{result.suggestedFix}</pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-grow p-12 text-center h-full">
            <Sparkles className="w-10 h-10 text-slate-700 animate-pulse mb-4" />
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Diagnostics Console Ready</h3>
            <p className="text-slate-500 text-xs max-w-xs mt-2 leading-relaxed">
              Paste your application files into the workbench on the left, then trigger diagnostics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
