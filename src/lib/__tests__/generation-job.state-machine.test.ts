/**
 * @file generation-job.state-machine.test.ts
 * @description Immaculate unit tests for the GenerationJob state machine
 *
 * Tests the ACTUAL GenerationJob class - not a reimplementation.
 * Focuses on: ERROR_HANDLERS config, canRetry(), getSecondsUntilRetry(), and state invariants.
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import {
  GenerationJob,
  ERROR_HANDLERS,
  type ErrorType,
  type GenerationStatus,
  type GenerationJobData
} from '../generation-job';
import { S3Service } from '../../services/s3-service';

// Mock S3Service to avoid environment variable requirements
vi.mock('../../services/s3-service', () => {
  return {
    S3Service: {
      getInstance: vi.fn(() => ({
        // Mock S3Service instance - not needed for state machine tests
      }))
    }
  };
});

// ============================================================================
// Mock Data Builders - Create realistic job data
// ============================================================================

function createMockJobData(overrides: Partial<GenerationJobData> = {}): GenerationJobData {
  return {
    id: 'test-job-123',
    userId: 'user-456',
    prompt: 'A cute fluffy monster',
    style: 'cute',
    stage: 'young',
    generationType: 'full',
    status: 'pending',
    progress: 0,
    totalCost: 0,
    retryCount: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    openaiTextTokens: 0,
    openaiImageTokens: 0,
    openaiTotalTokens: 0,
    openaiEstimatedCost: 0,
    falEstimatedCost: 0,
    costCalculationMethod: 'token_based',
    lastCostUpdate: new Date('2024-01-01T00:00:00Z'),
    lastUrlRefresh: new Date('2024-01-01T00:00:00Z'),
    ...overrides
  };
}

/**
 * Create a real GenerationJob instance with test data
 * This tests the ACTUAL implementation, not a mock
 */
function createRealJob(overrides: Partial<GenerationJobData> = {}): GenerationJob {
  const data = createMockJobData(overrides);
  return new GenerationJob(data);
}

// ============================================================================
// Test Suite: ERROR_HANDLERS Configuration Validation
// ============================================================================

describe('ERROR_HANDLERS Configuration', () => {
  describe('OpenAI Error Handlers', () => {
    it('should configure rate limiting with correct retry parameters', () => {
      const handler = ERROR_HANDLERS.openai_rate_limit;

      expect(handler.retryable).toBe(true);
      expect(handler.maxRetries).toBe(5);
      expect(handler.suggestedRetryDelay).toBe(30);
      expect(handler.userMessage).toContain('high demand');
      expect(handler.type).toBe('openai_rate_limit');
    });

    it('should configure invalid API key as permanently non-retryable', () => {
      const handler = ERROR_HANDLERS.openai_invalid_api_key;

      expect(handler.retryable).toBe(false);
      expect(handler.maxRetries).toBe(0);
      expect(handler.suggestedRetryDelay).toBe(0);
      expect(handler.userMessage).toContain('administrator');
    });

    it('should configure network timeout with short retry cycle', () => {
      const handler = ERROR_HANDLERS.openai_network_timeout;

      expect(handler.retryable).toBe(true);
      expect(handler.maxRetries).toBe(3);
      expect(handler.suggestedRetryDelay).toBe(15);
    });

    it('should configure content policy violation as non-retryable', () => {
      const handler = ERROR_HANDLERS.openai_content_policy;

      expect(handler.retryable).toBe(false);
      expect(handler.maxRetries).toBe(0);
      expect(handler.userMessage).toContain('family-friendly');
    });

    it('should configure insufficient quota as non-retryable', () => {
      const handler = ERROR_HANDLERS.openai_insufficient_quota;

      expect(handler.retryable).toBe(false);
      expect(handler.maxRetries).toBe(0);
      expect(handler.userMessage).toContain('top up');
    });

    it('should configure API error with reasonable retry limit', () => {
      const handler = ERROR_HANDLERS.openai_api_error;

      expect(handler.retryable).toBe(true);
      expect(handler.maxRetries).toBe(2);
      expect(handler.suggestedRetryDelay).toBe(120);
    });
  });

  describe('fal.ai Error Handlers', () => {
    it('should configure overload with highest retry count for resilience', () => {
      const handler = ERROR_HANDLERS.fal_overloaded;

      expect(handler.retryable).toBe(true);
      expect(handler.maxRetries).toBe(10);
      expect(handler.suggestedRetryDelay).toBe(120);
      expect(handler.userMessage).toContain('2 minutes');
    });

    it('should configure network timeout with generous retry limit', () => {
      const handler = ERROR_HANDLERS.fal_network_timeout;

      expect(handler.retryable).toBe(true);
      expect(handler.maxRetries).toBe(5);
      expect(handler.suggestedRetryDelay).toBe(60);
    });

    it('should configure API error with longest delay', () => {
      const handler = ERROR_HANDLERS.fal_api_error;

      expect(handler.retryable).toBe(true);
      expect(handler.maxRetries).toBe(3);
      expect(handler.suggestedRetryDelay).toBe(600);
    });

    it('should configure invalid credentials as non-retryable', () => {
      const handler = ERROR_HANDLERS.fal_invalid_api_key;

      expect(handler.retryable).toBe(false);
      expect(handler.maxRetries).toBe(0);
    });
  });

  describe('Infrastructure Error Handlers', () => {
    it('should configure S3 upload errors as retryable', () => {
      const handler = ERROR_HANDLERS.s3_upload_error;

      expect(handler.retryable).toBe(true);
      expect(handler.maxRetries).toBe(5);
      expect(handler.suggestedRetryDelay).toBe(10);
    });

    it('should configure S3 unavailable as non-retryable requiring intervention', () => {
      const handler = ERROR_HANDLERS.s3_storage_unavailable;

      expect(handler.retryable).toBe(false);
      expect(handler.maxRetries).toBe(0);
      expect(handler.userMessage).toContain('MinIO');
    });

    it('should configure database errors with minimal delay', () => {
      const handler = ERROR_HANDLERS.database_error;

      expect(handler.retryable).toBe(true);
      expect(handler.maxRetries).toBe(3);
      expect(handler.suggestedRetryDelay).toBe(5);
    });
  });

  describe('Unknown Error Handler', () => {
    it('should provide safe defaults for unknown errors', () => {
      const handler = ERROR_HANDLERS.unknown;

      expect(handler.retryable).toBe(true);
      expect(handler.maxRetries).toBe(2);
      expect(handler.suggestedRetryDelay).toBe(60);
    });
  });

  describe('Configuration Invariants', () => {
    it('should have consistent retry configuration for all error types', () => {
      Object.entries(ERROR_HANDLERS).forEach(([errorType, handler]) => {
        if (!handler.retryable) {
          expect(handler.maxRetries, `${errorType} should have 0 maxRetries`).toBe(0);
          expect(handler.suggestedRetryDelay, `${errorType} should have 0 delay`).toBe(0);
        } else {
          expect(handler.maxRetries, `${errorType} should have positive maxRetries`).toBeGreaterThan(0);
          expect(handler.suggestedRetryDelay, `${errorType} should have positive delay`).toBeGreaterThan(0);
        }
      });
    });

    it('should provide user messages for all error types', () => {
      Object.entries(ERROR_HANDLERS).forEach(([errorType, handler]) => {
        expect(handler.userMessage, `${errorType} missing user message`).toBeTruthy();
        expect(handler.userMessage.length, `${errorType} has empty message`).toBeGreaterThan(0);
      });
    });

    it('should have handler for every expected error type', () => {
      const expectedTypes: ErrorType[] = [
        'openai_rate_limit',
        'openai_invalid_api_key',
        'openai_insufficient_quota',
        'openai_content_policy',
        'openai_network_timeout',
        'openai_api_error',
        'fal_overloaded',
        'fal_invalid_api_key',
        'fal_insufficient_quota',
        'fal_network_timeout',
        'fal_api_error',
        'database_error',
        's3_upload_error',
        's3_storage_unavailable',
        'unknown'
      ];

      expectedTypes.forEach(errorType => {
        expect(ERROR_HANDLERS[errorType], `Missing handler for ${errorType}`).toBeDefined();
      });
    });
  });
});

// ============================================================================
// Test Suite: GenerationJob.canRetry() - REAL Implementation
// ============================================================================

describe('GenerationJob.canRetry() - Real Implementation', () => {
  describe('Status-Based Eligibility', () => {
    it('should allow retry for image_generation_failed status', () => {
      const job = createRealJob({
        status: 'image_generation_failed',
        retryCount: 0,
        lastError: {
          type: 'openai_rate_limit',
          retryable: true,
          maxRetries: 5,
          currentRetries: 0,
          lastRetryAt: new Date(),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 30
        }
      });

      expect(job.canRetry()).toBe(true);
    });

    it('should allow retry for conversion_failed status', () => {
      const job = createRealJob({
        status: 'conversion_failed',
        retryCount: 0,
        lastError: {
          type: 'fal_overloaded',
          retryable: true,
          maxRetries: 10,
          currentRetries: 0,
          lastRetryAt: new Date(),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 120
        }
      });

      expect(job.canRetry()).toBe(true);
    });

    it('should allow retry for image_generation_retrying status', () => {
      const job = createRealJob({
        status: 'image_generation_retrying',
        retryCount: 2,
        lastError: {
          type: 'openai_rate_limit',
          retryable: true,
          maxRetries: 5,
          currentRetries: 2,
          lastRetryAt: new Date(),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 30
        }
      });

      expect(job.canRetry()).toBe(true);
    });

    it('should NOT allow retry for pending status', () => {
      const job = createRealJob({
        status: 'pending',
        lastError: {
          type: 'openai_rate_limit',
          retryable: true,
          maxRetries: 5,
          currentRetries: 0,
          lastRetryAt: new Date(),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 30
        }
      });

      expect(job.canRetry()).toBe(false);
    });

    it('should NOT allow retry for completed status', () => {
      const job = createRealJob({
        status: 'completed',
        lastError: {
          type: 'openai_rate_limit',
          retryable: true,
          maxRetries: 5,
          currentRetries: 0,
          lastRetryAt: new Date(),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 30
        }
      });

      expect(job.canRetry()).toBe(false);
    });

    it('should NOT allow retry for generating_image status', () => {
      const job = createRealJob({
        status: 'generating_image',
        lastError: {
          type: 'openai_rate_limit',
          retryable: true,
          maxRetries: 5,
          currentRetries: 0,
          lastRetryAt: new Date(),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 30
        }
      });

      expect(job.canRetry()).toBe(false);
    });
  });

  describe('Error Retryability', () => {
    it('should NOT retry if error is not retryable', () => {
      const job = createRealJob({
        status: 'image_generation_failed',
        retryCount: 0,
        lastError: {
          type: 'openai_content_policy',
          retryable: false,
          maxRetries: 0,
          currentRetries: 0,
          lastRetryAt: new Date(),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 0
        }
      });

      expect(job.canRetry()).toBe(false);
    });

    it('should NOT retry if lastError is undefined', () => {
      const job = createRealJob({
        status: 'image_generation_failed',
        retryCount: 0,
        lastError: undefined
      });

      expect(job.canRetry()).toBe(false);
    });
  });

  describe('Retry Limit Enforcement', () => {
    it('should allow retry when under limit', () => {
      const job = createRealJob({
        status: 'image_generation_retrying',
        retryCount: 4,
        lastError: {
          type: 'openai_rate_limit',
          retryable: true,
          maxRetries: 5,
          currentRetries: 4,
          lastRetryAt: new Date(),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 30
        }
      });

      expect(job.canRetry()).toBe(true);
    });

    it('should NOT allow retry when at limit', () => {
      const job = createRealJob({
        status: 'image_generation_retrying',
        retryCount: 5,
        lastError: {
          type: 'openai_rate_limit',
          retryable: true,
          maxRetries: 5,
          currentRetries: 5,
          lastRetryAt: new Date(),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 30
        }
      });

      expect(job.canRetry()).toBe(false);
    });

    it('should NOT allow retry when over limit', () => {
      const job = createRealJob({
        status: 'image_generation_retrying',
        retryCount: 6,
        lastError: {
          type: 'openai_rate_limit',
          retryable: true,
          maxRetries: 5,
          currentRetries: 6,
          lastRetryAt: new Date(),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 30
        }
      });

      expect(job.canRetry()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle retryCount of 0 correctly', () => {
      const job = createRealJob({
        status: 'image_generation_failed',
        retryCount: 0,
        lastError: {
          type: 'openai_rate_limit',
          retryable: true,
          maxRetries: 5,
          currentRetries: 0,
          lastRetryAt: new Date(),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 30
        }
      });

      expect(job.canRetry()).toBe(true);
    });
  });
});

// ============================================================================
// Test Suite: GenerationJob.getSecondsUntilRetry() - REAL Implementation
// ============================================================================

describe('GenerationJob.getSecondsUntilRetry() - Real Implementation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Delay Calculation', () => {
    it('should return full delay immediately after error', () => {
      const job = createRealJob({
        status: 'image_generation_retrying',
        lastError: {
          type: 'openai_rate_limit',
          retryable: true,
          maxRetries: 5,
          currentRetries: 1,
          lastRetryAt: new Date('2024-01-01T12:00:00Z'),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 30
        }
      });

      expect(job.getSecondsUntilRetry()).toBe(30);
    });

    it('should return remaining delay after partial wait', () => {
      const job = createRealJob({
        status: 'image_generation_retrying',
        lastError: {
          type: 'openai_rate_limit',
          retryable: true,
          maxRetries: 5,
          currentRetries: 1,
          lastRetryAt: new Date('2024-01-01T11:59:50Z'),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 30
        }
      });

      expect(job.getSecondsUntilRetry()).toBe(20);
    });

    it('should return 0 when delay period has fully elapsed', () => {
      const job = createRealJob({
        status: 'image_generation_retrying',
        lastError: {
          type: 'openai_rate_limit',
          retryable: true,
          maxRetries: 5,
          currentRetries: 1,
          lastRetryAt: new Date('2024-01-01T11:59:29Z'),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 30
        }
      });

      expect(job.getSecondsUntilRetry()).toBe(0);
    });

    it('should never return negative values even if way past delay', () => {
      const job = createRealJob({
        status: 'image_generation_retrying',
        lastError: {
          type: 'openai_rate_limit',
          retryable: true,
          maxRetries: 5,
          currentRetries: 1,
          lastRetryAt: new Date('2024-01-01T10:00:00Z'),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 30
        }
      });

      const result = job.getSecondsUntilRetry();
      expect(result).toBe(0);
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Different Delay Periods', () => {
    it('should handle short delays (5s for database errors)', () => {
      const job = createRealJob({
        status: 'image_generation_retrying',
        lastError: {
          type: 'database_error',
          retryable: true,
          maxRetries: 3,
          currentRetries: 1,
          lastRetryAt: new Date('2024-01-01T12:00:00Z'),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 5
        }
      });

      expect(job.getSecondsUntilRetry()).toBe(5);
    });

    it('should handle long delays (600s for fal API errors)', () => {
      const job = createRealJob({
        status: 'conversion_retrying',
        lastError: {
          type: 'fal_api_error',
          retryable: true,
          maxRetries: 3,
          currentRetries: 1,
          lastRetryAt: new Date('2024-01-01T12:00:00Z'),
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 600
        }
      });

      expect(job.getSecondsUntilRetry()).toBe(600);
    });
  });

  describe('Edge Cases', () => {
    it('should return 0 when lastError is undefined', () => {
      const job = createRealJob({
        status: 'image_generation_failed',
        lastError: undefined
      });

      expect(job.getSecondsUntilRetry()).toBe(0);
    });

    it('should return 0 when lastRetryAt is undefined', () => {
      const job = createRealJob({
        status: 'image_generation_retrying',
        lastError: {
          type: 'openai_rate_limit',
          retryable: true,
          maxRetries: 5,
          currentRetries: 1,
          lastRetryAt: undefined,
          userMessage: 'Test',
          technicalMessage: 'Test',
          suggestedRetryDelay: 30
        }
      });

      expect(job.getSecondsUntilRetry()).toBe(0);
    });
  });
});

// ============================================================================
// Test Suite: State Machine Logic Integration
// ============================================================================

describe('State Machine Logic Integration', () => {
  it('should prevent retry for non-retryable errors regardless of status', () => {
    const nonRetryableErrors: ErrorType[] = [
      'openai_invalid_api_key',
      'openai_insufficient_quota',
      'openai_content_policy',
      'fal_invalid_api_key',
      'fal_insufficient_quota',
      's3_storage_unavailable'
    ];

    nonRetryableErrors.forEach(errorType => {
      const job = createRealJob({
        status: 'image_generation_failed',
        retryCount: 0,
        lastError: {
          type: errorType,
          retryable: ERROR_HANDLERS[errorType].retryable,
          maxRetries: ERROR_HANDLERS[errorType].maxRetries,
          currentRetries: 0,
          lastRetryAt: new Date(),
          userMessage: ERROR_HANDLERS[errorType].userMessage,
          technicalMessage: 'Test',
          suggestedRetryDelay: ERROR_HANDLERS[errorType].suggestedRetryDelay
        }
      });

      expect(job.canRetry(), `${errorType} should not be retryable`).toBe(false);
    });
  });

  it('should respect retry limits for high-retry-count errors', () => {
    const job = createRealJob({
      status: 'conversion_retrying',
      retryCount: 9,
      lastError: {
        type: 'fal_overloaded',
        retryable: true,
        maxRetries: 10,
        currentRetries: 9,
        lastRetryAt: new Date(),
        userMessage: 'Test',
        technicalMessage: 'Test',
        suggestedRetryDelay: 120
      }
    });

    expect(job.canRetry()).toBe(true);

    // Directly modify the internal data to test boundary
    job['data'].retryCount = 10;
    job['data'].lastError!.currentRetries = 10;

    expect(job.canRetry()).toBe(false);
  });
});
