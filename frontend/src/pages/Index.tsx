import { useState, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { RankingResults, LevelingResult } from "@/components/RankingResults";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, ChevronRight, X, FileCheck2, CheckCircle2 } from "lucide-react";

const LOADING_STEPS = [
  "Parsing resume documents…",
  "Extracting experience, qualifications & keywords…",
  "Running CMS matrix scoring engine…",
  "Ranking candidates by level…",
];

export default function Index() {
  const [resumes, setResumes] = useState<File[]>([]);
  const [results, setResults] = useState<LevelingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Cycle through loading steps while processing
  useEffect(() => {
    if (!isLoading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s));
    }, 2800);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleResumeUpload = (files: File[]) => {
    setResumes((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const added = files.filter((f) => !existing.has(f.name));
      const merged = [...prev, ...added];
      toast.success(`${merged.length} resume(s) queued — add more or remove files below.`);
      return merged;
    });
  };

  const handleRemoveResume = (name: string) => {
    setResumes((prev) => prev.filter((f) => f.name !== name));
  };

  const handleLevelCandidates = async () => {
    if (resumes.length === 0) { toast.error("Please upload at least one resume!"); return; }

    setIsLoading(true);
    const formData = new FormData();
    resumes.forEach((resume) => formData.append("resume_files", resume));

    try {
      const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
      const response = await fetch(`${apiUrl}/rank_resumes/`, { method: "POST", body: formData });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`Analysis failed: ${errorData?.error || response.statusText}`);
        return;
      }

      const data: LevelingResult[] = await response.json();
      setResults(data);
      toast.success("Candidates successfully leveled!");
    } catch (error) {
      console.error("Error leveling resumes:", error);
      toast.error("Failed to connect to scoring engine.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>

      {/* ── Loading Overlay ── */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md">
          {/* Wave bars */}
          <div className="flex items-end gap-1.5 h-12 mb-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 rounded-full bg-gradient-to-t from-indigo-500 to-violet-400 animate-wave-bar"
                style={{ height: "40px", animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          {/* Step indicators */}
          <div className="space-y-2 text-center max-w-xs">
            {LOADING_STEPS.map((step, i) => (
              <div
                key={step}
                className={`flex items-center gap-2 text-sm transition-all duration-500 ${
                  i < loadingStep ? "text-emerald-400 opacity-60" :
                  i === loadingStep ? "text-white font-semibold opacity-100 scale-105" :
                  "text-slate-500 opacity-40"
                }`}
              >
                {i < loadingStep ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${i === loadingStep ? "border-indigo-400" : "border-slate-600"}`} />
                )}
                {step}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-6">This may take up to a minute for multiple resumes</p>
        </div>
      )}

      {/* ── Animated Hero ── */}
      <div className="relative overflow-hidden rounded-b-[3rem] shadow-2xl">
        {/* Gradient mesh background */}
        <div
          className="absolute inset-0 animate-gradient"
          style={{
            background: "linear-gradient(135deg, #0f172a, #1e1b4b, #0c1a2e, #14013b, #0f172a)",
          }}
        />

        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-float absolute top-8 left-[10%] w-64 h-64 rounded-full bg-indigo-600/20 blur-3xl" style={{ animationDelay: "0s" }} />
          <div className="animate-float absolute top-4 right-[8%] w-80 h-80 rounded-full bg-violet-700/20 blur-3xl" style={{ animationDelay: "1.5s" }} />
          <div className="animate-float-slow absolute bottom-0 left-[40%] w-56 h-56 rounded-full bg-blue-600/15 blur-3xl" style={{ animationDelay: "0.8s" }} />
        </div>

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #a5b4fc 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-white pt-20 pb-28 px-6 sm:px-12 text-center max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-6"
            style={{ animation: "fade-in 0.5s ease both" }}
          >
            <Users className="w-4 h-4" /> AI-Powered HR Levelling
          </div>

          <h1
            className="text-5xl sm:text-6xl font-black tracking-tight mb-4 bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #ffffff 0%, #c7d2fe 50%, #a5b4fc 100%)",
              animation: "fade-in 0.7s ease 0.1s both",
            }}
          >
            TalentTier
          </h1>

          <p
            className="text-lg text-slate-300/90 max-w-xl mx-auto leading-relaxed"
            style={{ animation: "fade-in 0.9s ease 0.2s both" }}
          >
            Upload candidate resumes and instantly get an AI-powered CMS level assignment — with full scoring transparency.
          </p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-14 relative z-20 pb-24">

        {/* Upload Card */}
        <Card className="shadow-xl border-0 ring-1 ring-slate-200/60 mb-8 overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl">
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 animate-gradient" />
          <CardContent className="p-8 sm:p-10">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-800">
              <FileText className="w-5 h-5 text-indigo-500" /> Candidate Upload
            </h2>

            <FileUpload
              id="resumes"
              label="Drag & Drop Resumes (.pdf, .docx)"
              accept=".pdf,.docx,.txt"
              multiple={true}
              onFilesSelected={handleResumeUpload}
            />

            {resumes.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  {resumes.length} {resumes.length === 1 ? "file" : "files"} queued
                </p>
                {resumes.map((file, i) => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl group"
                    style={{ animation: `fade-in 0.3s ease ${i * 0.06}s both` }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileCheck2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-sm font-medium text-slate-800 truncate">{file.name}</span>
                      <span className="text-xs text-slate-400 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <button
                      onClick={() => handleRemoveResume(file.name)}
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
              <Button
                size="lg"
                onClick={handleLevelCandidates}
                disabled={isLoading || resumes.length === 0}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all font-semibold px-8 h-12 group border-0"
              >
                Run Matrix Analysis
                <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800">Levelling Results</h2>
              <div className="text-sm font-semibold text-indigo-600 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                {results.length} Candidates Processed
              </div>
            </div>
            <RankingResults results={results} />
          </div>
        )}
      </div>
    </div>
  );
}
