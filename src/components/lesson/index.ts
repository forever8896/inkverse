/**
 * Lesson Components Barrel Export
 *
 * This module exports all lesson-related components for clean imports.
 *
 * Usage:
 * import { LessonProvider, LessonNavigation, ... } from '@/components/lesson';
 */

// Context & Provider
export { LessonProvider, useLessonContext } from './LessonContext';

// Panels
export { LessonCreaturePanel } from './LessonCreaturePanel';
export { LessonInstructionsPanel } from './LessonInstructionsPanel';
export { LessonCodeEditorPanel } from './LessonCodeEditorPanel';

// Navigation
export { LessonNavigation } from './LessonNavigation';

// Modals
export { CompletionModals } from './CompletionModals';
