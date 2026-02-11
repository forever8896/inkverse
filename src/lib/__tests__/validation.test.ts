import { describe, it, expect } from 'vitest';
import {
  parseIntSafe,
  parseIntsSafe,
  getPatternFeedback,
  validateCode,
  validateCodeWithFeedback,
} from '../validation';
import type { ValidationRule } from '../lesson-types';

// =============================================================================
// parseIntSafe
// =============================================================================

describe('parseIntSafe', () => {
  it('parses valid integer strings', () => {
    expect(parseIntSafe('1')).toBe(1);
    expect(parseIntSafe('42')).toBe(42);
    expect(parseIntSafe('0')).toBe(0);
    expect(parseIntSafe('-5')).toBe(-5);
    expect(parseIntSafe('999')).toBe(999);
  });

  it('returns null for null/undefined/empty', () => {
    expect(parseIntSafe(null)).toBeNull();
    expect(parseIntSafe(undefined)).toBeNull();
    expect(parseIntSafe('')).toBeNull();
  });

  it('returns null for non-numeric strings', () => {
    expect(parseIntSafe('abc')).toBeNull();
    expect(parseIntSafe('twelve')).toBeNull();
    expect(parseIntSafe('!@#')).toBeNull();
  });

  it('parses strings with trailing non-numeric characters (parseInt behavior)', () => {
    // parseInt('123abc') returns 123 — this is standard JS behavior
    expect(parseIntSafe('123abc')).toBe(123);
  });

  it('returns null for float-only strings that start with a dot', () => {
    expect(parseIntSafe('.5')).toBeNull();
  });

  it('truncates floats to integer (parseInt behavior)', () => {
    expect(parseIntSafe('3.14')).toBe(3);
  });
});

// =============================================================================
// parseIntsSafe
// =============================================================================

describe('parseIntsSafe', () => {
  it('parses multiple valid integers', () => {
    const result = parseIntsSafe({ lessonId: '1', chapterId: '2', stepId: '3' });
    expect(result).toEqual({ lessonId: 1, chapterId: 2, stepId: 3 });
  });

  it('returns null if any value is invalid', () => {
    expect(parseIntsSafe({ a: '1', b: 'abc' })).toBeNull();
    expect(parseIntsSafe({ a: '1', b: null })).toBeNull();
    expect(parseIntsSafe({ a: '1', b: undefined })).toBeNull();
    expect(parseIntsSafe({ a: '1', b: '' })).toBeNull();
  });

  it('returns empty object for empty input', () => {
    expect(parseIntsSafe({})).toEqual({});
  });

  it('handles single value', () => {
    expect(parseIntsSafe({ id: '42' })).toEqual({ id: 42 });
  });
});

// =============================================================================
// getPatternFeedback
// =============================================================================

describe('getPatternFeedback', () => {
  it('returns known feedback for recognized patterns', () => {
    const feedback = getPatternFeedback('#[ink(storage)]');
    expect(feedback).toContain('ink(storage)');
    expect(feedback).toContain('attribute');
  });

  it('returns feedback for struct Creature pattern', () => {
    const feedback = getPatternFeedback('struct Creature');
    expect(feedback).toContain('Creature');
  });

  it('returns feedback for bool pattern', () => {
    const feedback = getPatternFeedback('bool');
    expect(feedback).toContain('bool');
  });

  it('returns feedback for &self pattern', () => {
    const feedback = getPatternFeedback('&self');
    expect(feedback).toContain('&self');
  });

  it('returns feedback for &mut self pattern', () => {
    const feedback = getPatternFeedback('&mut self');
    expect(feedback).toContain('mut');
  });

  it('returns generic fallback for unknown patterns', () => {
    const feedback = getPatternFeedback('some_unknown_pattern');
    expect(feedback).toBe('Make sure to include "some_unknown_pattern" in your code.');
  });
});

// =============================================================================
// validateCode (simple boolean validation)
// =============================================================================

describe('validateCode', () => {
  const sampleCode = `
    #[ink(storage)]
    pub struct Creature {
      is_awake: bool,
    }
    impl Creature {
      #[ink(constructor)]
      pub fn new() -> Self {
        Self { is_awake: true }
      }
    }
  `;

  describe('includes rules', () => {
    it('passes when all patterns are present', () => {
      const rules: ValidationRule[] = [
        { type: 'includes', patterns: ['#[ink(storage)]', 'struct Creature'] },
      ];
      expect(validateCode(sampleCode, rules)).toBe(true);
    });

    it('fails when a pattern is missing', () => {
      const rules: ValidationRule[] = [
        { type: 'includes', patterns: ['#[ink(storage)]', 'struct Monster'] },
      ];
      expect(validateCode(sampleCode, rules)).toBe(false);
    });
  });

  describe('excludes rules', () => {
    it('passes when excluded patterns are absent', () => {
      const rules: ValidationRule[] = [
        { type: 'excludes', patterns: ['panic!', 'unwrap()'] },
      ];
      expect(validateCode(sampleCode, rules)).toBe(true);
    });

    it('fails when an excluded pattern is present', () => {
      const rules: ValidationRule[] = [
        { type: 'excludes', patterns: ['struct Creature'] },
      ];
      expect(validateCode(sampleCode, rules)).toBe(false);
    });
  });

  describe('regex rules', () => {
    it('passes when regex matches', () => {
      const rules: ValidationRule[] = [
        { type: 'regex', patterns: ['pub\\s+struct\\s+Creature'] },
      ];
      expect(validateCode(sampleCode, rules)).toBe(true);
    });

    it('fails when regex does not match', () => {
      const rules: ValidationRule[] = [
        { type: 'regex', patterns: ['pub\\s+struct\\s+Monster'] },
      ];
      expect(validateCode(sampleCode, rules)).toBe(false);
    });
  });

  describe('mixed rules', () => {
    it('passes when all rule types pass', () => {
      const rules: ValidationRule[] = [
        { type: 'includes', patterns: ['#[ink(storage)]'] },
        { type: 'excludes', patterns: ['panic!'] },
        { type: 'regex', patterns: ['is_awake:\\s*bool'] },
      ];
      expect(validateCode(sampleCode, rules)).toBe(true);
    });

    it('fails when any rule fails', () => {
      const rules: ValidationRule[] = [
        { type: 'includes', patterns: ['#[ink(storage)]'] },
        { type: 'excludes', patterns: ['bool'] }, // bool IS present, so this fails
      ];
      expect(validateCode(sampleCode, rules)).toBe(false);
    });
  });

  it('passes with empty rules array', () => {
    expect(validateCode('any code', [])).toBe(true);
  });

  it('handles unknown rule types gracefully', () => {
    const rules = [{ type: 'unknown' as 'includes', patterns: ['test'] }];
    // unknown type falls through to default which returns true
    expect(validateCode('code', rules)).toBe(true);
  });
});

// =============================================================================
// validateCodeWithFeedback (enhanced validation with messages)
// =============================================================================

describe('validateCodeWithFeedback', () => {
  const sampleCode = `
    #[ink(storage)]
    pub struct Creature {
      is_awake: bool,
    }
  `;

  it('returns valid result when all rules pass', () => {
    const rules: ValidationRule[] = [
      { type: 'includes', patterns: ['#[ink(storage)]', 'struct Creature'] },
    ];
    const result = validateCodeWithFeedback(sampleCode, rules);
    expect(result.isValid).toBe(true);
    expect(result.feedback).toBe('');
  });

  describe('includes rules feedback', () => {
    it('returns pattern-specific feedback for known patterns', () => {
      const rules: ValidationRule[] = [
        { type: 'includes', patterns: ['#[ink(message)]'] },
      ];
      const result = validateCodeWithFeedback(sampleCode, rules);
      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('ink(message)');
    });

    it('uses custom message when provided', () => {
      const rules: ValidationRule[] = [
        { type: 'includes', patterns: ['missing_thing'], message: 'Custom hint!' },
      ];
      const result = validateCodeWithFeedback(sampleCode, rules);
      expect(result.isValid).toBe(false);
      expect(result.feedback).toBe('Custom hint!');
    });

    it('returns feedback for the first failing pattern only', () => {
      const rules: ValidationRule[] = [
        { type: 'includes', patterns: ['missing_a', 'missing_b'] },
      ];
      const result = validateCodeWithFeedback(sampleCode, rules);
      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('missing_a');
    });
  });

  describe('excludes rules feedback', () => {
    it('returns feedback when excluded pattern is found', () => {
      const rules: ValidationRule[] = [
        { type: 'excludes', patterns: ['bool'] },
      ];
      const result = validateCodeWithFeedback(sampleCode, rules);
      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('Remove');
      expect(result.feedback).toContain('bool');
    });

    it('uses custom message for excludes', () => {
      const rules: ValidationRule[] = [
        { type: 'excludes', patterns: ['bool'], message: 'Do not use bool here.' },
      ];
      const result = validateCodeWithFeedback(sampleCode, rules);
      expect(result.isValid).toBe(false);
      expect(result.feedback).toBe('Do not use bool here.');
    });
  });

  describe('regex rules feedback', () => {
    it('returns generic feedback when regex fails', () => {
      const rules: ValidationRule[] = [
        { type: 'regex', patterns: ['struct\\s+Monster'] },
      ];
      const result = validateCodeWithFeedback(sampleCode, rules);
      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('matches the required pattern');
    });

    it('uses custom message for regex failures', () => {
      const rules: ValidationRule[] = [
        { type: 'regex', patterns: ['nope'], message: 'Regex failed!' },
      ];
      const result = validateCodeWithFeedback(sampleCode, rules);
      expect(result.isValid).toBe(false);
      expect(result.feedback).toBe('Regex failed!');
    });
  });

  describe('custom rules', () => {
    it('passes through custom rules without error', () => {
      const rules: ValidationRule[] = [
        { type: 'custom', patterns: ['anything'] },
      ];
      const result = validateCodeWithFeedback(sampleCode, rules);
      expect(result.isValid).toBe(true);
    });
  });

  it('stops at the first failing rule', () => {
    const rules: ValidationRule[] = [
      { type: 'includes', patterns: ['MISSING'], message: 'First failure' },
      { type: 'includes', patterns: ['ALSO_MISSING'], message: 'Second failure' },
    ];
    const result = validateCodeWithFeedback(sampleCode, rules);
    expect(result.isValid).toBe(false);
    expect(result.feedback).toBe('First failure');
  });

  it('passes with empty rules array', () => {
    const result = validateCodeWithFeedback('any code', []);
    expect(result.isValid).toBe(true);
    expect(result.feedback).toBe('');
  });
});
