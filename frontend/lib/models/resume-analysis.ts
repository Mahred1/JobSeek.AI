// Comprehensive resume analysis models matching the enhanced backend structure

export interface ScoreBreakdown {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  examples: string[];
}

export interface ATSCompatibilityScore {
  score: number;
  keyword_optimization: number;
  format_compatibility: number;
  section_structure: number;
  file_format_score: number;
  
  // Detailed feedback
  strengths: string[];
  issues: string[];
  recommendations: string[];
  
  // Keyword analysis
  matched_keywords: string[];
  missing_keywords: string[];
  keyword_density: number;
}

export interface ContentQualityScore {
  score: number;
  achievement_focus: number;
  quantification: number;
  action_verbs: number;
  relevance: number;
  
  // Detailed analysis
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  
  // Specific examples
  strong_bullets: string[];
  weak_bullets: string[];
  quantified_achievements: string[];
}

export interface FormatStructureScore {
  score: number;
  visual_hierarchy: number;
  consistency: number;
  readability: number;
  length_appropriateness: number;
  
  // Detailed feedback
  strengths: string[];
  issues: string[];
  recommendations: string[];
}

export interface ImpactScore {
  score: number;
  first_impression: number;
  differentiation: number;
  value_proposition: number;
  memorability: number;
  
  // Detailed analysis
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface BulletPointExample {
  original: string;
  improved: string;
  explanation: string;
  impact_increase: number;
}

export interface IndustryBenchmark {
  industry: string;
  percentile_ranking: number;
  competitive_advantages: string[];
  improvement_priorities: string[];
  industry_specific_feedback: string;
}

// Updated main interface to match backend exactly
export interface ResumeAnalysisResult {
  // Overall Assessment
  overall_score: number;
  overall_feedback: string;
  
  // Detailed Score Breakdowns
  ats_compatibility: ATSCompatibilityScore;
  content_quality: ContentQualityScore;
  format_structure: FormatStructureScore;
  impact_effectiveness: ImpactScore;
  
  // Summary Scores (for dashboard/quick view)
  ats_score: number;
  content_score: number;
  format_score: number;
  impact_score: number;
  
  // Actionable Improvements
  top_strengths: string[];
  critical_improvements: string[];
  quick_wins: string[];
  
  // Specific Examples
  bullet_improvements: BulletPointExample[];
  
  // Industry Context
  industry_benchmark: IndustryBenchmark;
  
  // Target Information
  target_job_title: string;
  target_industry: string;
  
  // Metadata
  analysis_date: string;
  estimated_improvement_potential: number;
}

export interface OptimizedResumeResult {
  markdown: string;
  changes_summary: string[];
  improvement_score: number;
  before_after_comparison: Record<string, Record<string, number>>;
  implementation_guide: string[];
}

// Simplified interface matching the new backend response
export interface SimpleOptimizedResumeResult {
  markdown: string;
  changes_summary: string[];
  improvement_score: number;
}

// Legacy interfaces for backward compatibility (can be removed after migration)
export interface CategoryScore {
  category: string;
  score: number;
}

export interface ResumeRecommendation {
  text: string;
  type: 'improvement' | 'positive';
}

export interface ResumeAnalysis {
  id?: string;
  userId?: string;
  overallScore: number;
  categoryScores: CategoryScore[];
  recommendations: ResumeRecommendation[];
  createdAt?: Date;
}

// Enhanced mock data for dashboard display
export const mockResumeAnalysis: ResumeAnalysis = {
  overallScore: 78,
  categoryScores: [
    { category: 'ATS Compatibility', score: 82 },
    { category: 'Content Quality', score: 75 },
    { category: 'Format & Structure', score: 85 },
    { category: 'Impact & Effectiveness', score: 70 }
  ],
  recommendations: [
    { 
      text: 'Add more quantified achievements with specific metrics and percentages',
      type: 'improvement'
    },
    {
      text: 'Include industry-specific keywords like "cloud architecture" and "DevOps"',
      type: 'improvement'
    },
    {
      text: 'Excellent use of strong action verbs throughout your experience section',
      type: 'positive'
    },
    {
      text: 'Consider adding a more compelling professional summary that highlights your unique value',
      type: 'improvement'
    },
    {
      text: 'Great job maintaining consistent formatting and professional appearance',
      type: 'positive'
    }
  ]
}; 