/**
 * Lesson Editor Storage Utility
 *
 * Handles localStorage operations for the lesson editor auto-save system.
 * Supports multi-lesson editing with namespaced keys.
 *
 * @see /docs/PRD_LESSON_EDITOR_AUTOSAVE.md for full specification
 */

import { Lesson, Chapter } from './lesson-types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export const STORAGE_VERSION = 1;
export const DEFAULT_HISTORY_LIMIT = 30;
export const DEFAULT_AUTOSAVE_DEBOUNCE = 500;

/**
 * Draft state persisted to localStorage
 */
export interface EditorDraft {
  version: typeof STORAGE_VERSION;
  lessonId: number | null; // null = new unsaved lesson
  lesson: Partial<Lesson>;
  chapters: Chapter[];
  selectedChapter: number | null;
  selectedStep: number | null;
  savedAt: string; // ISO timestamp
  sessionStartedAt: string; // For multi-tab conflict detection
}

/**
 * History stored per lesson
 */
export interface EditorHistory {
  version: typeof STORAGE_VERSION;
  lessonId: number | null;
  entries: HistoryEntry[];
}

/**
 * Single history entry with full snapshot
 */
export interface HistoryEntry {
  id: string;
  timestamp: string; // ISO timestamp
  action: HistoryAction;
  description: string;
  snapshot: EditorDraft;
}

/**
 * Semantic action types - NOT triggered on every keystroke
 * History entries are created on: blur, explicit save, structural changes
 */
export type HistoryAction =
  | { type: 'lesson_loaded'; lessonId: number }
  | { type: 'lesson_field_updated'; field: string }
  | { type: 'chapter_added'; chapterIndex: number }
  | { type: 'chapter_updated'; chapterIndex: number; field: string }
  | { type: 'chapter_deleted'; chapterIndex: number }
  | { type: 'step_added'; chapterIndex: number; stepIndex: number }
  | { type: 'step_updated'; chapterIndex: number; stepIndex: number; field: string }
  | { type: 'step_deleted'; chapterIndex: number; stepIndex: number }
  | { type: 'json_imported' }
  | { type: 'reverted'; toEntryId: string };

/**
 * Global editor settings (not per-lesson)
 */
export interface EditorSettings {
  historyLimit: number;
  autoSaveDebounce: number;
  showActivityLog: boolean;
}

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  draft: (lessonId: number | null) => `lessonEditor_draft_${lessonId ?? 'new'}`,
  history: (lessonId: number | null) => `lessonEditor_history_${lessonId ?? 'new'}`,
  settings: 'lessonEditor_settings',
  activeLessonId: 'lessonEditor_activeLessonId',
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate UUID for history entries
 */
export function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely parse JSON from localStorage
 */
function safeJsonParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    console.error('[LessonEditorStorage] JSON parse error:', e);
    return null;
  }
}

/**
 * Safely write to localStorage with quota handling
 */
function safeLocalStorageSet(key: string, value: string): { success: boolean; error?: Error } {
  try {
    localStorage.setItem(key, value);
    return { success: true };
  } catch (e) {
    const error = e as Error;
    console.error(`[LessonEditorStorage] Write failed for ${key}:`, error);
    return { success: false, error };
  }
}

// ============================================================================
// Version Migration
// ============================================================================

/**
 * Check and migrate data if needed
 * Returns null if data is invalid and should be cleared
 */
function migrateData<T extends { version?: number }>(
  data: T | null,
  type: 'draft' | 'history'
): T | null {
  if (!data) return null;

  const version = data.version;

  // No version or malformed data
  if (version === undefined) {
    console.warn(`[LessonEditorStorage] ${type} missing version, clearing`);
    return null;
  }

  // Future version (downgrade scenario)
  if (version > STORAGE_VERSION) {
    console.warn(`[LessonEditorStorage] ${type} from newer version (${version} > ${STORAGE_VERSION}), clearing`);
    return null;
  }

  // Current version - no migration needed
  if (version === STORAGE_VERSION) {
    return data;
  }

  // Old version - attempt migration
  // Currently v1 is the only version, so no migrations yet
  console.warn(`[LessonEditorStorage] ${type} migration from v${version} not implemented, clearing`);
  return null;
}

// ============================================================================
// Draft Operations
// ============================================================================

/**
 * Save draft to localStorage
 */
export function saveDraft(draft: EditorDraft): { success: boolean; error?: Error } {
  const key = STORAGE_KEYS.draft(draft.lessonId);
  const json = JSON.stringify(draft);
  return safeLocalStorageSet(key, json);
}

/**
 * Load draft from localStorage
 */
export function loadDraft(lessonId: number | null): EditorDraft | null {
  const key = STORAGE_KEYS.draft(lessonId);
  const json = localStorage.getItem(key);
  const data = safeJsonParse<EditorDraft>(json);
  return migrateData(data, 'draft');
}

/**
 * Check if draft exists for a lesson
 */
export function hasDraft(lessonId: number | null): boolean {
  const key = STORAGE_KEYS.draft(lessonId);
  return localStorage.getItem(key) !== null;
}

/**
 * Clear draft for a specific lesson
 */
export function clearDraft(lessonId: number | null): void {
  const key = STORAGE_KEYS.draft(lessonId);
  localStorage.removeItem(key);
}

/**
 * Get all draft keys in storage
 */
export function getAllDraftKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('lessonEditor_draft_')) {
      keys.push(key);
    }
  }
  return keys;
}

// ============================================================================
// History Operations
// ============================================================================

/**
 * Save history to localStorage
 */
export function saveHistory(history: EditorHistory): { success: boolean; error?: Error } {
  const key = STORAGE_KEYS.history(history.lessonId);
  const json = JSON.stringify(history);
  return safeLocalStorageSet(key, json);
}

/**
 * Load history from localStorage
 */
export function loadHistory(lessonId: number | null): EditorHistory | null {
  const key = STORAGE_KEYS.history(lessonId);
  const json = localStorage.getItem(key);
  const data = safeJsonParse<EditorHistory>(json);
  return migrateData(data, 'history');
}

/**
 * Clear history for a specific lesson
 */
export function clearHistory(lessonId: number | null): void {
  const key = STORAGE_KEYS.history(lessonId);
  localStorage.removeItem(key);
}

/**
 * Add entry to history with automatic pruning
 */
export function addHistoryEntry(
  lessonId: number | null,
  entry: HistoryEntry,
  limit: number = DEFAULT_HISTORY_LIMIT
): { success: boolean; error?: Error } {
  let history = loadHistory(lessonId);

  if (!history) {
    history = {
      version: STORAGE_VERSION,
      lessonId,
      entries: [],
    };
  }

  // Add new entry at the beginning
  history.entries.unshift(entry);

  // Prune if over limit
  if (history.entries.length > limit) {
    history.entries = history.entries.slice(0, limit);
  }

  return saveHistory(history);
}

/**
 * Prune oldest entries from history
 */
export function pruneHistory(lessonId: number | null, keepCount: number): void {
  const history = loadHistory(lessonId);
  if (!history) return;

  history.entries = history.entries.slice(0, keepCount);
  saveHistory(history);
}

// ============================================================================
// Settings Operations
// ============================================================================

/**
 * Get default settings
 */
export function getDefaultSettings(): EditorSettings {
  return {
    historyLimit: DEFAULT_HISTORY_LIMIT,
    autoSaveDebounce: DEFAULT_AUTOSAVE_DEBOUNCE,
    showActivityLog: true,
  };
}

/**
 * Load settings from localStorage
 */
export function loadSettings(): EditorSettings {
  const json = localStorage.getItem(STORAGE_KEYS.settings);
  const data = safeJsonParse<EditorSettings>(json);
  return data ?? getDefaultSettings();
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: EditorSettings): void {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

// ============================================================================
// Active Lesson Tracking
// ============================================================================

/**
 * Get the last active lesson ID
 */
export function getActiveLessonId(): number | null {
  const value = localStorage.getItem(STORAGE_KEYS.activeLessonId);
  if (!value || value === 'null') return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Set the active lesson ID
 */
export function setActiveLessonId(lessonId: number | null): void {
  localStorage.setItem(STORAGE_KEYS.activeLessonId, String(lessonId));
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Clear all lesson editor local data
 * Preserves tutorial completion and other app data
 */
export function clearAllLocalData(): void {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('lessonEditor_')) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/**
 * Estimate storage size for lesson editor data
 */
export function estimateStorageSize(): { total: number; drafts: number; history: number } {
  let drafts = 0;
  let history = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('lessonEditor_')) continue;

    const value = localStorage.getItem(key);
    const size = (value?.length ?? 0) * 2; // Approximate bytes (UTF-16)

    if (key.includes('_draft_')) {
      drafts += size;
    } else if (key.includes('_history_')) {
      history += size;
    }
  }

  return { total: drafts + history, drafts, history };
}

// ============================================================================
// Quota Exceeded Fallback
// ============================================================================

export type QuotaFallbackResult =
  | { success: true }
  | { success: false; action: 'pruned_history' | 'cleared_history' | 'memory_only'; error: Error };

/**
 * Handle quota exceeded with fallback cascade
 * 1. Prune oldest 50% of history entries
 * 2. Drop ALL history entries
 * 3. Return memory_only status
 */
export function handleQuotaExceeded(
  lessonId: number | null,
  draft: EditorDraft
): QuotaFallbackResult {
  const history = loadHistory(lessonId);

  // Step 1: Try pruning 50% of history
  if (history && history.entries.length > 0) {
    const keepCount = Math.floor(history.entries.length / 2);
    pruneHistory(lessonId, keepCount);

    const result = saveDraft(draft);
    if (result.success) {
      return { success: false, action: 'pruned_history', error: new Error('Storage full, pruned history') };
    }
  }

  // Step 2: Try clearing all history
  clearHistory(lessonId);
  const result = saveDraft(draft);
  if (result.success) {
    return { success: false, action: 'cleared_history', error: new Error('Storage full, cleared history') };
  }

  // Step 3: Memory-only mode
  return {
    success: false,
    action: 'memory_only',
    error: result.error ?? new Error('Storage full, operating in memory-only mode'),
  };
}

// ============================================================================
// Index Validation
// ============================================================================

/**
 * Validate and clamp indices to prevent out-of-bounds access
 */
export function validateAndClampIndices(draft: EditorDraft): EditorDraft {
  const { chapters, selectedChapter, selectedStep } = draft;

  let validChapter = selectedChapter;
  let validStep = selectedStep;

  // Validate chapter index
  if (validChapter !== null) {
    if (chapters.length === 0) {
      validChapter = null;
      validStep = null;
    } else if (validChapter < 0 || validChapter >= chapters.length) {
      validChapter = Math.max(0, Math.min(validChapter, chapters.length - 1));
    }
  }

  // Validate step index
  if (validChapter !== null && validStep !== null) {
    const chapter = chapters[validChapter];
    if (!chapter || chapter.steps.length === 0) {
      validStep = null;
    } else if (validStep < 0 || validStep >= chapter.steps.length) {
      validStep = Math.max(0, Math.min(validStep, chapter.steps.length - 1));
    }
  }

  return {
    ...draft,
    selectedChapter: validChapter,
    selectedStep: validStep,
  };
}

// ============================================================================
// Helpers for History Actions
// ============================================================================

/**
 * Generate human-readable description for history action
 */
export function getActionDescription(action: HistoryAction): string {
  switch (action.type) {
    case 'lesson_loaded':
      return `Loaded lesson #${action.lessonId}`;
    case 'lesson_field_updated':
      return `Updated lesson ${action.field}`;
    case 'chapter_added':
      return `Added chapter ${action.chapterIndex}`;
    case 'chapter_updated':
      return `Updated chapter ${action.chapterIndex} ${action.field}`;
    case 'chapter_deleted':
      return `Deleted chapter ${action.chapterIndex}`;
    case 'step_added':
      return `Added step to chapter ${action.chapterIndex}`;
    case 'step_updated':
      return `Updated step ${action.stepIndex} in chapter ${action.chapterIndex}`;
    case 'step_deleted':
      return `Deleted step from chapter ${action.chapterIndex}`;
    case 'json_imported':
      return 'Imported lesson from JSON';
    case 'reverted':
      return `Reverted to earlier state`;
    default:
      return 'Unknown action';
  }
}

/**
 * Get icon for action type
 */
export function getActionIcon(action: HistoryAction): string {
  switch (action.type) {
    case 'lesson_loaded':
      return '📂';
    case 'lesson_field_updated':
      return '✏️';
    case 'chapter_added':
      return '📚';
    case 'chapter_updated':
      return '📝';
    case 'chapter_deleted':
      return '🗑️';
    case 'step_added':
      return '➕';
    case 'step_updated':
      return '✍️';
    case 'step_deleted':
      return '➖';
    case 'json_imported':
      return '📥';
    case 'reverted':
      return '↩️';
    default:
      return '•';
  }
}
