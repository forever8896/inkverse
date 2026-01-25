'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Share2 } from 'lucide-react';

import ShaderBackground from '@/components/ShaderBackground';
import Monster2DDisplay from './Monster2DDisplay';
import MonsterMetadataCard from './MonsterMetadataCard';
import NFTDetailsCard from './NFTDetailsCard';
import ShareModal from './ShareModal';
import EmptyState from './EmptyState';
import EvolutionTimeline from './EvolutionTimeline';
import { useIPFSMetadata } from '@/hooks/useIPFSMetadata';
import type { MonsterStage, MonsterStyle, NFTAttribute } from '@/lib/ipfs-utils';
import type { MonsterData } from '@/app/api/my-monster/route';
import type { EvolutionStage } from '@/hooks/useMonsterAsset';
import type { EvolutionHistoryEntry } from '@/lib/evolution-history';

// Dynamically import MonsterViewer to avoid SSR issues with Three.js
const MonsterViewer = dynamic(() => import('@/components/MonsterViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-pulse text-slate-500">Loading 3D viewer...</div>
    </div>
  ),
});

// ============================================================================
// Types
// ============================================================================

interface EvolutionData {
  currentStage: EvolutionStage;
  evolutionHistory: EvolutionHistoryEntry[];
  nextEvolution?: {
    stage: EvolutionStage;
    requiresGeneration: boolean;
    canEvolve: boolean;
  };
  monsterId: string;
  nftItemId?: number;
  nftOwnerAddress?: string;
}

interface MonsterViewerPageProps {
  monster: MonsterData | null;
  isPublic?: boolean;
  evolutionData?: EvolutionData;
  onEvolve?: (targetStage: 'young_3d' | 'adult', walletAddress: string) => Promise<{ success: boolean; error?: string }>;
  isEvolving?: boolean;
  walletAddress?: string;
}

// Floating particles for atmosphere
function FloatingParticles() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => {
        const size = 2 + Math.random() * 3;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              background: `rgba(79, 255, 176, ${0.15 + Math.random() * 0.2})`,
              boxShadow: `0 0 ${size * 2}px rgba(79, 255, 176, 0.2)`,
              left: `${Math.random() * 100}%`,
            }}
            initial={{ top: '100%', opacity: 0 }}
            animate={{
              top: '-5%',
              opacity: [0, 0.8, 0.8, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 8,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export default function MonsterViewerPage({
  monster,
  isPublic = false,
  evolutionData,
  onEvolve,
  isEvolving = false,
  walletAddress,
}: MonsterViewerPageProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Fetch IPFS metadata
  const {
    metadata,
    resolvedImageUrl,
    resolvedModelUrl,
    has3DModel,
    isLoading: isMetadataLoading,
    error: metadataError,
    usingFallback,
  } = useIPFSMetadata({
    metadataCid: monster?.metadataCid,
    fallbackImageUrl: monster?.imageUrl,
    fallbackModelUrl: monster?.modelUrl,
    autoFetch: !!monster,
  });

  // Handle evolution trigger
  const handleEvolve = useCallback(async () => {
    if (!onEvolve || !evolutionData?.nextEvolution || !walletAddress) {
      console.warn('[MonsterViewerPage] Cannot evolve: missing required data');
      return;
    }

    const targetStage = evolutionData.nextEvolution.stage as 'young_3d' | 'adult';
    await onEvolve(targetStage, walletAddress);
  }, [onEvolve, evolutionData?.nextEvolution, walletAddress]);

  // No monster found
  if (!monster) {
    return (
      <div
        className="min-h-screen relative"
        style={{
          background: 'linear-gradient(180deg, #240B4D 0%, #1a0a3a 50%, #0f0520 100%)',
        }}
      >
        <ShaderBackground />
        <FloatingParticles />
        <EmptyState />
      </div>
    );
  }

  // Build share URL
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/monster/${monster.id}`
      : '';

  // Get monster name - prioritize NFT item ID from evolution data
  const nftItemId = evolutionData?.nftItemId || monster.nft?.itemId;
  const monsterName =
    metadata?.name || (nftItemId ? `Monster #${nftItemId}` : 'Your Monster');

  // Get attributes from metadata or create defaults
  const attributes: NFTAttribute[] = metadata?.attributes || [
    { trait_type: 'Style', value: monster.style },
    { trait_type: 'Stage', value: evolutionData?.currentStage || monster.stage },
    { trait_type: 'Has 3D Model', value: has3DModel ? 'Yes' : 'No' },
  ];

  // Check if we should show 3D based on evolution stage
  const shouldShow3D = evolutionData
    ? (evolutionData.currentStage === 'young_3d' || evolutionData.currentStage === 'adult')
    : has3DModel;

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: 'linear-gradient(180deg, #240B4D 0%, #1a0a3a 50%, #0f0520 100%)',
      }}
    >
      <ShaderBackground />
      <FloatingParticles />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-4 md:px-8 py-4">
        <Link
          href="/lab"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back to Lab</span>
        </Link>

        <h1 className="hidden md:block font-pixel text-xs text-[var(--mi-mint)] uppercase tracking-widest">
          Monster Viewer
        </h1>

        <button
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-pixel uppercase tracking-wider transition-all hover:scale-105"
          style={{
            background: 'rgba(79, 255, 176, 0.15)',
            border: '1px solid rgba(79, 255, 176, 0.3)',
            color: 'var(--mi-mint)',
          }}
        >
          <Share2 size={14} />
          <span className="hidden sm:inline">Share</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Desktop: 60/40 split | Mobile: Stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Viewer Panel - 60% on desktop */}
            <div className="lg:col-span-3">
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  minHeight: '500px',
                }}
              >
                {/* Loading State */}
                {isMetadataLoading && (
                  <div className="w-full h-[500px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-[var(--mi-mint)] border-t-transparent rounded-full mx-auto mb-4" />
                      <p className="text-slate-400 text-sm">Loading monster...</p>
                    </div>
                  </div>
                )}

                {/* 3D Viewer */}
                {!isMetadataLoading && shouldShow3D && has3DModel && resolvedModelUrl && (
                  <MonsterViewer
                    modelUrl={resolvedModelUrl}
                    height="h-[500px]"
                    showControls={true}
                    autoRotate={true}
                  />
                )}

                {/* 2D Display (when 3D not revealed or not available) */}
                {!isMetadataLoading && (!shouldShow3D || !has3DModel || !resolvedModelUrl) && (
                  <div className="p-8 min-h-[500px] flex items-center justify-center relative">
                    <Monster2DDisplay
                      imageUrl={resolvedImageUrl}
                      alt={monsterName}
                    />
                    {/* 3D Not Revealed Badge */}
                    {evolutionData?.currentStage === 'young' && has3DModel && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                        <div
                          className="px-4 py-2 rounded-lg text-xs font-pixel uppercase tracking-wider"
                          style={{
                            background: 'rgba(255, 159, 28, 0.2)',
                            border: '1px solid rgba(255, 159, 28, 0.3)',
                            color: 'var(--mi-orange)',
                          }}
                        >
                          3D Model Hidden - Evolve to Reveal
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Fallback Notice */}
              {usingFallback && !isMetadataLoading && (
                <div
                  className="mt-2 px-3 py-2 rounded-lg text-xs text-center"
                  style={{
                    background: 'rgba(255, 159, 28, 0.1)',
                    border: '1px solid rgba(255, 159, 28, 0.2)',
                    color: 'var(--mi-orange)',
                  }}
                >
                  Using cached assets (IPFS temporarily unavailable)
                </div>
              )}
            </div>

            {/* Info Panel - 40% on desktop */}
            <div className="lg:col-span-2 space-y-4">
              {/* Metadata Card */}
              <MonsterMetadataCard
                name={monsterName}
                itemId={nftItemId}
                stage={(evolutionData?.currentStage || monster.stage) as MonsterStage}
                style={monster.style as MonsterStyle}
                attributes={attributes}
              />

              {/* Evolution Timeline (when evolution data is available) */}
              {evolutionData && (
                <EvolutionTimeline
                  currentStage={evolutionData.currentStage}
                  evolutionHistory={evolutionData.evolutionHistory.map(entry => ({
                    id: `${entry.stage}-${entry.timestamp}`,
                    stage: entry.stage,
                    milestoneLabel: entry.milestone,
                    evolvedAt: entry.timestamp,
                    assetsCid: entry.assets,
                    txHash: entry.txHash,
                  }))}
                  nextEvolution={evolutionData.nextEvolution}
                  onEvolve={onEvolve && walletAddress ? handleEvolve : undefined}
                  isEvolving={isEvolving}
                />
              )}

              {/* NFT Details Card */}
              {monster.nft && (
                <NFTDetailsCard
                  nft={{
                    itemId: monster.nft.itemId,
                    collectionId: monster.nft.collectionId,
                    ownerAddress: evolutionData?.nftOwnerAddress || monster.nft.ownerAddress,
                    txHash: monster.nft.txHash,
                    blockHash: monster.nft.blockHash,
                    mintedAt: monster.nft.mintedAt,
                  }}
                />
              )}

              {/* Not Minted Notice (for public view of non-minted monsters) */}
              {!monster.nft && !evolutionData?.nftItemId && (
                <div
                  className="rounded-xl p-5"
                  style={{
                    background: 'rgba(255, 159, 28, 0.1)',
                    border: '1px solid rgba(255, 159, 28, 0.25)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎨</span>
                    <span className="text-sm text-[var(--mi-orange)]">
                      Not yet minted on-chain
                    </span>
                  </div>
                </div>
              )}

              {/* Continue Learning CTA */}
              {!isPublic && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Link
                    href="/lab"
                    className="flex items-center justify-center w-full py-4 rounded-xl font-pixel text-sm uppercase tracking-wider transition-all hover:scale-[1.02]"
                    style={{
                      background: 'var(--mi-cobalt)',
                      color: 'white',
                      boxShadow: '0 0 30px rgba(30, 76, 221, 0.3)',
                    }}
                  >
                    Continue Learning
                  </Link>
                </motion.div>
              )}

              {/* Public CTA */}
              {isPublic && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Link
                    href="/lesson/1/1/1"
                    className="flex items-center justify-center w-full py-4 rounded-xl font-pixel text-sm uppercase tracking-wider transition-all hover:scale-[1.02]"
                    style={{
                      background: 'var(--mi-cobalt)',
                      color: 'white',
                      boxShadow: '0 0 30px rgba(30, 76, 221, 0.3)',
                    }}
                  >
                    Create Your Own Monster
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={shareUrl}
        monsterName={monsterName}
      />
    </div>
  );
}
