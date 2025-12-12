'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamic import for WebGL background (client-side only)
const OrganicShaderBackground = dynamic(
  () => import('@/components/OrganicShaderBackground'),
  { ssr: false }
);

// Subtle floating particles for ambient atmosphere
function FloatingParticles() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    left: string;
    size: number;
    duration: number;
    delay: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    // Generate particles only on client
    setParticles(
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 3,
        duration: 15 + Math.random() * 10,
        delay: Math.random() * 12,
        opacity: 0.15 + Math.random() * 0.2,
      }))
    );
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-float-particle"
          style={{
            left: particle.left,
            width: particle.size,
            height: particle.size,
            background: `rgba(79, 255, 176, ${particle.opacity})`,
            boxShadow: `0 0 ${particle.size * 2}px rgba(79, 255, 176, 0.2)`,
            ['--particle-duration' as string]: `${particle.duration}s`,
            ['--particle-delay' as string]: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// The darkness transition and loading sequence
function DarknessTransition({
  onReady,
}: {
  onReady: () => void;
}) {
  const [narrativeStage, setNarrativeStage] = useState(0);
  const [isLessonReady, setIsLessonReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const router = useRouter();

  const narrativeMessages = [
    'Your creature stirs...',
    'A bond is forming...',
    'Preparing your workspace...',
    'Ready to learn together.',
  ];

  // Prefetch and wait for the lesson page to be ready
  useEffect(() => {
    // Prefetch the lesson route
    router.prefetch('/lesson/1/1/1');

    // Give it time to prefetch heavy components (Monaco, WalletProviders, etc.)
    const prefetchTimer = setTimeout(() => {
      setIsLessonReady(true);
    }, 6000); // Match narrative duration (4 messages × 1.5s)

    return () => clearTimeout(prefetchTimer);
  }, [router]);

  // Progress through narrative messages (slower for readability)
  useEffect(() => {
    const interval = setInterval(() => {
      setNarrativeStage((prev) => {
        if (prev >= narrativeMessages.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1500); // Slower transitions for better readability

    return () => clearInterval(interval);
  }, [narrativeMessages.length]);

  // When lesson is ready and we've shown enough narrative, start exit animation
  useEffect(() => {
    if (isLessonReady && narrativeStage >= narrativeMessages.length - 1 && !isExiting) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 800);
      return () => clearTimeout(exitTimer);
    }
  }, [isLessonReady, narrativeStage, narrativeMessages.length, isExiting]);

  // Navigate after exit animation completes
  useEffect(() => {
    if (isExiting) {
      const navTimer = setTimeout(() => {
        localStorage.setItem('monsters-ink-hatched', 'true');
        onReady();
        router.push('/lesson/1/1/1');
      }, 600); // Match the exit animation duration
      return () => clearTimeout(navTimer);
    }
  }, [isExiting, router, onReady]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: '#0a0412' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: isExiting ? 0.6 : 0.8 }}
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(79, 255, 176, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Narrative content */}
      <motion.div
        className="text-center relative z-10"
        animate={{
          opacity: isExiting ? 0 : 1,
          scale: isExiting ? 1.1 : 1,
          y: isExiting ? -20 : 0
        }}
        transition={{ duration: 0.5 }}
      >
        {/* Narrative text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={narrativeStage}
            initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-sm md:text-base font-pixel tracking-widest px-8"
            style={{
              color: '#4FFFB0',
              textShadow: '0 0 20px rgba(79, 255, 176, 0.5)',
            }}
          >
            {narrativeMessages[narrativeStage]}
          </motion.p>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="mt-10 w-48 mx-auto">
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(79, 255, 176, 0.15)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #4FFFB0, #2dd4bf)',
                boxShadow: '0 0 10px rgba(79, 255, 176, 0.5)',
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${((narrativeStage + 1) / narrativeMessages.length) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const [isHovering, setIsHovering] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showDarkness, setShowDarkness] = useState(false);
  const [hasHatched, setHasHatched] = useState<boolean | null>(null); // null = loading
  const router = useRouter();
  const eggRef = useRef<HTMLDivElement>(null);

  // Check if user has already hatched (returning user)
  // TODO: Re-enable localStorage check after testing
  useEffect(() => {
    // const hatched = localStorage.getItem('monsters-ink-hatched');
    // setHasHatched(hatched === 'true');
    setHasHatched(false); // Always show first-time experience for testing
  }, []);

  const handleEggClick = useCallback(() => {
    if (isShaking || showDarkness) return;

    // Start shaking
    setIsShaking(true);

    // After shake animation, transition to darkness
    setTimeout(() => {
      setShowDarkness(true);
    }, 1200); // Shake duration
  }, [isShaking, showDarkness]);

  const handleContinueJourney = useCallback(() => {
    router.push('/lab');
  }, [router]);

  // Show nothing while checking localStorage (prevents flash)
  if (hasHatched === null) {
    return (
      <div
        className="min-h-screen"
        style={{
          background: 'linear-gradient(180deg, #240B4D 0%, #1a0a3a 50%, #0f0520 100%)',
        }}
      />
    );
  }

  // Returning user view
  if (hasHatched) {
    return (
      <div className="min-h-screen overflow-hidden relative">
        {/* WebGL organic background */}
        <OrganicShaderBackground />

        <FloatingParticles />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <Image
              src="/logo.png"
              alt="Monsters Ink!"
              width={400}
              height={200}
              className="object-contain"
              priority
            />
          </motion.div>

          {/* Creature */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <Image
              src="/creatures/first_awake.png"
              alt="Your creature"
              width={160}
              height={160}
              className="object-contain"
              style={{
                filter: 'drop-shadow(0 0 25px rgba(79, 255, 176, 0.3))',
              }}
            />
          </motion.div>

          {/* Welcome back message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="font-pixel text-xs mb-8 tracking-wider"
            style={{ color: '#4FFFB0' }}
          >
            Welcome back, bio-engineer
          </motion.p>

          {/* Continue button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={handleContinueJourney}
            className="px-8 py-4 font-pixel text-xs tracking-wider rounded-lg transition-all duration-300 hover:scale-105"
            style={{
              background: '#1E4CDD',
              color: 'white',
              boxShadow: '0 0 20px rgba(30, 76, 221, 0.3)',
            }}
          >
            Continue your journey
          </motion.button>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-6 text-center"
          >
            <p className="text-xs text-slate-500">
              Funded by{' '}
              <span style={{ color: '#E6007A' }} className="font-semibold">
                Polkadot
              </span>
            </p>
          </motion.footer>
        </div>
      </div>
    );
  }

  // First-time user: Landing page with egg
  return (
    <>
      {/* Darkness transition overlay */}
      <AnimatePresence>
        {showDarkness && (
          <DarknessTransition onReady={() => {}} />
        )}
      </AnimatePresence>

      {/* Main landing page */}
      <div
        className={`min-h-screen overflow-hidden relative transition-opacity duration-500 ${
          showDarkness ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* WebGL organic background */}
        <OrganicShaderBackground />

        {/* Floating particles */}
        <FloatingParticles />

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-4"
          >
            <Image
              src="/logo.png"
              alt="Monsters Ink!"
              width={420}
              height={210}
              className="object-contain"
              priority
            />
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-16 text-center"
          >
            <p
              className="font-pixel text-[10px] md:text-xs tracking-wider mb-2"
              style={{ color: '#4FFFB0' }}
            >
              Inside this egg sleeps your future companion
            </p>
            <p
              className="font-pixel text-[8px] md:text-[10px] tracking-wider"
              style={{ color: '#94a3b8' }}
            >
              Together, you'll learn to code ink! smart contracts
            </p>
          </motion.div>

          {/* Egg */}
          <motion.div
            ref={eggRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="relative mb-10"
          >
            {/* Ambient glow beneath egg */}
            <div
              className="absolute w-48 h-16 rounded-[100%] animate-egg-ambient-glow"
              style={{
                left: '50%',
                bottom: '-8px',
                transform: 'translateX(-42%)',
                background: 'radial-gradient(ellipse, rgba(79, 255, 176, 0.15) 0%, transparent 70%)',
              }}
            />

            {/* The egg */}
            <div
              onClick={handleEggClick}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className={`relative cursor-pointer transition-transform duration-200 ${
                isShaking ? 'animate-egg-shake' : ''
              } ${isHovering && !isShaking ? 'scale-105' : 'scale-100'}`}
            >
              <div className={isShaking ? '' : isHovering ? 'animate-egg-wiggle' : 'animate-egg-breathe'}>
                <Image
                  src="/creatures/first_egg.png"
                  alt="Click to begin your journey"
                  width={260}
                  height={260}
                  className="object-contain relative z-10 transition-all duration-300"
                  priority
                />
              </div>
            </div>
          </motion.div>

          {/* Call to action */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="font-pixel text-xs mb-4 tracking-wider"
            style={{ color: '#FFDAB9' }}
          >
            Wake them up
          </motion.p>

          {/* Value prop */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="font-pixel text-[10px] text-center max-w-lg tracking-wider leading-relaxed"
            style={{ color: '#94a3b8' }}
          >
            They evolve as you code. Complete your ink! training and immortalize your companion on-chain.
          </motion.p>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-6 text-center"
          >
            <p className="text-xs text-slate-500">
              Funded by{' '}
              <span style={{ color: '#E6007A' }} className="font-semibold">
                Polkadot
              </span>
            </p>
          </motion.footer>
        </div>
      </div>
    </>
  );
}
