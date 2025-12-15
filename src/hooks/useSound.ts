'use client';

/**
 * useSound Hook
 *
 * A React hook that wraps the SoundManager singleton for easy sound playback.
 * Handles user interaction detection and provides ready state.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  SoundManager,
  SOUND_PATHS,
  type SoundName,
  markUserInteraction,
} from '@/lib/sound-manager';

// Re-export for convenience
export { SOUND_PATHS, type SoundName } from '@/lib/sound-manager';

interface UseSoundOptions {
  /** Volume multiplier (0-1), applied on top of default sound volume */
  volume?: number;
}

interface UseSoundReturn {
  /** Play the sound */
  play: () => void;
  /** Stop all instances of this sound (resets to beginning) */
  stop: () => void;
  /** Whether the sound is loaded and ready to play */
  isReady: boolean;
}

/**
 * Hook for playing sound effects using the global SoundManager
 *
 * @param soundNameOrPath - Either a SoundName key (e.g., 'CORRECT') or path (e.g., '/sounds/correct.mp3')
 * @param options - Optional configuration
 * @returns Object with play/stop functions and isReady state
 *
 * @example
 * // Using sound name (recommended)
 * const { play } = useSound('CORRECT');
 *
 * // Using path (legacy support)
 * const { play } = useSound('/sounds/correct.mp3');
 *
 * // With volume
 * const { play } = useSound('CLICK', { volume: 0.5 });
 */
export function useSound(
  soundNameOrPath: SoundName | string,
  options: UseSoundOptions = {}
): UseSoundReturn {
  const { volume = 1 } = options;
  const [isReady, setIsReady] = useState(false);

  // Resolve sound name from path if needed
  const soundName = resolveSoundName(soundNameOrPath);

  // Set up user interaction listener to initialize sounds
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleInteraction = () => {
      markUserInteraction();
      // Check ready state after a short delay
      setTimeout(() => {
        if (soundName) {
          setIsReady(SoundManager.isReady(soundName));
        }
      }, 100);
    };

    // Listen for any user interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach((event) => {
      window.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    // Check if already initialized
    if (soundName) {
      setIsReady(SoundManager.isReady(soundName));
    }

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleInteraction);
      });
    };
  }, [soundName]);

  // Periodically check ready state until loaded
  useEffect(() => {
    if (isReady || !soundName) return;

    const checkReady = setInterval(() => {
      if (SoundManager.isReady(soundName)) {
        setIsReady(true);
        clearInterval(checkReady);
      }
    }, 200);

    return () => clearInterval(checkReady);
  }, [soundName, isReady]);

  const play = useCallback(() => {
    if (!soundName) {
      // Fallback for unknown paths - create audio directly
      if (soundNameOrPath.startsWith('/')) {
        try {
          const audio = new Audio(soundNameOrPath);
          audio.volume = Math.max(0, Math.min(1, volume));
          audio.play().catch(() => {});
        } catch {}
      }
      return;
    }

    SoundManager.play(soundName, volume);
  }, [soundName, soundNameOrPath, volume]);

  const stop = useCallback(() => {
    if (soundName) {
      SoundManager.stop(soundName);
    }
  }, [soundName]);

  return {
    play,
    stop,
    isReady,
  };
}

/**
 * Resolve a path or name to a SoundName
 */
function resolveSoundName(input: string): SoundName | null {
  // If it's already a valid sound name
  if (input in SOUND_PATHS) {
    return input as SoundName;
  }

  // Try to find by path
  for (const [name, path] of Object.entries(SOUND_PATHS)) {
    if (path === input) {
      return name as SoundName;
    }
  }

  return null;
}

/**
 * Hook to preload sounds on mount
 * Call this in your root layout or early in the app lifecycle
 */
export function useSoundPreloader(): { isLoaded: boolean } {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleInteraction = async () => {
      markUserInteraction();
      await SoundManager.initialize();
      setIsLoaded(SoundManager.isFullyLoaded());
    };

    // Listen for first interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach((event) => {
      window.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    // Check initial state
    setIsLoaded(SoundManager.isFullyLoaded());

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  return { isLoaded };
}

/**
 * Preload multiple sounds for faster initial playback
 * @deprecated Use SoundManager.initialize() instead
 */
export function preloadSounds(sources: string[]): void {
  // Now handled by SoundManager automatically
  markUserInteraction();
}
