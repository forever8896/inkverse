/**
 * SoundManager - Simple, reliable audio playback
 *
 * Preloads Audio elements on first interaction, then clones them for each play.
 * Cloned elements have the source already buffered, avoiding "media removed from
 * document" errors that occur when fresh Audio elements are GC'd mid-load.
 */

export const SOUND_PATHS = {
  CORRECT: '/sounds/correct.mp3',
  WRONG: '/sounds/wrong.mp3',
  MONSTER_SHAKE: '/sounds/monster-shake.mp3',
  MONSTER_SHAKE_LG: '/sounds/monster-shake-lg.mp3',
  LVL_UP: '/sounds/lvl-up.mp3',
  CLICK: '/sounds/click.mp3',
} as const;

export type SoundName = keyof typeof SOUND_PATHS;

const VOLUMES: Record<SoundName, number> = {
  CORRECT: 0.6,
  WRONG: 0.5,
  MONSTER_SHAKE: 0.5,
  MONSTER_SHAKE_LG: 0.7,
  LVL_UP: 0.7,
  CLICK: 0.4,
};

class SoundManagerClass {
  private static instance: SoundManagerClass | null = null;
  private activeSounds: Map<SoundName, Set<HTMLAudioElement>> = new Map();
  private preloaded: Map<SoundName, HTMLAudioElement> = new Map();
  private masterVolume = 1.0;
  private isMuted = false;

  private constructor() {
    // Initialize active sounds map
    for (const name of Object.keys(SOUND_PATHS)) {
      this.activeSounds.set(name as SoundName, new Set());
    }
  }

  static getInstance(): SoundManagerClass {
    if (!SoundManagerClass.instance) {
      SoundManagerClass.instance = new SoundManagerClass();
    }
    return SoundManagerClass.instance;
  }

  /**
   * Preload all sounds so cloned elements already have the source buffered
   */
  private ensurePreloaded(name: SoundName): HTMLAudioElement | null {
    if (this.preloaded.has(name)) return this.preloaded.get(name)!;

    const path = SOUND_PATHS[name];
    if (!path) return null;

    const audio = new Audio(path);
    audio.preload = 'auto';
    // Trigger load without playing
    audio.load();
    this.preloaded.set(name, audio);
    return audio;
  }

  /**
   * Play a sound - clones a preloaded Audio element for reliable playback
   */
  play(name: SoundName, volumeOverride?: number): boolean {
    if (typeof window === 'undefined') return false;
    if (this.isMuted) return false;

    const path = SOUND_PATHS[name];
    if (!path) return false;

    try {
      // Clone from preloaded element (source already buffered) or create fresh
      const source = this.ensurePreloaded(name);
      const audio = source
        ? source.cloneNode(true) as HTMLAudioElement
        : new Audio(path);

      const baseVolume = VOLUMES[name] ?? 0.5;
      audio.volume = Math.max(0, Math.min(1, (volumeOverride ?? 1) * baseVolume * this.masterVolume));

      // Track this audio element
      const soundSet = this.activeSounds.get(name);
      if (soundSet) {
        soundSet.add(audio);

        // Remove from tracking when done
        audio.addEventListener('ended', () => {
          soundSet.delete(audio);
        }, { once: true });

        audio.addEventListener('error', () => {
          soundSet.delete(audio);
        }, { once: true });
      }

      // Play
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch((err) => {
          // Remove from tracking on error
          soundSet?.delete(audio);
          // Only log if not an autoplay restriction
          if (err.name !== 'NotAllowedError') {
            console.warn(`[Sound] Failed to play ${name}:`, err.message);
          }
        });
      }

      return true;
    } catch (err) {
      console.warn(`[Sound] Error playing ${name}:`, err);
      return false;
    }
  }

  /**
   * Stop all instances of a specific sound
   */
  stop(name: SoundName): void {
    const soundSet = this.activeSounds.get(name);
    if (!soundSet) return;

    for (const audio of soundSet) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // Ignore
      }
    }
    soundSet.clear();
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    for (const name of this.activeSounds.keys()) {
      this.stop(name);
    }
  }

  /**
   * Set master volume (0-1)
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Mute/unmute
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopAll();
    }
  }

  /**
   * For compatibility - sounds are always "ready" since we create on demand
   */
  isReady(_name: SoundName): boolean {
    return true;
  }

  isFullyLoaded(): boolean {
    return this.preloaded.size === Object.keys(SOUND_PATHS).length;
  }

  initialize(): Promise<void> {
    // Preload all sounds
    for (const name of Object.keys(SOUND_PATHS)) {
      this.ensurePreloaded(name as SoundName);
    }
    return Promise.resolve();
  }

  markUserInteraction(): void {
    // Preload on first interaction so sounds are ready
    this.initialize();
  }
}

// Singleton
export const SoundManager = SoundManagerClass.getInstance();

// Convenience functions
export const playSound = (name: SoundName, volume?: number) => SoundManager.play(name, volume);
export const stopSound = (name: SoundName) => SoundManager.stop(name);
export const stopAllSounds = () => SoundManager.stopAll();
export const initializeSounds = () => SoundManager.initialize();
export const markUserInteraction = () => SoundManager.markUserInteraction();
