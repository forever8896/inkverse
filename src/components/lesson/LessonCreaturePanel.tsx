'use client';

/**
 * LessonCreaturePanel - Left panel containing creature display
 *
 * Contains:
 * - Logo with link back to lab
 * - Creature stage display
 * - Generation status notification
 */

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { useLessonContext } from './LessonContext';
import { isProcessing } from '@/lib/status-constants';

// LeftPanelDisplay - Smart display component with priority hierarchy
const LeftPanelDisplay = dynamic(
  () =>
    import('@/components/LeftPanelDisplay').then((mod) => ({
      default: mod.LeftPanelDisplay,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-mi-cobalt border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-mi-mint text-sm">Loading display...</p>
        </div>
      </div>
    ),
  }
);

interface LessonCreaturePanelProps {
  showLogo?: boolean;
}

export function LessonCreaturePanel({ showLogo = true }: LessonCreaturePanelProps) {
  const {
    isTransitioning,
    asset,
    targetStage,
    effectiveLoading,
    isDisplayRevealing,
    handleRetry,
    creatureDisplayRef,
  } = useLessonContext();

  return (
    <div className="relative overflow-hidden transition-all duration-500 p-5 w-full h-full">
      {/* Single bordered container for logo, button, and creature */}
      <motion.div
        className="w-full h-full flex flex-col overflow-hidden"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      >
        {/* Header: Logo */}
        <div className="flex justify-between items-start p-4 flex-shrink-0">
          <Link
            href="/lab"
            className={`flex items-center space-x-2 hover:opacity-80 transition-opacity duration-500 ${
              showLogo ? 'opacity-100' : 'opacity-0'
            }`}
            title="View all lessons"
          >
            <img src="/logo.png" alt="Monsters ink!" className="h-[80px]" />
          </Link>
        </div>

        {/* Smart Display - Handles lesson images, generation status, and creatures */}
        <div
          ref={creatureDisplayRef}
          className={`relative flex-1 transition-all duration-300 ease-out ${
            isTransitioning
              ? 'opacity-0 scale-95 translate-y-4'
              : 'opacity-100 scale-100 translate-y-0'
          }`}
        >
          <LeftPanelDisplay />
        </div>
      </motion.div>

      {/* Generation Notification Toast */}
      <GenerationNotification
        isVisible={asset.isGenerating || isProcessing(asset.status)}
      />
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function GenerationNotification({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-sm px-4 pointer-events-none">
      <div className="bg-slate-900/90 backdrop-blur-md border border-purple-500/30 rounded-xl p-4 shadow-xl animate-fade-in-up flex items-center space-x-3">
        <div className="relative flex-shrink-0">
          <div className="w-3 h-3 bg-mi-grass rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-3 h-3 bg-mi-grass rounded-full animate-ping opacity-75"></div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">
            Creating your unique monster...
          </p>
          <p className="text-xs text-slate-400">
            Standby, it will be ready soon.
          </p>
        </div>
      </div>
    </div>
  );
}
