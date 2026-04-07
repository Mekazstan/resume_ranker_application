import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Briefcase, GraduationCap, CheckCircle, Search, ShieldAlert, Tag, AudioLines, AlertTriangle, TrendingUp } from "lucide-react";
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

export const RankingResults = ({ results }: RankingResultsProps) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getQualText = (val: number) => {
    if (val === 1) return "OND/Diploma";
    if (val === 2) return "BSc";
    if (val === 3) return "MSc/MPH";
    if (val === 4) return "PhD";
    return "Not detected";
  };

  const getLevelColor = (level: string) => {
    if (level === "None" || level === "Error") return "bg-red-50 text-red-700 border-red-200";
    if (level.startsWith("PAS")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (level.startsWith("PO"))  return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (level.startsWith("JPA")) return "bg-violet-50 text-violet-700 border-violet-200";
    if (level.startsWith("PRA")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (level.startsWith("SPA")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {results.map((result, idx) => {
        const key = `${result.filename}-${idx}`;
        const isExpanded = !!expandedItems[key];
        const isInvalid = result.assigned_level === "None" || result.assigned_level === "Error";

        return (
          <Card key={key} className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            {/* Card Header */}
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-4 flex-1">
                <div className={cn(
                  "flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 shrink-0 shadow-inner",
                  isInvalid
                    ? "border-red-100 bg-red-50 text-red-600"
                    : "border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100"
                )}>
                  <span className="text-xl font-bold">
                    {Math.round(result.score)}
                    <span className="text-xs text-gray-500">%</span>
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                      {result.filename.replace('.pdf', '').replace('.docx', '').replace('.txt', '')}
                    </h3>
                    <Badge variant="outline" className={cn("px-2.5 py-0.5 font-semibold", getLevelColor(result.assigned_level))}>
                      {result.assigned_level}
                    </Badge>
                  </div>

                  {result.metrics && (
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-2 flex-wrap">
                      <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {result.metrics.total_exp}y Total</div>
                      <div className="flex items-center gap-1.5"><Search className="w-4 h-4" /> {result.metrics.ph_exp}y Africa PH</div>
                      <div className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> {getQualText(result.metrics.qualification)}</div>
                      {result.metrics.certifications !== undefined && (
                        <div className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> {result.metrics.certifications} cert(s)</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => toggleItem(key)}
                className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors whitespace-nowrap self-start md:self-auto"
              >
                {isExpanded ? "Hide Analysis" : "View Full Analysis"}
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Expanded Analysis */}
            {isExpanded && (
              <div className="border-t border-gray-100 bg-slate-50/40 px-5 pb-6 pt-4 space-y-5 animate-in slide-in-from-top-2">

                {/* Section 1: AI Reasoning */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-2 font-semibold text-gray-800 text-sm">
                    {isInvalid
                      ? <ShieldAlert className="w-4 h-4 text-red-500" />
                      : <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    Automated Analysis
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{result.reasoning}</p>
                </div>

                {/* Section 2: Extracted CV Signals */}
                {result.metrics && (result.metrics.keywords_found || result.metrics.verbs_found) && (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="font-semibold text-gray-800 text-sm mb-3">Signals Extracted from CV</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" /> Domain Keywords Found ({result.metrics.keywords_found?.length ?? 0})
                        </p>
                        {result.metrics.keywords_found && result.metrics.keywords_found.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {result.metrics.keywords_found.map((kw) => (
                              <span key={kw} className="px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-medium">{kw}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">None detected from the keyword dictionary</span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5">
                          <AudioLines className="w-3.5 h-3.5" /> Seniority Verbs Found ({result.metrics.verbs_found?.length ?? 0})
                        </p>
                        {result.metrics.verbs_found && result.metrics.verbs_found.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {result.metrics.verbs_found.map((v) => (
                              <span key={v} className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-medium">{v}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">None detected from the verb dictionary</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3a: Matrix Math Breakdown (qualified candidates) */}
                {result.breakdown && !isInvalid && (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="font-semibold text-gray-800 text-sm mb-3">Matrix Score Breakdown ({result.assigned_level})</div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                      {Object.entries(result.breakdown).map(([key, val]) => {
                        const [earned, max] = val.split("/").map(Number);
                        const pct = max > 0 ? earned / max : 0;
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500 font-medium">{key}</span>
                              <span className="font-mono text-gray-800 font-semibold">{val}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", pct >= 0.7 ? "bg-emerald-400" : pct >= 0.4 ? "bg-amber-400" : "bg-red-400")}
                                style={{ width: `${Math.round(pct * 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 3b: For "None" — Closest level score breakdown + Gate Analysis */}
                {isInvalid && (
                  <>
                    {/* Closest level score breakdown */}
                    {result.closest_level && (
                      <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4">
                        <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm mb-1">
                          <TrendingUp className="w-4 h-4 text-amber-500" />
                          Closest Match: {result.closest_level.level}
                          <span className="ml-auto text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            {result.closest_level.gap} pts short of {result.closest_level.threshold}% threshold
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          All hard gates were passed for this level, but the candidate scored <strong>{result.closest_level.score}%</strong> — needing <strong>{result.closest_level.threshold}%</strong>.
                          Below is how each factor contributed:
                        </p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                          {Object.entries(result.closest_level.breakdown).map(([k, val]) => {
                            const [earned, max] = val.split("/").map(Number);
                            const pct = max > 0 ? earned / max : 0;
                            return (
                              <div key={k}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-500 font-medium">{k}</span>
                                  <span className="font-mono text-gray-800 font-semibold">{val}</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={cn("h-full rounded-full", pct >= 0.7 ? "bg-emerald-400" : pct >= 0.4 ? "bg-amber-400" : "bg-red-400")}
                                    style={{ width: `${Math.round(pct * 100)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Gate analysis for failed levels */}
                    {result.gate_analysis && result.gate_analysis.length > 0 && (
                      <div className="bg-white rounded-xl border border-red-100 shadow-sm p-4">
                        <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm mb-3">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          Hard Gate Analysis (Entry-Level Checks)
                        </div>
                        <p className="text-xs text-gray-400 mb-3">
                          Showing the 3 most basic levels (PAS-1 to PAS-3). A ✗ means the candidate failed that mandatory requirement.
                        </p>
                        <div className="space-y-3">
                          {result.gate_analysis.map((record) => (
                            <div key={record.level} className="border border-gray-100 rounded-lg overflow-hidden">
                              <div className="px-3 py-2 bg-slate-50 text-xs font-bold text-slate-700 border-b border-gray-100">
                                {record.level}
                              </div>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-400 border-b border-gray-50">
                                    <th className="text-left py-1.5 px-3 font-medium">Criterion</th>
                                    <th className="text-left py-1.5 px-3 font-medium">Required</th>
                                    <th className="text-left py-1.5 px-3 font-medium">Candidate Has</th>
                                    <th className="text-right py-1.5 px-3 font-medium">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {record.gates.map((gate) => (
                                    <tr key={gate.criterion} className={cn("border-b border-gray-50 last:border-0", !gate.passed && "bg-red-50/40")}>
                                      <td className="py-1.5 px-3 font-medium text-gray-700">{gate.criterion}</td>
                                      <td className="py-1.5 px-3 text-gray-500">{gate.required}</td>
                                      <td className="py-1.5 px-3 text-gray-700">{gate.has}</td>
                                      <td className="py-1.5 px-3 text-right">
                                        {gate.passed
                                          ? <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">✓ Pass</span>
                                          : <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                                              ✗ Fail {gate.gap > 0 && <span className="text-red-400 font-normal">({gate.gap}y short)</span>}
                                            </span>
                                        }
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
                  </>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};
