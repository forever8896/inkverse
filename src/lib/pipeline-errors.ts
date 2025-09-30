/**
 * Minimal Pipeline Error Classification
 *
 * Internal utility for determining retry strategy.
 * Never exposed to public API - keeps service details private.
 */

export interface RetryDecision {
  canRetry: boolean;
  delayMs: number;
  reason: string; // Internal logging only
}

/**
 * Classify error and determine retry strategy
 * Internal use only - not exposed to public API
 */
export function isRetryableError(error: any, service: 'openai' | 'fal'): RetryDecision {
  // Network/infrastructure errors - usually transient
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
    return {
      canRetry: true,
      delayMs: 60000, // 1 minute
      reason: `Network error for ${service}: ${error.code}`
    };
  }

  // Service unavailable - usually maintenance or overload
  if (error.status === 503) {
    return {
      canRetry: true,
      delayMs: 300000, // 5 minutes
      reason: `${service} service unavailable (503)`
    };
  }

  // Rate limited - need to wait for quota reset
  if (error.status === 429) {
    return {
      canRetry: true,
      delayMs: 900000, // 15 minutes
      reason: `${service} rate limited (429)`
    };
  }

  // Timeout errors - service might be slow
  if (error.name === 'AbortError' || error.code === 'ETIMEDOUT') {
    return {
      canRetry: true,
      delayMs: 120000, // 2 minutes
      reason: `${service} timeout - may be experiencing high load`
    };
  }

  // Authentication errors - don't retry
  if (error.status === 401 || error.status === 403) {
    return {
      canRetry: false,
      delayMs: 0,
      reason: `${service} authentication error - requires manual intervention`
    };
  }

  // Client errors (400-499 except rate limits) - usually permanent
  if (error.status >= 400 && error.status < 500) {
    return {
      canRetry: false,
      delayMs: 0,
      reason: `${service} client error (${error.status}) - likely permanent`
    };
  }

  // Unknown errors - be conservative and don't retry
  return {
    canRetry: false,
    delayMs: 0,
    reason: `Unknown error from ${service}: ${error.message || 'No details'}`
  };
}

/**
 * Calculate exponential backoff delay based on retry count
 */
export function calculateBackoffDelay(baseDelayMs: number, retryCount: number): number {
  // Exponential backoff: baseDelay * 2^retryCount, with jitter
  const exponentialDelay = baseDelayMs * Math.pow(2, retryCount);

  // Add 10% jitter to prevent thundering herd
  const jitter = exponentialDelay * 0.1 * Math.random();

  // Cap at 1 hour maximum
  const maxDelay = 60 * 60 * 1000; // 1 hour

  return Math.min(exponentialDelay + jitter, maxDelay);
}