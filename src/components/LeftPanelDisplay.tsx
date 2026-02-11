import { motion } from 'motion/react';
import {
  useLeftPanelDisplay,
  type LeftPanelDisplay,
} from '@/hooks/useLeftPanelDisplay';
import { CreatureStageDisplay } from '@/components/CreatureStageDisplay';
import { LessonStepImageDisplay } from '@/components/LessonStepImageDisplay';
import { isProcessing, isRetrying, STATUS_MESSAGES, type GenerationStatus } from '@/lib/status-constants';

/**
 * Smart display component that shows the appropriate content based on priority hierarchy:
 * 1. Generated Creature (if available and generation is complete)
 * 2. Generation Status (if generation is in progress)
 * 3. Lesson Step Image (if no generation involved)
 * 4. Default Egg (fallback)
 */
export function LeftPanelDisplay() {
  const display = useLeftPanelDisplay();

  return (
    <motion.div
      key={display.type} // Force re-animation when type changes
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full h-full"
    >
      {renderDisplayContent(display)}
    </motion.div>
  );
}

function renderDisplayContent(display: LeftPanelDisplay) {
  switch (display.type) {
    case 'creature':
      return (
        <CreatureStageDisplay
          stage={display.stage}
          imageUrl={display.imageUrl}
          modelUrl={display.modelUrl}
          isRevealing={display.isRevealing}
          isLoading={display.isLoading}
          error={display.error}
          onRetry={display.onRetry}
        />
      );

    case 'generation':
      return (
        <GenerationStatusDisplay
          status={display.status || 'unknown'}
          error={display.error}
          userMessage={display.userMessage}
          onRetry={display.onRetry}
          isEvolving={display.isEvolving}
        />
      );

    case 'lesson-image':
      return (
        <LessonStepImageDisplay
          imageUrl={display.imageUrl}
          title={display.title || ''}
        />
      );

    case 'egg':
    default:
      return <DefaultEggDisplay />;
  }
}

function GenerationStatusDisplay({
  status,
  error,
  userMessage,
  onRetry,
  isEvolving,
}: {
  status: string;
  error: string | null;
  userMessage?: string | null;
  onRetry: () => void;
  isEvolving?: boolean;
}) {
  const retrying = isRetrying(status);
  const statusMessage = STATUS_MESSAGES[status as GenerationStatus];

  const title = isEvolving
    ? 'Evolving Monster...'
    : statusMessage || 'Synthesizing DNA...';
  // Use the workflow's userMessage when available (e.g. "Our 3D service hit a temporary issue. Retrying automatically...")
  // Otherwise fall back to contextual subtitles
  const subtitle = isEvolving
    ? 'Unlocking your 3D model on the blockchain.'
    : userMessage
    ? userMessage
    : retrying
    ? 'Automatic retry in progress — keep this page open.'
    : 'Your unique creature is being generated in the bio-chamber.';
  const errorText = isEvolving ? 'Evolution Failed. Retry?' : 'Generation Failed. Retry?';

  // Only show the manual retry button for errors that are NOT auto-retrying
  const showRetryButton = error && !retrying;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-grid-slate-800/[0.2] bg-[length:20px_20px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 flex flex-col items-center text-center p-6"
      >
        {/* DNA Spinner Animation */}
        <div className={`w-16 h-16 mb-4 border-4 border-t-transparent rounded-full animate-spin ${
          retrying
            ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
            : 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
        }`} />

        <h3 className="text-xl font-bold text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-purple-200 max-w-xs">
          {subtitle}
        </p>

        {showRetryButton && (
          <button
            onClick={onRetry}
            className="mt-6 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs rounded border border-red-500/50 transition-colors"
          >
            {errorText}
          </button>
        )}
      </motion.div>
    </div>
  );
}

function DefaultEggDisplay() {
  return (
    <motion.div
      className="w-full h-full flex items-center justify-center relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Placeholder visuals */}
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-slate-900 to-slate-900" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(148,163,184,0.1)] border border-slate-700">
          <span className="text-4xl">🥚</span>
        </div>
        <p className="text-slate-400 text-sm font-medium tracking-wider">
          INCUBATING
        </p>
      </div>
    </motion.div>
  );
}
