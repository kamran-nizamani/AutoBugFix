import React, { useState } from "react";
import { Sparkles, Terminal, FileCode, GitBranch, HeartHandshake, Check, Copy } from "lucide-react";

export default function AIPanel() {
  const [logsInput, setLogsInput] = useState("");
  const [traceInput, setTraceInput] = useState("");
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnoseResult, setDiagnoseResult] = useState<string | null>(null);

  const [prodType, setProdType] = useState<"pr" | "commit" | "release" | "testcase">("pr");
  const [prodTitle, setProdTitle] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<string | null>(null);

  const [copiedDiag, setCopiedDiag] = useState(false);
  const [copiedProd, setCopiedProd] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDiagnose = async () => {
    setIsDiagnosing(true);
    setErrorMsg(null);
    setDiagnoseResult(null);
    try {
      const res = await fetch("/api/ai/diagnose-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: logsInput, traces: traceInput })
      });
      if (!res.ok) {
        throw new Error("Failed to compile AI diagnosis. Confirm server and API keys.");
      }
      const data = await res.json();
      setDiagnoseResult(data.explanation);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setGenerationResult(null);
    try {
      const res = await fetch("/api/ai/productivity-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: prodType, title: prodTitle, description: prodDesc })
      });
      if (!res.ok) {
        throw new Error("Failed to generate code assets. Confirm your AI configuration.");
      }
      const data = await res.json();
      setGenerationResult(data.result);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 bg-[#0A0C10]">
      {/* Diagnostics center */}
      <div className="lg:col-span-6 flex flex-col h-[650px] bg-[#0F172A] border border-[#1E293B] rounded overflow-hidden">
        <div className="bg-[#0F172A] px-4 py-3 border-b border-[#1E293B] flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">AI Stack Trace & Log Diagnostician</h3>
        </div>

        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Paste error outputs, crash dumps, or Node stack traces to get an immediate architectural diagnosis, conventional commits blueprint, and test file recommendations.
          </p>

          <div className="flex flex-col gap-1">
            <label htmlFor="diag-logs" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Console Logs Output</label>
            <textarea
              id="diag-logs"
              value={logsInput}
              onChange={(e) => setLogsInput(e.target.value)}
              placeholder="e.g., Uncaught TypeError: Cannot read properties of null (reading 'map')"
              className="px-3 py-2 bg-[#0A0C10] border border-[#1E293B] rounded text-xs font-mono text-slate-200 h-24 focus:outline-hidden focus:border-cyan-400 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="diag-traces" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Exception Stack Trace</label>
            <textarea
              id="diag-traces"
              value={traceInput}
              onChange={(e) => setTraceInput(e.target.value)}
              placeholder="at processTicksAndRejections (node:internal/process/task_queues:95)&#10;at async Server.handler (server.ts:45)"
              className="px-3 py-2 bg-[#0A0C10] border border-[#1E293B] rounded text-xs font-mono text-slate-200 h-24 focus:outline-hidden focus:border-cyan-400 resize-none"
            />
          </div>

          {diagnoseResult ? (
            <div className="mt-2 bg-[#0A0C10] border border-[#1E293B] rounded p-4 relative">
              <button
                onClick={() => copyToClipboard(diagnoseResult, setCopiedDiag)}
                className="absolute top-3 right-3 text-[10px] bg-[#0F172A] border border-[#1E293B] hover:bg-[#1E293B] text-slate-300 font-bold px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer"
              >
                {copiedDiag ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedDiag ? "Copied" : "Copy Diagnosis"}</span>
              </button>
              <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Diagnostic Synthesis
              </h4>
              <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[160px] overflow-y-auto border-t border-[#1E293B] pt-2">
                {diagnoseResult}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#1E293B] rounded p-6 text-center bg-[#0A0C10]/20">
              <Terminal className="w-8 h-8 text-slate-700 mb-2" />
              <span className="text-xs text-slate-500 font-mono">REPORTER_TRACE: WAITING</span>
            </div>
          )}
        </div>

        <div className="p-3 bg-[#0F172A] border-t border-[#1E293B] flex justify-end">
          <button
            onClick={handleDiagnose}
            disabled={isDiagnosing || (!logsInput.trim() && !traceInput.trim())}
            className="px-4 py-2 bg-white text-black hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 font-bold rounded text-xs flex items-center gap-2 uppercase tracking-widest transition cursor-pointer"
          >
            {isDiagnosing ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Analyzing Crash dump...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Decompile Trace</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Developer Productivity templates generator */}
      <div className="lg:col-span-6 flex flex-col h-[650px] bg-[#0F172A] border border-[#1E293B] rounded overflow-hidden">
        <div className="bg-[#0F172A] px-4 py-3 border-b border-[#1E293B] flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">AI Developer Productivity Hub</h3>
        </div>

        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Convert user tickets into robust engineering materials. Compile polished pull request descriptions, Conventional Git commit histories, release notes, or mock Jest integration test scripts.
          </p>

          <div className="grid grid-cols-4 gap-1 bg-[#0A0C10] p-1 border border-[#1E293B] rounded">
            {[
              { id: "pr", label: "Pull Request" },
              { id: "commit", label: "Git Commits" },
              { id: "release", label: "Release Note" },
              { id: "testcase", label: "Jest Test" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setProdType(tab.id as any)}
                className={`py-1.5 text-[9px] font-bold uppercase rounded transition cursor-pointer ${
                  prodType === tab.id
                    ? "bg-[#1E293B] text-cyan-400 border border-cyan-800/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="prod-title" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Issue Ticket Summary</label>
            <input
              id="prod-title"
              type="text"
              value={prodTitle}
              onChange={(e) => setProdTitle(e.target.value)}
              placeholder="e.g., State leak inside unmounted PollingWidget causing browser freeze"
              className="px-3 py-2 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-200 focus:outline-hidden focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="prod-desc" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Issue Description / Context</label>
            <textarea
              id="prod-desc"
              value={prodDesc}
              onChange={(e) => setProdDesc(e.target.value)}
              placeholder="Interval is initialized in useEffect but misses a return clearInterval() cleanup function."
              className="px-3 py-2 bg-[#0A0C10] border border-[#1E293B] rounded text-xs text-slate-200 h-20 focus:outline-hidden focus:border-cyan-400 resize-none"
            />
          </div>

          {generationResult ? (
            <div className="mt-2 bg-[#0A0C10] border border-[#1E293B] rounded p-4 relative">
              <button
                onClick={() => copyToClipboard(generationResult, setCopiedProd)}
                className="absolute top-3 right-3 text-[10px] bg-[#0F172A] border border-[#1E293B] hover:bg-[#1E293B] text-slate-300 font-bold px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer"
              >
                {copiedProd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedProd ? "Copied" : "Copy Code"}</span>
              </button>
              <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" /> Generated Enterprise Assets
              </h4>
              <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[160px] overflow-y-auto border-t border-[#1E293B] pt-2">
                {generationResult}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#1E293B] rounded p-6 text-center bg-[#0A0C10]/20">
              <GitBranch className="w-8 h-8 text-slate-700 mb-2" />
              <span className="text-xs text-slate-500 font-mono">ASSET_GEN: WAITING</span>
            </div>
          )}
        </div>

        <div className="p-3 bg-[#0F172A] border-t border-[#1E293B] flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prodTitle.trim()}
            className="px-4 py-2 bg-white text-black hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 font-bold rounded text-xs flex items-center gap-2 uppercase tracking-widest transition cursor-pointer"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Compiling Assets...</span>
              </>
            ) : (
              <>
                <HeartHandshake className="w-3.5 h-3.5 fill-current" />
                <span>Assemble Assets</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="col-span-12 bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded font-mono">
          <strong>Integration Error:</strong> {errorMsg}
        </div>
      )}
    </div>
  );
}
