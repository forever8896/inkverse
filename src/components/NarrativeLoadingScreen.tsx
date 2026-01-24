'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

const MONSTER_IMAGES = [
  '/monsters/17b3d246-bbee-460d-bf10-96ead31ac702.webp',
  '/monsters/c779ad1c-a127-4780-8821-77c28ad70961.webp',
  '/monsters/d0bebeab-0f60-4ebc-aaa2-8a38601485c0.webp',
  '/monsters/f84edb46-eec8-4faa-b3ee-0586fc1f7394.webp',
];

interface NarrativeLoadingScreenProps {
  onComplete: () => void;
  messages?: string[];
  /** Duration per message in ms (default: 1500) */
  messageDuration?: number;
}

/**
 * Shared narrative loading screen used for route transitions.
 * Shows narrative messages with a progress bar in a minimal, atmospheric style.
 */
export function NarrativeLoadingScreen({
  onComplete,
  messages = [
    'Your creature stirs...',
    'A bond is forming...',
    'Preparing your workspace...',
    'Ready to learn together.',
  ],
  messageDuration = 1500,
}: NarrativeLoadingScreenProps) {
  const [narrativeStage, setNarrativeStage] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [currentMonster, setCurrentMonster] = useState(0);

  // Progress through narrative messages
  useEffect(() => {
    const interval = setInterval(() => {
      setNarrativeStage((prev) => {
        if (prev >= messages.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, messageDuration);

    return () => clearInterval(interval);
  }, [messages.length, messageDuration]);

  // Mark as ready after all messages have been shown
  useEffect(() => {
    const totalDuration = messages.length * messageDuration;
    const readyTimer = setTimeout(() => {
      setIsReady(true);
    }, totalDuration);

    return () => clearTimeout(readyTimer);
  }, [messages.length, messageDuration]);

  // Start exit animation when ready
  useEffect(() => {
    if (isReady && narrativeStage >= messages.length - 1 && !isExiting) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 800);
      return () => clearTimeout(exitTimer);
    }
  }, [isReady, narrativeStage, messages.length, isExiting]);

  // Call onComplete after exit animation
  useEffect(() => {
    if (isExiting) {
      const navTimer = setTimeout(() => {
        onComplete();
      }, 600);
      return () => clearTimeout(navTimer);
    }
  }, [isExiting, onComplete]);

  // Cycle through monster images
  useEffect(() => {
    const monsterInterval = setInterval(() => {
      setCurrentMonster((prev) => (prev + 1) % MONSTER_IMAGES.length);
    }, 2000);

    return () => clearInterval(monsterInterval);
  }, []);

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
          background:
            'radial-gradient(circle, rgba(79, 255, 176, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Narrative content */}
      <motion.div
        className="text-center relative z-10"
        animate={{
          opacity: isExiting ? 0 : 1,
          scale: isExiting ? 1.1 : 1,
          y: isExiting ? -20 : 0,
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
              color: 'var(--mi-mint)',
              textShadow: '0 0 20px rgba(79, 255, 176, 0.5)',
            }}
          >
            {messages[narrativeStage]}
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
                background: 'linear-gradient(90deg, var(--mi-mint), #2dd4bf)',
                boxShadow: '0 0 10px rgba(79, 255, 176, 0.5)',
              }}
              initial={{ width: '0%' }}
              animate={{
                width: `${((narrativeStage + 1) / messages.length) * 100}%`,
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* Monster carousel at bottom */}
      <div className="absolute bottom-[20%] left-0 right-0 flex justify-center overflow-hidden h-32 md:h-48 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMonster}
            initial={{ x: -200, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 0.6, scale: 1 }}
            exit={{ x: 200, opacity: 0, scale: 0.8 }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="relative w-28 h-28 md:w-48 md:h-48"
          >
            <Image
              src={MONSTER_IMAGES[currentMonster]}
              alt="Monster"
              fill
              className="object-contain"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(79, 255, 176, 0.4))',
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
