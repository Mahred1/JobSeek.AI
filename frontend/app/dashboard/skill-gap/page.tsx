'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkillGapAnalysis, MatchedSkill, MissingSkill, ProjectRecommendation } from '@/lib/models/skill-gap';
import { skillGapApi, resumeApi, Resume, ResumeListResponse } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { hasToken, getStoredTokens } from '@/lib/auth';

// Enum for analysis steps
enum AnalysisStep {
  INPUT = 'input',
  ANALYZING = 'analyzing',
  RESULTS = 'results',
}

export default function SkillGapPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromQuery = searchParams.get('tab');
    return tabFromQuery === 'history' ? 'history' : 'new'; // Default to 'new' if not specified or invalid
  });
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>(AnalysisStep.INPUT);

  // Input states
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [storedResumes, setStoredResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [jobPostingUrl, setJobPostingUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Results state
  const [analysisResults, setAnalysisResults] = useState<SkillGapAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<SkillGapAnalysis[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check authentication on component mount
  useEffect(() => {
    if (!hasToken()) {
      router.push('/login');
      return;
    }

    // Load analysis history and resume list when component mounts
    if (isAuthenticated) {
      fetchAnalysisHistory();
      fetchUserResumes();
    }
  }, [isAuthenticated, router]);

  // Effect to update activeTab when query param changes
  useEffect(() => {
    const tabFromQuery = searchParams.get('tab');
    if (tabFromQuery === 'new' || tabFromQuery === 'history') {
      setActiveTab(tabFromQuery);
    }
  }, [searchParams]);

  // Tab change handler to fetch history when tab changes
  useEffect(() => {
    if (activeTab === 'history' && isAuthenticated) {
      fetchAnalysisHistory();
    }
    if (activeTab === 'new' && isAuthenticated) {
      fetchUserResumes();
    }
  }, [activeTab, isAuthenticated]);

  // Fetch user's stored resumes
  const fetchUserResumes = async () => {
    setLoadingResumes(true);
    try {
      const response = await resumeApi.getUserResumes();
      setStoredResumes(response.resumes);
    } catch (err) {
      console.error('Failed to fetch user resumes:', err);
      setError('Failed to load your saved resumes. Please try again later.');
    } finally {
      setLoadingResumes(false);
    }
  };

  // Fetch analysis history
  const fetchAnalysisHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await skillGapApi.getAnalysisHistory();
      setAnalysisHistory(history);
    } catch (err) {
      console.error('Failed to fetch analysis history:', err);
      setError('Failed to fetch your previous analyses. Please try again later.');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setResumeFile(file);

      // Clear resume text and selected resume when file is selected
      setResumeText('');
      setSelectedResumeId('');

      // Visual feedback
      const fileName = document.getElementById('file-name');
      if (fileName) {
        fileName.textContent = file.name;
      }

      // Auto-save the uploaded resume to the user's account
      try {
        // Get filename without extension for the title
        const fileTitle = file.name.split('.').slice(0, -1).join('.') || file.name;
        await resumeApi.uploadResume(file, fileTitle, false);

        // Refresh the list of stored resumes
        await fetchUserResumes();
      } catch (err) {
        console.error('Failed to auto-save resume:', err);
        // Don't show an error to the user since this is a background operation
      }
    }
  };

  // Reset file input
  const resetFileInput = () => {
    setResumeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Clear file name display
    const fileName = document.getElementById('file-name');
    if (fileName) {
      fileName.textContent = 'No file selected';
    }
  };

  // Validate inputs
  const validateInputs = () => {
    // Reset error
    setError(null);

    // Check if resume is provided (either file, text, or stored resume)
    if (!resumeFile && !resumeText && !selectedResumeId) {
      setError('Please upload a resume file, paste your resume text, or select a stored resume');
      return false;
    }

    // Verify the selected resume ID exists in the current resume list
    if (selectedResumeId) {
      const resumeExists = storedResumes.some(resume => resume.id === selectedResumeId);
      if (!resumeExists) {
        setError('The selected resume no longer exists. Please choose another resume or refresh the page.');
        return false;
      }
    }

    // Check if job info is provided (either description or URL)
    if (!jobDescription && !jobPostingUrl) {
      setError('Please enter a job description or provide a job posting URL');
      return false;
    }

    return true;
  };

  // Submit analysis
  const submitAnalysis = async () => {
    // Validate inputs
    if (!validateInputs()) {
      return;
    }

    // Set analyzing state
    setAnalysisStep(AnalysisStep.ANALYZING);

    try {
      let finalResumeId = selectedResumeId;

      // If user uploaded a file but didn't select an existing resume,
      // automatically save the file first
      if (resumeFile && !selectedResumeId) {
        try {
          // Get filename without extension for the title
          const fileName = resumeFile.name;
          const fileTitle = fileName.split('.').slice(0, -1).join('.') || fileName;

          // Save the resume to user's account
          const savedResume = await resumeApi.uploadResume(resumeFile, fileTitle, false);
          finalResumeId = savedResume.id;

          // Refresh stored resumes in the background
          fetchUserResumes().catch(console.error);
        } catch (saveErr) {
          console.error('Failed to auto-save resume file:', saveErr);
          // Continue with analysis even if saving failed
        }
      }
      // If user entered text but didn't select an existing resume,
      // automatically save the text first
      else if (resumeText && !resumeFile && !selectedResumeId) {
        try {
          // Get a generic title based on timestamp
          const title = `Resume ${new Date().toLocaleDateString()}`;

          // Save the resume text to user's account
          const savedResume = await resumeApi.saveResumeText(title, resumeText, false);
          finalResumeId = savedResume.id;

          // Refresh stored resumes in the background
          fetchUserResumes().catch(console.error);
        } catch (saveErr) {
          console.error('Failed to auto-save resume text:', saveErr);
          // Continue with analysis even if saving failed
        }
      }

      // Create request object - use original file/text if saving failed
      const request = {
        resumeFile: finalResumeId ? undefined : (resumeFile || undefined),
        resumeText: finalResumeId ? undefined : (resumeText || undefined),
        resumeId: finalResumeId || undefined,
        jobDescription: jobDescription || undefined,
        jobPostingUrl: jobPostingUrl || undefined,
      };

      // Submit analysis
      const results = await skillGapApi.analyzeSkills(request);

      // Store results
      setAnalysisResults(results);

      // Show results
      setAnalysisStep(AnalysisStep.RESULTS);

      // Automatically fetch history to update with new analysis
      await fetchAnalysisHistory();
    } catch (err) {
      console.error('Failed to analyze resume:', err);
      setError('Failed to analyze your resume. Please try again later.');
      setAnalysisStep(AnalysisStep.INPUT);
    }
  };

  // Save analysis (used by Save button)
  const saveAnalysis = async () => {
    if (!analysisResults) return;

    try {
      // This is just refreshing the history since analyses are already saved on backend
      await fetchAnalysisHistory();
      // Show a brief success message
      alert('Analysis saved successfully!');
    } catch (err) {
      console.error('Failed to save analysis:', err);
      setError('Failed to save your analysis. Please try again.');
    }
  };

  // Reset analysis
  const resetAnalysis = () => {
    // Reset all states
    setResumeFile(null);
    setResumeText('');
    setSelectedResumeId('');
    setJobDescription('');
    setJobPostingUrl('');
    setError(null);
    setAnalysisResults(null);
    setAnalysisStep(AnalysisStep.INPUT);
    resetFileInput();
  };

  // Fetch job description from URL
  const fetchJobDescription = async () => {
    if (!jobPostingUrl) {
      setError('Please enter a job posting URL');
      return;
    }

    try {
      // Show loading state for job description
      setJobDescription('Fetching job description...');

      // Use the real backend service to fetch job description
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/skill-gap/fetch-job-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getStoredTokens()?.access_token || ''}`,
        },
        body: JSON.stringify({ job_posting_url: jobPostingUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job description');
      }

      const data = await response.json();
      setJobDescription(data.job_description);
    } catch (err) {
      console.error('Failed to fetch job description:', err);
      setError('Failed to fetch job description. Please enter it manually.');
      setJobDescription('');
    }
  };

  // Render input form
  const renderInputForm = () => {
    return (
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload Your Resume</CardTitle>
            <CardDescription>
              Upload your resume to analyze it against a job description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stored Resumes Section */}
            {storedResumes.length > 0 && (
              <div className="space-y-2">
                <label className="font-medium text-sm">Select Saved Resume</label>
                <div className="relative">
                  <select
                    value={selectedResumeId}
                    onChange={(e) => {
                      const resumeId = e.target.value;
                      setSelectedResumeId(resumeId);
                      // Clear other resume inputs when stored resume is selected
                      if (resumeId) {
                        setResumeFile(null);
                        setResumeText('');
                        resetFileInput();
                      }
                    }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 appearance-none"
                  >
                    <option value="">Select a saved resume</option>
                    {storedResumes.map((resume) => (
                      <option key={resume.id} value={resume.id}>
                        {resume.title}{resume.is_primary ? " (Primary)" : ""}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {selectedResumeId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedResumeId('')}
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
            )}

            {(storedResumes.length > 0) && (
              <div className="mt-4 relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    OR
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex flex-col space-y-2">
                <label className="font-medium text-sm">Upload Resume File</label>
                <div className="flex items-center space-x-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                    id="resume-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('resume-upload')?.click()}
                  >
                    Choose File
                  </Button>
                  <span id="file-name" className="text-sm text-gray-500">
                    {resumeFile ? resumeFile.name : 'No file selected'}
                  </span>
                  {resumeFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetFileInput}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    OR
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <label className="font-medium text-sm">Paste Resume Text</label>
                <Textarea
                  placeholder="Paste your resume text here..."
                  className="h-48 mt-1"
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    // Clear file input and selected resume if text is entered
                    if (e.target.value) {
                      resetFileInput();
                      setSelectedResumeId('');
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
            <CardDescription>
              Enter job details to compare against your resume
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium text-sm">
                Job Description
              </label>
              <Textarea
                placeholder="Paste the job description here..."
                className="h-48"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <div className="mt-4 relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  OR
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <label className="font-medium text-sm">
                Job Posting URL
              </label>
              <div className="flex space-x-2">
                <Input
                  placeholder="https://example.com/job-posting"
                  value={jobPostingUrl}
                  onChange={(e) => setJobPostingUrl(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchJobDescription}
                >
                  Fetch
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Enter a URL to a job posting and we'll extract the description for you
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetAnalysis}>
              Reset
            </Button>
            <Button onClick={submitAnalysis}>
              Analyze Resume
            </Button>
          </CardFooter>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
      </div>
    );
  };

  // Render analyzing state
  const renderAnalyzing = () => {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Analyzing Your Resume</h2>
        <p className="text-gray-600 text-center max-w-md mb-8">
          We're comparing your resume against the job description and identifying skill gaps...
        </p>
        <p className="text-sm text-gray-500">This may take a minute or two.</p>
      </div>
    );
  };

  // Render results
  const renderResults = () => {
    if (!analysisResults) {
      return (
        <div className="text-center py-12">
          <p>No analysis results available. Please try again.</p>
          <Button className="mt-4" onClick={resetAnalysis}>
            Start New Analysis
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Overall Summary Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-3" />
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <CardTitle className="text-2xl md:text-3xl font-bold">
                  Resume Analysis: {analysisResults.job_title}
                </CardTitle>
                <CardDescription className="text-blue-100 text-base mt-1">
                  {analysisResults.job_posting_url && (
                    <div className="text-sm mb-1">Source: {analysisResults.job_posting_url}</div>
                  )}
                  Overall Match: {analysisResults.match_percentage}% compatibility with job requirements
                </CardDescription>
              </div>
              <div className="flex items-center">
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center">
                  <div className="text-4xl font-extrabold bg-gradient-to-br from-blue-600 to-indigo-700 text-transparent bg-clip-text">
                    {analysisResults.match_percentage}%
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="prose max-w-none">
              <h3 className="text-xl font-medium mb-3 text-gray-800">Executive Summary</h3>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
                <p className="text-gray-700 whitespace-pre-line">{analysisResults.overall_assessment}</p>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-md">
                  <h4 className="font-medium text-green-700 mb-2">Top Strengths</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{analysisResults.top_strengths}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-md">
                  <h4 className="font-medium text-yellow-700 mb-2">Biggest Gaps</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{analysisResults.biggest_gaps}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-700 mb-2">Timeline to Ready</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{analysisResults.timeline_to_ready}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Results */}
        <Tabs defaultValue="matched" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="matched">Matched Skills</TabsTrigger>
            <TabsTrigger value="missing">Skill Gaps</TabsTrigger>
            <TabsTrigger value="projects">Project Ideas</TabsTrigger>
            <TabsTrigger value="next-steps">Next Steps</TabsTrigger>
          </TabsList>

          {/* Matched Skills Tab */}
          <TabsContent value="matched" className="mt-6">
            <div className="mb-4 p-4 bg-gray-50 rounded-md text-sm text-gray-700">
              <p>These skills from your resume match the job requirements. The evidence shows how your experience aligns with what the employer is seeking.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisResults.matched_skills.map((skill, index) => (
                <Card key={index} className="overflow-hidden border border-gray-200 hover:shadow-md transition-all">
                  <div className="h-2 bg-green-500"></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg font-bold text-gray-800">{skill.skill}</CardTitle>
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {skill.level}
                        </span>
                        <span className={`text-xs mt-1 ${skill.meets_requirement ? 'text-green-600' : 'text-yellow-600'}`}>
                          {skill.meets_requirement ? '✓ Meets requirement' : '⚠ Partial match'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 border-l-2 border-green-300">
                      <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Evidence from your resume:</h4>
                      <p className="italic">"{skill.evidence}"</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Missing Skills Tab */}
          <TabsContent value="missing" className="mt-6">
            <div className="mb-4 p-4 bg-gray-50 rounded-md text-sm text-gray-700">
              <p>These are skills mentioned in the job description that were not found or not sufficiently demonstrated in your resume. Focus on these areas to improve your match rate.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysisResults.missing_skills.map((skill, index) => (
                <Card key={index} className="overflow-hidden border border-gray-200 hover:shadow-md transition-all">
                  <div className={`h-2 ${skill.importance === "Critical"
                      ? "bg-red-500"
                      : skill.importance === "Important"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    }`}></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg font-bold text-gray-800">{skill.skill}</CardTitle>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${skill.importance === "Critical"
                          ? "bg-red-100 text-red-800"
                          : skill.importance === "Important"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                        {skill.importance}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Why this skill is needed:</h4>
                        <p className="text-gray-700 text-sm border-l-2 border-gray-200 pl-3">{skill.why_needed}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-500">
                            <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a9.006 9.006 0 00-3.5.339.75.75 0 00-.5.707v11.246a.75.75 0 001.25.672zM12.75 3.33v8.73a.75.75 0 01-.287.592 7.47 7.47 0 01-8.654 1.264.75.75 0 01-.509-.706V4.206a.75.75 0 01.553-.72 8.958 8.958 0 013.897-.36.75.75 0 01.503.397.75.75 0 001.38-.442 2.25 2.25 0 013.117-.905z" />
                          </svg>
                          Learning Path:
                        </h4>
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-sm text-gray-700 whitespace-pre-line">{skill.learning_path}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Project Recommendations Tab */}
          <TabsContent value="projects" className="mt-6">
            <div className="mb-4 p-4 bg-gray-50 rounded-md text-sm text-gray-700">
              <p>Complete these projects to build practical experience with the skills you're missing. Each project is designed to address specific requirements from the job description.</p>
            </div>
            <div className="space-y-6">
              {analysisResults.project_recommendations.map((project, index) => (
                <Card key={index} className="overflow-hidden border border-gray-200 hover:shadow-md transition-all">
                  <div className="h-2 bg-indigo-500"></div>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <CardTitle className="text-xl font-bold text-gray-800">{project.title}</CardTitle>
                      <div className="flex space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {project.difficulty}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {project.time_estimate}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="bg-indigo-50 p-4 rounded-md">
                      <p className="text-gray-700">{project.description}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-indigo-600">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
                        </svg>
                        Skills You'll Gain:
                      </h4>
                      <div className="bg-indigo-50 p-3 rounded-md">
                        <p className="text-sm text-gray-700">{project.skills_gained}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Next Steps Tab */}
          <TabsContent value="next-steps" className="mt-6">
            <div className="mb-4 p-4 bg-gray-50 rounded-md text-sm text-gray-700">
              <p>Follow these actionable steps to improve your candidacy for this position. These recommendations are tailored specifically to your current skill level and the job requirements.</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">Immediate Action Plan</CardTitle>
                <CardDescription>
                  Specific steps you can take right now to improve your chances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
                  <h3 className="text-lg font-medium text-blue-900 mb-3">Next Steps</h3>
                  <div className="text-gray-700 whitespace-pre-line">{analysisResults.next_steps}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-1">Ready to improve your match?</h3>
            <p className="text-sm text-gray-600 mb-3 sm:mb-0">Save this analysis to track your progress or start a new one</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={resetAnalysis} className="sm:order-1">
              Start New Analysis
            </Button>
            <Button className="sm:order-2" onClick={saveAnalysis}>
              Save Analysis
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Main render method
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Skill Gap Analysis</h1>
        <p className="text-gray-500">
          Compare your resume to job descriptions to identify skill gaps and get personalized recommendations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-6">

          <TabsList className="grid grid-cols-2 w-[300px]">
            <TabsTrigger value="new">New Analysis</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="new" className="mt-0">
          {analysisStep === AnalysisStep.INPUT && renderInputForm()}
          {analysisStep === AnalysisStep.ANALYZING && renderAnalyzing()}
          {analysisStep === AnalysisStep.RESULTS && renderResults()}
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          {loadingHistory ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : analysisHistory.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Analysis History</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You haven't performed any skill gap analyses yet. Create your first analysis to get started.
              </p>
              <Button onClick={() => {
                setActiveTab('new');
                setAnalysisStep(AnalysisStep.INPUT);
              }}>
                Create Your First Analysis
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analysisHistory.map((analysis) => (
                <Card key={analysis.id} className="hover:shadow-md transition-all hover:border-blue-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <CardTitle className="line-clamp-1">{analysis.job_title}</CardTitle>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${analysis.match_percentage >= 80
                          ? "bg-green-100 text-green-800"
                          : analysis.match_percentage >= 60
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                        {analysis.match_percentage.toFixed(0)}% Match
                      </span>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {new Date(analysis.createdAt!).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {analysis.matched_skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {skill.skill}
                        </span>
                      ))}
                      {analysis.matched_skills.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                          +{analysis.matched_skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => {
                      setAnalysisResults(analysis);
                      setAnalysisStep(AnalysisStep.RESULTS);
                      setActiveTab('new');
                    }}>
                      View Results
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}