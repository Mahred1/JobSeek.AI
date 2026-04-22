"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { learningPathsApi, skillGapApi, resumeAnalysisApi } from "@/lib/api";
import { LearningPath } from "@/lib/models/learning-path";
import {
  mockResumeAnalysis,
  ResumeAnalysis,
} from "@/lib/models/resume-analysis";
import { SkillGapAnalysis } from "@/lib/models/skill-gap";

export default function Dashboard() {
  const { user } = useAuth();
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [skillAnalyses, setSkillAnalyses] = useState<SkillGapAnalysis[]>([]);
  const [resumeAnalyses, setResumeAnalyses] = useState<ResumeAnalysis[]>([]);
  const [loadingPaths, setLoadingPaths] = useState(false);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [loadingResume, setLoadingResume] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingPaths(true);
        setLoadingAnalyses(true);
        setLoadingResume(true);

        const paths = await learningPathsApi.getUserPaths();
        setLearningPaths(paths);

        const analyses = await skillGapApi.getAnalysisHistory();
        setSkillAnalyses(analyses);

        try {
          const resumeAnalysisData = await resumeAnalysisApi.getUserAnalyses();

          const transformedAnalyses = resumeAnalysisData.map(
            (analysis: any) => ({
              id: analysis.id,
              userId: analysis.userId,
              overallScore: analysis.analysis_result?.overall_score || 0,
              categoryScores: [
                {
                  category: "ATS Compatibility",
                  score: analysis.analysis_result?.ats_score || 0,
                },
                {
                  category: "Content Quality",
                  score: analysis.analysis_result?.content_score || 0,
                },
                {
                  category: "Format & Structure",
                  score: analysis.analysis_result?.format_score || 0,
                },
                {
                  category: "Impact & Effectiveness",
                  score: analysis.analysis_result?.impact_score || 0,
                },
              ],
              recommendations: [
                ...(analysis.analysis_result?.critical_improvements
                  ?.slice(0, 3)
                  .map((improvement: string) => ({
                    text: improvement,
                    type: "improvement" as const,
                  })) || []),
                ...(analysis.analysis_result?.top_strengths
                  ?.slice(0, 2)
                  .map((strength: string) => ({
                    text: strength,
                    type: "positive" as const,
                  })) || []),
              ],
              createdAt: new Date(analysis.createdAt),
            })
          );

          setResumeAnalyses(transformedAnalyses);
        } catch (resumeError) {
          console.error("Failed to fetch resume analyses:", resumeError);
          // Fall back to mock data if API fails
          setResumeAnalyses([mockResumeAnalysis]);
        }

        console.log("Fetched analyses:", analyses);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError("Failed to load your data. Please try again later.");
      } finally {
        setLoadingPaths(false);
        setLoadingAnalyses(false);
        setLoadingResume(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Use the most recent analysis or mock data
  const latestResumeAnalysis =
    resumeAnalyses.length > 0 ? resumeAnalyses[0] : mockResumeAnalysis;

  // Helper function to get status color based on match percentage
  const getStatusColor = (matchPercentage: number): string => {
    if (matchPercentage >= 75) return "bg-green-500";
    if (matchPercentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Helper function to get status text based on match percentage
  const getStatusText = (matchPercentage: number): string => {
    if (matchPercentage >= 75) return "High match";
    if (matchPercentage >= 50) return "Medium match";
    return "Low match";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.full_name || "User"}
        </h1>
        <p className="text-gray-500">
          Track your career preparation progress and start new analyses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Skill Analysis</CardTitle>
            <CardDescription>Total skill gaps identified</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-600">
                  {skillAnalyses.reduce(
                    (total, analysis) => total + analysis.missing_skills.length,
                    0
                  )}
                </p>
                <p className="text-sm text-green-600">
                  {skillAnalyses.length > 0
                    ? `From ${skillAnalyses.length} job analyses`
                    : "No analyses yet"}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m22 8-6 4 6 4V8Z"></path>
                  <rect x="2" y="6" width="14" height="12" rx="2"></rect>
                  <path d="M6 12h.01"></path>
                  <path d="M10 12h.01"></path>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Resume Score</CardTitle>
            <CardDescription>Latest enhancement score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-orange-500">
                  {latestResumeAnalysis.overallScore}
                  <span className="text-xl">/100</span>
                </p>
                <p className="text-sm text-green-600">+12 from previous</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
                  <path d="M5 12V5a2 2 0 0 1 2-2h7l5 5v4"></path>
                  <path d="M5 21h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2Z"></path>
                  <path d="M7 17h.01"></path>
                  <path d="M11 17h.01"></path>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Learning Paths</CardTitle>
            <CardDescription>Your personalized journeys</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-indigo-600">
                  {learningPaths.length}
                </p>
                <p className="text-sm text-gray-600">
                  <Link
                    href="/dashboard/learning-paths"
                    className="hover:underline"
                  >
                    {learningPaths.length > 0
                      ? "View your paths"
                      : "Create your first path"}
                  </Link>
                </p>
              </div>
              <Link
                href="/dashboard/learning-paths"
                className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v8"></path>
                  <path d="m16 4-4 4-4-4"></path>
                  <path d="M3 12h10"></path>
                  <path d="m7 16-4-4 4-4"></path>
                  <path d="M21 12h-4"></path>
                  <path d="M12 22v-8"></path>
                  <path d="m16 20-4-4-4 4"></path>
                </svg>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Analyses</CardTitle>
                <CardDescription>
                  Your latest skill gap analyses
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Link href="/dashboard/skill-gap">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAnalyses ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : skillAnalyses.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No skill gap analyses yet.</p>
                <Button className="mt-3" size="sm">
                  <Link href="/dashboard/skill-gap">
                    Start Your First Analysis
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {skillAnalyses.slice(0, 3).map((analysis, i) => (
                  <div
                    key={analysis.id}
                    className="flex items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold">
                      {analysis.job_title.charAt(0)}
                    </div>
                    <div className="ml-4 flex-grow">
                      <p className="font-medium">{analysis.job_title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(
                          analysis.createdAt || new Date()
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusColor(
                          analysis.match_percentage
                        )} mr-2`}
                      ></div>
                      <span className="text-sm">
                        {getStatusText(analysis.match_percentage)}
                      </span>
                    </div>
                  </div>
                ))}
                {skillAnalyses.length > 3 && (
                  <div className="text-center pt-2">
                    <Link
                      href="/dashboard/skill-gap"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View all {skillAnalyses.length} analyses
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Learning Paths</CardTitle>
                <CardDescription>
                  Continue your personalized learning journey
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Link href="/dashboard/learning-paths">Create New</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPaths ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-md">
                {error}
              </div>
            ) : learningPaths.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 8v4"></path>
                    <path d="M12 16h.01"></path>
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">
                  You haven't created any learning paths yet.
                </p>
                <Button>
                  <Link href="/dashboard/learning-paths">
                    Create Your First Path
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {learningPaths.slice(0, 3).map((path, i) => (
                  <Link
                    href={`/dashboard/learning-paths/${path.id}`}
                    key={path.id}
                  >
                    <div className="flex p-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg cursor-pointer">
                      <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                        <span className="text-lg font-bold">
                          {path.niche.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4 flex-grow">
                        <p className="font-medium">{path.title}</p>
                        <p className="text-xs text-gray-500">{path.niche}</p>
                        <div className="flex mt-1">
                          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                            {path.estimatedTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {learningPaths.length > 3 && (
                  <div className="text-center pt-2">
                    <Link
                      href="/dashboard/learning-paths"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View all {learningPaths.length} learning paths
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resume Status</CardTitle>
                <CardDescription>Latest enhancement feedback</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Link href="/dashboard/resume">Enhance Resume</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Category Scores</h4>
                <div className="space-y-4">
                  {latestResumeAnalysis.categoryScores.map(
                    (category, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">
                            {category.category}
                          </span>
                          <span className="text-sm font-medium">
                            {category.score}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-orange-500 h-2 rounded-full"
                            style={{ width: `${category.score}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Top Recommendations</h4>
                <ul className="space-y-2">
                  {latestResumeAnalysis.recommendations.map(
                    (recommendation, index) => (
                      <li key={index} className="flex items-start">
                        {recommendation.type === "improvement" ? (
                          <svg
                            className="w-5 h-5 text-orange-500 mt-0.5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            ></path>
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-green-500 mt-0.5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                        )}
                        <span className="text-sm">{recommendation.text}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
