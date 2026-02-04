'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import type { GalleryMonster } from '@/types/gallery';

// Lazy load 3D viewer
const MiniMonsterViewer = dynamic(
  () => import('./MiniMonsterViewer').then((mod) => ({ default: mod.MiniMonsterViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[rgba(36,11,77,0.4)]">
        <div className="w-4 h-4 border-2 border-[var(--mi-mint)] border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

interface MonsterGalleryProps {
  className?: string;
}

const GALLERY_LIMIT = 30;
const MIN_MONSTERS_TO_SHOW = 3;

// Simple, deliberate timing
const MAX_CARDS = 2; // Maximum 2 cards at once
const MIN_SPAWN_DELAY = 8000; // At least 8 seconds between spawns
const MAX_SPAWN_DELAY = 14000; // At most 14 seconds between spawns

interface FloatingCard {
  id: string;
  monster: GalleryMonster;
  top: number; // 5-65% from top
  direction: 'left' | 'right';
  speed: number; // 22-38 seconds to cross
}

// Single floating card
function FloatingMonsterCard({
  card,
  onComplete,
}: {
  card: FloatingCard;
  onComplete: (id: string) => void;
}) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  const { monster, top, direction, speed } = card;

  const has3D = monster.modelUrl && (monster.stage === 'young_3d' || monster.stage === 'adult');
  const show3D = has3D && !modelError && isInView;

  // Intersection observer for 3D
  useEffect(() => {
    if (!has3D || !cardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: '100px', threshold: 0 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [has3D]);

  // Remove after animation completes
  useEffect(() => {
    const timer = setTimeout(() => onComplete(card.id), (speed + 1) * 1000);
    return () => clearTimeout(timer);
  }, [card.id, speed, onComplete]);

  if (imageError || !monster.imageUrl) return null;

  // Start and end positions
  const startX = direction === 'right' ? -280 : 'calc(100vw + 40px)';
  const endX = direction === 'right' ? 'calc(100vw + 40px)' : -280;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/monster/${monster.id}`);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ x: startX, opacity: 0 }}
      animate={{ x: endX, opacity: isHovered ? 1 : 0.85 }}
      exit={{ opacity: 0 }}
      transition={{
        x: { duration: speed, ease: 'linear' },
        opacity: { duration: 0.8 },
      }}
      className="fixed cursor-pointer pointer-events-auto"
      style={{ top: `${top}%`, zIndex: isHovered ? 10 : 2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <motion.div
        animate={{ scale: isHovered ? 1.06 : 1, y: isHovered ? -6 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`rounded-2xl overflow-hidden transition-shadow duration-300
          bg-[rgba(36,11,77,0.75)] border backdrop-blur-sm
          ${isHovered
            ? 'border-[rgba(79,255,176,0.6)] shadow-2xl shadow-[rgba(79,255,176,0.3)]'
            : 'border-[rgba(79,255,176,0.2)]'
          }`}
        style={{ width: 220, height: isHovered ? 310 : 280 }}
      >
        {/* Monster image/3D */}
        <div className="relative overflow-hidden" style={{ height: isHovered ? 220 : 200 }}>
          {show3D ? (
            <MiniMonsterViewer
              modelUrl={monster.modelUrl!}
              onError={() => setModelError(true)}
              isVisible={isInView}
            />
          ) : (
            <img
              src={monster.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          )}

          {/* Bottom gradient */}
          <div
            className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(36,11,77,0.95), transparent)' }}
          />

          {/* 3D badge */}
          {has3D && (
            <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md bg-cyan-500/90 text-[8px] font-pixel text-white shadow-lg">
              3D
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-4 py-3">
          {/* Always visible: Stage */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full ${
              monster.stage === 'adult' ? 'bg-green-400' :
              monster.stage === 'young_3d' ? 'bg-cyan-400' : 'bg-yellow-400'
            }`} />
            <span className="font-pixel text-[8px] text-white/80 uppercase">
              {monster.stage === 'adult' ? 'Adult' : monster.stage === 'young_3d' ? '3D Model' : 'Young'}
            </span>
          </div>

          {/* Owner address - subtle */}
          <div className="text-[7px] font-mono text-[var(--mi-peach)]/60 truncate mb-2">
            {monster.ownerAddress?.slice(0, 8)}...{monster.ownerAddress?.slice(-6)}
          </div>

          {/* Hover: Expanded info + CTA */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2 border-t border-[rgba(79,255,176,0.3)]">
                  <div
                    className="py-2 px-3 rounded-lg text-center"
                    style={{
                      background: 'rgba(79, 255, 176, 0.15)',
                      border: '1px solid rgba(79, 255, 176, 0.3)',
                    }}
                  >
                    <span className="font-pixel text-[9px] text-[var(--mi-mint)] uppercase tracking-wider">
                      View Monster
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function MonsterGallery({ className }: MonsterGalleryProps) {
  const [monsters, setMonsters] = useState<GalleryMonster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCards, setActiveCards] = useState<FloatingCard[]>([]);
  const monsterIndexRef = useRef(0);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTopRef = useRef<number>(50); // Track last spawn position

  // Fetch monsters
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/gallery/monsters?limit=${GALLERY_LIMIT}&shuffle=true`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (data.success && data.monsters) {
          setMonsters(data.monsters);
        }
      } catch (err) {
        console.warn('[MonsterGallery] Failed to load:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGallery();
  }, []);

  // Generate a random top position that's different from the last one
  const getRandomTop = useCallback(() => {
    let newTop: number;
    do {
      newTop = 5 + Math.random() * 60; // 5% to 65%
    } while (Math.abs(newTop - lastTopRef.current) < 20); // Ensure at least 20% apart
    lastTopRef.current = newTop;
    return newTop;
  }, []);

  // Remove completed card
  const handleCardComplete = useCallback((cardId: string) => {
    setActiveCards((prev) => prev.filter((c) => c.id !== cardId));
  }, []);

  // Spawn a single card
  const spawnCard = useCallback(() => {
    if (monsters.length === 0) return;

    setActiveCards((current) => {
      if (current.length >= MAX_CARDS) return current;

      const monster = monsters[monsterIndexRef.current % monsters.length];
      monsterIndexRef.current++;

      const newCard: FloatingCard = {
        id: `${monster.id}-${Date.now()}-${Math.random()}`,
        monster,
        top: getRandomTop(),
        direction: Math.random() > 0.5 ? 'left' : 'right',
        speed: 22 + Math.random() * 16, // 22-38 seconds (significant variation)
      };

      return [...current, newCard];
    });
  }, [monsters, getRandomTop]);

  // Schedule next spawn with random delay
  const scheduleSpawn = useCallback(() => {
    const delay = MIN_SPAWN_DELAY + Math.random() * (MAX_SPAWN_DELAY - MIN_SPAWN_DELAY);

    spawnTimerRef.current = setTimeout(() => {
      spawnCard();
      scheduleSpawn(); // Chain next spawn
    }, delay);
  }, [spawnCard]);

  // Start the flow
  useEffect(() => {
    if (isLoading || monsters.length < MIN_MONSTERS_TO_SHOW) return;

    // First card after 1 second
    const firstSpawn = setTimeout(() => {
      spawnCard();
      // Start the rhythm after first card
      scheduleSpawn();
    }, 1000);

    return () => {
      clearTimeout(firstSpawn);
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    };
  }, [isLoading, monsters.length, spawnCard, scheduleSpawn]);

  if (isLoading || monsters.length < MIN_MONSTERS_TO_SHOW) return null;

  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none ${className || ''}`}
      style={{ zIndex: 15 }}
      aria-label="Community monsters"
    >
      <div className="pointer-events-auto">
        <AnimatePresence>
          {activeCards.map((card) => (
            <FloatingMonsterCard
              key={card.id}
              card={card}
              onComplete={handleCardComplete}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
