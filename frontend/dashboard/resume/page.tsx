'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resumeApi, skillGapApi } from '@/lib/api';
import { ResumeAnalysisResult, SimpleOptimizedResumeResult } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { hasToken } from '@/lib/auth';
import { Resume } from '@/lib/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Enum for tracking the analysis steps
enum AnalysisStep {
  SELECT = 'select',
  ANALYZING = 'analyzing',
  RESULTS = 'results',
  OPTIMIZED = 'optimized',
}

export default function ResumeEnhancementPage() {
  const router = useRouter();
  const [step, setStep] = useState<AnalysisStep>(AnalysisStep.SELECT);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [optimizedResume, setOptimizedResume] = useState<SimpleOptimizedResumeResult | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState<string | null>(null);
  const [userResumes, setUserResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  // Load user's resumes when the component mounts
  useEffect(() => {
    const fetchResumes = async () => {
      if (!hasToken()) {
        router.push('/login');
        return;
      }
      
      setLoadingResumes(true);
      try {
        const response = await resumeApi.getUserResumes();
        setUserResumes(response.resumes);
        
        // Auto-select primary resume if available
        const primaryResume = response.resumes.find(r => r.is_primary);
        if (primaryResume) {
          setSelectedResume(primaryResume);
        }
      } catch (err) {
        console.error("Failed to fetch resumes:", err);
        setError("Failed to load your resumes");
      } finally {
        setLoadingResumes(false);
      }
    };
    
    fetchResumes();
  }, [router]);

  // Handle resume selection
  const handleResumeSelect = (resumeId: string) => {
    const resume = userResumes.find(r => r.id === resumeId);
    if (resume) {
      setSelectedResume(resume);
    }
  };

  // Start analysis
  const handleStartAnalysis = () => {
    // Validate inputs
    if (!selectedResume) {
      setError('Please select a resume to analyze');
      return;
    }

    // Show loading state
    setStep(AnalysisStep.ANALYZING);

    // Default job title and industry since they're still required by the backend
    const defaultJobTitle = "General Position";
    const defaultIndustry = "Technology";

    // Call the API to analyze the resume
    skillGapApi.analyzeResume(
      selectedResume.id,
      defaultJobTitle,
      defaultIndustry
    )
      .then((result: ResumeAnalysisResult) => {
        setAnalysisResult(result);
        setStep(AnalysisStep.RESULTS);
      })
      .catch((error: Error) => {
        console.error('Resume analysis failed:', error);
        setError(`Analysis failed: ${error.message || 'Unknown error'}`);
        setStep(AnalysisStep.SELECT);
      });
  };

  // Generate optimized resume
  const handleOptimizeResume = () => {
    if (!analysisResult || !selectedResume) return;
    
    setStep(AnalysisStep.ANALYZING);
    
    // Use the same default values for job title and industry
    const defaultJobTitle = "General Position";
    const defaultIndustry = "Technology";
    
    skillGapApi.optimizeResume(
      selectedResume.id,
      defaultJobTitle,
      defaultIndustry,
      analysisResult
    )
      .then((result: SimpleOptimizedResumeResult) => {
        setOptimizedResume(result);
        setStep(AnalysisStep.OPTIMIZED);
      })
      .catch((error: Error) => {
        console.error('Resume optimization failed:', error);
        setError(`Optimization failed: ${error.message || 'Unknown error'}`);
        setStep(AnalysisStep.RESULTS);
      });
  };

  // Reset and start over
  const handleReset = () => {
    setStep(AnalysisStep.SELECT);
    setSelectedResume(null);
    setAnalysisResult(null);
    setOptimizedResume(null);
    setError(null);
  };

  // Download optimized resume
  const handleDownloadResume = () => {
    // This function is no longer needed as we now have separate download functions in the component
  };

  return (
    <div>
      {error && (
        <div className="max-w-3xl mx-auto mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
          <button 
            className="float-right font-bold"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {step === AnalysisStep.SELECT && <ResumeSelectionForm 
        selectedResume={selectedResume}
        userResumes={userResumes}
        handleResumeSelect={handleResumeSelect}
        loadingResumes={loadingResumes}
        handleStartAnalysis={handleStartAnalysis}
      />}
      {step === AnalysisStep.ANALYZING && <AnalyzingView />}
      {step === AnalysisStep.RESULTS && analysisResult && <ResultsView 
        result={analysisResult}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReset={handleReset}
        onOptimize={handleOptimizeResume}
      />}
      {step === AnalysisStep.OPTIMIZED && optimizedResume && <OptimizedResumeView
        optimizedResume={optimizedResume}
        onBack={() => setStep(AnalysisStep.RESULTS)}
        onReset={handleReset}
      />}
    </div>
  );
}

// Simplified resume selection form (no file upload)
function ResumeSelectionForm({ 
  selectedResume, 
  userResumes,
  handleResumeSelect,
  loadingResumes,
  handleStartAnalysis 
}: { 
  selectedResume: Resume | null;
  userResumes: Resume[];
  handleResumeSelect: (resumeId: string) => void;
  loadingResumes: boolean;
  handleStartAnalysis: () => void;
}) {
  const router = useRouter();
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Resume Enhancement</h1>
        <p className="text-gray-600">
          Select a resume from your saved resumes for comprehensive analysis and professional enhancement.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Your Resume</CardTitle>
          <CardDescription>
            Choose a resume to analyze for ATS compatibility, content quality, and structure optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userResumes.length > 0 ? (
            <div className="space-y-4">
              <Label htmlFor="stored-resume">Choose from your saved resumes</Label>
              <div className="grid gap-3">
                {userResumes.map((resume) => (
                  <div
                    key={resume.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedResume?.id === resume.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleResumeSelect(resume.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {resume.title}
                          {resume.is_primary && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Primary
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Created: {new Date(resume.created_at).toLocaleDateString()}
                          {resume.updated_at && (
                            <span className="ml-2">
                              • Updated: {new Date(resume.updated_at).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {selectedResume?.id === resume.id && (
                          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {loadingResumes && (
                <div className="text-sm text-gray-500 text-center">Loading your resumes...</div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No resumes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                You need to upload a resume first before you can analyze it.
              </p>
              <div className="mt-6">
                <Button onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        {userResumes.length > 0 && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">
              {selectedResume ? `Selected: ${selectedResume.title}` : 'No resume selected'}
            </div>
            <Button 
              onClick={handleStartAnalysis} 
              disabled={!selectedResume || loadingResumes}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              Analyze & Enhance Resume
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

// Custom Resume Formatter Component for display
function ResumeFormatter({ markdown }: { markdown: string }) {
  // Parse the markdown into structured sections
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const sections: Array<{ type: string; content: string; level?: number }> = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (trimmed.startsWith('# ')) {
        sections.push({ type: 'h1', content: trimmed.substring(2) });
      } else if (trimmed.startsWith('## ')) {
        sections.push({ type: 'h2', content: trimmed.substring(3) });
      } else if (trimmed.startsWith('### ')) {
        sections.push({ type: 'h3', content: trimmed.substring(4) });
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        sections.push({ type: 'bullet', content: trimmed.substring(2) });
      } else if (trimmed.includes('|') && (trimmed.includes('@') || trimmed.includes('+'))) {
        sections.push({ type: 'contact', content: trimmed });
      } else if (trimmed.includes('|') && (trimmed.includes('2020') || trimmed.includes('2021') || trimmed.includes('2022') || trimmed.includes('2023') || trimmed.includes('2024') || trimmed.includes('Present'))) {
        sections.push({ type: 'job-details', content: trimmed });
      } else if (trimmed.length > 0) {
        sections.push({ type: 'paragraph', content: trimmed });
      }
    }
    
    return sections;
  };

  const sections = parseMarkdown(markdown);

  return (
    <div id="resume-content" className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
      {/* Resume Header Styling */}
      <div className="bg-blue-50 px-8 py-8 border-b-2 border-blue-100">
        {sections.filter(s => s.type === 'h1').map((section, index) => (
          <h1 key={index} className="text-5xl font-bold text-gray-900 text-center mb-4 tracking-tight">
            {section.content}
          </h1>
        ))}
        {sections.filter(s => s.type === 'contact').map((section, index) => (
          <div key={index} className="text-center text-gray-700">
            <div className="flex flex-wrap justify-center gap-6 mt-4">
              {section.content.split('|').map((item, i) => (
                <span key={i} className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                  <span className="text-gray-800 font-medium text-sm">{item.trim()}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Resume Body */}
      <div className="px-8 py-6 space-y-8">
        {(() => {
          const bodySections = sections.filter(s => s.type !== 'h1' && s.type !== 'contact');
          const groupedSections: Array<{ title: string; content: Array<{ type: string; content: string }> }> = [];
          let currentSection: { title: string; content: Array<{ type: string; content: string }> } | null = null;

          for (const section of bodySections) {
            if (section.type === 'h2') {
              if (currentSection) {
                groupedSections.push(currentSection);
              }
              currentSection = { title: section.content, content: [] };
            } else if (currentSection) {
              currentSection.content.push(section);
            }
          }

          if (currentSection) {
            groupedSections.push(currentSection);
          }

          return groupedSections.map((group, groupIndex) => (
            <div key={groupIndex} className="resume-section">
              {/* Section Header */}
              <div className="border-b-2 border-blue-600 pb-2 mb-4">
                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                  {group.title}
                </h2>
              </div>

              {/* Section Content */}
              <div className="space-y-4">
                {(() => {
                  if (group.title.toLowerCase().includes('experience') || group.title.toLowerCase().includes('education')) {
                    // Handle Experience/Education sections with companies/institutions
                    const entries: Array<{ company: string; content: Array<{ type: string; content: string }> }> = [];
                    let currentEntry: { company: string; content: Array<{ type: string; content: string }> } | null = null;

                    for (const item of group.content) {
                      if (item.type === 'h3') {
                        if (currentEntry) {
                          entries.push(currentEntry);
                        }
                        currentEntry = { company: item.content, content: [] };
                      } else if (currentEntry) {
                        currentEntry.content.push(item);
                      }
                    }

                    if (currentEntry) {
                      entries.push(currentEntry);
                    }

                    return entries.map((entry, entryIndex) => (
                      <div key={entryIndex} className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {entry.company}
                        </h3>
                        <div className="ml-4 space-y-2">
                          {entry.content.map((item, itemIndex) => (
                            <div key={itemIndex}>
                              {item.type === 'bullet' ? (
                                <div className="flex items-start">
                                  <span className="text-blue-600 mr-3 mt-1.5 flex-shrink-0">•</span>
                                  <p className="text-gray-700 leading-relaxed text-sm">
                                    {item.content}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-gray-600 text-sm italic mb-2">
                                  {item.content}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  } else {
                    // Handle other sections (Skills, Projects, etc.)
                    return group.content.map((item, itemIndex) => (
                      <div key={itemIndex}>
                        {item.type === 'h3' ? (
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {item.content}
                          </h3>
                        ) : item.type === 'bullet' ? (
                          <div className="flex items-start mb-2">
                            <span className="text-blue-600 mr-3 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-gray-700 leading-relaxed text-sm">
                              {item.content}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-700 mb-3 leading-relaxed">
                            {item.content}
                          </p>
                        )}
                      </div>
                    ));
                  }
                })()}
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}

// Enhanced optimized resume view
function OptimizedResumeView({ 
  optimizedResume, 
  onBack, 
  onReset
}: { 
  optimizedResume: SimpleOptimizedResumeResult;
  onBack: () => void;
  onReset: () => void;
}) {
  const [activeTab, setActiveTab] = useState("resume");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Download as Markdown
  const handleDownloadMarkdown = () => {
    const blob = new Blob([optimizedResume.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized-resume-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download as PDF with proper formatting
  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      // Create a temporary container with inline styles
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '800px';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      
      // Create the PDF-optimized HTML content with inline styles
      const createPDFContent = (markdown: string) => {
        const lines = markdown.split('\n').filter(line => line.trim());
        let htmlContent = '<div style="max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; line-height: 1.6;">';
        
        let currentSection = '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          if (trimmed.startsWith('# ')) {
            htmlContent += `<h1 style="font-size: 42px; font-weight: bold; color: #111827; text-align: center; margin: 0 0 20px 0; letter-spacing: -0.025em;">${trimmed.substring(2)}</h1>`;
          } else if (trimmed.startsWith('## ')) {
            if (currentSection) htmlContent += '</div>';
            currentSection = trimmed.substring(3);
            htmlContent += `<div style="margin: 30px 0;"><h2 style="font-size: 18px; font-weight: bold; color: #111827; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin: 0 0 16px 0;">${currentSection}</h2>`;
          } else if (trimmed.startsWith('### ')) {
            htmlContent += `<h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 16px 0 8px 0;">${trimmed.substring(4)}</h3>`;
          } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            htmlContent += `<div style="display: flex; align-items: flex-start; margin: 6px 0;"><span style="color: #2563eb; margin-right: 12px; margin-top: 6px; flex-shrink: 0;">•</span><p style="color: #374151; line-height: 1.6; font-size: 14px; margin: 0;">${trimmed.substring(2)}</p></div>`;
          } else if (trimmed.includes('|') && (trimmed.includes('@') || trimmed.includes('+'))) {
            const contactItems = trimmed.split('|').map(item => item.trim());
            htmlContent += '<div style="text-align: center; margin: 20px 0;"><div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 16px;">';
            contactItems.forEach(item => {
              htmlContent += `<span style="background: #eff6ff; padding: 6px 12px; border-radius: 20px; font-size: 14px; color: #1f2937; border: 1px solid #dbeafe;">${item}</span>`;
            });
            htmlContent += '</div></div>';
          } else if (trimmed.length > 0) {
            htmlContent += `<p style="color: #374151; margin: 8px 0; line-height: 1.6; font-size: 14px;">${trimmed}</p>`;
          }
        }
        
        if (currentSection) htmlContent += '</div>';
        htmlContent += '</div>';
        return htmlContent;
      };
      
      tempContainer.innerHTML = createPDFContent(optimizedResume.markdown);
      document.body.appendChild(tempContainer);

      // Configure html2canvas for high quality
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200,
        windowHeight: 800
      });

      // Remove temporary element
      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename with date
      const fileName = `enhanced-resume-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Save the PDF
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">🎉 Resume Enhanced Successfully!</h1>
        <p className="text-xl text-gray-600">
          Your resume has been professionally optimized with an estimated improvement of <span className="font-bold text-green-600">+{optimizedResume.improvement_score} points</span>
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg rounded-xl p-2">
          <TabsTrigger value="resume" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Enhanced Resume</TabsTrigger>
          <TabsTrigger value="changes" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Key Changes</TabsTrigger>
        </TabsList>

        {/* Enhanced Resume Tab */}
        <TabsContent value="resume">
          <Card className="shadow-lg">
            <CardHeader className="bg-blue-50 border-b border-blue-100">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                Your Professionally Enhanced Resume
              </CardTitle>
              <CardDescription>
                Ready to download and use for your job applications
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[800px] overflow-y-auto p-6 bg-gray-50 border-t">
                <ResumeFormatter markdown={optimizedResume.markdown} />
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t border-gray-200 flex justify-between">
              <div className="flex gap-3">
                <Button variant="outline" onClick={onBack}>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Back to Analysis
                </Button>
                <Button variant="ghost" onClick={onReset}>
                  Start Over
                </Button>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleDownloadMarkdown}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download Markdown
                </Button>
                <Button 
                  onClick={handleDownloadPDF} 
                  disabled={isGeneratingPdf}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isGeneratingPdf ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Key Changes Tab */}
        <TabsContent value="changes">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Key Improvements Made</CardTitle>
              <CardDescription>
                Summary of the major enhancements applied to your resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizedResume.changes_summary.map((change, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                    </div>
                    <p className="text-gray-700">{change}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component for the analyzing state
function AnalyzingView() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <div className="relative w-24 h-24">
        <div className="w-24 h-24 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin"></div>
        <div className="w-24 h-24 rounded-full border-l-4 border-r-4 border-t-4 border-blue-200 animate-spin absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Your Resume</h2>
        <div className="max-w-md mx-auto">
          <p className="text-gray-600 mb-4">
            We're analyzing your resume for ATS compatibility, content quality, and structure to provide detailed recommendations.
          </p>
          <div className="flex flex-col space-y-3">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-gray-600">Extracting resume content</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center animate-pulse mr-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-sm text-gray-600">Checking ATS compatibility</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center mr-3">
              </div>
              <span className="text-sm text-gray-500">Analyzing content and structure</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center mr-3">
              </div>
              <span className="text-sm text-gray-500">Generating recommendations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for the results view
function ResultsView({ 
  result, 
  activeTab,
  setActiveTab,
  onReset,
  onOptimize
}: { 
  result: ResumeAnalysisResult;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onReset: () => void;
  onOptimize: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section with Overall Score */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">Resume Analysis Complete</h1>
              <p className="text-xl text-blue-100 mb-2">
                {result.target_job_title} • {result.target_industry} Industry
              </p>
              <p className="text-lg text-blue-200 mb-6">
                Analysis Date: {new Date(result.analysis_date).toLocaleDateString()}
              </p>
              
              {/* Quick Score Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{result.ats_score || 0}%</div>
                  <div className="text-sm text-blue-200">ATS Score</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{result.content_score || 0}%</div>
                  <div className="text-sm text-blue-200">Content</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{result.format_score || 0}%</div>
                  <div className="text-sm text-blue-200">Format</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{result.impact_score || 0}%</div>
                  <div className="text-sm text-blue-200">Impact</div>
                </div>
              </div>
            </div>
            
            {/* Overall Score Circle */}
            <div className="flex-shrink-0">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <path 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="3"
                  />
                  <path 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray={`${result.overall_score || 0}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold">{result.overall_score || 0}%</div>
                  <div className="text-sm text-blue-200">Overall Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6 bg-white shadow-lg rounded-xl p-2">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="ats" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">ATS Analysis</TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Content</TabsTrigger>
            <TabsTrigger value="format" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Format</TabsTrigger>
            <TabsTrigger value="impact" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Impact</TabsTrigger>
            <TabsTrigger value="improvements" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Improvements</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Overall Feedback */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-3.707-8.293a1 1 0 011.414 0L10 10.586 11.707 8.879a1 1 0 111.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Overall Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    {(result.overall_feedback || "No overall feedback available.").split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Industry Benchmark */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Industry Benchmark
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <span className="font-medium">Industry Ranking</span>
                    <span className="text-2xl font-bold text-blue-600">{result.industry_benchmark?.percentile_ranking || 0}th percentile</span>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-green-700">Competitive Advantages</h4>
                    <ul className="space-y-1">
                      {(result.industry_benchmark?.competitive_advantages || []).map((advantage, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span className="text-sm">{advantage}</span>
                        </li>
                      ))}
                      {(!result.industry_benchmark?.competitive_advantages || result.industry_benchmark.competitive_advantages.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No competitive advantages identified</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-orange-700">Improvement Priorities</h4>
                    <ul className="space-y-1">
                      {(result.industry_benchmark?.improvement_priorities || []).map((priority, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-1">→</span>
                          <span className="text-sm">{priority}</span>
                        </li>
                      ))}
                      {(!result.industry_benchmark?.improvement_priorities || result.industry_benchmark.improvement_priorities.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No improvement priorities identified</li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Score Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ScoreCard 
                title="ATS Compatibility" 
                score={result.ats_score || 0} 
                description="How well your resume passes through Applicant Tracking Systems"
                icon={
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                color="blue"
              />
              <ScoreCard 
                title="Content Quality" 
                score={result.content_score || 0} 
                description="The strength and impact of your resume content"
                icon={
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                }
                color="green"
              />
              <ScoreCard 
                title="Format & Structure" 
                score={result.format_score || 0} 
                description="The organization and visual appeal of your resume"
                icon={
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                }
                color="purple"
              />
              <ScoreCard 
                title="Impact & Effectiveness" 
                score={result.impact_score || 0} 
                description="How compelling and memorable your resume is"
                icon={
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                }
                color="orange"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button 
                onClick={onOptimize}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
                Optimize My Resume
              </Button>
              <Button 
                onClick={onReset}
                variant="outline"
                size="lg"
                className="px-8 py-3"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Start New Analysis
              </Button>
            </div>
          </TabsContent>

          {/* ATS Analysis Tab */}
          <TabsContent value="ats" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>ATS Compatibility Analysis</CardTitle>
                <CardDescription>How well your resume performs with Applicant Tracking Systems</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ATS Score Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{result.ats_compatibility?.keyword_optimization || 0}%</div>
                    <div className="text-sm text-gray-600">Keyword Optimization</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.ats_compatibility?.format_compatibility || 0}%</div>
                    <div className="text-sm text-gray-600">Format Compatibility</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{result.ats_compatibility?.section_structure || 0}%</div>
                    <div className="text-sm text-gray-600">Section Structure</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{result.ats_compatibility?.file_format_score || 0}%</div>
                    <div className="text-sm text-gray-600">File Format</div>
                  </div>
                </div>

                {/* Keyword Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-700">Keywords Found ({(result.ats_compatibility?.matched_keywords || []).length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {(result.ats_compatibility?.matched_keywords || []).slice(0, 15).map((keyword, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                      {(result.ats_compatibility?.matched_keywords || []).length > 15 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                          +{(result.ats_compatibility?.matched_keywords || []).length - 15} more
                        </span>
                      )}
                      {(!result.ats_compatibility?.matched_keywords || result.ats_compatibility.matched_keywords.length === 0) && (
                        <span className="text-sm text-gray-500 italic">No keywords identified</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-red-700">Missing Keywords ({(result.ats_compatibility?.missing_keywords || []).length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {(result.ats_compatibility?.missing_keywords || []).slice(0, 15).map((keyword, index) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                      {(result.ats_compatibility?.missing_keywords || []).length > 15 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                          +{(result.ats_compatibility?.missing_keywords || []).length - 15} more
                        </span>
                      )}
                      {(!result.ats_compatibility?.missing_keywords || result.ats_compatibility.missing_keywords.length === 0) && (
                        <span className="text-sm text-gray-500 italic">No missing keywords identified</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ATS Feedback */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-700">ATS Strengths</h4>
                    <ul className="space-y-2">
                      {(result.ats_compatibility?.strengths || []).map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                      {(!result.ats_compatibility?.strengths || result.ats_compatibility.strengths.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No ATS strengths identified</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-red-700">ATS Issues</h4>
                    <ul className="space-y-2">
                      {(result.ats_compatibility?.issues || []).map((issue, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">✗</span>
                          <span className="text-sm">{issue}</span>
                        </li>
                      ))}
                      {(!result.ats_compatibility?.issues || result.ats_compatibility.issues.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No ATS issues identified</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-700">Recommendations</h4>
                    <ul className="space-y-2">
                      {(result.ats_compatibility?.recommendations || []).map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">→</span>
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                      {(!result.ats_compatibility?.recommendations || result.ats_compatibility.recommendations.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No recommendations available</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Quality Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Content Quality Analysis</CardTitle>
                <CardDescription>Evaluation of your resume's content strength and impact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Content Score Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{result.content_quality?.achievement_focus || 0}%</div>
                    <div className="text-sm text-gray-600">Achievement Focus</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.content_quality?.quantification || 0}%</div>
                    <div className="text-sm text-gray-600">Quantification</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{result.content_quality?.action_verbs || 0}%</div>
                    <div className="text-sm text-gray-600">Action Verbs</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{result.content_quality?.relevance || 0}%</div>
                    <div className="text-sm text-gray-600">Relevance</div>
                  </div>
                </div>

                {/* Content Examples */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-700">Strong Bullet Points</h4>
                    <ul className="space-y-2">
                      {(result.content_quality?.strong_bullets || []).slice(0, 5).map((bullet, index) => (
                        <li key={index} className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                          "{bullet}"
                        </li>
                      ))}
                      {(!result.content_quality?.strong_bullets || result.content_quality.strong_bullets.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No strong bullet points identified</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-red-700">Weak Bullet Points</h4>
                    <ul className="space-y-2">
                      {(result.content_quality?.weak_bullets || []).slice(0, 5).map((bullet, index) => (
                        <li key={index} className="p-3 bg-red-50 border-l-4 border-red-400 rounded text-sm">
                          "{bullet}"
                        </li>
                      ))}
                      {(!result.content_quality?.weak_bullets || result.content_quality.weak_bullets.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No weak bullet points identified</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Content Feedback */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-700">Content Strengths</h4>
                    <ul className="space-y-2">
                      {(result.content_quality?.strengths || []).map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                      {(!result.content_quality?.strengths || result.content_quality.strengths.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No content strengths identified</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-red-700">Content Weaknesses</h4>
                    <ul className="space-y-2">
                      {(result.content_quality?.weaknesses || []).map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">✗</span>
                          <span className="text-sm">{weakness}</span>
                        </li>
                      ))}
                      {(!result.content_quality?.weaknesses || result.content_quality.weaknesses.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No content weaknesses identified</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-700">Recommendations</h4>
                    <ul className="space-y-2">
                      {(result.content_quality?.recommendations || []).map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">→</span>
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                      {(!result.content_quality?.recommendations || result.content_quality.recommendations.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No recommendations available</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Format & Structure Tab */}
          <TabsContent value="format" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Format & Structure Analysis</CardTitle>
                <CardDescription>Evaluation of your resume's visual design and organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Format Score Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{result.format_structure?.visual_hierarchy || 0}%</div>
                    <div className="text-sm text-gray-600">Visual Hierarchy</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.format_structure?.consistency || 0}%</div>
                    <div className="text-sm text-gray-600">Consistency</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{result.format_structure?.readability || 0}%</div>
                    <div className="text-sm text-gray-600">Readability</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{result.format_structure?.length_appropriateness || 0}%</div>
                    <div className="text-sm text-gray-600">Length Appropriateness</div>
                  </div>
                </div>

                {/* Format Feedback */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-700">Format Strengths</h4>
                    <ul className="space-y-2">
                      {(result.format_structure?.strengths || []).map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                      {(!result.format_structure?.strengths || result.format_structure.strengths.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No format strengths identified</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-red-700">Format Issues</h4>
                    <ul className="space-y-2">
                      {(result.format_structure?.issues || []).map((issue, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">✗</span>
                          <span className="text-sm">{issue}</span>
                        </li>
                      ))}
                      {(!result.format_structure?.issues || result.format_structure.issues.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No format issues identified</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-700">Recommendations</h4>
                    <ul className="space-y-2">
                      {(result.format_structure?.recommendations || []).map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">→</span>
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                      {(!result.format_structure?.recommendations || result.format_structure.recommendations.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No recommendations available</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Impact & Effectiveness Tab */}
          <TabsContent value="impact" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Impact & Effectiveness Analysis</CardTitle>
                <CardDescription>How compelling and memorable your resume is to hiring managers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Impact Score Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{result.impact_effectiveness?.first_impression || 0}%</div>
                    <div className="text-sm text-gray-600">First Impression</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.impact_effectiveness?.differentiation || 0}%</div>
                    <div className="text-sm text-gray-600">Differentiation</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{result.impact_effectiveness?.value_proposition || 0}%</div>
                    <div className="text-sm text-gray-600">Value Proposition</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{result.impact_effectiveness?.memorability || 0}%</div>
                    <div className="text-sm text-gray-600">Memorability</div>
                  </div>
                </div>

                {/* Impact Feedback */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-700">Impact Strengths</h4>
                    <ul className="space-y-2">
                      {(result.impact_effectiveness?.strengths || []).map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                      {(!result.impact_effectiveness?.strengths || result.impact_effectiveness.strengths.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No impact strengths identified</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-red-700">Impact Weaknesses</h4>
                    <ul className="space-y-2">
                      {(result.impact_effectiveness?.weaknesses || []).map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">✗</span>
                          <span className="text-sm">{weakness}</span>
                        </li>
                      ))}
                      {(!result.impact_effectiveness?.weaknesses || result.impact_effectiveness.weaknesses.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No impact weaknesses identified</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-700">Recommendations</h4>
                    <ul className="space-y-2">
                      {(result.impact_effectiveness?.recommendations || []).map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">→</span>
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                      {(!result.impact_effectiveness?.recommendations || result.impact_effectiveness.recommendations.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No recommendations available</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Improvements Tab */}
          <TabsContent value="improvements" className="space-y-6">
            {/* Quick Wins */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Quick Wins - Implement This Week
                </CardTitle>
                <CardDescription>Easy improvements with high impact potential</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(result.quick_wins || []).map((win, index) => (
                    <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-700">{win}</p>
                      </div>
                    </div>
                  ))}
                  {(!result.quick_wins || result.quick_wins.length === 0) && (
                    <div className="col-span-2 text-center text-gray-500 italic py-8">
                      No quick wins identified
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Critical Improvements */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Critical Improvements - High Priority
                </CardTitle>
                <CardDescription>Essential changes that will significantly impact your success rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(result.critical_improvements || []).map((improvement, index) => (
                    <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-700">{improvement}</p>
                      </div>
                    </div>
                  ))}
                  {(!result.critical_improvements || result.critical_improvements.length === 0) && (
                    <div className="text-center text-gray-500 italic py-8">
                      No critical improvements identified
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bullet Point Improvements */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Bullet Point Improvements</CardTitle>
                <CardDescription>Specific examples of how to enhance your bullet points</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(result.bullet_improvements || []).slice(0, 5).map((improvement, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          Example {index + 1}
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          +{improvement.impact_increase || 0}% Impact
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded">
                          <p className="text-sm font-medium text-red-800 mb-1">Before:</p>
                          <p className="text-sm text-gray-700">"{improvement.original || 'No original text available'}"</p>
                        </div>
                        
                        <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
                          <p className="text-sm font-medium text-green-800 mb-1">After:</p>
                          <p className="text-sm text-gray-700">"{improvement.improved || 'No improved text available'}"</p>
                        </div>
                        
                        <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                          <p className="text-sm font-medium text-blue-800 mb-1">Why it's better:</p>
                          <p className="text-sm text-gray-700">{improvement.explanation || 'No explanation available'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!result.bullet_improvements || result.bullet_improvements.length === 0) && (
                    <div className="text-center text-gray-500 italic py-8">
                      No bullet point improvements available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Strengths */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Your Top Strengths
                </CardTitle>
                <CardDescription>What makes your resume competitive</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(result.top_strengths || []).map((strength, index) => (
                    <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-700">{strength}</p>
                      </div>
                    </div>
                  ))}
                  {(!result.top_strengths || result.top_strengths.length === 0) && (
                    <div className="col-span-2 text-center text-gray-500 italic py-8">
                      No top strengths identified
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Score Card Component for displaying individual scores
function ScoreCard({ 
  title, 
  score, 
  description, 
  icon, 
  color = "blue" 
}: { 
  title: string; 
  score: number; 
  description: string; 
  icon: React.ReactNode; 
  color?: string;
}) {
  const getColorClasses = (color: string, score: number) => {
    const baseClasses = {
      blue: "from-blue-500 to-blue-600 bg-blue-50 text-blue-600",
      green: "from-green-500 to-green-600 bg-green-50 text-green-600", 
      purple: "from-purple-500 to-purple-600 bg-purple-50 text-purple-600",
      orange: "from-orange-500 to-orange-600 bg-orange-50 text-orange-600",
      red: "from-red-500 to-red-600 bg-red-50 text-red-600"
    };
    
    // Determine color based on score if not specified
    if (score >= 85) return baseClasses.green;
    if (score >= 70) return baseClasses.blue;
    if (score >= 50) return baseClasses.orange;
    return baseClasses.red;
  };

  const colorClasses = getColorClasses(color, score);
  const [gradientFrom, gradientTo, bgClass, textClass] = colorClasses.split(' ');

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-full ${bgClass} flex items-center justify-center`}>
            <div className={textClass}>
              {icon}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{score}%</div>
            <div className="text-sm text-gray-500">Score</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo} transition-all duration-500`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card> 
  );
} 