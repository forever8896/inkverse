/**
 * Image Filter Utilities
 *
 * Shared utilities for generating CSS filter strings from HSL values.
 * Used across LessonLayout, LabClient, and other creature display components.
 */

export interface HSLValues {
  hue: number;
  saturation: number;
  lightness: number;
}

export interface ImageFilterOptions {
  /** Include purple glow drop-shadow effect */
  includeGlow?: boolean;
  /** Custom glow color (default: purple) */
  glowColor?: string;
  /** Glow blur radius in pixels (default: 20) */
  glowRadius?: number;
}

/**
 * Generate a CSS filter string from HSL adjustment values.
 *
 * @param hslValues - The HSL adjustment values (offsets from base)
 * @param options - Additional filter options
 * @returns CSS filter string ready for use in style attribute
 *
 * @example
 * // Basic usage
 * const filter = createHSLFilter({ hue: 30, saturation: 20, lightness: 10 });
 * // Returns: "hue-rotate(30deg) saturate(120%) brightness(110%)"
 *
 * @example
 * // With glow effect
 * const filter = createHSLFilter({ hue: 0, saturation: 0, lightness: 0 }, { includeGlow: true });
 * // Returns: "hue-rotate(0deg) saturate(100%) brightness(100%) drop-shadow(0 0 20px rgba(147, 51, 234, 0.5))"
 */
export function createHSLFilter(
  hslValues: HSLValues,
  options: ImageFilterOptions = {}
): string {
  const { hue, saturation, lightness } = hslValues;
  const {
    includeGlow = false,
    glowColor = 'rgba(147, 51, 234, 0.5)',
    glowRadius = 20
  } = options;

  let filter = `hue-rotate(${hue}deg) saturate(${100 + saturation}%) brightness(${100 + lightness}%)`;

  if (includeGlow) {
    filter += ` drop-shadow(0 0 ${glowRadius}px ${glowColor})`;
  }

  return filter;
}

/**
 * Default HSL values (no adjustment)
 */
export const DEFAULT_HSL_VALUES: HSLValues = {
  hue: 0,
  saturation: 0,
  lightness: 0,
};

/**
 * Parse HSL values from localStorage
 *
 * @param key - localStorage key (default: 'creatureColor')
 * @returns Parsed HSLValues or default values if not found/invalid
 */
export function loadHSLFromStorage(key: string = 'creatureColor'): HSLValues {
  if (typeof window === 'undefined') return DEFAULT_HSL_VALUES;

  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        typeof parsed.hue === 'number' &&
        typeof parsed.saturation === 'number' &&
        typeof parsed.lightness === 'number'
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error parsing saved HSL values:', error);
  }

  return DEFAULT_HSL_VALUES;
}

/**
 * Save HSL values to localStorage
 *
 * @param values - HSL values to save
 * @param key - localStorage key (default: 'creatureColor')
 */
export function saveHSLToStorage(values: HSLValues, key: string = 'creatureColor'): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch (error) {
    console.error('Error saving HSL values:', error);
  }
}
