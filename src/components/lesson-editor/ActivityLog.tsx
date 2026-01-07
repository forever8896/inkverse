/**
 * Activity Log Component
 *
 * Displays a collapsible log of recent editor changes with revert functionality.
 * Shows last 30 semantic actions with timestamps.
 *
 * @see /docs/PRD_LESSON_EDITOR_AUTOSAVE.md Section 5.2
 */

'use client';

import { useState, useEffect } from 'react';
import { HistoryEntry } from '@/lib/lesson-editor-storage';
import { getActionIcon } from '@/lib/lesson-editor-storage';

interface ActivityLogProps {
  history: HistoryEntry[];
  onRevert: (entryId: string) => void;
  onClearHistory: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * Format relative time for display
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
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

/**
 * Get location string for the action
 */
function getLocationString(entry: HistoryEntry): string | null {
  const { action, snapshot } = entry;

  switch (action.type) {
    case 'chapter_added':
    case 'chapter_updated':
    case 'chapter_deleted': {
      const chapter = snapshot.chapters[action.chapterIndex];
      return chapter ? `Chapter ${action.chapterIndex}: "${chapter.title}"` : `Chapter ${action.chapterIndex}`;
    }
    case 'step_added':
    case 'step_updated':
    case 'step_deleted': {
      const chapter = snapshot.chapters[action.chapterIndex];
      const step = chapter?.steps[action.stepIndex];
      if (step) {
        return `Ch ${action.chapterIndex} > Step ${action.stepIndex}: "${step.title}"`;
      }
      return `Chapter ${action.chapterIndex} > Step ${action.stepIndex}`;
    }
    case 'lesson_loaded':
    case 'lesson_field_updated':
      return snapshot.lesson?.title ? `"${snapshot.lesson.title}"` : null;
    default:
      return null;
  }
}

export function ActivityLog({
  history,
  onRevert,
  onClearHistory,
  isCollapsed = false,
  onToggleCollapse,
}: ActivityLogProps) {
  // Auto-refresh relative times
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const [confirmingRevert, setConfirmingRevert] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const handleRevertClick = (entryId: string) => {
    if (confirmingRevert === entryId) {
      onRevert(entryId);
      setConfirmingRevert(null);
    } else {
      setConfirmingRevert(entryId);
      // Auto-cancel after 3 seconds
      setTimeout(() => setConfirmingRevert(null), 3000);
    }
  };

  const handleClearClick = () => {
    if (confirmingClear) {
      onClearHistory();
      setConfirmingClear(false);
    } else {
      setConfirmingClear(true);
      // Auto-cancel after 3 seconds
      setTimeout(() => setConfirmingClear(false), 3000);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggleCollapse}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">📋</span>
          <h3 className="text-sm font-bold text-cyan-400">Activity Log</h3>
          {history.length > 0 && (
            <span className="text-xs text-slate-500">({history.length})</span>
          )}
        </div>
        <span className="text-slate-400 text-sm">
          {isCollapsed ? '▼' : '▲'}
        </span>
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="border-t border-slate-700">
          {history.length === 0 ? (
            <div className="px-4 py-6 text-center text-slate-500 text-sm">
              No activity recorded yet.
              <br />
              <span className="text-xs">Changes will appear here.</span>
            </div>
          ) : (
            <>
              <div className="max-h-[300px] overflow-y-auto">
                {history.map((entry, index) => {
                  const location = getLocationString(entry);
                  const isConfirming = confirmingRevert === entry.id;

                  return (
                    <div
                      key={entry.id}
                      className={`px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                        index === 0 ? 'bg-slate-700/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-slate-500">
                              {formatRelativeTime(entry.timestamp)}
                            </span>
                            {index === 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-cyan-900/30 text-cyan-400 rounded">
                                Latest
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{getActionIcon(entry.action)}</span>
                            <span className="text-sm text-slate-200 truncate">
                              {entry.description}
                            </span>
                          </div>
                          {location && (
                            <div className="text-xs text-slate-500 mt-1 truncate">
                              {location}
                            </div>
                          )}
                        </div>

                        {/* Revert button - not for the latest entry */}
                        {index > 0 && (
                          <button
                            onClick={() => handleRevertClick(entry.id)}
                            className={`px-2 py-1 text-[10px] rounded transition-colors whitespace-nowrap ${
                              isConfirming
                                ? 'bg-amber-600/30 border border-amber-500/50 text-amber-200'
                                : 'bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                            }`}
                          >
                            {isConfirming ? 'Confirm?' : '↩ Revert'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clear History button */}
              <div className="px-4 py-3 border-t border-slate-700 bg-slate-900/50">
                <button
                  onClick={handleClearClick}
                  className={`w-full py-2 text-xs rounded transition-colors ${
                    confirmingClear
                      ? 'bg-red-600/30 border border-red-500/50 text-red-200'
                      : 'bg-slate-800/50 border border-slate-600/50 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  }`}
                >
                  {confirmingClear ? 'Click again to confirm' : 'Clear History'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
