'use client';

/**
 * LessonCodeEditorPanel - Code editor section with controls
 *
 * Contains:
 * - Editor header with title
 * - Reset, Check, and Solution buttons
 * - Monaco code editor (lazy loaded)
 */

import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { useLessonContext } from './LessonContext';

// Monaco Editor (~1MB) - Only load when code step is shown
const MonacoCodeEditor = dynamic(
  () => import('@/components/MonacoCodeEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full rounded-xl border border-slate-600/50 bg-slate-800/50 animate-pulse flex items-center justify-center">
        <div className="text-center text-slate-400">
          <div className="text-3xl mb-2">🧬</div>
          <div className="text-sm">Loading editor...</div>
        </div>
      </div>
    )
  }
);

export function LessonCodeEditorPanel() {
  const {
    currentStepData,
    isTransitioning,
    userCode,
    setUserCode,
    validateUserCode,
    resetCode,
    showSolution,
    showCodeEditor,
  } = useLessonContext();

  // Don't render if no code or editor is hidden
  if (currentStepData?.code === undefined || !showCodeEditor) {
    return null;
  }

  return (
    <motion.div
      className={`flex-1 flex flex-col min-h-0 mb-4 transition-all duration-500 ease-out ${
        isTransitioning
          ? 'opacity-0 translate-x-4'
          : 'opacity-100 translate-x-0'
      }`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
    >
      {/* Editor Header */}
      <div className="p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold transition-all duration-300">
            Workspace
          </h4>
          <div className="flex space-x-2">
            {/* Reset Button */}
            <EditorButton
              onClick={resetCode}
              icon={<ResetIcon />}
              tooltip="Reset Code"
              variant="default"
            />

            {/* Check Code Button */}
            {currentStepData?.validation && (
              <EditorButton
                onClick={validateUserCode}
                icon={<CheckIcon />}
                tooltip="Check Code"
                variant="primary"
              />
            )}

            {/* Solution Button */}
            {currentStepData?.expectedCode && (
              <EditorButton
                onClick={showSolution}
                icon={<HelpIcon />}
                tooltip="Show Solution"
                variant="secondary"
              />
            )}
          </div>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 min-h-0">
        <div
          className={`h-full transition-all duration-300 ease-out ${
            isTransitioning ? 'opacity-0 scale-98' : 'opacity-100 scale-100'
          }`}
        >
          <MonacoCodeEditor
            value={userCode}
            onChange={setUserCode}
            language="rust"
          />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface EditorButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  tooltip: string;
  variant: 'default' | 'primary' | 'secondary';
}

function EditorButton({ onClick, icon, tooltip, variant }: EditorButtonProps) {
  const variantClasses = {
    default: 'border-slate-600/50 bg-slate-800/50 hover:bg-slate-700/70 hover:border-slate-500/70',
    primary: 'border-purple-500/50 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 hover:from-purple-600/40 hover:to-cyan-600/40 hover:border-purple-400/70 shadow-lg shadow-purple-500/20',
    secondary: 'border-cyan-500/50 bg-cyan-600/20 hover:bg-cyan-600/40 hover:border-cyan-400/70 shadow-lg shadow-cyan-500/20',
  };

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-8 h-8 rounded-lg border transition-all duration-200 flex items-center justify-center backdrop-blur-sm hover:scale-105 active:scale-95 ${variantClasses[variant]}`}
        aria-label={tooltip}
      >
        {icon}
      </button>
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900/90 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-slate-700/50 backdrop-blur-sm">
        {tooltip}
      </div>
    </div>
  );
}

// ============================================================================
// Icons
// ============================================================================

function ResetIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-300 group-hover:text-white transition-colors duration-200"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-purple-200 group-hover:text-white transition-colors duration-200"
    >
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-cyan-200 group-hover:text-white transition-colors duration-200"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}
