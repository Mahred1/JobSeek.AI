// Learning path related interfaces

// Industry niche
export interface Niche {
  id: number;
  name: string;
  icon: string;
  description: string;
}

// Questions to tailor the learning path
export interface PathQuestion {
  id: string;
  label: string;
  options: string[];
}

// Learning resource with progress tracking
export interface LearningResource {
  type: string;
  name: string;
  link: string;
  rating?: number;
  description?: string;
}

// Resource progress tracking
export interface LearningResourceProgress {
  resource_id: string;
  completed: boolean;
  completed_at?: string;
  notes?: string;
  rating?: number;
  time_spent_minutes?: number;
}

// Subtopic within a learning module
export interface LearningSubtopic {
  title: string;
  description: string;
  resources?: LearningResource[];
}

// Learning module in a path
export interface LearningModule {
  id: number;
  title: string;
  timeline: string;
  difficulty: string;
  description: string;
  topics: string[];
  resources: LearningResource[];
  tips: string;
  subtopics?: LearningSubtopic[];
  prerequisites?: string[];
  learningObjectives?: string[];
  projects?: string[];
  completed?: boolean;
  progress?: number;
  started_at?: string;
  completed_at?: string;
  target_completion_date?: string;
  notes?: string;
  resource_progress?: LearningResourceProgress[];
  custom_resources?: LearningResource[];
}

// Learning path statistics
export interface LearningPathStats {
  total_modules: number;
  completed_modules: number;
  total_resources: number;
  completed_resources: number;
  total_time_spent_minutes: number;
  estimated_completion_date?: string;
  last_activity_date?: string;
  average_module_completion_days?: number;
}

// Complete learning path
export interface LearningPath {
  id?: string;
  title: string;
  description: string;
  estimatedTime: string;
  modules: LearningModule[];
  niche: string;
  overview?: string;
  prerequisites?: string[];
  intendedAudience?: string;
  careerOutcomes?: string[];
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  last_accessed?: string;
  is_active?: boolean;
  target_completion_date?: string;
  custom_notes?: string;
  stats?: LearningPathStats;
}

// Request to generate a learning path
export interface LearningPathRequest {
  nicheId: number;
  customNiche?: string;
  answers: Record<string, string>;
}
