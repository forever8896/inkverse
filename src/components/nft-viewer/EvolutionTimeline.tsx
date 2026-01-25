'use client';

import { motion } from 'motion/react';
import type { EvolutionStage, EvolutionHistoryEntry } from '@/hooks/useMonsterAsset';

// ============================================================================
// Types
// ============================================================================

interface EvolutionTimelineProps {
  currentStage: EvolutionStage;
  evolutionHistory: EvolutionHistoryEntry[];
  nextEvolution?: {
    stage: EvolutionStage;
    requiresGeneration: boolean;
    canEvolve: boolean;
  };
  onEvolve?: () => void;
  isEvolving?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const STAGE_CONFIG: Record<EvolutionStage, { icon: string; label: string; color: string }> = {
  young: { icon: '🐣', label: 'Young (2D)', color: 'var(--mi-mint)' },
  young_3d: { icon: '🦋', label: 'Young (3D)', color: 'var(--mi-cobalt)' },
  adult: { icon: '👾', label: 'Adult', color: 'var(--mi-orange)' },
};

const STAGE_ORDER: EvolutionStage[] = ['young', 'young_3d', 'adult'];

// ============================================================================
// Helpers
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateTxHash(hash: string): string {
  if (!hash || hash.length < 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

// ============================================================================
// Components
// ============================================================================

interface StageNodeProps {
  stage: EvolutionStage;
  isCompleted: boolean;
  isCurrent: boolean;
  isNext: boolean;
  historyEntry?: EvolutionHistoryEntry;
  onEvolve?: () => void;
  canEvolve?: boolean;
  isEvolving?: boolean;
  requiresGeneration?: boolean;
}

function StageNode({
  stage,
  isCompleted,
  isCurrent,
  isNext,
  historyEntry,
  onEvolve,
  canEvolve,
  isEvolving,
  requiresGeneration,
}: StageNodeProps) {
  const config = STAGE_CONFIG[stage];

  return (
    <div className="relative flex items-start gap-4">
      {/* Node Circle */}
      <div
        className={`relative flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl transition-all duration-300 ${
          isCompleted
            ? 'border-[var(--mi-mint)] bg-[var(--mi-mint)]/10'
            : isCurrent
              ? 'border-[var(--mi-cobalt)] bg-[var(--mi-cobalt)]/10 animate-pulse'
              : isNext && canEvolve
                ? 'border-[var(--mi-orange)] bg-[var(--mi-orange)]/10'
                : 'border-slate-600/50 bg-slate-800/50'
        }`}
      >
        <span>{config.icon}</span>
        {isCompleted && (
          <motion.div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--mi-mint)] flex items-center justify-center text-xs text-black font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            ✓
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`font-pixel text-[10px] uppercase tracking-wide ${
              isCompleted || isCurrent
                ? 'text-white'
                : 'text-slate-400'
            }`}
          >
            {config.label}
          </span>
          {isCurrent && !isNext && (
            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-[var(--mi-cobalt)]/20 text-[var(--mi-cobalt)] border border-[var(--mi-cobalt)]/30">
              Current
            </span>
          )}
          {isNext && canEvolve && (
            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-[var(--mi-orange)]/20 text-[var(--mi-orange)] border border-[var(--mi-orange)]/30">
              Next
            </span>
          )}
        </div>

        {/* Completed Evolution Details */}
        {historyEntry && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {/* Milestone */}
            {historyEntry.milestoneLabel && (
              <div className="text-sm text-slate-300">
                {historyEntry.milestoneLabel}
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{formatDate(historyEntry.evolvedAt)}</span>
              <span>•</span>
              <span>{formatTime(historyEntry.evolvedAt)}</span>
            </div>

            {/* Transaction Link */}
            {historyEntry.txHash && (
              <a
                href={`https://paseo.subscan.io/extrinsic/${historyEntry.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--mi-mint)] hover:underline"
              >
                <span>Tx: {truncateTxHash(historyEntry.txHash)}</span>
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
          </motion.div>
        )}

        {/* Evolve Button for Next Stage */}
        {isNext && canEvolve && onEvolve && (
          <motion.button
            onClick={onEvolve}
            disabled={isEvolving}
            className={`mt-3 px-4 py-2 rounded-lg font-pixel text-[10px] uppercase tracking-wider transition-all ${
              isEvolving
                ? 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
                : 'bg-[var(--mi-orange)]/20 text-[var(--mi-orange)] border border-[var(--mi-orange)]/50 hover:bg-[var(--mi-orange)]/30 hover:scale-105'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {isEvolving ? (
              <span className="flex items-center gap-2">
                <motion.span
                  className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                Evolving...
              </span>
            ) : (
              <>
                {requiresGeneration ? 'Generate & Evolve' : 'Reveal 3D Model'}
              </>
            )}
          </motion.button>
        )}

        {/* Future Stage Placeholder */}
        {!isCompleted && !isCurrent && !isNext && (
          <div className="text-xs text-slate-600 italic">
            Complete previous evolution to unlock
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function EvolutionTimeline({
  currentStage,
  evolutionHistory,
  nextEvolution,
  onEvolve,
  isEvolving,
}: EvolutionTimelineProps) {
  // Create a map of stage -> history entry for quick lookup
  const historyByStage = new Map<EvolutionStage, EvolutionHistoryEntry>();
  evolutionHistory.forEach((entry) => {
    historyByStage.set(entry.stage, entry);
  });

  const currentStageIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-pixel text-[10px] uppercase tracking-wider text-[var(--mi-mint)]">
          Evolution Journey
        </h3>
        <div className="text-xs text-slate-500">
          {evolutionHistory.length} / {STAGE_ORDER.length} Stages
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-6 top-6 bottom-0 w-0.5 bg-gradient-to-b from-[var(--mi-mint)]/50 via-slate-600/30 to-transparent" />

        {/* Stage Nodes */}
        <div className="space-y-0">
          {STAGE_ORDER.map((stage, index) => {
            const isCompleted = index < currentStageIndex || (index === currentStageIndex && historyByStage.has(stage));
            const isCurrent = stage === currentStage;
            const isNext = nextEvolution?.stage === stage;

            return (
              <StageNode
                key={stage}
                stage={stage}
                isCompleted={isCompleted && historyByStage.has(stage)}
                isCurrent={isCurrent}
                isNext={isNext}
                historyEntry={historyByStage.get(stage)}
                onEvolve={isNext ? onEvolve : undefined}
                canEvolve={nextEvolution?.canEvolve}
                isEvolving={isEvolving}
                requiresGeneration={nextEvolution?.requiresGeneration}
              />
            );
          })}
        </div>
      </div>

      {/* All Stages Complete */}
      {currentStage === 'adult' && historyByStage.has('adult') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-slate-700/30 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-[var(--mi-mint)]">
            <span className="text-lg">🎉</span>
            <span className="font-pixel text-[10px] uppercase tracking-wider">
              Evolution Complete!
            </span>
            <span className="text-lg">🎉</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Your monster has reached its final form
          </p>
        </motion.div>
      )}

      {/* Progress Bar */}
      <div className="mt-6 pt-4 border-t border-slate-700/30">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400">Progress</span>
          <span className="text-white font-medium">
            {Math.round(((currentStageIndex + 1) / STAGE_ORDER.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, var(--mi-mint), var(--mi-cobalt), var(--mi-orange))',
            }}
            initial={{ width: 0 }}
            animate={{
              width: `${((currentStageIndex + 1) / STAGE_ORDER.length) * 100}%`,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}
