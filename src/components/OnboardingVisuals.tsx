'use client';

/**
 * OnboardingVisuals - Animated visual display for onboarding screens
 *
 * Shows different visuals for each onboarding screen:
 * - Screen 0: Static monster image 1
 * - Screen 1: Static monster image 2
 * - Screen 2: 3D model viewer
 *
 * Features magical transitions with scale, blur, rotation, and glow effects.
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ONBOARDING_VISUALS } from '@/lib/onboarding-assets';

// Dynamic import for 3D model viewer (heavy component)
// No loading state - model is preloaded during NarrativeLoadingScreen
const WelcomeModelViewer = dynamic(
  () => import('@/components/WelcomeModelViewer').then(mod => ({ default: mod.WelcomeModelViewer })),
  {
    ssr: false,
    loading: () => null,
  }
);

// Animation variants (static, no need to recreate)
const TRANSITION_VARIANTS = {
  enter: {
    opacity: 0,
    scale: 0.6,
    filter: 'blur(20px)',
    rotateY: -30,
  },
  center: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    rotateY: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
      opacity: { duration: 0.5 },
      filter: { duration: 0.6 },
      scale: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] as const },
    },
  },
  exit: {
    opacity: 0,
    scale: 1.2,
    filter: 'blur(20px)',
    rotateY: 30,
    transition: {
      duration: 0.5,
      ease: [0.55, 0.06, 0.68, 0.19] as const,
    },
  },
} as const;

interface OnboardingVisualsProps {
  currentScreen: number;
  className?: string;
}

// Generate particle positions deterministically based on index
// This avoids SSR hydration mismatches from Math.random() in render
function generateParticlePosition(index: number): { left: number; top: number } {
  // Use golden ratio based distribution for natural-looking spread
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const radius = 30 * Math.sqrt(index / 12);
  const theta = index * goldenAngle;
  return {
    left: 50 + radius * Math.cos(theta),
    top: 50 + radius * Math.sin(theta),
  };
}

// Magical particles that float around the visual
function MagicalParticles({ active }: { active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tweensRef = useRef<gsap.core.Tween[]>([]);

  // Pre-compute particle positions for SSR compatibility
  const particlePositions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => generateParticlePosition(i)),
    []
  );

  useEffect(() => {
    if (!containerRef.current || !active) return;

    const particles = containerRef.current.querySelectorAll('.magic-particle');

    // Store tweens for proper cleanup
    tweensRef.current = Array.from(particles).map((particle, i) =>
      gsap.to(particle, {
        x: `random(-100, 100)`,
        y: `random(-100, 100)`,
        opacity: `random(0.3, 0.8)`,
        scale: `random(0.5, 1.5)`,
        duration: `random(2, 4)`,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.1,
      })
    );

    return () => {
      // Clean up all tweens
      tweensRef.current.forEach((tween) => tween.kill());
      tweensRef.current = [];
    };
  }, [active]);

  if (!active) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden">
      {particlePositions.map((pos, i) => (
        <div
          key={i}
          className="magic-particle absolute w-2 h-2 rounded-full"
          style={{
            left: `${pos.left}%`,
            top: `${pos.top}%`,
            background: i % 2 === 0
              ? 'radial-gradient(circle, rgba(79, 255, 176, 0.8), transparent)'
              : 'radial-gradient(circle, rgba(45, 212, 191, 0.8), transparent)',
            boxShadow: '0 0 10px rgba(79, 255, 176, 0.5)',
          }}
        />
      ))}
    </div>
  );
}

// Image visual with magical animation
function MagicalImage({ src, alt }: { src: string; alt: string }) {
  const imageRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!imageRef.current) return;

    // Subtle floating animation
    tweenRef.current = gsap.to(imageRef.current, {
      y: -10,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    return () => {
      // Proper cleanup without stale closure
      tweenRef.current?.kill();
      tweenRef.current = null;
    };
  }, []);

  if (hasError) {
    // Fallback for failed image load
    return (
      <div
        className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center rounded-full"
        style={{ background: 'rgba(79, 255, 176, 0.1)' }}
      >
        <div
          className="w-32 h-32 rounded-full animate-pulse"
          style={{ background: 'rgba(79, 255, 176, 0.2)' }}
        />
      </div>
    );
  }

  return (
    <div ref={imageRef} className="relative w-64 h-64 md:w-80 md:h-80">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        style={{
          filter: 'drop-shadow(0 0 40px rgba(79, 255, 176, 0.4))',
        }}
        priority
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export function OnboardingVisuals({ currentScreen, className = '' }: OnboardingVisualsProps) {
  const [hasEntered, setHasEntered] = useState(false);
  const [showRotationHint, setShowRotationHint] = useState(false);

  useEffect(() => {
    // Small delay to trigger entrance animation
    const timer = setTimeout(() => setHasEntered(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Track viewport height to hide rotation hints on short screens
  useEffect(() => {
    const checkHeight = () => {
      setShowRotationHint(window.innerHeight >= 1024);
    };

    checkHeight();
    window.addEventListener('resize', checkHeight);
    return () => window.removeEventListener('resize', checkHeight);
  }, []);

  // Bounds check for safety
  const safeScreen = Math.max(0, Math.min(currentScreen, ONBOARDING_VISUALS.length - 1));
  const visual = ONBOARDING_VISUALS[safeScreen];

  return (
    <div className={`${className} relative flex items-center justify-center w-full h-full`}>
      
      {/* Magical particles */}
      <MagicalParticles active={hasEntered} />

      {/* Visual content with AnimatePresence for transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={safeScreen}
          variants={TRANSITION_VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          className="relative z-10"
          style={{ perspective: '1000px' }}
        >
          {visual.type === 'image' ? (
            <MagicalImage src={visual.src} alt={visual.alt} />
          ) : (
            // 3D model viewer
            <div className="w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px]">
              <WelcomeModelViewer modelUrl={visual.modelUrl} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Fixed rotation hint at bottom - only on 3D screen and tall viewports */}
      {visual.type === '3d' && showRotationHint && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="fixed bottom-64 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 select-none z-30"
        >
          {/* Control indicator */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Horizontal arrows */}
            <motion.span
              className="absolute left-0 font-pixel text-lg"
              style={{ color: 'var(--mi-mint)' }}
              animate={{ x: [-3, 3, -3], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              ‹
            </motion.span>
            <motion.span
              className="absolute right-0 font-pixel text-lg"
              style={{ color: 'var(--mi-mint)' }}
              animate={{ x: [3, -3, 3], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              ›
            </motion.span>

            {/* Vertical arrows */}
            <div className="absolute" style={{ top: '-3px', transform: 'rotate(90deg)' }}>
              <motion.span
                className="font-pixel text-lg"
                style={{ color: 'var(--mi-mint)' }}
                animate={{ y: [-3, 3, -3], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              >
                ‹
              </motion.span>
            </div>
            <div className="absolute" style={{ bottom: '-4px', transform: 'rotate(90deg)' }}>
              <motion.span
                className="font-pixel text-lg"
                style={{ color: 'var(--mi-mint)' }}
                animate={{ y: [3, -3, 3], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              >
                ›
              </motion.span>
            </div>

            {/* Center circle indicator */}
            <motion.div
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: 'rgba(79, 255, 176, 0.4)',
                background: 'rgba(79, 255, 176, 0.1)'
              }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ background: 'var(--mi-mint)' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </div>

          {/* Label */}
          <motion.p
            className="font-pixel text-[8px] tracking-wider uppercase"
            style={{ color: 'rgba(148, 163, 184, 0.8)' }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="hidden sm:inline">Drag monster to rotate</span>
            <span className="sm:hidden">Touch monster to rotate</span>
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}
