/**
 * Lesson Editor Persistence Hook
 *
 * Manages auto-save, change history, and recovery for the lesson editor.
 * Implements debounced saves, semantic history recording, and revert functionality.
 *
 * @see /docs/PRD_LESSON_EDITOR_AUTOSAVE.md for full specification
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Lesson, Chapter } from '@/lib/lesson-types';
import {
  EditorDraft,
  EditorHistory,
  HistoryEntry,
  HistoryAction,
  EditorSettings,
  STORAGE_VERSION,
  DEFAULT_HISTORY_LIMIT,
  DEFAULT_AUTOSAVE_DEBOUNCE,
  generateId,
  isStorageAvailable,
  saveDraft,
  loadDraft,
  hasDraft as checkHasDraft,
  clearDraft as storageClearDraft,
  loadHistory,
  clearHistory as storageClearHistory,
  addHistoryEntry,
  loadSettings,
  saveSettings,
  setActiveLessonId,
  clearAllLocalData as storageClearAllLocalData,
  handleQuotaExceeded,
  validateAndClampIndices,
  getActionDescription,
} from '@/lib/lesson-editor-storage';

// ============================================================================
// Types
// ============================================================================

export interface EditorState {
  lesson: Partial<Lesson>;
  chapters: Chapter[];
  selectedChapter: number | null;
  selectedStep: number | null;
}

export interface UseLessonEditorPersistenceReturn {
  // State
  draft: EditorDraft | null;
  history: HistoryEntry[];
  lastSaved: Date | null;
  hasDraft: boolean;

  // Save indicator states
  isSaving: boolean;
  isDirty: boolean;
  saveError: Error | null;
  isStorageAvailable: boolean;

  // Settings
  settings: EditorSettings;
  updateSettings: (settings: Partial<EditorSettings>) => void;

  // Actions
  saveDraft: (state: EditorState) => void;
  saveDraftImmediate: (state: EditorState) => void;
  recordChange: (action: HistoryAction, state: EditorState, customDescription?: string) => void;
  revertTo: (entryId: string) => EditorDraft | null;
  clearDraft: () => void;
  clearHistory: () => void;
  clearAllLocalData: () => void;

  // Recovery
  checkForDraft: (lessonId: number | null) => EditorDraft | null;
  discardDraft: (lessonId: number | null) => void;
  restoreDraft: (lessonId: number | null) => EditorDraft | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useLessonEditorPersistence(
  lessonId: number | null
): UseLessonEditorPersistenceReturn {
  // Storage availability check (deferred to client)
  const [storageAvailable, setStorageAvailable] = useState(false);

  // Core state
  const [draft, setDraft] = useState<EditorDraft | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [settings, setSettings] = useState<EditorSettings>({
    historyLimit: DEFAULT_HISTORY_LIMIT,
    autoSaveDebounce: DEFAULT_AUTOSAVE_DEBOUNCE,
    showActivityLog: true,
  });

  // Check storage availability on mount (client-side only)
  useEffect(() => {
    const available = isStorageAvailable();
    setStorageAvailable(available);
    if (available) {
      setSettings(loadSettings());
    }
  }, []);

  // Save indicator states
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);

  // Session tracking
  const sessionStartedAt = useRef<string>(new Date().toISOString());

  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Pending state for flush
  const pendingState = useRef<EditorState | null>(null);

  // ============================================================================
  // Load initial data when lessonId changes
  // ============================================================================

  useEffect(() => {
    if (!storageAvailable) return;

    // Load existing draft and history
    const existingDraft = loadDraft(lessonId);
    const existingHistory = loadHistory(lessonId);

    if (existingDraft) {
      setDraft(validateAndClampIndices(existingDraft));
      setLastSaved(new Date(existingDraft.savedAt));
    } else {
      setDraft(null);
      setLastSaved(null);
    }

    if (existingHistory) {
      setHistory(existingHistory.entries);
    } else {
      setHistory([]);
    }

    // Track active lesson
    setActiveLessonId(lessonId);

    // Reset dirty state
    setIsDirty(false);
    setSaveError(null);
  }, [lessonId, storageAvailable]);

  // ============================================================================
  // Debounced save implementation
  // ============================================================================

  const createDraft = useCallback(
    (state: EditorState): EditorDraft => ({
      version: STORAGE_VERSION,
      lessonId,
      lesson: state.lesson,
      chapters: state.chapters,
      selectedChapter: state.selectedChapter,
      selectedStep: state.selectedStep,
      savedAt: new Date().toISOString(),
      sessionStartedAt: sessionStartedAt.current,
    }),
    [lessonId]
  );

  const performSave = useCallback(
    (state: EditorState) => {
      if (!storageAvailable) return;

      setIsSaving(true);
      const newDraft = createDraft(state);

      const result = saveDraft(newDraft);

      if (result.success) {
        setDraft(newDraft);
        setLastSaved(new Date(newDraft.savedAt));
        setIsDirty(false);
        setSaveError(null);
      } else if (result.error?.name === 'QuotaExceededError') {
        // Handle quota exceeded with fallback cascade
        const fallback = handleQuotaExceeded(lessonId, newDraft);
        if (!fallback.success && fallback.action === 'memory_only') {
          setSaveError(fallback.error);
          // Still update local state
          setDraft(newDraft);
          setLastSaved(new Date(newDraft.savedAt));
        } else if (!fallback.success) {
          // Partial success - reload history as it may have been pruned
          const updatedHistory = loadHistory(lessonId);
          setHistory(updatedHistory?.entries ?? []);
          setDraft(newDraft);
          setLastSaved(new Date(newDraft.savedAt));
          setIsDirty(false);
        }
      } else {
        setSaveError(result.error ?? new Error('Unknown save error'));
      }

      setIsSaving(false);
      pendingState.current = null;
    },
    [storageAvailable, lessonId, createDraft]
  );

  const debouncedSave = useCallback(
    (state: EditorState) => {
      if (!storageAvailable) return;

      // Mark as dirty immediately
      setIsDirty(true);
      pendingState.current = state;

      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new debounced save
      debounceTimer.current = setTimeout(() => {
        performSave(state);
      }, settings.autoSaveDebounce);
    },
    [storageAvailable, settings.autoSaveDebounce, performSave]
  );

  const immediateSave = useCallback(
    (state: EditorState) => {
      if (!storageAvailable) return;

      // Clear any pending debounce
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }

      performSave(state);
    },
    [storageAvailable, performSave]
  );

  // ============================================================================
  // History recording
  // ============================================================================

  const recordChange = useCallback(
    (action: HistoryAction, state: EditorState, customDescription?: string) => {
      if (!storageAvailable) return;

      const description = customDescription ?? getActionDescription(action);
      const snapshot = createDraft(state);

      const entry: HistoryEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action,
        description,
        snapshot,
      };

      const result = addHistoryEntry(lessonId, entry, settings.historyLimit);

      if (result.success) {
        // Reload history to get updated list
        const updatedHistory = loadHistory(lessonId);
        setHistory(updatedHistory?.entries ?? []);
      }

      // Also trigger an immediate save
      immediateSave(state);
    },
    [storageAvailable, lessonId, settings.historyLimit, createDraft, immediateSave]
  );

  // ============================================================================
  // Revert functionality
  // ============================================================================

  const revertTo = useCallback(
    (entryId: string): EditorDraft | null => {
      const entry = history.find((e) => e.id === entryId);
      if (!entry) return null;

      // Validate and return the snapshot
      return validateAndClampIndices(entry.snapshot);
    },
    [history]
  );

  // ============================================================================
  // Clear operations
  // ============================================================================

  const clearDraft = useCallback(() => {
    if (!storageAvailable) return;
    storageClearDraft(lessonId);
    setDraft(null);
    setLastSaved(null);
    setIsDirty(false);
    setSaveError(null);
  }, [storageAvailable, lessonId]);

  const clearHistory = useCallback(() => {
    if (!storageAvailable) return;
    storageClearHistory(lessonId);
    setHistory([]);
  }, [storageAvailable, lessonId]);

  const clearAllLocalData = useCallback(() => {
    if (!storageAvailable) return;
    storageClearAllLocalData();
    setDraft(null);
    setHistory([]);
    setLastSaved(null);
    setIsDirty(false);
    setSaveError(null);
  }, [storageAvailable]);

  // ============================================================================
  // Recovery operations
  // ============================================================================

  const checkForDraft = useCallback(
    (targetLessonId: number | null): EditorDraft | null => {
      if (!storageAvailable) return null;
      const existingDraft = loadDraft(targetLessonId);
      if (!existingDraft) return null;
      return validateAndClampIndices(existingDraft);
    },
    [storageAvailable]
  );

  const discardDraft = useCallback(
    (targetLessonId: number | null) => {
      if (!storageAvailable) return;
      storageClearDraft(targetLessonId);
      if (targetLessonId === lessonId) {
        setDraft(null);
        setLastSaved(null);
      }
    },
    [storageAvailable, lessonId]
  );

  const restoreDraft = useCallback(
    (targetLessonId: number | null): EditorDraft | null => {
      if (!storageAvailable) return null;
      const existingDraft = loadDraft(targetLessonId);
      if (!existingDraft) return null;
      return validateAndClampIndices(existingDraft);
    },
    [storageAvailable]
  );

  // ============================================================================
  // Settings management
  // ============================================================================

  const updateSettings = useCallback(
    (updates: Partial<EditorSettings>) => {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      if (storageAvailable) {
        saveSettings(newSettings);
      }
    },
    [settings, storageAvailable]
  );

  // ============================================================================
  // beforeunload handler to flush pending saves
  // ============================================================================

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Flush any pending save
      if (pendingState.current) {
        immediateSave(pendingState.current);
      }

      // Show warning if dirty
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, immediateSave]);

  // ============================================================================
  // Cleanup on unmount
  // ============================================================================

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // ============================================================================
  // Return value
  // ============================================================================

  const hasDraftValue = useMemo(() => {
    if (!storageAvailable) return false;
    return checkHasDraft(lessonId);
  }, [storageAvailable, lessonId, draft]);

  return {
    // State
    draft,
    history,
    lastSaved,
    hasDraft: hasDraftValue,

    // Save indicator states
    isSaving,
    isDirty,
    saveError,
    isStorageAvailable: storageAvailable,

    // Settings
    settings,
    updateSettings,

    // Actions
    saveDraft: debouncedSave,
    saveDraftImmediate: immediateSave,
    recordChange,
    revertTo,
    clearDraft,
    clearHistory,
    clearAllLocalData,

    // Recovery
    checkForDraft,
    discardDraft,
    restoreDraft,
  };
}
