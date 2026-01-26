'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Share2, ExternalLink, Copy, Check, Clock, Sparkles, Eye } from 'lucide-react';

import ShaderBackground from '@/components/ShaderBackground';
import ShareModal from './ShareModal';
import EmptyState from './EmptyState';
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
      <div
        className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#4FFFB0', borderTopColor: 'transparent' }}
      />
    </div>
  ),
});

// ============================================================================
// Types
// ============================================================================

interface EvolutionData {
  currentStage: EvolutionStage;
  evolutionHistory: EvolutionHistoryEntry[];
  nextEvolution: {
    stage: EvolutionStage;
    requiresGeneration: boolean;
    canEvolve: boolean;
  } | null;
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

// Design system colors
const COLORS = {
  mint: '#4FFFB0',
  peach: '#FFDAB9',
  violet: '#240B4D',
  orange: '#FF9F1C',
  grass: '#2ECC71',
  // Backgrounds
  bgDeep: '#0f0520',
  bgCard: 'rgba(36, 11, 77, 0.4)',
  bgCardHover: 'rgba(36, 11, 77, 0.6)',
  border: 'rgba(79, 255, 176, 0.1)',
  borderHover: 'rgba(79, 255, 176, 0.2)',
  // Text
  textMuted: 'rgba(255, 218, 185, 0.6)', // peach at 60%
  textSecondary: 'rgba(255, 218, 185, 0.8)', // peach at 80%
};

// Stage display config
const STAGE_CONFIG: Record<EvolutionStage, {
  label: string;
  color: string;
  bg: string;
  description: string;
}> = {
  young: {
    label: 'Young',
    color: COLORS.mint,
    bg: 'rgba(79, 255, 176, 0.12)',
    description: '2D Sprite Generated'
  },
  young_3d: {
    label: '3D Form',
    color: COLORS.mint,
    bg: 'rgba(79, 255, 176, 0.12)',
    description: '3D Model Unlocked'
  },
  adult: {
    label: 'Adult',
    color: COLORS.orange,
    bg: 'rgba(255, 159, 28, 0.12)',
    description: 'Final Evolution'
  },
};

// All stages in order
const ALL_STAGES: EvolutionStage[] = ['young', 'young_3d', 'adult'];

// Utility to truncate addresses
function truncateAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

// Format date
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// IPFS gateway
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

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
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [viewingStage, setViewingStage] = useState<EvolutionStage | null>(null);

  // Fetch IPFS metadata for current/default view
  const {
    metadata,
    resolvedImageUrl,
    resolvedModelUrl,
    has3DModel,
    isLoading: isMetadataLoading,
  } = useIPFSMetadata({
    metadataCid: monster?.metadataCid,
    fallbackImageUrl: monster?.imageUrl,
    fallbackModelUrl: monster?.modelUrl,
    autoFetch: !!monster,
  });

  // Get the stage we're actually viewing
  const activeViewStage = viewingStage || evolutionData?.currentStage || 'young';

  // Get assets for the viewing stage
  const viewingAssets = useMemo(() => {
    if (!evolutionData || !viewingStage) {
      // Use current assets
      return { imageUrl: resolvedImageUrl, modelUrl: resolvedModelUrl };
    }

    // Find the history entry for the viewing stage
    const historyEntry = evolutionData.evolutionHistory.find(h => h.stage === viewingStage);
    if (historyEntry?.assets) {
      return {
        imageUrl: historyEntry.assets.image_cid ? `${IPFS_GATEWAY}${historyEntry.assets.image_cid}` : resolvedImageUrl,
        modelUrl: historyEntry.assets.model_cid ? `${IPFS_GATEWAY}${historyEntry.assets.model_cid}` : (viewingStage === 'young' ? null : resolvedModelUrl),
      };
    }

    // Fallback to current assets
    return { imageUrl: resolvedImageUrl, modelUrl: resolvedModelUrl };
  }, [viewingStage, evolutionData, resolvedImageUrl, resolvedModelUrl]);

  // Determine if we should show 3D for the viewing stage
  // For public pages (no evolutionData), show 3D if modelUrl is available
  // For user pages, respect the evolution stage
  const shouldShow3DForViewing = useMemo(() => {
    // If no evolution data (public page), show 3D if model is available
    if (!evolutionData) {
      return !!viewingAssets.modelUrl;
    }
    // For user pages, check the stage
    const stage = viewingStage || evolutionData.currentStage;
    return stage === 'young_3d' || stage === 'adult';
  }, [viewingStage, evolutionData, viewingAssets.modelUrl]);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  // Check if a stage is unlocked (has been reached)
  const isStageUnlocked = useCallback((stage: EvolutionStage) => {
    if (!evolutionData) return stage === 'young';
    const stageIndex = ALL_STAGES.indexOf(stage);
    const currentIndex = ALL_STAGES.indexOf(evolutionData.currentStage);
    return stageIndex <= currentIndex;
  }, [evolutionData]);

  // Get history entry for a stage
  const getHistoryEntry = useCallback((stage: EvolutionStage) => {
    return evolutionData?.evolutionHistory.find(h => h.stage === stage);
  }, [evolutionData]);

  // No monster found
  if (!monster) {
    return (
      <div className="h-screen w-screen overflow-hidden relative" style={{ background: COLORS.bgDeep }}>
        <ShaderBackground />
        <EmptyState />
      </div>
    );
  }

  // Build share URL
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/monster/${monster.id}` : '';

  // Get monster name
  const nftItemId = evolutionData?.nftItemId || monster.nft?.itemId;
  const monsterName = metadata?.name || (nftItemId ? `Monster #${nftItemId}` : 'Your Monster');

  // Current stage config
  const currentStage = evolutionData?.currentStage || (monster.stage as EvolutionStage) || 'young';
  const viewingConfig = STAGE_CONFIG[activeViewStage];

  // Get attributes
  const attributes: NFTAttribute[] = metadata?.attributes || [
    { trait_type: 'Style', value: monster.style },
    { trait_type: 'Stage', value: currentStage },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden relative" style={{ background: COLORS.bgDeep }}>
      <ShaderBackground />

      {/* Bento Grid Container */}
      <div className="relative z-10 h-full w-full p-4 md:p-6">
        <div className="h-full w-full max-w-[1600px] mx-auto grid grid-rows-[auto_1fr] gap-4">

          {/* Header Row */}
          <header className="flex items-center justify-between">
            <Link
              href="/lab"
              className="flex items-center gap-2 hover:text-white transition-colors text-sm"
              style={{ color: COLORS.textMuted }}
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back to Lab</span>
            </Link>

            <h1 className="font-pixel text-[10px] uppercase tracking-widest" style={{ color: COLORS.mint }}>
              {monsterName}
            </h1>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-pixel uppercase tracking-wider transition-all hover:scale-105"
              style={{
                background: `${COLORS.mint}26`, // 15% opacity
                border: `1px solid ${COLORS.mint}4D`, // 30% opacity
                color: COLORS.mint,
              }}
            >
              <Share2 size={12} />
              <span className="hidden sm:inline">Share</span>
            </button>
          </header>

          {/* Main Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">

            {/* Left: Monster Viewer - floating, no background */}
            <div className="lg:col-span-2 flex items-center justify-center relative">
              {/* Viewing indicator */}
              {viewingStage && viewingStage !== currentStage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                  style={{ background: viewingConfig.bg, color: viewingConfig.color }}
                >
                  <Eye size={12} />
                  Viewing: {viewingConfig.label}
                  <button
                    onClick={() => setViewingStage(null)}
                    className="ml-1 hover:opacity-70 transition-opacity"
                  >
                    ✕
                  </button>
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeViewStage}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  {isMetadataLoading ? (
                    <div
                      className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: COLORS.mint, borderTopColor: 'transparent' }}
                    />
                  ) : shouldShow3DForViewing && viewingAssets.modelUrl ? (
                    <MonsterViewer
                      modelUrl={viewingAssets.modelUrl}
                      className="w-full h-full"
                      height=""
                      showControls={false}
                      autoRotate={true}
                      minimal={true}
                    />
                  ) : viewingAssets.imageUrl ? (
                    <motion.img
                      src={viewingAssets.imageUrl}
                      alt={monsterName}
                      className="max-w-full max-h-full object-contain"
                      style={{ filter: `drop-shadow(0 0 40px ${COLORS.mint}4D)` }}
                    />
                  ) : (
                    <div className="text-sm" style={{ color: COLORS.textMuted }}>No image available</div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right: Info Cards Stack */}
            <div className="flex flex-col gap-3 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-1">

              {/* Monster Info Card */}
              <div
                className="rounded-xl p-4 flex-shrink-0"
                style={{
                  background: COLORS.bgCard,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="px-3 py-1 rounded-full text-[10px] font-pixel uppercase tracking-wider"
                    style={{ background: STAGE_CONFIG[currentStage].bg, color: STAGE_CONFIG[currentStage].color }}
                  >
                    {STAGE_CONFIG[currentStage].label}
                  </span>
                  {nftItemId && (
                    <span className="text-xs font-mono" style={{ color: COLORS.textMuted }}>#{nftItemId}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {attributes.slice(0, 4).map((attr, i) => (
                    <div key={i} className="text-xs">
                      <span className="block" style={{ color: COLORS.textMuted }}>{attr.trait_type}</span>
                      <span className="text-white">{String(attr.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* NFT Details Card */}
              {monster.nft && (
                <div
                  className="rounded-xl p-4 flex-shrink-0"
                  style={{
                    background: `rgba(46, 204, 113, 0.08)`,
                    border: `1px solid rgba(46, 204, 113, 0.2)`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: COLORS.grass }} />
                    <span className="text-[10px] font-pixel uppercase tracking-wider" style={{ color: COLORS.grass }}>
                      On-Chain
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span style={{ color: COLORS.textMuted }}>Collection</span>
                      <span className="text-white font-mono">#{monster.nft.collectionId}</span>
                    </div>

                    {(evolutionData?.nftOwnerAddress || monster.nft.ownerAddress) && (
                      <div className="flex justify-between items-center gap-2">
                        <span style={{ color: COLORS.textMuted }}>Owner</span>
                        <button
                          onClick={() => copyToClipboard(evolutionData?.nftOwnerAddress || monster.nft!.ownerAddress, 'owner')}
                          className="flex items-center gap-1 text-white font-mono transition-colors"
                          style={{ ['--hover-color' as string]: COLORS.mint }}
                          onMouseEnter={(e) => e.currentTarget.style.color = COLORS.mint}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                        >
                          {truncateAddress(evolutionData?.nftOwnerAddress || monster.nft.ownerAddress)}
                          {copiedField === 'owner' ? <Check size={10} style={{ color: COLORS.grass }} /> : <Copy size={10} />}
                        </button>
                      </div>
                    )}

                    {monster.nft.txHash && (
                      <div className="flex justify-between items-center gap-2">
                        <span style={{ color: COLORS.textMuted }}>Tx</span>
                        <a
                          href={`https://assethub-polkadot.subscan.io/extrinsic/${monster.nft.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-white font-mono transition-colors"
                          onMouseEnter={(e) => e.currentTarget.style.color = COLORS.mint}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                        >
                          {truncateAddress(monster.nft.txHash)}
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Evolution Journey - Enhanced */}
              {evolutionData && (
                <div
                  className="rounded-xl p-4 flex-shrink-0"
                  style={{
                    background: COLORS.bgCard,
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={14} style={{ color: COLORS.mint }} />
                    <span className="text-[10px] font-pixel uppercase tracking-wider" style={{ color: COLORS.textSecondary }}>
                      Evolution Journey
                    </span>
                  </div>

                  {/* Evolution Stages */}
                  <div className="space-y-2">
                    {ALL_STAGES.map((stage, index) => {
                      const config = STAGE_CONFIG[stage];
                      const isUnlocked = isStageUnlocked(stage);
                      const isCurrent = evolutionData.currentStage === stage;
                      const isViewing = viewingStage === stage || (!viewingStage && isCurrent);
                      const historyEntry = getHistoryEntry(stage);

                      return (
                        <motion.button
                          key={stage}
                          onClick={() => isUnlocked && setViewingStage(stage)}
                          disabled={!isUnlocked}
                          className={`w-full text-left rounded-lg p-3 transition-all ${
                            isUnlocked ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed opacity-40'
                          } ${isViewing ? 'ring-1' : ''}`}
                          style={{
                            background: isViewing ? config.bg : 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${isViewing ? config.color + '40' : 'rgba(255, 255, 255, 0.04)'}`,
                            ringColor: config.color,
                          }}
                          whileHover={isUnlocked ? { scale: 1.02 } : {}}
                          whileTap={isUnlocked ? { scale: 0.98 } : {}}
                        >
                          <div className="flex items-center justify-between">
                            {/* Stage Name */}
                            <div className="flex items-center gap-2">
                              <span
                                className="text-sm font-medium"
                                style={{ color: isUnlocked ? config.color : COLORS.textMuted }}
                              >
                                {config.label}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-pixel uppercase bg-white/10 text-white">
                                  Current
                                </span>
                              )}
                            </div>

                            {/* Timestamp */}
                            {isUnlocked && historyEntry?.timestamp && (
                              <div className="flex items-center gap-1 text-[10px]" style={{ color: COLORS.textMuted }}>
                                <Clock size={10} />
                                {formatDate(historyEntry.timestamp)}
                              </div>
                            )}
                          </div>

                          {/* Description or locked message */}
                          <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
                            {isUnlocked ? config.description : 'Continue learning to unlock'}
                          </p>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Next Evolution Hint */}
                  {evolutionData.nextEvolution && (
                    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <p className="text-[10px] text-center" style={{ color: COLORS.textMuted }}>
                        Next: <span style={{ color: STAGE_CONFIG[evolutionData.nextEvolution.stage].color }}>
                          {STAGE_CONFIG[evolutionData.nextEvolution.stage].label}
                        </span>
                        {evolutionData.nextEvolution.requiresGeneration && ' • Requires Generation'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* CTA Button */}
              <Link
                href="/lab"
                className="flex items-center justify-center py-3 rounded-xl font-pixel text-[10px] uppercase tracking-wider transition-all hover:scale-[1.02] flex-shrink-0"
                style={{
                  background: `${COLORS.mint}1A`,
                  border: `1px solid ${COLORS.mint}4D`,
                  color: COLORS.mint,
                }}
              >
                {isPublic ? 'Create Your Own' : 'Continue Learning'}
              </Link>
            </div>
          </div>
        </div>
      </div>

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
