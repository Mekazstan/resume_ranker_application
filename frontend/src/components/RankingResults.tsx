import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Briefcase, GraduationCap, Search, ShieldAlert, Tag, AudioLines, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface Metrics {
  total_exp: number;
  ph_exp: number;
  qualification: number;
  certifications?: number;
  keywords_found?: string[];
  verbs_found?: string[];
}

export interface GateRecord {
  criterion: string;
  required: string;
  has: string;
  passed: boolean;
  gap: number;
}

export interface GateAnalysisItem {
  level: string;
  gates: GateRecord[];
}

export interface ClosestLevel {
  level: string;
  score: number;
  threshold: number;
  gap: number;
  breakdown: Record<string, string>;
}

export interface LevelingResult {
  filename: string;
  assigned_level: string;
  score: number;
  reasoning: string;
  metrics?: Metrics;
  breakdown?: Record<string, string>;
  gate_analysis?: GateAnalysisItem[];
  closest_level?: ClosestLevel;
}

interface RankingResultsProps {
  results: LevelingResult[];
}

/* ─── Animated count-up hook ─────────────────────────────────────── */
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return value;
}

/* ─── SVG Score Ring ─────────────────────────────────────────────── */
function ScoreRing({ score, level }: { score: number; level: string }) {
  const display = useCountUp(Math.round(score), 1300);
  const isInvalid = level === "None" || level === "Error";

  const circumference = 2 * Math.PI * 28; // r=28
  const dash = (display / 100) * circumference;

  const color = isInvalid
    ? "#ef4444"
    : score >= 70 ? "#10b981"
    : score >= 45 ? "#f59e0b"
    : "#6366f1";

  const trackColor = isInvalid ? "#fee2e2" : "#e5e7eb";

  return (
    <div className="relative w-[72px] h-[72px] shrink-0">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        {/* Track */}
        <circle cx="32" cy="32" r="28" fill="none" stroke={trackColor} strokeWidth="5" />
        {/* Fill */}
        <circle
          cx="32" cy="32" r="28"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.05s linear" }}
        />
      </svg>
      {/* Center number */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-extrabold leading-none" style={{ color }}>
          {display}
        </span>
        <span className="text-[9px] text-slate-400 leading-none mt-0.5">%</span>
      </div>
    </div>
  );
}

/* ─── Animated progress bar ────────────────────────────────────── */
function ScoreBar({ pct, delay = 0 }: { pct: number; delay?: number }) {
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => setWidth(Math.round(pct * 100)), delay);
    return () => clearTimeout(timerRef.current);
  }, [pct, delay]);

  const bg = pct >= 0.7 ? "bg-emerald-400" : pct >= 0.4 ? "bg-amber-400" : "bg-rose-400";

  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", bg)}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

/* ─── Helper: qualification text ────────────────────────────────── */
function qualText(val: number) {
  if (val === 1) return "OND/Diploma";
  if (val === 2) return "BSc";
  if (val === 3) return "MSc/MPH";
  if (val === 4) return "PhD";
  return "Not detected";
}

/* ─── Level badge colour ─────────────────────────────────────── */
function levelStyles(level: string) {
  if (level === "None" || level === "Error") return "bg-red-50 text-red-700 border-red-200";
  if (level.startsWith("PAS")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (level.startsWith("PO"))  return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (level.startsWith("JPA")) return "bg-violet-50 text-violet-700 border-violet-200";
  if (level.startsWith("PRA")) return "bg-amber-50 text-amber-700 border-amber-200";
  if (level.startsWith("SPA")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

/* ─── Main Component ─────────────────────────────────────────── */
export const RankingResults = ({ results }: RankingResultsProps) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-4">
      {results.map((result, idx) => {
        const key = `${result.filename}-${idx}`;
        const isExpanded = !!expandedItems[key];
        const isInvalid = result.assigned_level === "None" || result.assigned_level === "Error";

        return (
          <div
            key={key}
            className="rounded-2xl overflow-hidden border border-white/60 bg-white/80 backdrop-blur-xl shadow-md hover:shadow-xl transition-shadow duration-300"
            style={{ animation: `fade-in 0.4s ease ${idx * 0.1}s both` }}
          >
            {/* Thin accent bar */}
            <div
              className={cn(
                "h-0.5 w-full",
                isInvalid
                  ? "bg-red-400"
                  : "bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-400"
              )}
            />

            {/* Card header */}
            <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
              {/* Score ring */}
              <ScoreRing score={result.score} level={result.assigned_level} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h3 className="font-bold text-lg text-slate-900 truncate">
                    {result.filename.replace(/\.(pdf|docx|txt)$/i, "")}
                  </h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-2.5 py-0.5 font-bold text-xs tracking-wide animate-pulse-badge",
                      levelStyles(result.assigned_level)
                    )}
                  >
                    {result.assigned_level}
                  </Badge>
                </div>

                {result.metrics && (
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" /> {result.metrics.total_exp}y Total
                    </span>
                    <span className="flex items-center gap-1">
                      <Search className="w-3.5 h-3.5" /> {result.metrics.ph_exp}y Africa PH
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" /> {qualText(result.metrics.qualification)}
                    </span>
                    {result.metrics.certifications !== undefined && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" /> {result.metrics.certifications} cert(s)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Toggle */}
              <button
                onClick={() => toggle(key)}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl transition-colors whitespace-nowrap self-start md:self-auto"
              >
                {isExpanded ? "Hide" : "View Analysis"}
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* ── Expanded Analysis ── */}
            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50/60 px-5 pb-6 pt-5 space-y-4">

                {/* Reasoning */}
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                    {isInvalid
                      ? <ShieldAlert className="w-4 h-4 text-red-400" />
                      : <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    Automated Analysis
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{result.reasoning}</p>
                </div>

                {/* Extracted CV Signals */}
                {result.metrics && (result.metrics.keywords_found || result.metrics.verbs_found) && (
                  <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-800 mb-3">Signals Extracted from CV</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" /> Domain Keywords ({result.metrics.keywords_found?.length ?? 0})
                        </p>
                        {result.metrics.keywords_found?.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {result.metrics.keywords_found.map((kw) => (
                              <span key={kw} className="px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-medium">{kw}</span>
                            ))}
                          </div>
                        ) : <span className="text-xs text-slate-400 italic">None from the keyword list</span>}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                          <AudioLines className="w-3.5 h-3.5" /> Seniority Verbs ({result.metrics.verbs_found?.length ?? 0})
                        </p>
                        {result.metrics.verbs_found?.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {result.metrics.verbs_found.map((v) => (
                              <span key={v} className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-medium">{v}</span>
                            ))}
                          </div>
                        ) : <span className="text-xs text-slate-400 italic">None from the verb list</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Score breakdown — qualified */}
                {result.breakdown && !isInvalid && (
                  <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-800 mb-4">
                      Matrix Score Breakdown
                      <span className="ml-2 text-xs font-normal text-slate-400">({result.assigned_level})</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      {Object.entries(result.breakdown).map(([label, val], i) => {
                        const [earned, max] = val.split("/").map(Number);
                        const pct = max > 0 ? earned / max : 0;
                        return (
                          <div key={label}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-500 font-medium">{label}</span>
                              <span className="font-mono font-bold text-slate-800">{val}</span>
                            </div>
                            <ScoreBar pct={pct} delay={i * 80} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Closest level — failed candidates */}
                {isInvalid && result.closest_level && (
                  <div className="bg-white rounded-xl border border-amber-100 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-semibold text-slate-800">
                        Closest Match: {result.closest_level.level}
                      </span>
                      <span className="ml-auto text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                        {result.closest_level.gap} pts short of {result.closest_level.threshold}% threshold
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Hard gates were passed for this level, but the candidate scored <strong>{result.closest_level.score}%</strong> vs the required <strong>{result.closest_level.threshold}%</strong>.
                      Factor contributions:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      {Object.entries(result.closest_level.breakdown).map(([label, val], i) => {
                        const [earned, max] = val.split("/").map(Number);
                        const pct = max > 0 ? earned / max : 0;
                        return (
                          <div key={label}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-500 font-medium">{label}</span>
                              <span className="font-mono font-bold text-slate-800">{val}</span>
                            </div>
                            <ScoreBar pct={pct} delay={i * 80} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Gate analysis table — failed candidates */}
                {isInvalid && result.gate_analysis && result.gate_analysis.length > 0 && (
                  <div className="bg-white rounded-xl border border-red-100 p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      Hard Gate Analysis — Entry Level Checks
                    </div>
                    <p className="text-xs text-slate-400 mb-4">
                      Showing the 3 most basic levels (PAS-1 to PAS-3). A ✗ indicates a mandatory requirement was not met.
                    </p>
                    <div className="space-y-3">
                      {result.gate_analysis.map((record) => (
                        <div key={record.level} className="border border-slate-100 rounded-xl overflow-hidden">
                          <div className="px-3 py-2 bg-slate-50 text-xs font-bold text-slate-600 border-b border-slate-100">
                            {record.level}
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-slate-400 border-b border-slate-50">
                                <th className="text-left py-1.5 px-3 font-medium">Criterion</th>
                                <th className="text-left py-1.5 px-3 font-medium">Required</th>
                                <th className="text-left py-1.5 px-3 font-medium">Candidate</th>
                                <th className="text-right py-1.5 px-3 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {record.gates.map((gate) => (
                                <tr
                                  key={gate.criterion}
                                  className={cn("border-b border-slate-50 last:border-0", !gate.passed && "bg-red-50/50")}
                                >
                                  <td className="py-1.5 px-3 font-medium text-slate-700">{gate.criterion}</td>
                                  <td className="py-1.5 px-3 text-slate-500">{gate.required}</td>
                                  <td className="py-1.5 px-3 text-slate-700">{gate.has}</td>
                                  <td className="py-1.5 px-3 text-right">
                                    {gate.passed
                                      ? <span className="text-emerald-600 font-bold">✓ Pass</span>
                                      : <span className="text-red-600 font-bold">
                                          ✗ Fail {gate.gap > 0 && <span className="font-normal text-red-400">({gate.gap}y short)</span>}
                                        </span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
