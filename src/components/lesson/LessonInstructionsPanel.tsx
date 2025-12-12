'use client';

/**
 * LessonInstructionsPanel - Instructions/content section
 *
 * Contains:
 * - Lesson content (rendered markdown)
 * - Hint button and tooltip
 * - Code editor toggle button
 */

import LessonContent from '@/components/LessonContent';
import { useLessonContext } from './LessonContext';

export function LessonInstructionsPanel() {
  const {
    currentStepData,
    isTransitioning,
    showHint,
    setShowHint,
    showCodeEditor,
    setShowCodeEditor,
    lessonContentRef,
  } = useLessonContext();

  return (
    <div
      className={`p-6 flex flex-col overflow-hidden backdrop-blur-md bg-white/5 rounded-xl mb-4 transition-all duration-500 ease-out ${
        isTransitioning
          ? 'opacity-0 translate-x-4'
          : 'opacity-100 translate-x-0'
      } ${currentStepData?.code !== undefined && showCodeEditor ? 'flex-1 min-h-0' : 'flex-[2] min-h-0'}`}
    >
      {/* Lesson Content */}
      {currentStepData && (
        <div className="flex-1 flex flex-col min-h-0">
          <div
            ref={lessonContentRef}
            className="flex-1 overflow-y-auto transition-all duration-300"
          >
            <LessonContent html={currentStepData.content} />
          </div>
        </div>
      )}

      {/* Hint and Code Toggle Buttons */}
      {(currentStepData?.hint || currentStepData?.code !== undefined) && (
        <div className="mt-4 flex-shrink-0 flex items-center space-x-2">
          {/* Hint Button */}
          {currentStepData?.hint && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 transition-all duration-200 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 hover:border-amber-500/50 text-sm"
            >
              <span>💡</span>
              <span className="font-medium">Show Hint</span>
            </button>
          )}

          {/* Code Editor Toggle Button */}
          {currentStepData?.code !== undefined && (
            <button
              onClick={() => setShowCodeEditor(!showCodeEditor)}
              className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-all duration-200 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/30 hover:border-cyan-500/50 text-sm"
              title={showCodeEditor ? 'Hide Code Editor' : 'Show Code Editor'}
              aria-label={showCodeEditor ? 'Hide Code Editor' : 'Show Code Editor'}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-cyan-300"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span className="font-medium">{showCodeEditor ? 'Hide Code' : 'Show Code'}</span>
            </button>
          )}
        </div>
      )}

      {/* Hint Tooltip */}
      {currentStepData?.hint && (
        <HintTooltip hint={currentStepData.hint} isVisible={showHint} />
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function HintTooltip({ hint, isVisible }: { hint: string; isVisible: boolean }) {
  return (
    <div className="relative">
      <button className="hidden">
        <span>💡</span>
        <span className="font-medium">Show Hint</span>
      </button>
      <div className="relative w-full flex justify-center">
        {/* Animated Toast-like Hint Overlay */}
        <div
          className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-300 ${
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-4'
          } w-[min(90vw,420px)]`}
          aria-live="polite"
        >
          <div className="p-4 bg-gradient-to-r from-amber-900/80 to-yellow-900/70 border border-amber-600/60 rounded-lg shadow-xl backdrop-blur-lg flex items-start space-x-3 pointer-events-auto">
            <span className="text-lg mt-0.5">💡</span>
            <div>
              <h4 className="text-amber-300 font-semibold mb-1 text-sm">
                Hint
              </h4>
              <p className="text-amber-100 leading-relaxed text-sm">
                {hint}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
