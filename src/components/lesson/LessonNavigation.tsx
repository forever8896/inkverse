'use client';

/**
 * LessonNavigation - Navigation controls for lessons
 *
 * Contains:
 * - Previous/Next step buttons
 * - Step indicator dots
 * - Chapter indicator dots
 * - Complete lesson button
 */

import { useLessonContext } from './LessonContext';

export function LessonNavigation() {
  const {
    lesson,
    currentChapter,
    currentStep,
    currentChapterData,
    currentStepData,
    isTransitioning,
    isValidated,
    isLastStep,
    nextStep,
    previousStep,
    goToStep,
    goToChapter,
    setShowCompletionModal,
  } = useLessonContext();

  const canProceed = !currentStepData?.validation || isValidated;

  return (
    <div className="flex justify-between items-center flex-shrink-0">
      {/* Previous Button */}
      <div className="relative group">
        <button
          onClick={previousStep}
          disabled={currentStep === 0 && currentChapter === 0}
          className="w-10 h-10 rounded-lg border border-slate-600/50 bg-slate-800/50 hover:bg-slate-700/70 hover:border-slate-500/70 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-800/50 disabled:hover:border-slate-600/50 transition-all duration-200 flex items-center justify-center backdrop-blur-sm hover:scale-105 active:scale-95"
          aria-label="Previous step"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-300 group-hover:text-white transition-colors duration-200"
          >
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
        {(currentStep > 0 || currentChapter > 0) && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900/90 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-slate-700/50 backdrop-blur-sm">
            Previous Step
          </div>
        )}
      </div>

      {/* Chapter & Step Indicators */}
      <div className="flex flex-col items-center space-y-2">
        {/* Chapter Title */}
        <div className="text-xs text-slate-400">
          Chapter {currentChapter + 1}: {currentChapterData?.title}
        </div>

        {/* Step Indicators for Current Chapter */}
        <div className="flex space-x-2">
          {currentChapterData && Array.from({ length: currentChapterData.steps.length }, (_, i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-110 ${
                i === currentStep
                  ? 'bg-gradient-to-r from-purple-400 to-cyan-400 shadow-lg shadow-purple-400/30'
                  : i < currentStep
                    ? 'bg-gradient-to-r from-pink-400 to-pink-400 shadow-md shadow-green-400/20'
                    : 'bg-slate-600 hover:bg-slate-500'
              }`}
              title={`Step ${i + 1}`}
            />
          ))}
        </div>

        {/* Chapter Indicators */}
        <div className="flex space-x-1">
          {lesson?.chapters?.map((chapter, idx) => (
            <button
              key={chapter.id}
              onClick={() => goToChapter(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-200 hover:scale-125 ${
                idx === currentChapter
                  ? 'bg-purple-500'
                  : idx < currentChapter
                    ? 'bg-emerald-500'
                    : 'bg-slate-700 hover:bg-slate-600'
              }`}
              title={`Chapter ${idx + 1}: ${chapter.title}`}
            />
          ))}
        </div>
      </div>

      {/* Next/Complete Button */}
      {isLastStep ? (
        <CompleteButton
          canProceed={canProceed}
          onClick={() => setShowCompletionModal(true)}
        />
      ) : (
        <NextButton
          canProceed={canProceed}
          onClick={nextStep}
        />
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function NextButton({ canProceed, onClick }: { canProceed: boolean; onClick: () => void }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={!canProceed}
        className={`w-10 h-10 rounded-lg border transition-all duration-200 flex items-center justify-center backdrop-blur-sm active:scale-95 ${
          !canProceed
            ? 'border-slate-600/50 bg-slate-800/50 opacity-30 cursor-not-allowed'
            : 'border-purple-500/50 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 hover:from-purple-600/40 hover:to-cyan-600/40 hover:border-purple-400/70 hover:scale-105 shadow-lg shadow-purple-500/20'
        }`}
        aria-label="Next step"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-colors duration-200 ${
            !canProceed ? 'text-slate-500' : 'text-purple-200 group-hover:text-white'
          }`}
        >
          <polyline points="9,18 15,12 9,6" />
        </svg>
      </button>
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900/90 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-slate-700/50 backdrop-blur-sm">
        {!canProceed ? 'Complete validation first' : 'Next Step'}
      </div>
    </div>
  );
}

function CompleteButton({ canProceed, onClick }: { canProceed: boolean; onClick: () => void }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={!canProceed}
        className={`w-10 h-10 rounded-lg border transition-all duration-300 flex items-center justify-center backdrop-blur-sm active:scale-95 ${
          !canProceed
            ? 'border-slate-600/50 bg-slate-800/50 opacity-30 cursor-not-allowed'
            : 'border-purple-500/50 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 hover:from-purple-600/40 hover:to-cyan-600/40 hover:border-purple-400/70 hover:scale-105 shadow-lg shadow-purple-500/20 animate-pulse-glow'
        }`}
        aria-label="Complete lesson"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-colors duration-200 ${
            !canProceed ? 'text-slate-500' : 'text-purple-200 group-hover:text-white'
          }`}
        >
          <path d="M20 6L9 17l-5-5" />
          <circle cx="12" cy="12" r="10" strokeWidth="1" opacity="0.3" />
        </svg>
      </button>
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900/90 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-slate-700/50 backdrop-blur-sm">
        {!canProceed ? 'Complete validation first' : 'Complete Lesson'}
      </div>
    </div>
  );
}
