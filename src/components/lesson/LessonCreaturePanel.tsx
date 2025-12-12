'use client';

/**
 * LessonCreaturePanel - Left panel containing creature display
 *
 * Contains:
 * - Logo with link back to lab
 * - NFT capture button
 * - Creature stage display
 * - Generation status notification
 * - Camera shutter effect
 * - Success overlay
 */

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Camera, Loader2 } from 'lucide-react';
import { useLessonContext } from './LessonContext';
import { isProcessing } from '@/lib/status-constants';

// CreatureStageDisplay - Load immediately, but MonsterViewer inside is lazy
const CreatureStageDisplay = dynamic(
  () => import('@/components/CreatureStageDisplay').then(mod => ({ default: mod.CreatureStageDisplay })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-purple-300 text-sm">Loading creature display...</p>
        </div>
      </div>
    )
  }
);

export function LessonCreaturePanel() {
  const {
    isTransitioning,
    asset,
    targetStage,
    effectiveLoading,
    isDisplayRevealing,
    handleRetry,
    captureNFT,
    isCapturing,
    showShutter,
    showSuccess,
    creatureDisplayRef,
  } = useLessonContext();

  return (
    <div className="relative overflow-hidden transition-all duration-500 p-5 w-1/2">
      {/* Single bordered container for logo, button, and creature */}
      <div className="w-full h-full rounded-xl border border-purple-500/30 bg-slate-900 flex flex-col overflow-hidden">
        {/* Header: Logo and Snapshot Button */}
        <div className="flex justify-between items-start p-4 flex-shrink-0">
          <Link
            href="/lab"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            title="View all lessons"
          >
            <img
              src="/logo.png"
              alt="Monsters ink!"
              className="h-[80px]"
            />
          </Link>

          <div className="flex items-center space-x-3">
            {/* NFT Capture Button */}
            <button
              onClick={captureNFT}
              disabled={isCapturing}
              className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-300 ${
                isCapturing
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/30 hover:scale-105'
              }`}
              title="Create NFT"
            >
              {isCapturing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Camera size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Creature Display */}
        <div
          ref={creatureDisplayRef}
          className={`relative flex-1 transition-all duration-300 ease-out ${
            isTransitioning
              ? 'opacity-0 scale-95 translate-y-4'
              : 'opacity-100 scale-100 translate-y-0'
          }`}
        >
          <CreatureStageDisplay
            stage={targetStage}
            imageUrl={asset.imageUrl}
            modelUrl={asset.modelUrl}
            isRevealing={isDisplayRevealing}
            isLoading={effectiveLoading}
            error={asset.error}
            onRetry={handleRetry}
          />
        </div>
      </div>

      {/* Generation Notification Toast */}
      <GenerationNotification
        isVisible={asset.isGenerating || isProcessing(asset.status)}
      />

      {/* Camera Shutter Effect */}
      {showShutter && <CameraShutterEffect />}

      {/* Success Overlay */}
      {showSuccess && <SuccessOverlay />}
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
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Creating your unique monster...</p>
          <p className="text-xs text-slate-400">Standby, it will be ready soon.</p>
        </div>
      </div>
    </div>
  );
}

function CameraShutterEffect() {
  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <div className="camera-shutter">
          <div className="shutter-blade blade-1"></div>
          <div className="shutter-blade blade-2"></div>
          <div className="shutter-blade blade-3"></div>
          <div className="shutter-blade blade-4"></div>
          <div className="shutter-blade blade-5"></div>
          <div className="shutter-blade blade-6"></div>
          <div className="shutter-blade blade-7"></div>
          <div className="shutter-blade blade-8"></div>
        </div>
      </div>
    </div>
  );
}

function SuccessOverlay() {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-6 rounded-2xl shadow-2xl animate-bounce-in">
        <div className="text-center">
          <div className="text-4xl mb-2">📸</div>
          <h3 className="text-xl font-bold mb-1">NFT Created!</h3>
          <p className="text-green-100 text-sm">
            Your creature has been captured
          </p>
        </div>
      </div>
    </div>
  );
}
