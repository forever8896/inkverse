'use client';

/**
 * LessonInstructionsPanel - Instructions/content section
 *
 * Contains:
 * - Lesson content (rendered markdown)
 * - Hint button and tooltip
 * - Code editor toggle button
 */

import { motion } from 'motion/react';
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
    <motion.div
      className={`p-6 flex flex-col overflow-hidden backdrop-blur-md bg-white/5 rounded-xl mb-4 transition-all duration-500 ease-out ${
        isTransitioning
          ? 'opacity-0 translate-x-4'
          : 'opacity-100 translate-x-0'
      } ${currentStepData?.code !== undefined && showCodeEditor ? 'flex-1 min-h-0' : 'flex-[2] min-h-0'}`}
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
    >
      {/* Lesson Content */}
      {currentStepData && (
        <div className="flex-1 flex flex-col min-h-0">
          <div
            ref={lessonContentRef}
            className="flex-1 overflow-y-auto transition-all duration-300"
          >
            {/* Step title rendered as H1 */}
            <h1 className="font-normal mb-6 text-purple-400 text-balance" style={{ fontSize: '0.6rem', lineHeight: 1.4 }}>
              {(() => {
                const title = currentStepData.title || '';
                const emojiMatch = title.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)/u);
                if (emojiMatch) {
                  const emoji = emojiMatch[0];
                  const rest = title.slice(emoji.length).replace(/^\s+/, '');
                  return (
                    <>
                      <span style={{ display: 'inline-block', transform: 'translateY(-1px)' }}>{emoji}</span>
                      {rest && ` ${rest}`}
                    </>
                  );
                }
                return title;
              })()}
            </h1>
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
              className="px-2 py-1 bg-[#FF9F1C]/20 hover:bg-[#FF9F1C]/40 border border-[#FF9F1C]/50 hover:border-[#FF9F1C] text-[#FF9F1C] hover:text-white font-pixel text-[8px] uppercase tracking-wider rounded transition-all hover:shadow-lg hover:shadow-[#FF9F1C]/20"
            >
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
          )}

          {/* Code Editor Toggle Button */}
          {currentStepData?.code !== undefined && (
            <button
              onClick={() => setShowCodeEditor(!showCodeEditor)}
              className="px-2 py-1 bg-[#4FFFB0]/20 hover:bg-[#4FFFB0]/40 border border-[#4FFFB0]/50 hover:border-[#4FFFB0] text-[#4FFFB0] hover:text-white font-pixel text-[8px] uppercase tracking-wider rounded transition-all hover:shadow-lg hover:shadow-[#4FFFB0]/20"
            >
              {showCodeEditor ? 'Hide Code' : 'Show Code'}
            </button>
          )}
        </div>
      )}

      {/* Hint Tooltip */}
      {currentStepData?.hint && (
        <HintTooltip hint={currentStepData.hint} isVisible={showHint} />
      )}
    </motion.div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function HintTooltip({ hint, isVisible }: { hint: string; isVisible: boolean }) {
  return (
    <div className="relative">
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
          <div className="p-4 bg-[#FF9F1C]/10 border border-[#FF9F1C]/40 rounded-lg shadow-xl backdrop-blur-lg pointer-events-auto">
            <h4 className="font-pixel text-[8px] uppercase tracking-wider text-[#FF9F1C] mb-2">
              Hint
            </h4>
            <p className="text-slate-200 leading-relaxed text-sm">
              {hint}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
