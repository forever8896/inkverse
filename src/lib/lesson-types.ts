export interface ValidationRule {
  type: 'includes' | 'excludes' | 'regex' | 'custom';
  patterns: string[];
  message?: string;
}

export interface Step {
  id: number;
  chapterId: number;
  title: string;
  content: string;
  order: number;
  code?: string;
  expectedCode?: string;
  codeTemplate?: string;
  hint?: string;
  validation?: ValidationRule[];
  image?: string; // Optional image URL or import for this step
  requiresAuth?: boolean; // Whether this step requires authentication
  triggersGeneration?: boolean; // Whether completing this step triggers AI monster generation
}

// Chapter structure for lessons that include multiple chapters
export interface LessonChapter {
  id: number;
  title: string;
  steps: LessonStep[];
  image?: string;
  requiresAuth?: boolean;
  triggersGeneration?: boolean; // Triggers NFT generation when completed
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedTime?: number; // Minutes to complete
  successCriteria?: string[]; // Clear completion criteria
}

export interface Chapter {
  id: number;
  lessonId: number;
  title: string;
  description: string;
  order: number;
  concept: string; // Core concept being taught: "syntax", "storage", "deployment"
  steps: Step[];
  estimatedTime: number; // Total minutes for chapter
  requiresPreviousChapter: boolean;
  completed?: boolean;
  currentStepId?: number;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  duration: string;
  objectives: string[];
  chapters?: LessonChapter[]; // Optional chapters for multi-chapter lessons
  evolutionPath?: {
    startStage: string;
    endStage: string;
    majorEvolution: boolean; // Does this lesson trigger NFT generation?
  };
  completed: boolean;
  locked: boolean;
}

// Legacy support - keep LessonStep for backward compatibility during migration
export interface LessonStep {
  id: number;
  title: string;
  content: string;
  code?: string;
  expectedCode?: string;
  hint?: string;
  validation?: ValidationRule[];
  image?: string;
  requiresAuth?: boolean;
  triggersGeneration?: boolean; // Whether completing this step triggers AI monster generation
}
