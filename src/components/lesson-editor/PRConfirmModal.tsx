'use client';

interface PRConfirmModalProps {
  lessonTitle: string;
  lessonId: number;
  chapterCount: number;
  stepCount: number;
  isSubmitting: boolean;
  result: { prUrl: string; prNumber: number } | null;
  error: string | null;
  onSubmit: () => void;
  onClose: () => void;
}

export function PRConfirmModal({
  lessonTitle,
  lessonId,
  chapterCount,
  stepCount,
  isSubmitting,
  result,
  error,
  onSubmit,
  onClose,
}: PRConfirmModalProps) {
  const branchName = `lesson-editor/${lessonId}-{timestamp}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{result ? '✅' : '📋'}</span>
            <h2 className="text-lg font-bold text-blue-300">
              {result ? 'PR Created' : 'Submit Pull Request'}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {result ? (
            // Success state
            <div>
              <p className="text-slate-300 mb-4">
                Your changes have been submitted as a pull request.
              </p>
              <div className="bg-slate-800/50 border border-emerald-600/30 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">PR #:</span>
                    <span className="text-emerald-300 font-medium">{result.prNumber}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-400">URL: </span>
                    <a
                      href={result.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline break-all"
                    >
                      {result.prUrl}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Confirmation state
            <div>
              <p className="text-slate-300 mb-4">
                This will create a pull request with your lesson changes:
              </p>

              <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Lesson:</span>
                    <span className="text-white font-medium truncate ml-2 max-w-[200px]">
                      &quot;{lessonTitle}&quot;
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Chapters:</span>
                    <span className="text-slate-200">{chapterCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Steps:</span>
                    <span className="text-slate-200">{stepCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Branch:</span>
                    <span className="text-slate-200 font-mono text-xs">{branchName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Target:</span>
                    <span className="text-slate-200 font-mono text-xs">main</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 mb-4">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <p className="text-sm text-slate-400">
                The PR will be reviewed before merging into the main branch.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/30 flex gap-3">
          {result ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded text-sm text-slate-300 hover:text-white transition-colors"
              >
                Close
              </button>
              <a
                href={result.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2.5 bg-[#1E4CDD]/30 hover:bg-[#1E4CDD]/50 border border-[#1E4CDD]/50 hover:border-blue-400 rounded text-sm text-blue-200 hover:text-white font-pixel uppercase text-center transition-colors"
              >
                View PR
              </a>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded text-sm text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-[#1E4CDD]/30 hover:bg-[#1E4CDD]/50 border border-[#1E4CDD]/50 hover:border-blue-400 rounded text-sm text-blue-200 hover:text-white font-pixel uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit PR'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
