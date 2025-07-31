import { describe, it, expect } from 'vitest';
import { validateCode } from './lessons';

describe('validateCode', () => {
  it('should return true for valid code', () => {
    const code = 'hello world';
    const rules = [{ type: 'includes' as const, patterns: ['hello'] }];

    expect(validateCode(code, rules)).toBe(true);
  });
});
