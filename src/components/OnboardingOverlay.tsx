'use client';

/**
 * OnboardingOverlay - Three-screen welcome experience
 *
 * Displays onboarding messages at the bottom of the screen:
 * 1. Welcome message - introduces the concept
 * 2. Progression message - explains how lessons work
 * 3. NFT message - explains the end goal
 *
 * Features:
 * - Manual navigation with Next/Back buttons
 * - Dot indicators showing current screen
 * - "Begin" button on final screen to start lessons
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const ONBOARDING_SCREENS = [
  {
    title: 'Welcome to Monsters Ink!',
    subtitle: 'Learn to code ink! smart contracts by evolving your own unique monster.',
  },
  {
    title: 'Complete lessons to unlock new abilities.',
    subtitle: 'Watch your monster grow as your skills develop.',
  },
  {
    title: 'Finish the course and mint your monster as an NFT.',
    subtitle: 'Your creation, permanently on-chain.',
  },
];

interface OnboardingOverlayProps {
  onComplete: () => void;
}

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const isFirstScreen = currentScreen === 0;
  const isLastScreen = currentScreen === ONBOARDING_SCREENS.length - 1;

  const handleNext = useCallback(() => {
    if (isLastScreen) {
      onComplete();
    } else {
      setCurrentScreen((prev) => prev + 1);
    }
  }, [isLastScreen, onComplete]);

  const handleBack = useCallback(() => {
    if (!isFirstScreen) {
      setCurrentScreen((prev) => prev - 1);
    }
  }, [isFirstScreen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleBack();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handleBack]);

  // Focus the Next button on mount for keyboard accessibility
  useEffect(() => {
    nextButtonRef.current?.focus();
  }, []);

  const screen = ONBOARDING_SCREENS[currentScreen];

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col justify-end pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Monsters Ink onboarding"
    >
      {/* Bottom overlay with message */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative px-8 py-10 pointer-events-auto"
        style={{
          background: 'linear-gradient(to top, rgba(10, 4, 18, 0.95) 0%, rgba(10, 4, 18, 0.8) 70%, transparent 100%)',
        }}
      >
        {/* Content */}
        <div className="max-w-2xl mx-auto text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <h2
                className="font-pixel text-sm md:text-base tracking-wider mb-3"
                style={{ color: 'var(--mi-mint)' }}
              >
                {screen.title}
              </h2>
              <p
                className="font-pixel text-[10px] md:text-xs tracking-wider leading-relaxed"
                style={{ color: '#94a3b8' }}
              >
                {screen.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          <div
            className="flex items-center justify-center gap-2 mt-8 mb-6"
            role="tablist"
            aria-label="Onboarding progress"
          >
            {ONBOARDING_SCREENS.map((_, index) => (
              <div
                key={index}
                role="tab"
                aria-selected={index === currentScreen}
                aria-label={`Step ${index + 1} of ${ONBOARDING_SCREENS.length}`}
                className="transition-all duration-300"
                style={{
                  width: index === currentScreen ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background:
                    index === currentScreen
                      ? 'var(--mi-mint)'
                      : 'rgba(79, 255, 176, 0.3)',
                }}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-center gap-4">
            {/* Back button - only show if not on first screen */}
            <button
              onClick={handleBack}
              disabled={isFirstScreen}
              aria-label={`Go back to step ${currentScreen}`}
              aria-hidden={isFirstScreen}
              tabIndex={isFirstScreen ? -1 : 0}
              className={`px-6 py-3 font-pixel text-[10px] uppercase tracking-wider rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-transparent ${
                isFirstScreen
                  ? 'opacity-0 pointer-events-none'
                  : 'opacity-100 hover:scale-105'
              }`}
              style={{
                background: 'rgba(148, 163, 184, 0.1)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#94a3b8',
              }}
            >
              Back
            </button>

            {/* Next/Begin button */}
            <button
              ref={nextButtonRef}
              onClick={handleNext}
              aria-label={isLastScreen ? 'Begin learning' : `Go to step ${currentScreen + 2}`}
              className="px-8 py-3 font-pixel text-[10px] uppercase tracking-wider rounded-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent"
              style={{
                background: isLastScreen ? '#1E4CDD' : 'rgba(79, 255, 176, 0.15)',
                border: isLastScreen ? 'none' : '1px solid rgba(79, 255, 176, 0.4)',
                color: isLastScreen ? 'white' : 'var(--mi-mint)',
                boxShadow: isLastScreen
                  ? '0 0 20px rgba(30, 76, 221, 0.4)'
                  : '0 0 15px rgba(79, 255, 176, 0.2)',
                // @ts-expect-error CSS custom property for focus ring
                '--tw-ring-color': isLastScreen ? '#1E4CDD' : 'var(--mi-mint)',
              }}
            >
              {isLastScreen ? 'Begin' : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
