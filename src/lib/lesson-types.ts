export interface ValidationRule {
  type: 'includes' | 'excludes' | 'regex' | 'custom';
  patterns: string[];
  message?: string;
}

export interface LessonStep {
  id: number;
  title: string;
  content: string;
  code?: string;
  expectedCode?: string;
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
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  duration: string;
  objectives: string[];
  steps: LessonStep[];
  completed: boolean;
  locked: boolean;
  chapters?: LessonChapter[]; // Optional chapters for multi-chapter lessons
}
