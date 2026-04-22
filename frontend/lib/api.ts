import { AuthTokens, UserProfile, getStoredTokens } from "./auth";
import {
  LearningPath,
  LearningPathRequest,
  LearningPathStats,
  Niche,
  PathQuestion,
} from "./models/learning-path";
import {
  SkillGapAnalysis,
  SkillGapAnalysisRequest,
  ProjectRecommendation,
  SkillLearningResources,
} from "./models/skill-gap";
import { hasToken } from "./auth";
import {
  ResumeAnalysisResult,
  OptimizedResumeResult,
  SimpleOptimizedResumeResult,
  ATSCompatibilityScore,
  ContentQualityScore,
  FormatStructureScore,
  ImpactScore as ResumeImpactScore,
  BulletPointExample,
  IndustryBenchmark as ResumeIndustryBenchmark,
} from "./models/resume-analysis";

// Resume types
export interface Resume {
  id: string;
  title: string;
  content: string;
  file_name?: string;
  is_primary: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ResumeListResponse {
  resumes: Resume[];
  total: number;
}

// Re-export the updated interfaces with proper type exports
export type {
  ResumeAnalysisResult,
  OptimizedResumeResult,
  SimpleOptimizedResumeResult,
  ATSCompatibilityScore,
  ContentQualityScore,
  FormatStructureScore,
  BulletPointExample,
} from "./models/resume-analysis";

// Rename conflicting types
export type ResumeImpactScoreType = ResumeImpactScore;
export type ResumeIndustryBenchmarkType = ResumeIndustryBenchmark;

// Legacy interfaces for backward compatibility
export interface SectionAnalysis {
  score: number;
  feedback: string;
  suggestions: string[];
  beforeExample?: string;
  afterExample?: string;
  bulletPoints?: {
    before: string;
    after: string;
  }[];
}

export interface ContentIssue {
  type: string;
  instances: number;
  examples: string[];
  recommendations: string[];
}

export interface ATSIssue {
  type: string;
  issue: string;
  impact: string;
  solution: string;
}

export interface KeywordAnalysis {
  matched: string[];
  missing: string[];
  recommendations: string[];
}

export interface IndustryBenchmark {
  overallRanking: string;
  topAreaForImprovement: string;
  competitiveEdge: string;
}

export interface QuantifyImpactScore {
  score: number;
  quantifiedBullets: string[];
  nonQuantifiedBullets: string[];
  improvementSuggestions: string[];
}

export interface ActionVerbScore {
  score: number;
  strongVerbs: string[];
  weakVerbs: string[];
  recommendedAlternatives: Record<string, string[]>;
}

export interface TenseConsistencyScore {
  score: number;
  inconsistencies: string[];
  recommendations: string[];
}

export interface AccomplishmentScore {
  score: number;
  responsibilityStatements: string[];
  accomplishmentStatements: string[];
  transformationSuggestions: Record<string, string>;
}

export interface ImpactScore {
  quantifyImpact: QuantifyImpactScore;
  actionVerbs: ActionVerbScore;
  tenseConsistency: TenseConsistencyScore;
  accomplishmentOrientation: AccomplishmentScore;
  overallScore: number;
}

export interface BrevityScore {
  bulletPointUsage: number;
  bulletPointLength: number;
  fillerWordUsage: number;
  pageDensity: number;
  overallScore: number;
  suggestions: string[];
}

export interface StyleScore {
  buzzwordUsage: number;
  dateFormatting: number;
  contactDetails: number;
  readability: number;
  personalPronouns: number;
  activeVoice: number;
  bulletConsistency: number;
  overallScore: number;
  suggestions: string[];
}

export interface SectionScore {
  experienceSections: number;
  educationSection: number;
  skillsSection: number;
  unnecessarySections: string[];
  overallScore: number;
  suggestions: string[];
}

export interface SoftSkillsScore {
  communication: number;
  analyticalThinking: number;
  teamwork: number;
  overallScore: number;
  suggestions: string[];
}

export interface ATSScore {
  keywordRelevance: number;
  jobMatch: number;
  formatCompatibility: number;
  overallScore: number;
  suggestions: string[];
}

// Legacy interface - keeping for backward compatibility
export interface LegacyResumeAnalysisResult {
  impact: ImpactScore;
  brevity: BrevityScore;
  style: StyleScore;
  sections: SectionScore;
  softSkills: SoftSkillsScore;
  ats: ATSScore;

  // Summary scores
  atsScore: number;
  formatScore: number;
  contentScore: number;
  overallScore: number;

  // Target information
  industry: string;
  jobTitle: string;

  // Section analysis
  sectionAnalysis: Record<string, SectionAnalysis>;
  atsIssues: ATSIssue[];
  keywordMatch: KeywordAnalysis;
  contentIssues: ContentIssue[];
  industryBenchmark: IndustryBenchmark;
}

// Define API base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Interface for login request
interface LoginRequest {
  username: string; // Uses username for OAuth2 compatibility
  password: string;
}

// Interface for registration request
interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

// Interface for update profile request
interface UpdateProfileRequest {
  full_name: string;
  // Add any other necessary fields for updating the profile
}

// Generic fetch function with authentication and error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Add default headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add auth token if available
  const tokens = getStoredTokens();
  if (tokens?.access_token) {
    headers["Authorization"] = `Bearer ${tokens.access_token}`;
  } else {
    // Log authentication issues - in a real app you might want to redirect here
    console.warn(
      `API call to ${endpoint} attempted without authentication token`
    );

    // For endpoints that require authentication, throw an error
    if (
      endpoint.includes("/learning-paths/generate") ||
      endpoint.includes("/learning-paths/user") ||
      endpoint === "/auth/me" ||
      endpoint.includes("/skill-gap/")
    ) {
      throw new Error("Authentication required. Please log in.");
    }
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Handle HTTP errors
    if (!response.ok) {
      let errorData;
      let errorMsg = `HTTP error! Status: ${response.status}`;

      try {
        errorData = await response.json();
        errorMsg = errorData.detail || errorMsg;
      } catch (e) {
        // If we can't parse JSON, use the default error message
      }

      // Special handling for authentication errors
      if (response.status === 401) {
        console.error("Authentication failed:", errorMsg);
        errorMsg = `Authentication failed (401): ${errorMsg}`;
      }

      throw new Error(errorMsg);
    }

    // Parse JSON response
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
}

// Auth API functions
export const authApi = {
  // Login endpoint
  login: async (email: string, password: string): Promise<AuthTokens> => {
    // Convert to FormData for OAuth2 compatibility with FastAPI
    const formData = new URLSearchParams();
    formData.append("username", email); // FastAPI OAuth2 uses 'username'
    formData.append("password", password);

    return fetchApi<AuthTokens>("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });
  },

  // Register endpoint
  register: async (userData: RegisterRequest): Promise<UserProfile> => {
    return fetchApi<UserProfile>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Get current user profile
  getProfile: async (): Promise<UserProfile> => {
    return fetchApi<UserProfile>("/auth/me");
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    return fetchApi<UserProfile>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

// Learning Paths API functions
export const learningPathsApi = {
  // Get all available niches
  getNiches: async (): Promise<Niche[]> => {
    return await fetchApi<Niche[]>("/learning-paths/niches");
  },

  // Get questions for tailoring learning path based on niche
  getQuestions: async (
    nicheId: number,
    useAi: boolean = true
  ): Promise<PathQuestion[]> => {
    return await fetchApi<PathQuestion[]>(
      `/learning-paths/questions?nicheId=${nicheId}&use_ai=${useAi}`
    );
  },

  // Generate a learning path based on user's answers
  generatePath: async (request: LearningPathRequest): Promise<LearningPath> => {
    return await fetchApi<LearningPath>("/learning-paths/generate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  // Save a learning path to user's account
  savePath: async (path: LearningPath): Promise<LearningPath> => {
    return await fetchApi<LearningPath>("/learning-paths/save", {
      method: "POST",
      body: JSON.stringify(path),
    });
  },

  // Get user's saved learning paths
  getUserPaths: async (): Promise<LearningPath[]> => {
    return await fetchApi<LearningPath[]>("/learning-paths/user");
  },

  // Get a specific learning path by ID
  getPathById: async (id: string): Promise<LearningPath> => {
    return await fetchApi<LearningPath>(`/learning-paths/${id}`);
  },

  // Update a learning path
  updatePath: async (id: string, path: Partial<LearningPath>): Promise<LearningPath> => {
    return await fetchApi<LearningPath>(`/learning-paths/${id}`, {
      method: "PUT",
      body: JSON.stringify(path),
    });
  },

  // Delete a learning path
  deletePath: async (id: string): Promise<void> => {
    return await fetchApi<void>(`/learning-paths/${id}`, {
      method: "DELETE",
    });
  },

  // Progress Tracking Functions

  // Update module progress
  updateModuleProgress: async (
    pathId: string,
    moduleId: number,
    progress: {
      completed?: boolean;
      progress?: number;
      notes?: string;
      target_completion_date?: string;
    }
  ): Promise<LearningPath> => {
    return await fetchApi<LearningPath>(`/learning-paths/${pathId}/progress/module`, {
      method: "PUT",
      body: JSON.stringify({
        module_id: moduleId,
        ...progress,
      }),
    });
  },

  // Update resource progress
  updateResourceProgress: async (
    pathId: string,
    moduleId: number,
    resourceId: string,
    progress: {
      completed?: boolean;
      notes?: string;
      rating?: number;
      time_spent_minutes?: number;
    }
  ): Promise<LearningPath> => {
    return await fetchApi<LearningPath>(`/learning-paths/${pathId}/progress/resource`, {
      method: "PUT",
      body: JSON.stringify({
        module_id: moduleId,
        resource_id: resourceId,
        ...progress,
      }),
    });
  },

  // Add custom resource to a module
  addCustomResource: async (
    pathId: string,
    moduleId: number,
    resource: {
      type: string;
      name: string;
      link: string;
      rating?: number;
      description?: string;
    }
  ): Promise<LearningPath> => {
    return await fetchApi<LearningPath>(`/learning-paths/${pathId}/resources/custom`, {
      method: "POST",
      body: JSON.stringify({
        module_id: moduleId,
        resource,
      }),
    });
  },

  // Get learning path statistics
  getPathStats: async (pathId: string): Promise<LearningPathStats> => {
    return await fetchApi<LearningPathStats>(`/learning-paths/${pathId}/stats`);
  },

  // Update path notes
  updatePathNotes: async (pathId: string, notes: string): Promise<void> => {
    return await fetchApi<void>(`/learning-paths/${pathId}/notes`, {
      method: "PUT",
      body: JSON.stringify({ notes }),
    });
  },

  // Update target completion date
  updateTargetDate: async (pathId: string, targetDate: string): Promise<void> => {
    return await fetchApi<void>(`/learning-paths/${pathId}/target-date`, {
      method: "PUT",
      body: JSON.stringify({ target_date: targetDate }),
    });
  },
};

// Skill Gap Analysis API functions
export const skillGapApi = {
  // Analyze resume and job description to identify skill gaps
  analyzeSkills: async (
    data: SkillGapAnalysisRequest
  ): Promise<SkillGapAnalysis> => {
    // For file uploads, we need to use FormData
    const formData = new FormData();

    if (data.resumeFile) {
      formData.append("resume_file", data.resumeFile);
    }

    if (data.resumeText) {
      formData.append("resume_text", data.resumeText);
    }

    if (data.resumeId) {
      formData.append("resume_id", data.resumeId);
    }

    if (data.githubUrl) {
      formData.append("github_url", data.githubUrl);
    }

    if (data.jobDescription) {
      formData.append("job_description", data.jobDescription);
    }

    if (data.jobPostingUrl) {
      formData.append("job_posting_url", data.jobPostingUrl);
    }

    // Get the stored auth token
    const tokens = getStoredTokens();
    const authHeader = tokens?.access_token
      ? `Bearer ${tokens.access_token}`
      : "";

    // Make a direct fetch call instead of using fetchApi to avoid header issues with FormData
    const url = `${API_BASE_URL}/skill-gap/analyze`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = `HTTP error! Status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch (e) {
          // If we can't parse JSON, use the default error message
        }
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (error) {
      console.error("API Error for skill gap analysis:", error);
      throw error;
    }
  },

  // Get skill gap analysis history
  getAnalysisHistory: async (): Promise<SkillGapAnalysis[]> => {
    return fetchApi<SkillGapAnalysis[]>("/skill-gap/history");
  },

  // Get a specific analysis by ID
  getAnalysisById: async (analysisId: string): Promise<SkillGapAnalysis> => {
    return fetchApi<SkillGapAnalysis>(`/skill-gap/history/${analysisId}`);
  },

  // Generate project recommendations based on missing skills
  getProjectRecommendations: async (
    skills: string[]
  ): Promise<ProjectRecommendation[]> => {
    return fetchApi<ProjectRecommendation[]>("/skill-gap/projects", {
      method: "POST",
      body: JSON.stringify({ skills }),
    });
  },

  // Get learning resources for specific skills
  getLearningResources: async (
    skills: string[]
  ): Promise<SkillLearningResources[]> => {
    return fetchApi<SkillLearningResources[]>("/skill-gap/resources", {
      method: "POST",
      body: JSON.stringify({ skills }),
    });
  },

  // Analyze resume for ATS optimization (part of Resume Enhancement)
  analyzeResume: async (
    resumeId: string,
    jobTitle: string,
    industry: string
  ): Promise<ResumeAnalysisResult> => {
    const formData = new FormData();
    formData.append("resume_id", resumeId);
    formData.append("job_title", jobTitle);
    formData.append("industry", industry);

    // Get the stored auth token
    const tokens = getStoredTokens();
    const authHeader = tokens?.access_token
      ? `Bearer ${tokens.access_token}`
      : "";

    // Make a direct fetch call instead of using fetchApi to avoid header issues with FormData
    const url = `${API_BASE_URL}/resume/analyze`;

    try {
      console.log("Making resume analysis request to:", url);
      console.log("FormData contents:", {
        resumeId,
        jobTitle,
        industry,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = `HTTP error! Status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch (e) {
          // If we can't parse JSON, use the default error message
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log("Resume analysis response received:", result);
      console.log("Response structure check:", {
        hasOverallScore: "overall_score" in result,
        hasOverallFeedback: "overall_feedback" in result,
        hasATSCompatibility: "ats_compatibility" in result,
        hasContentQuality: "content_quality" in result,
        hasFormatStructure: "format_structure" in result,
        hasImpactEffectiveness: "impact_effectiveness" in result,
        hasIndustryBenchmark: "industry_benchmark" in result,
        topLevelKeys: Object.keys(result),
      });

      return result;
    } catch (error) {
      console.error("API Error for resume analysis:", error);
      throw error;
    }
  },

  // Optimize resume based on analysis
  optimizeResume: async (
    resumeId: string,
    jobTitle: string,
    industry: string,
    analysisResult?: ResumeAnalysisResult
  ): Promise<SimpleOptimizedResumeResult> => {
    const formData = new FormData();
    formData.append("resume_id", resumeId);
    formData.append("job_title", jobTitle);
    formData.append("industry", industry);

    // Include analysis result if available
    if (analysisResult) {
      formData.append("analysis_result", JSON.stringify(analysisResult));
    }

    // Get the stored auth token
    const tokens = getStoredTokens();
    const authHeader = tokens?.access_token
      ? `Bearer ${tokens.access_token}`
      : "";

    // Make a direct fetch call
    const url = `${API_BASE_URL}/resume/optimize`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = `HTTP error! Status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch (e) {
          // If we can't parse JSON, use the default error message
        }
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (error) {
      console.error("API Error for resume optimization:", error);
      throw error;
    }
  },
};

// Resume management API functions
export const resumeApi = {
  // Upload a new resume
  uploadResume: async (
    file: File,
    title: string,
    isPrimary: boolean = false
  ): Promise<Resume> => {
    const formData = new FormData();
    formData.append("resume_file", file);
    formData.append("title", title);
    formData.append("is_primary", isPrimary.toString());

    const tokens = getStoredTokens();
    const authHeader = tokens?.access_token
      ? `Bearer ${tokens.access_token}`
      : "";

    const response = await fetch(`${API_BASE_URL}/resumes`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = `HTTP error! Status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorMsg;
      } catch (e) {
        // If we can't parse JSON, use the default error message
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  },

  // Save resume text directly
  saveResumeText: async (
    title: string,
    content: string,
    isPrimary: boolean = false
  ): Promise<Resume> => {
    return fetchApi<Resume>("/resumes/text", {
      method: "POST",
      body: JSON.stringify({
        title,
        content,
        is_primary: isPrimary,
      }),
    });
  },

  // Get all user's resumes
  getUserResumes: async (): Promise<ResumeListResponse> => {
    return fetchApi<ResumeListResponse>("/resumes");
  },

  // Get primary resume
  getPrimaryResume: async (): Promise<Resume | null> => {
    return fetchApi<Resume | null>("/resumes/primary");
  },

  // Get resume by ID
  getResumeById: async (id: string): Promise<Resume> => {
    return fetchApi<Resume>(`/resumes/${id}`);
  },

  // Update resume
  updateResume: async (id: string, data: Partial<Resume>): Promise<Resume> => {
    return fetchApi<Resume>(`/resumes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Set resume as primary
  setPrimaryResume: async (id: string): Promise<Resume> => {
    return fetchApi<Resume>(`/resumes/${id}/set-primary`, {
      method: "PUT",
    });
  },

  // Delete resume
  deleteResume: async (id: string): Promise<void> => {
    return fetchApi<void>(`/resumes/${id}`, {
      method: "DELETE",
    });
  },
};

// Resume analysis API functions
export const resumeAnalysisApi = {
  // Get all user's resume analyses
  getUserAnalyses: async (): Promise<any[]> => {
    return fetchApi<any[]>("/resume/analyses");
  },

  // Get specific analysis by ID
  getAnalysisById: async (id: string): Promise<any> => {
    return fetchApi<any>(`/resume/analyses/${id}`);
  },
};

// Export the generic fetch function for other API calls
export default fetchApi;
