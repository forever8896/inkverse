'use client';

import { useRef, useEffect, useState } from 'react';
import { GalleryCard } from './GalleryCard';
import type { GalleryMonster, GalleryDirection, GallerySpeed, GalleryCardSize } from '@/types/gallery';

interface GalleryLaneProps {
  monsters: GalleryMonster[];
  direction: GalleryDirection;
  speed: GallerySpeed;
  cardSize: GalleryCardSize;
  isPaused: boolean;
  onCardHover: (id: string | null) => void;
}

const SPEED_DURATIONS: Record<GallerySpeed, number> = {
  slow: 35, // seconds for full cycle
  fast: 22,
};

const CARD_GAP = 16; // px gap between cards

export function GalleryLane({
  monsters,
  direction,
  speed,
  cardSize,
  isPaused,
  onCardHover,
}: GalleryLaneProps) {
  const laneRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);

  // Calculate content width for animation
  useEffect(() => {
    if (laneRef.current) {
      const firstChild = laneRef.current.querySelector('.gallery-lane-content');
      if (firstChild) {
        setContentWidth(firstChild.scrollWidth);
      }
    }
  }, [monsters]);

  // Duplicate monsters for seamless loop
  const displayMonsters = [...monsters, ...monsters];

  const duration = SPEED_DURATIONS[speed];
  const animationDirection = direction === 'left' ? 'reverse' : 'normal';

  const handleCardHover = (id: string, isHovered: boolean) => {
    onCardHover(isHovered ? id : null);
  };

  if (monsters.length === 0) {
    return null;
  }

  return (
    <div
      ref={laneRef}
      className="relative overflow-hidden w-full"
      style={{
        // Fade edges with CSS mask
        maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}
    >
      <div
        className="gallery-lane-content flex gap-4 will-change-transform"
        style={{
          animation: `gallery-scroll ${duration}s linear infinite`,
          animationDirection,
          animationPlayState: isPaused ? 'paused' : 'running',
          gap: `${CARD_GAP}px`,
        }}
      >
        {displayMonsters.map((monster, index) => (
          <GalleryCard
            key={`${monster.id}-${index}`}
            monster={monster}
            size={cardSize}
            onHover={(isHovered) => handleCardHover(monster.id, isHovered)}
          />
        ))}
      </div>

    </div>
  );
}
