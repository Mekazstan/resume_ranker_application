import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { RankingResults, LevelingResult } from "@/components/RankingResults";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users, FileText, ChevronRight, X, FileCheck2 } from "lucide-react";

export default function Index() {
  const [resumes, setResumes] = useState<File[]>([]);
  const [results, setResults] = useState<LevelingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleResumeUpload = (files: File[]) => {
    // Merge with existing files, avoiding duplicates by name
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
    if (resumes.length === 0) {
      toast.error("Please upload at least one resume!");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    resumes.forEach((resume) => {
      formData.append("resume_files", resume);
    });

    try {
      const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
      const response = await fetch(`${apiUrl}/rank_resumes/`, {
        method: "POST",
        body: formData,
      });

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
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Premium Header */}
      <div className="bg-slate-900 text-white pt-16 pb-24 px-6 sm:px-12 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-slate-800 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-900 blur-3xl opacity-30" />
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-indigo-300 text-sm font-medium mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Users className="w-4 h-4" /> HR Candidate Levelling Engine
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
            Automate CMS Role Assignments
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Upload one or more candidate resumes and our AI-powered engine will automatically read each CV, extract key metrics like years of experience, qualifications, and relevant skills — then match each candidate to their most appropriate CMS role level (from Programme Assistant all the way to Senior Programme Associate). You'll get a ranked list with scores and a full breakdown of why each candidate qualified.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 relative z-20 pb-20">
        
        {/* Upload Section */}
        <Card className="shadow-lg border-0 ring-1 ring-slate-100/50 transition-shadow hover:shadow-xl duration-300 mb-8 overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm">
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <CardContent className="p-8 sm:p-10">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
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
              <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                  {resumes.length} {resumes.length === 1 ? 'file' : 'files'} queued
                </p>
                {resumes.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileCheck2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-sm font-medium text-slate-800 truncate">{file.name}</span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {(file.size / 1024).toFixed(0)} KB
                      </span>
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
            
            <div className="mt-8 flex justify-end items-center border-t border-slate-100 pt-6">
              <Button 
                size="lg" 
                onClick={handleLevelCandidates} 
                disabled={isLoading || resumes.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all font-semibold px-8 h-12 relative overflow-hidden group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Extracting & Levelling...
                  </>
                ) : (
                  <>
                    Run Matrix Analysis
                    <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800">Levelling Results</h2>
              <div className="text-sm font-medium text-slate-500 px-3 py-1 bg-slate-100 rounded-full">
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
