'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MiniMonsterViewer } from './MiniMonsterViewer';
import type { GalleryMonster, GalleryCardSize } from '@/types/gallery';

interface GalleryCardProps {
  monster: GalleryMonster;
  size: GalleryCardSize;
  onHover: (isHovered: boolean) => void;
}

const STAGE_COLORS: Record<string, { dot: string; label: string }> = {
  young: { dot: 'bg-yellow-400', label: 'Young' },
  young_3d: { dot: 'bg-cyan-400', label: '3D' },
  adult: { dot: 'bg-green-400', label: 'Adult' },
};

function truncateAddress(address: string | null): string {
  if (!address) return 'Unknown';
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function GalleryCard({ monster, size, onHover }: GalleryCardProps) {
  const [imageError, setImageError] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);

  const dimensions = size === 'large'
    ? { width: 180, height: 240 }
    : { width: 140, height: 180 };

  const stageInfo = STAGE_COLORS[monster.stage] || STAGE_COLORS.young;

  // Check if monster is new (created within last 24 hours)
  const isNew = (() => {
    if (!monster.createdAt) return false;
    const createdDate = new Date(monster.createdAt);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return createdDate > dayAgo;
  })();

  // Determine if we should show 3D model
  const has3DModel = monster.modelUrl && (monster.stage === 'young_3d' || monster.stage === 'adult');
  const show3D = has3DModel && !modelError;

  // Intersection Observer for lazy loading 3D models
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        rootMargin: '100px', // Start loading slightly before visible
        threshold: 0.1,
      }
    );

    observer.observe(card);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover(false);
  };

  const handleModelError = () => {
    setModelError(true);
  };

  return (
    <Link
      ref={cardRef}
      href={`/monster/${monster.id}`}
      className="block flex-shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`
          rounded-xl overflow-hidden transition-all duration-300
          bg-[rgba(36,11,77,0.6)] backdrop-blur-sm
          border border-[rgba(79,255,176,0.2)]
          ${isHovered ? 'scale-105 border-[rgba(79,255,176,0.5)] shadow-lg shadow-[rgba(79,255,176,0.2)]' : ''}
        `}
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
      >
        {/* Monster Display Area */}
        <div
          className="relative overflow-hidden bg-[rgba(36,11,77,0.4)]"
          style={{ height: `${Math.floor(dimensions.height * 0.75)}px` }}
        >
          {show3D && isVisible ? (
            // 3D Model Viewer
            <div className="w-full h-full">
              <MiniMonsterViewer
                modelUrl={monster.modelUrl!}
                onError={handleModelError}
                isVisible={isVisible}
              />
            </div>
          ) : !imageError && monster.imageUrl ? (
            // 2D Image Fallback
            <img
              src={monster.imageUrl}
              alt="Community Monster"
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            // Placeholder
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl">🥚</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-1 right-1 flex gap-1">
            {isNew && (
              <div className="px-1.5 py-0.5 rounded bg-[var(--mi-mint)]/80 text-[6px] font-pixel text-black">
                NEW
              </div>
            )}
            {show3D && (
              <div className="px-1.5 py-0.5 rounded bg-cyan-500/80 text-[6px] font-pixel text-white">
                3D
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div
          className="px-2 py-1.5 flex flex-col justify-center gap-0.5"
          style={{ height: `${Math.floor(dimensions.height * 0.25)}px` }}
        >
          {/* Wallet Address */}
          <div className="flex items-center gap-1 text-[var(--mi-peach)] font-pixel text-[6px] uppercase truncate">
            <span className="opacity-70">🔗</span>
            <span>{truncateAddress(monster.ownerAddress)}</span>
          </div>

          {/* Stage Badge */}
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${stageInfo.dot}`} />
            <span className="font-pixel text-[6px] text-white/70 uppercase">
              {stageInfo.label}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
