'use client';

/**
 * CompilationErrorDisplay Component
 *
 * Displays structured Rust compilation errors with:
 * - Error code and message
 * - Source location (file:line:column)
 * - Code snippet with highlighting
 * - Suggestions and explanations
 */

import type { CompilationError } from '@/hooks/useCodeCompilation';

interface CompilationErrorDisplayProps {
  errors: CompilationError[];
  warnings?: CompilationError[];
  onDismiss?: () => void;
}

/**
 * Single error/warning item display
 */
function ErrorItem({ item, isWarning = false }: { item: CompilationError; isWarning?: boolean }) {
  const bgColor = isWarning ? 'bg-yellow-900/30' : 'bg-red-900/30';
  const borderColor = isWarning ? 'border-yellow-500/50' : 'border-red-500/50';
  const labelColor = isWarning ? 'text-yellow-400' : 'text-red-400';
  const labelBg = isWarning ? 'bg-yellow-600/30' : 'bg-red-600/30';

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4 mb-3`}>
      {/* Header: Error code + message */}
      <div className="flex items-start gap-2 mb-2">
        <span className={`${labelBg} ${labelColor} px-2 py-0.5 rounded text-xs font-mono uppercase`}>
          {isWarning ? 'warning' : 'error'}
          {item.code && ` [${item.code}]`}
        </span>
      </div>

      {/* Message */}
      <p className="text-white font-medium text-sm mb-2">{item.message}</p>

      {/* Location */}
      {item.location && (
        <div className="text-slate-400 text-xs font-mono mb-2">
          <span className="text-blue-400">--&gt;</span> {item.location.file}:{item.location.line}:{item.location.column}
        </div>
      )}

      {/* Code snippet */}
      {item.snippet && (
        <pre className="bg-slate-900/50 border border-slate-700 rounded p-3 text-xs font-mono text-slate-300 overflow-x-auto mb-2">
          {item.snippet}
        </pre>
      )}

      {/* Suggestion */}
      {item.suggestion && (
        <div className="flex items-start gap-2 text-sm mt-2">
          <span className="text-cyan-400 font-medium">help:</span>
          <span className="text-slate-300">{item.suggestion}</span>
        </div>
      )}

      {/* Educational explanation */}
      {item.explanation && (
        <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded">
          <p className="text-blue-300 text-xs leading-relaxed">
            <span className="font-semibold">Learn:</span> {item.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Main compilation error display component
 */
export function CompilationErrorDisplay({
  errors,
  warnings = [],
  onDismiss,
}: CompilationErrorDisplayProps) {
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  if (!hasErrors && !hasWarnings) {
    return null;
  }

  return (
    <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-4 max-h-[400px] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-semibold text-sm">Compilation Results</h3>
          <div className="flex gap-2">
            {hasErrors && (
              <span className="bg-red-600/30 text-red-300 px-2 py-0.5 rounded text-xs">
                {errors.length} error{errors.length !== 1 ? 's' : ''}
              </span>
            )}
            {hasWarnings && (
              <span className="bg-yellow-600/30 text-yellow-300 px-2 py-0.5 rounded text-xs">
                {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-white text-xl leading-none px-2"
            aria-label="Dismiss"
          >
            &times;
          </button>
        )}
      </div>

      {/* Errors */}
      {hasErrors && (
        <div className="mb-4">
          {errors.map((error, index) => (
            <ErrorItem key={`error-${index}`} item={error} />
          ))}
        </div>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <div>
          {warnings.map((warning, index) => (
            <ErrorItem key={`warning-${index}`} item={warning} isWarning />
          ))}
        </div>
      )}

      {/* Help text */}
      <div className="mt-4 pt-3 border-t border-slate-700">
        <p className="text-slate-400 text-xs">
          Fix the errors above and click &quot;Check Code&quot; again. Hover over error codes for more info.
        </p>
      </div>
    </div>
  );
}

/**
 * Compact inline error display for toast-like notifications
 */
export function CompilationErrorSummary({
  errors,
  warnings = [],
}: {
  errors: CompilationError[];
  warnings?: CompilationError[];
}) {
  const firstError = errors[0];
  const totalErrors = errors.length;
  const totalWarnings = warnings.length;

  if (!firstError) {
    return null;
  }

  return (
    <div className="text-sm">
      <p className="font-medium text-white mb-1">
        {firstError.message}
      </p>
      {firstError.location && (
        <p className="text-slate-400 text-xs font-mono">
          Line {firstError.location.line}, Column {firstError.location.column}
        </p>
      )}
      {firstError.suggestion && (
        <p className="text-cyan-400 text-xs mt-1">
          Hint: {firstError.suggestion}
        </p>
      )}
      {(totalErrors > 1 || totalWarnings > 0) && (
        <p className="text-slate-500 text-xs mt-2">
          {totalErrors > 1 && `+${totalErrors - 1} more error${totalErrors > 2 ? 's' : ''}`}
          {totalErrors > 1 && totalWarnings > 0 && ', '}
          {totalWarnings > 0 && `${totalWarnings} warning${totalWarnings > 1 ? 's' : ''}`}
        </p>
      )}
    </div>
  );
}
