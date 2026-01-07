/**
 * Save Indicator Component
 *
 * Displays the current save status of the lesson editor.
 * Shows: "Saved X ago", "Saving...", or "Unsaved changes" based on state.
 *
 * @see /docs/PRD_LESSON_EDITOR_AUTOSAVE.md Section 5.1
 */

'use client';

import { useEffect, useState } from 'react';

interface SaveIndicatorProps {
  lastSaved: Date | null;
  isSaving: boolean;
  isDirty: boolean;
  saveError: Error | null;
  isStorageAvailable: boolean;
}

/**
 * Format relative time (e.g., "2s ago", "5m ago", "1h ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 5) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function SaveIndicator({
  lastSaved,
  isSaving,
  isDirty,
  saveError,
  isStorageAvailable,
}: SaveIndicatorProps) {
  // Re-render every 10 seconds to update relative time
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  // Not available in private browsing
  if (!isStorageAvailable) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/30 border border-amber-600/50 rounded text-xs text-amber-300">
        <span className="text-amber-400">!</span>
        <span>Auto-save unavailable</span>
      </div>
    );
  }

  // Error state
  if (saveError) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 bg-red-900/30 border border-red-600/50 rounded text-xs text-red-300 cursor-help"
        title={saveError.message}
      >
        <span className="text-red-400">!</span>
        <span>Unsaved changes</span>
      </div>
    );
  }

  // Saving state
  if (isSaving) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/30 border border-amber-600/50 rounded text-xs text-amber-300">
        <span className="inline-block w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
        <span>Saving...</span>
      </div>
    );
  }

  // Dirty state (unsaved changes, not yet saving)
  if (isDirty) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/30 border border-amber-600/50 rounded text-xs text-amber-300">
        <span className="inline-block w-2 h-2 bg-amber-400 rounded-full" />
        <span>Unsaved</span>
      </div>
    );
  }

  // Saved state
  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-900/30 border border-emerald-600/50 rounded text-xs text-emerald-300">
        <span className="text-emerald-400">✓</span>
        <span>Saved {formatRelativeTime(lastSaved)}</span>
      </div>
    );
  }

  // No save yet
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-600/50 rounded text-xs text-slate-400">
      <span>Not saved</span>
    </div>
  );
}
