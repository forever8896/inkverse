import { describe, it, expect, beforeEach } from 'vitest';
import {
  createHSLFilter,
  loadHSLFromStorage,
  saveHSLToStorage,
  DEFAULT_HSL_VALUES,
  type HSLValues,
} from '../image-filters';

// =============================================================================
// createHSLFilter
// =============================================================================

describe('createHSLFilter', () => {
  it('generates correct filter for default values', () => {
    const filter = createHSLFilter({ hue: 0, saturation: 0, lightness: 0 });
    expect(filter).toBe('hue-rotate(0deg) saturate(100%) brightness(100%)');
  });

  it('applies hue rotation', () => {
    const filter = createHSLFilter({ hue: 90, saturation: 0, lightness: 0 });
    expect(filter).toContain('hue-rotate(90deg)');
  });

  it('applies saturation offset (adds to 100%)', () => {
    const filter = createHSLFilter({ hue: 0, saturation: 30, lightness: 0 });
    expect(filter).toContain('saturate(130%)');
  });

  it('applies negative saturation', () => {
    const filter = createHSLFilter({ hue: 0, saturation: -50, lightness: 0 });
    expect(filter).toContain('saturate(50%)');
  });

  it('applies lightness offset (adds to 100%)', () => {
    const filter = createHSLFilter({ hue: 0, saturation: 0, lightness: 20 });
    expect(filter).toContain('brightness(120%)');
  });

  it('applies all values together', () => {
    const filter = createHSLFilter({ hue: 45, saturation: 25, lightness: 10 });
    expect(filter).toBe('hue-rotate(45deg) saturate(125%) brightness(110%)');
  });

  it('does not include glow by default', () => {
    const filter = createHSLFilter({ hue: 0, saturation: 0, lightness: 0 });
    expect(filter).not.toContain('drop-shadow');
  });

  it('includes glow when requested', () => {
    const filter = createHSLFilter(
      { hue: 0, saturation: 0, lightness: 0 },
      { includeGlow: true }
    );
    expect(filter).toContain('drop-shadow');
    expect(filter).toContain('rgba(147, 51, 234, 0.5)'); // default purple
    expect(filter).toContain('20px'); // default radius
  });

  it('uses custom glow color', () => {
    const filter = createHSLFilter(
      { hue: 0, saturation: 0, lightness: 0 },
      { includeGlow: true, glowColor: 'rgba(255, 0, 0, 0.5)' }
    );
    expect(filter).toContain('rgba(255, 0, 0, 0.5)');
  });

  it('uses custom glow radius', () => {
    const filter = createHSLFilter(
      { hue: 0, saturation: 0, lightness: 0 },
      { includeGlow: true, glowRadius: 40 }
    );
    expect(filter).toContain('40px');
  });
});

// =============================================================================
// DEFAULT_HSL_VALUES
// =============================================================================

describe('DEFAULT_HSL_VALUES', () => {
  it('is all zeros', () => {
    expect(DEFAULT_HSL_VALUES).toEqual({ hue: 0, saturation: 0, lightness: 0 });
  });
});

// =============================================================================
// loadHSLFromStorage / saveHSLToStorage
// =============================================================================

describe('localStorage integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when nothing saved', () => {
    const values = loadHSLFromStorage();
    expect(values).toEqual(DEFAULT_HSL_VALUES);
  });

  it('saves and loads values', () => {
    const hsl: HSLValues = { hue: 45, saturation: 20, lightness: -10 };
    saveHSLToStorage(hsl);
    const loaded = loadHSLFromStorage();
    expect(loaded).toEqual(hsl);
  });

  it('uses custom storage key', () => {
    const hsl: HSLValues = { hue: 90, saturation: 0, lightness: 0 };
    saveHSLToStorage(hsl, 'myKey');
    const loaded = loadHSLFromStorage('myKey');
    expect(loaded).toEqual(hsl);

    // Default key should still return defaults
    expect(loadHSLFromStorage()).toEqual(DEFAULT_HSL_VALUES);
  });

  it('returns defaults for invalid stored JSON', () => {
    localStorage.setItem('creatureColor', 'not-json');
    const values = loadHSLFromStorage();
    expect(values).toEqual(DEFAULT_HSL_VALUES);
  });

  it('returns defaults for stored object missing required fields', () => {
    localStorage.setItem('creatureColor', JSON.stringify({ hue: 10 }));
    const values = loadHSLFromStorage();
    expect(values).toEqual(DEFAULT_HSL_VALUES);
  });

  it('returns defaults for stored object with wrong types', () => {
    localStorage.setItem('creatureColor', JSON.stringify({ hue: 'ten', saturation: 0, lightness: 0 }));
    const values = loadHSLFromStorage();
    expect(values).toEqual(DEFAULT_HSL_VALUES);
  });
});
