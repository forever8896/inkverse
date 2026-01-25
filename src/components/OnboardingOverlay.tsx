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
 * - GSAP character-by-character text animation
 * - "Begin" button on final screen to start lessons
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';

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

interface AnimatedTextProps {
  title: string;
  subtitle: string;
  screenKey: number;
}

function AnimatedText({ title, subtitle, screenKey, onAnimationComplete }: AnimatedTextProps & { onAnimationComplete?: () => void }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [showSubtitle, setShowSubtitle] = useState(false);

  useEffect(() => {
    // Reset state for new screen
    setShowSubtitle(false);

    if (!titleRef.current) return;

    // Split title into words, then characters within each word
    // Words are wrapped in nowrap spans to prevent mid-word line breaks
    const words = title.split(' ');
    const allCharSpans: HTMLSpanElement[] = [];

    // Clear title element
    titleRef.current.innerHTML = '';

    words.forEach((word, wordIndex) => {
      // Create word wrapper with nowrap
      const wordSpan = document.createElement('span');
      wordSpan.style.display = 'inline-block';
      wordSpan.style.whiteSpace = 'nowrap';

      // Create character spans within the word
      word.split('').forEach((char) => {
        const charSpan = document.createElement('span');
        charSpan.textContent = char;
        charSpan.style.display = 'inline-block';
        charSpan.style.opacity = '0';
        charSpan.style.filter = 'blur(4px)';
        charSpan.style.transform = 'translateY(8px)';
        wordSpan.appendChild(charSpan);
        allCharSpans.push(charSpan);
      });

      titleRef.current?.appendChild(wordSpan);

      // Add space between words (except after last word)
      if (wordIndex < words.length - 1) {
        const spaceSpan = document.createElement('span');
        spaceSpan.textContent = '\u00A0'; // Non-breaking space
        spaceSpan.style.display = 'inline-block';
        spaceSpan.style.opacity = '0';
        titleRef.current?.appendChild(spaceSpan);
        allCharSpans.push(spaceSpan);
      }
    });

    // Animate characters in with GSAP
    const tl = gsap.timeline({
      onComplete: () => {
        setShowSubtitle(true);
        // Slight delay before signaling buttons can appear
        setTimeout(() => onAnimationComplete?.(), 300);
      },
    });

    tl.to(allCharSpans, {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      duration: 0.08,
      stagger: 0.025,
      ease: 'power2.out',
    });

    return () => {
      tl.kill();
    };
  }, [title, screenKey, onAnimationComplete]);

  return (
    <div>
      <h2
        ref={titleRef}
        className="font-pixel text-[11px] md:text-[13px] tracking-wider mb-3 text-balance"
        style={{ color: 'var(--mi-mint)' }}
        aria-label={title}
      />
      <p
        className="font-pixel text-[8px] md:text-[10px] tracking-wider leading-relaxed text-balance transition-opacity duration-500"
        style={{
          color: '#94a3b8',
          opacity: showSubtitle ? 1 : 0,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

interface OnboardingOverlayProps {
  onComplete: () => void;
}

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [showButtons, setShowButtons] = useState(false);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const isFirstScreen = currentScreen === 0;
  const isLastScreen = currentScreen === ONBOARDING_SCREENS.length - 1;

  const handleNext = useCallback(() => {
    if (isLastScreen) {
      onComplete();
    } else {
      setShowButtons(false);
      setCurrentScreen((prev) => prev + 1);
    }
  }, [isLastScreen, onComplete]);

  const handleBack = useCallback(() => {
    if (!isFirstScreen) {
      setShowButtons(false);
      setCurrentScreen((prev) => prev - 1);
    }
  }, [isFirstScreen]);

  const handleAnimationComplete = useCallback(() => {
    setShowButtons(true);
  }, []);

  // Keyboard navigation (only when buttons are visible)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showButtons) return;

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
  }, [handleNext, handleBack, showButtons]);

  // Focus the Next button when it becomes visible for keyboard accessibility
  useEffect(() => {
    if (showButtons) {
      nextButtonRef.current?.focus();
    }
  }, [showButtons]);

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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AnimatedText
                title={screen.title}
                subtitle={screen.subtitle}
                screenKey={currentScreen}
                onAnimationComplete={handleAnimationComplete}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div
            className="flex items-center justify-center gap-4 mt-8 transition-all duration-500"
            style={{
              opacity: showButtons ? 1 : 0,
              transform: showButtons ? 'translateY(0)' : 'translateY(10px)',
            }}
          >
            {/* Back button - only render if not on first screen */}
            {!isFirstScreen && (
              <button
                onClick={handleBack}
                aria-label={`Go back to step ${currentScreen}`}
                tabIndex={showButtons ? 0 : -1}
                className="px-5 py-2.5 font-pixel text-[8px] uppercase tracking-wider rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-transparent"
                style={{
                  background: 'rgba(148, 163, 184, 0.1)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#94a3b8',
                }}
              >
                Back
              </button>
            )}

            {/* Next/Begin button */}
            <button
              ref={nextButtonRef}
              onClick={handleNext}
              aria-label={isLastScreen ? 'Begin learning' : `Go to step ${currentScreen + 2}`}
              tabIndex={showButtons ? 0 : -1}
              className="px-6 py-2.5 font-pixel text-[8px] uppercase tracking-wider rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent"
              style={{
                background: 'rgba(79, 255, 176, 0.15)',
                border: '1px solid rgba(79, 255, 176, 0.4)',
                color: 'var(--mi-mint)',
                boxShadow: '0 0 15px rgba(79, 255, 176, 0.2)',
                // @ts-expect-error CSS custom property for focus ring
                '--tw-ring-color': 'var(--mi-mint)',
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
