// Resource for learning or projects
export interface Resource {
  title: string;
  url: string;
  type: string;
}

// Detailed resource with additional information
export interface DetailedResource extends Resource {
  difficulty: string;
  description: string;
}

// Simplified matched skill (updated to match backend)
export interface MatchedSkill {
  skill: string;
  level: string; // Beginner, Intermediate, Advanced, Expert
  evidence: string; // Evidence from resume showing this skill
  meets_requirement: boolean; // Whether this skill fully meets the job requirement
}

// Simplified missing skill (updated to match backend)
export interface MissingSkill {
  skill: string;
  importance: string; // Critical, Important, Nice-to-Have
  why_needed: string; // Why this skill is needed for the role
  learning_path: string; // Specific steps to learn this skill
}

// Simplified project recommendation (updated to match backend)
export interface ProjectRecommendation {
  title: string;
  description: string; // What to build and how it helps
  skills_gained: string; // Comma-separated skills this project develops
  time_estimate: string; // Time needed to complete
  difficulty: string; // Easy, Medium, or Hard
}

// Complete skill gap analysis (updated to match simplified backend)
export interface SkillGapAnalysis {
  id?: string;
  userId?: string;
  job_title: string;
  job_description: string;
  resume_text: string;
  match_percentage: number; // 0-100 percentage
  matched_skills: MatchedSkill[];
  missing_skills: MissingSkill[];
  project_recommendations: ProjectRecommendation[];
  top_strengths: string; // Top 3 strengths from the resume
  biggest_gaps: string; // Top 3 most critical skill gaps
  next_steps: string; // Immediate actionable steps to improve candidacy
  timeline_to_ready: string; // Realistic timeline to become job-ready
  overall_assessment: string; // Honest assessment of current fit and potential
  createdAt?: string; 
  job_posting_url?: string;
}

// Request payload for skill gap analysis
export interface SkillGapAnalysisRequest {
  resumeFile?: File;
  resumeText?: string;
  resumeId?: string; // Added resumeId for selecting stored resumes
  jobDescription?: string;
  jobPostingUrl?: string;
  githubUrl?: string;
}

// Learning resources for a specific skill
export interface SkillLearningResources {
  skill: string;
  resources: DetailedResource[];
} 