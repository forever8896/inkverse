import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// ============================================================================
// PERFORMANCE: Lazy load Three.js/MonsterViewer (~500KB)
// Only loads when adult stage is shown (3D model display)
// ============================================================================
const MonsterViewer = dynamic(() => import('./MonsterViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900/80">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-indigo-300 text-sm">Loading 3D viewer...</p>
      </div>
    </div>
  ),
});

interface CreatureStageDisplayProps {
  stage: 'egg' | 'young' | 'adult';
  imageUrl: string | null;
  modelUrl: string | null;
  isRevealing: boolean; // True if we are currently in a Reveal Step
  isLoading: boolean; // True if we are blocked waiting for asset
  error: string | null; // Error message from hook
  onRetry: () => void; // Callback to retry generation/check
}

export const CreatureStageDisplay: React.FC<CreatureStageDisplayProps> = ({
  stage,
  imageUrl,
  modelUrl,
  isRevealing,
  isLoading,
  error,
  onRetry,
}) => {
  const [showRetry, setShowRetry] = useState(false);

  // Show retry button if loading takes too long (5s for demo, 30s real)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => setShowRetry(true), 5000);
    } else {
      setShowRetry(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Blocking / Synthesizing State
  if (isLoading && isRevealing) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-800/[0.2] bg-[length:20px_20px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 flex flex-col items-center text-center p-6"
        >
          {/* DNA Spinner Animation */}
          <div className="w-16 h-16 mb-4 border-4 border-purple-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(168,85,247,0.5)]" />

          <h3 className="text-xl font-bold text-white mb-2">
            Synthesizing DNA...
          </h3>
          <p className="text-sm text-purple-200 max-w-xs">
            Your unique creature is being generated in the bio-chamber.
          </p>

          <AnimatePresence>
            {(showRetry || error) && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={onRetry}
                className="mt-6 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs rounded border border-red-500/50 transition-colors"
              >
                {error
                  ? 'Generation Failed. Retry?'
                  : 'Taking a while? Retry Check'}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // 3D Model (Adult / Evolution)
  if (stage === 'adult' && modelUrl) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-full overflow-hidden relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-slate-900/80 z-0" />
        <MonsterViewer
          modelUrl={modelUrl}
          className="w-full h-full z-10 relative"
          autoRotate={true}
        />
        <div className="absolute bottom-4 left-0 right-0 text-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-indigo-300 bg-slate-900/80 px-3 py-1 rounded-full">
            Interactive 3D Model
          </span>
        </div>
      </motion.div>
    );
  }

  // 2D Image (Young / Hatch)
  if ((stage === 'young' || stage === 'adult') && imageUrl) {
    return (
      <motion.div
        layoutId="creature-display"
        className="w-full h-full flex items-center justify-center p-4"
      >
        <div className="relative w-full h-full">
          <Image
            src={imageUrl}
            alt="Your Monster"
            fill
            className="object-contain"
            priority
            unoptimized // External presigned URLs bypass Next.js Image optimization
          />
        </div>
      </motion.div>
    );
  }

  // Error State
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-full flex flex-col items-center justify-center bg-red-950/30 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />

        <div className="z-10 flex flex-col items-center text-center p-8 max-w-md">
          <span className="text-4xl mb-4">⚠️</span>
          <h3 className="text-lg font-bold text-red-200 mb-2">
            Generation System Offline
          </h3>

          <p className="text-sm text-red-100/80 mb-6 leading-relaxed">
            We're terribly sorry, but we're not able to generate you a unique
            monster at the moment.
            <br />
            <br />
            <span className="text-red-300">
              Don't worry, we've saved your progress.
            </span>
            <br />
            If you keep this tab open or come back to our website soon, you'll
            be able to continue where you left off.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500 rounded text-sm font-semibold text-red-200 transition-colors flex items-center gap-2"
            >
              <span>🔄</span> Retry Generation
            </button>
          </div>

          <p className="mt-4 text-[10px] text-red-400/60 font-mono">
            Error Ref: {error}
          </p>
        </div>
      </motion.div>
    );
  }

  // No creature available - this component only handles creature display
  // The calling component should handle fallback cases
  return null;
};
