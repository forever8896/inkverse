'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

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
  const router = useRouter();

  const narrativeMessages = [
    'Your creature stirs...',
    'A bond is forming...',
    'Ready to learn together.',
  ];

  // Prefetch and wait for the lesson page to be ready
  useEffect(() => {
    // Prefetch the lesson route
    router.prefetch('/lesson/1/1/1');

    // Give it time to prefetch, then mark as ready
    const prefetchTimer = setTimeout(() => {
      setIsLessonReady(true);
    }, 2500); // Minimum time for narrative + prefetch

    return () => clearTimeout(prefetchTimer);
  }, [router]);

  // Progress through narrative messages
  useEffect(() => {
    const interval = setInterval(() => {
      setNarrativeStage((prev) => {
        if (prev >= narrativeMessages.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [narrativeMessages.length]);

  // When lesson is ready and we've shown enough narrative, navigate
  useEffect(() => {
    if (isLessonReady && narrativeStage >= narrativeMessages.length - 1) {
      // Small delay after "Ready to learn together" before navigating
      const navTimer = setTimeout(() => {
        localStorage.setItem('monsters-ink-hatched', 'true');
        onReady();
        router.push('/lesson/1/1/1');
      }, 800);
      return () => clearTimeout(navTimer);
    }
  }, [isLessonReady, narrativeStage, narrativeMessages.length, router, onReady]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: '#0a0412' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Narrative text */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={narrativeStage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-lg font-pixel tracking-wider"
            style={{ color: '#4FFFB0' }}
          >
            {narrativeMessages[narrativeStage]}
          </motion.p>
        </AnimatePresence>

        {/* Subtle loading indicator */}
        <motion.div
          className="mt-8 w-32 h-0.5 mx-auto rounded-full overflow-hidden"
          style={{ background: 'rgba(79, 255, 176, 0.1)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: '#4FFFB0' }}
            initial={{ width: '0%' }}
            animate={{ width: isLessonReady ? '100%' : '70%' }}
            transition={{ duration: isLessonReady ? 0.3 : 2, ease: 'easeOut' }}
          />
        </motion.div>
      </div>
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
      <div
        className="min-h-screen overflow-hidden relative"
        style={{
          background: 'linear-gradient(180deg, #240B4D 0%, #1a0a3a 50%, #0f0520 100%)',
        }}
      >
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
        style={{
          background: 'linear-gradient(180deg, #240B4D 0%, #1a0a3a 50%, #0f0520 100%)',
        }}
      >
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
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="font-pixel text-[10px] md:text-xs mb-16 tracking-wider text-center"
            style={{ color: '#4FFFB0' }}
          >
            Every ink! master starts with an egg
          </motion.p>

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
            {/* Soft glow behind egg */}
            <div
              className="absolute rounded-full animate-egg-glow"
              style={{
                width: 350,
                height: 350,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(255, 218, 185, 0.2) 0%, rgba(255, 218, 185, 0.05) 40%, transparent 70%)',
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
              <div className={isShaking ? '' : 'animate-egg-breathe'}>
                <Image
                  src="/creatures/first_egg.png"
                  alt="Click to begin your journey"
                  width={260}
                  height={260}
                  className="object-contain relative z-10 transition-all duration-300"
                  style={{
                    filter: isHovering
                      ? 'drop-shadow(0 0 35px rgba(255, 218, 185, 0.5))'
                      : 'drop-shadow(0 0 15px rgba(255, 218, 185, 0.25))',
                  }}
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
            className="text-sm mb-3"
            style={{ color: isHovering ? '#FFDAB9' : '#64748b' }}
          >
            {isHovering ? 'Click to awaken...' : 'Touch to awaken'}
          </motion.p>

          {/* Value prop */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="text-xs text-center max-w-sm"
            style={{ color: '#475569' }}
          >
            Master ink! smart contracts by evolving your creature
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
