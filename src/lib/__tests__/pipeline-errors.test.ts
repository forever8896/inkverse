import { describe, it, expect } from 'vitest';
import { isRetryableError, calculateBackoffDelay } from '../pipeline-errors';

// =============================================================================
// isRetryableError
// =============================================================================

describe('isRetryableError', () => {
  describe('network errors', () => {
    it('retries ENOTFOUND with 1 minute delay', () => {
      const result = isRetryableError({ code: 'ENOTFOUND' }, 'openai');
      expect(result.canRetry).toBe(true);
      expect(result.delayMs).toBe(60000);
      expect(result.reason).toContain('Network');
    });

    it('retries ECONNRESET with 1 minute delay', () => {
      const result = isRetryableError({ code: 'ECONNRESET' }, 'fal');
      expect(result.canRetry).toBe(true);
      expect(result.delayMs).toBe(60000);
      expect(result.reason).toContain('fal');
    });
  });

  describe('service unavailable (503)', () => {
    it('retries with 5 minute delay', () => {
      const result = isRetryableError({ status: 503 }, 'openai');
      expect(result.canRetry).toBe(true);
      expect(result.delayMs).toBe(300000);
      expect(result.reason).toContain('503');
    });
  });

  describe('rate limiting (429)', () => {
    it('retries with 15 minute delay', () => {
      const result = isRetryableError({ status: 429 }, 'openai');
      expect(result.canRetry).toBe(true);
      expect(result.delayMs).toBe(900000);
      expect(result.reason).toContain('rate limited');
    });
  });

  describe('timeout errors', () => {
    it('retries AbortError with 2 minute delay', () => {
      const result = isRetryableError({ name: 'AbortError' }, 'fal');
      expect(result.canRetry).toBe(true);
      expect(result.delayMs).toBe(120000);
      expect(result.reason).toContain('timeout');
    });

    it('retries ETIMEDOUT with 2 minute delay', () => {
      const result = isRetryableError({ code: 'ETIMEDOUT' }, 'openai');
      expect(result.canRetry).toBe(true);
      expect(result.delayMs).toBe(120000);
    });
  });

  describe('authentication errors (do not retry)', () => {
    it('does not retry 401', () => {
      const result = isRetryableError({ status: 401 }, 'openai');
      expect(result.canRetry).toBe(false);
      expect(result.delayMs).toBe(0);
      expect(result.reason).toContain('authentication');
    });

    it('does not retry 403', () => {
      const result = isRetryableError({ status: 403 }, 'fal');
      expect(result.canRetry).toBe(false);
      expect(result.delayMs).toBe(0);
    });
  });

  describe('client errors (do not retry)', () => {
    it('does not retry 400', () => {
      const result = isRetryableError({ status: 400 }, 'openai');
      expect(result.canRetry).toBe(false);
      expect(result.reason).toContain('client error');
    });

    it('does not retry 404', () => {
      const result = isRetryableError({ status: 404 }, 'fal');
      expect(result.canRetry).toBe(false);
    });

    it('does not retry 422', () => {
      const result = isRetryableError({ status: 422 }, 'openai');
      expect(result.canRetry).toBe(false);
    });
  });

  describe('unknown errors', () => {
    it('does not retry errors with no recognizable properties', () => {
      const result = isRetryableError({ message: 'something weird' }, 'openai');
      expect(result.canRetry).toBe(false);
      expect(result.reason).toContain('Unknown');
    });

    it('includes error message in reason', () => {
      const result = isRetryableError({ message: 'custom error msg' }, 'fal');
      expect(result.reason).toContain('custom error msg');
    });

    it('handles error with no message', () => {
      const result = isRetryableError({}, 'openai');
      expect(result.canRetry).toBe(false);
      expect(result.reason).toContain('No details');
    });
  });

  describe('service name in reasons', () => {
    it('includes openai in reason text', () => {
      const result = isRetryableError({ status: 503 }, 'openai');
      expect(result.reason).toContain('openai');
    });

    it('includes fal in reason text', () => {
      const result = isRetryableError({ status: 503 }, 'fal');
      expect(result.reason).toContain('fal');
    });
  });
});

// =============================================================================
// calculateBackoffDelay
// =============================================================================

describe('calculateBackoffDelay', () => {
  it('returns base delay for retry 0 (plus jitter)', () => {
    const delay = calculateBackoffDelay(1000, 0);
    // Base: 1000 * 2^0 = 1000, jitter up to 10% = 1000-1100
    expect(delay).toBeGreaterThanOrEqual(1000);
    expect(delay).toBeLessThanOrEqual(1100);
  });

  it('doubles delay for each retry', () => {
    // Use 0 jitter by checking the minimum bound
    const delay0 = calculateBackoffDelay(1000, 0);
    const delay1 = calculateBackoffDelay(1000, 1);
    const delay2 = calculateBackoffDelay(1000, 2);

    // delay1 should be roughly 2x delay0 (accounting for jitter)
    expect(delay1).toBeGreaterThanOrEqual(2000);
    expect(delay2).toBeGreaterThanOrEqual(4000);
  });

  it('caps at 1 hour maximum', () => {
    const delay = calculateBackoffDelay(60000, 10); // Would be 60000 * 1024 without cap
    const oneHour = 60 * 60 * 1000;
    expect(delay).toBeLessThanOrEqual(oneHour);
  });

  it('handles very small base delays', () => {
    const delay = calculateBackoffDelay(100, 3);
    // 100 * 2^3 = 800, jitter up to 80
    expect(delay).toBeGreaterThanOrEqual(800);
    expect(delay).toBeLessThanOrEqual(880);
  });

  it('handles zero base delay', () => {
    const delay = calculateBackoffDelay(0, 5);
    expect(delay).toBe(0);
  });
});
