/**
 * Lesson Editor Validation Schema
 *
 * Validates lesson JSON structure before export to prevent corrupted data.
 * Uses Zod for runtime validation with helpful error messages.
 */

import { z } from 'zod';

// Step validation schema
const StepSchema = z.object({
  id: z.number().int().positive(),
  chapterId: z.number().int().nonnegative(),
  title: z.string().min(1, 'Step title is required'),
  content: z.string().min(1, 'Step content is required'),
  order: z.number().int().positive(),
  code: z.string().optional(),
  expectedCode: z.string().optional(),
  codeTemplate: z.string().optional(),
  hint: z.string().optional(),
  validation: z.array(z.object({
    type: z.enum(['includes', 'excludes', 'regex', 'custom']),
    patterns: z.array(z.string()),
    message: z.string().optional(),
  })).optional(),
  image: z.string().optional(),
  requiresAuth: z.boolean().optional(),
  triggersGeneration: z.boolean().optional(),
  generationStage: z.enum(['young', 'adult']).optional(),
  displayStage: z.enum(['egg', 'young', 'adult']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  estimatedTime: z.number().int().positive().optional(),
});

// Chapter validation schema
const ChapterSchema = z.object({
  id: z.number().int().nonnegative(),
  lessonId: z.number().int().positive(),
  title: z.string().min(1, 'Chapter title is required'),
  description: z.string().min(1, 'Chapter description is required'),
  order: z.number().int().nonnegative(),
  concept: z.string().min(1, 'Chapter concept is required'),
  steps: z.array(StepSchema).min(1, 'Chapter must have at least one step'),
  estimatedTime: z.number().int().positive('Estimated time must be positive'),
  requiresPreviousChapter: z.boolean(),
  completed: z.boolean().optional(),
  currentStepId: z.number().int().optional(),
});

// Lesson validation schema
const LessonSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1, 'Lesson title is required'),
  description: z.string().min(1, 'Lesson description is required'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  duration: z.string().min(1, 'Duration is required'),
  objectives: z.array(z.string()).min(1, 'At least one objective is required'),
  chapters: z.array(ChapterSchema).min(1, 'Lesson must have at least one chapter'),
  evolutionPath: z.object({
    startStage: z.string(),
    endStage: z.string(),
    majorEvolution: z.boolean(),
  }).optional(),
  completed: z.boolean(),
  locked: z.boolean(),
});

export type ValidatedLesson = z.infer<typeof LessonSchema>;
export type ValidatedChapter = z.infer<typeof ChapterSchema>;
export type ValidatedStep = z.infer<typeof StepSchema>;

/**
 * Validates a lesson object against the schema
 * @param lesson - The lesson object to validate
 * @returns Object with success status and either data or errors
 */
export function validateLesson(lesson: unknown): {
  success: boolean;
  data?: ValidatedLesson;
  errors?: { field: string; message: string }[];
} {
  try {
    const validatedData = LessonSchema.parse(lesson);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Unknown validation error' }],
    };
  }
}

/**
 * Validates a chapter object against the schema
 */
export function validateChapter(chapter: unknown): {
  success: boolean;
  data?: ValidatedChapter;
  errors?: { field: string; message: string }[];
} {
  try {
    const validatedData = ChapterSchema.parse(chapter);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Unknown validation error' }],
    };
  }
}

/**
 * Validates a step object against the schema
 */
export function validateStep(step: unknown): {
  success: boolean;
  data?: ValidatedStep;
  errors?: { field: string; message: string }[];
} {
  try {
    const validatedData = StepSchema.parse(step);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Unknown validation error' }],
    };
  }
}
