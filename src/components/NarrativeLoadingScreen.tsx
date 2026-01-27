'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const MONSTER_IMAGES = [
  '/monsters/17b3d246-bbee-460d-bf10-96ead31ac702.webp',
  '/monsters/c779ad1c-a127-4780-8821-77c28ad70961.webp',
  '/monsters/d0bebeab-0f60-4ebc-aaa2-8a38601485c0.webp',
  '/monsters/f84edb46-eec8-4faa-b3ee-0586fc1f7394.webp',
];

// Messages shown at different loading progress stages
const LOADING_MESSAGES = [
  { threshold: 0, message: 'Your creature stirs...' },
  { threshold: 25, message: 'A bond is forming...' },
  { threshold: 50, message: 'Preparing your workspace...' },
  { threshold: 75, message: 'Almost there...' },
  { threshold: 100, message: 'Ready to learn together.' },
];

interface NarrativeLoadingScreenProps {
  onComplete: () => void;
  /** Path to GLB model to preload during loading screen */
  preloadModelUrl?: string;
}

/**
 * Loading screen that shows real progress based on 3D model download.
 * Shows narrative messages tied to actual loading progress.
 */
// Threshold in ms - if model loads faster than this, assume it's cached
const CACHE_THRESHOLD_MS = 300;

export function NarrativeLoadingScreen({
  onComplete,
  preloadModelUrl,
}: NarrativeLoadingScreenProps) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [currentMonster, setCurrentMonster] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(!preloadModelUrl);
  const [loadError, setLoadError] = useState(false);
  const [isCached, setIsCached] = useState(false);

  // Get current message based on loading progress
  const currentMessage = useMemo(() => {
    // Find the highest threshold that's <= current progress
    const matchingMessages = LOADING_MESSAGES.filter(
      (m) => loadingProgress >= m.threshold
    );
    return matchingMessages[matchingMessages.length - 1]?.message || LOADING_MESSAGES[0].message;
  }, [loadingProgress]);

  // Preload 3D model with progress tracking
  useEffect(() => {
    if (!preloadModelUrl) {
      // No model to load, complete immediately
      setLoadingProgress(100);
      setModelLoaded(true);
      return;
    }

    let isMounted = true;
    let lastProgressUpdate = 0;
    const loadStartTime = Date.now();
    const loader = new GLTFLoader();

    loader.load(
      preloadModelUrl,
      () => {
        if (!isMounted) return;
        const loadDuration = Date.now() - loadStartTime;

        // If loaded very fast, it's likely cached - skip loading screen
        if (loadDuration < CACHE_THRESHOLD_MS) {
          setIsCached(true);
        }

        setLoadingProgress(100);
        setModelLoaded(true);
      },
      (progressEvent) => {
        if (!isMounted) return;
        // Calculate actual loading progress from bytes
        if (progressEvent.lengthComputable && progressEvent.total > 0) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setLoadingProgress(Math.round(progress));
        } else {
          // Fallback: increment slowly based on time, not per-event
          // This prevents rapid jumping when Content-Length is missing
          const now = Date.now();
          if (now - lastProgressUpdate > 500) {
            lastProgressUpdate = now;
            setLoadingProgress((prev) => Math.min(prev + 2, 90));
          }
        }
      },
      (error) => {
        if (!isMounted) return;
        // Log in development only
        if (process.env.NODE_ENV === 'development') {
          console.error('[Loading] Failed to preload 3D model:', error);
        }
        setLoadError(true);
        setLoadingProgress(100);
        setModelLoaded(true); // Continue anyway on error
      }
    );

    return () => {
      isMounted = false;
    };
  }, [preloadModelUrl]);

  // Handle completion - skip loading screen entirely if cached
  useEffect(() => {
    if (modelLoaded && loadingProgress >= 100) {
      // If model was cached, skip loading screen entirely
      if (isCached) {
        onComplete();
        return;
      }

      // Normal flow: show exit animation
      if (!isExiting) {
        const exitTimer = setTimeout(() => {
          setIsExiting(true);
        }, 800);
        return () => clearTimeout(exitTimer);
      }
    }
  }, [modelLoaded, loadingProgress, isExiting, isCached, onComplete]);

  // Call onComplete after exit animation (non-cached flow)
  useEffect(() => {
    if (isExiting && !isCached) {
      const navTimer = setTimeout(() => {
        onComplete();
      }, 600);
      return () => clearTimeout(navTimer);
    }
  }, [isExiting, isCached, onComplete]);

  // Cycle through monster images
  useEffect(() => {
    const monsterInterval = setInterval(() => {
      setCurrentMonster((prev) => (prev + 1) % MONSTER_IMAGES.length);
    }, 2000);

    return () => clearInterval(monsterInterval);
  }, []);

  // Don't render loading screen if model was cached
  if (isCached) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: '#0a0412' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: isExiting ? 0.6 : 0.8 }}
      role="status"
      aria-live="polite"
      aria-label={`Loading: ${loadingProgress}% complete. ${currentMessage}`}
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
        {/* Narrative text - changes based on loading progress */}
        <AnimatePresence mode="wait">
          <motion.p
            key={currentMessage}
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
            {currentMessage}
          </motion.p>
        </AnimatePresence>

        {/* Loading percentage */}
        <motion.p
          className="mt-4 font-pixel text-[10px] tracking-wider"
          style={{ color: '#94a3b8' }}
        >
          {loadError ? 'Loading...' : `${loadingProgress}%`}
        </motion.p>

        {/* Progress bar - real loading progress */}
        <div className="mt-4 w-48 mx-auto">
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
                width: `${loadingProgress}%`,
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
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
