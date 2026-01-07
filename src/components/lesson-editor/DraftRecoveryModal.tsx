/**
 * Draft Recovery Modal Component
 *
 * Prompts user to restore or discard a saved draft when one exists.
 * Shown on page load when local draft is detected.
 *
 * @see /docs/PRD_LESSON_EDITOR_AUTOSAVE.md Section 5.3
 */

'use client';

import { EditorDraft } from '@/lib/lesson-editor-storage';

interface DraftRecoveryModalProps {
  draft: EditorDraft;
  onRestore: () => void;
  onDiscard: () => void;
}

/**
 * Format date for display
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Count total changes in draft
 */
function countChanges(draft: EditorDraft): number {
  let count = 0;

  // Count chapters
  count += draft.chapters.length;

  // Count steps
  draft.chapters.forEach((chapter) => {
    count += chapter.steps.length;
  });

  return count;
}

export function DraftRecoveryModal({
  draft,
  onRestore,
  onDiscard,
}: DraftRecoveryModalProps) {
  const lessonTitle = draft.lesson?.title || 'Untitled Lesson';
  const lastSaved = formatDate(draft.savedAt);
  const changeCount = countChanges(draft);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <h2 className="text-lg font-bold text-purple-300">Unsaved Draft Found</h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-slate-300 mb-4">
            You have unsaved changes from your last session:
          </p>

          {/* Draft info card */}
          <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Lesson:</span>
                <span className="text-white font-medium truncate ml-2 max-w-[200px]">
                  "{lessonTitle}"
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Last saved:</span>
                <span className="text-slate-200">{lastSaved}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Content:</span>
                <span className="text-slate-200">
                  {draft.chapters.length} chapter{draft.chapters.length !== 1 ? 's' : ''},{' '}
                  {changeCount} item{changeCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-400 mb-4">
            Would you like to restore this draft or start fresh?
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/30 flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded text-sm text-slate-300 hover:text-white transition-colors"
          >
            Discard & Start Fresh
          </button>
          <button
            onClick={onRestore}
            className="flex-1 px-4 py-2.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 hover:border-purple-400 rounded text-sm text-purple-200 hover:text-white font-medium transition-colors"
          >
            Restore Draft
          </button>
        </div>
      </div>
    </div>
  );
}
