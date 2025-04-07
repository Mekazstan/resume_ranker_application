
import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { RankingResults } from "@/components/RankingResults";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface RankingResult {
  filename: string;
  score: number;
  reasoning: string;
}

const Index = () => {
  const [jobDescription, setJobDescription] = useState<File | null>(null);
  const [resumes, setResumes] = useState<File[]>([]);
  const [rankingResults, setRankingResults] = useState<RankingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleJobDescriptionUpload = (files: File[]) => {
    if (files.length > 0) {
      setJobDescription(files[0]);
      toast.success("Job description uploaded successfully!");
    }
  };

  const handleResumeUpload = (files: File[]) => {
    setResumes(files);
    toast.success(`${files.length} resumes uploaded successfully!`);
  };

  const handleRankResumes = async () => {
    // Validate inputs
    if (!jobDescription) {
      toast.error("Please upload a job description!");
      return;
    }

    if (resumes.length === 0) {
      toast.error("Please upload at least one resume!");
      return;
    }

    setIsLoading(true);

    try {
      // In a real application, you would send the files to your backend API
      // For this example, we'll simulate a response after a short delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response - in a real app, you'd get this from your API
      const mockResponse: RankingResult[] = [
        {
          "filename": "Resume1.docx",
          "score": 9,
          "reasoning": "The candidate's resume demonstrates a strong match with the job description. They have 8+ years of experience in designing, developing, and deploying scalable web applications using Python and Django, which aligns with the job's primary requirements. The candidate's experience with RESTful API design, cloud platforms (AWS), and version control systems (Git) also matches the job's required skills. Additionally, their experience in mentoring junior developers, participating in code reviews, and contributing to architectural decisions aligns with the job's responsibilities. The only area where the candidate's experience is not explicitly mentioned is in containerization technologies (Docker, Kubernetes) and frontend technologies (React, Angular, Vue.js), which are listed as preferred skills. However, the candidate does mention experience with Docker, which partially fulfills this preference."
        },
        {
          "filename": "Resume2.txt",
          "score": 4,
          "reasoning": "The candidate has some experience in Python and API development, but their primary expertise lies in Java and Spring framework. They have basic knowledge of AWS and Git, which are required skills for the job. However, they lack experience in Django, relational databases, and cloud platforms, which are crucial for the Senior Software Engineer position. The candidate's eagerness to expand their skills in Python-based technologies is a positive aspect, but it does not compensate for the lack of direct experience in the required skills."
        },
        {
          "filename": "Resume3.pdf",
          "score": 2,
          "reasoning": "The candidate's resume shows a strong focus on frontend development with JavaScript frameworks like React and Angular, but the job description requires a Senior Software Engineer with expertise in Python, Django, and backend technologies. Although the candidate has some basic knowledge of backend technologies and version control systems like Git, their overall experience and skills do not align closely with the job requirements."
        }
      ];
      
      setRankingResults(mockResponse);
      toast.success("Resumes ranked successfully!");
    } catch (error) {
      console.error("Error ranking resumes:", error);
      toast.error("Failed to rank resumes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Resume Ranker</h1>
          <p className="mt-2 text-lg text-gray-600">
            Upload a job description and resumes to find the best match
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Upload Job Description</h2>
              <FileUpload 
                id="job-description" 
                label="Job Description File" 
                accept=".pdf,.docx" 
                multiple={false}
                onFilesSelected={handleJobDescriptionUpload}
              />
              {jobDescription && (
                <p className="mt-2 text-sm text-green-600">
                  Selected: {jobDescription.name}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Upload Resumes</h2>
              <FileUpload 
                id="resumes" 
                label="Resume Files" 
                accept=".pdf,.docx" 
                multiple={true}
                onFilesSelected={handleResumeUpload}
              />
              {resumes.length > 0 && (
                <p className="mt-2 text-sm text-green-600">
                  {resumes.length} file(s) selected
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={handleRankResumes} 
              disabled={isLoading || !jobDescription || resumes.length === 0}
              className="px-8 py-6 text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Ranking Resumes...
                </>
              ) : (
                "Rank Resumes"
              )}
            </Button>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Ranking Results</h2>
            {rankingResults.length > 0 ? (
              <RankingResults results={rankingResults} />
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-gray-500">
                  No results yet. Upload files and click "Rank Resumes" to see results.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
