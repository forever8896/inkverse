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

import { motion } from 'motion/react';
import { useLessonContext } from './LessonContext';

export function LessonNavigation() {
  const {
    lesson,
    currentChapter,
    currentStep,
    currentChapterData,
    currentStepData,
    isValidated,
    isLastStep,
    nextStep,
    previousStep,
    setShowCompletionModal,
    playClickSound,
  } = useLessonContext();

  const canProceed = !currentStepData?.validation || isValidated;

  return (
    <motion.div
      className="flex justify-between items-center flex-shrink-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
    >
      {/* Previous Button */}
      <div className="relative group">
        <button
          onClick={() => { playClickSound(); previousStep(); }}
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

      {/* Progress Indicator */}
      <ProgressIndicator
        lesson={lesson}
        currentChapter={currentChapter}
        currentStep={currentStep}
        currentChapterData={currentChapterData}
      />

      {/* Next/Complete Button */}
      {isLastStep ? (
        <CompleteButton
          canProceed={canProceed}
          onClick={() => { playClickSound(); setShowCompletionModal(true); }}
        />
      ) : (
        <NextButton
          canProceed={canProceed}
          onClick={() => { playClickSound(); nextStep(); }}
        />
      )}
    </motion.div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface ProgressIndicatorProps {
  lesson: ReturnType<typeof useLessonContext>['lesson'];
  currentChapter: number;
  currentStep: number;
  currentChapterData: ReturnType<typeof useLessonContext>['currentChapterData'];
}

function ProgressIndicator({ lesson, currentChapter, currentStep, currentChapterData }: ProgressIndicatorProps) {
  // Calculate total steps and current position across all chapters
  const totalSteps = lesson?.chapters?.reduce((acc, ch) => acc + ch.steps.length, 0) ?? 0;
  const stepsBeforeCurrentChapter = lesson?.chapters
    ?.slice(0, currentChapter)
    .reduce((acc, ch) => acc + ch.steps.length, 0) ?? 0;
  const overallCurrentStep = stepsBeforeCurrentChapter + currentStep + 1;
  const progressPercent = totalSteps > 0 ? (overallCurrentStep / totalSteps) * 100 : 0;

  const stepsInCurrentChapter = currentChapterData?.steps.length ?? 0;

  return (
    <div className="flex flex-col items-center gap-2 min-w-[200px]">
      {/* Text progress */}
      <div className="text-sm text-slate-300">
        <span className="text-slate-500">Chapter {currentChapter + 1}</span>
        <span className="text-slate-600 mx-2">·</span>
        <span>Step {currentStep + 1} of {stepsInCurrentChapter}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

// Shared styles for navigation buttons
const NAV_BUTTON_STYLES = {
  base: 'w-10 h-10 rounded-lg border transition-all duration-200 flex items-center justify-center backdrop-blur-sm active:scale-95',
  disabled: 'border-slate-600/50 bg-slate-800/50 opacity-30 cursor-not-allowed',
  primary: 'border-purple-500/50 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 hover:from-purple-600/40 hover:to-cyan-600/40 hover:border-purple-400/70 hover:scale-105 shadow-lg shadow-purple-500/20',
  default: 'border-slate-600/50 bg-slate-800/50 hover:bg-slate-700/70 hover:border-slate-500/70 hover:scale-105',
} as const;

interface NavButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary';
  tooltip: string;
  disabledTooltip?: string;
  ariaLabel: string;
  icon: React.ReactNode;
  className?: string;
}

function NavButton({
  onClick,
  disabled = false,
  variant = 'default',
  tooltip,
  disabledTooltip,
  ariaLabel,
  icon,
  className = '',
}: NavButtonProps) {
  const buttonClass = disabled
    ? NAV_BUTTON_STYLES.disabled
    : variant === 'primary'
      ? NAV_BUTTON_STYLES.primary
      : NAV_BUTTON_STYLES.default;

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${NAV_BUTTON_STYLES.base} ${buttonClass} ${className}`}
        aria-label={ariaLabel}
      >
        {icon}
      </button>
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900/90 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-slate-700/50 backdrop-blur-sm">
        {disabled && disabledTooltip ? disabledTooltip : tooltip}
      </div>
    </div>
  );
}

function NextButton({ canProceed, onClick }: { canProceed: boolean; onClick: () => void }) {
  return (
    <NavButton
      onClick={onClick}
      disabled={!canProceed}
      variant="primary"
      tooltip="Next Step"
      disabledTooltip="Complete validation first"
      ariaLabel="Next step"
      icon={
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
      }
    />
  );
}

function CompleteButton({ canProceed, onClick }: { canProceed: boolean; onClick: () => void }) {
  return (
    <NavButton
      onClick={onClick}
      disabled={!canProceed}
      variant="primary"
      tooltip="Complete Lesson"
      disabledTooltip="Complete validation first"
      ariaLabel="Complete lesson"
      className={canProceed ? 'animate-pulse-glow' : ''}
      icon={
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
      }
    />
  );
}
