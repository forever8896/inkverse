export type { ValidationRule, LessonStep, Lesson } from './lesson-types';
export type { ValidationResult } from './validation';
// Do NOT re-export server-only data loading from the client bundle
// Pages should import from '@/lib/lessons-server' when running on the server
export { validateCode, validateCodeWithFeedback, getPatternFeedback } from './validation';
