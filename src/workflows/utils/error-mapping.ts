/**
 * Error mapping utilities for Workflow integration
 * Maps existing ERROR_HANDLERS to Workflow FatalError and RetryableError types
 */

import { FatalError, RetryableError } from 'workflow';
import { ERROR_HANDLERS, type ErrorType, type GenerationStatus } from '@/lib/generation-job';

/**
 * Map service error codes to Workflow error types
 * Returns FatalError for non-retryable errors, RetryableError for retryable errors
 */
export function mapServiceErrorToWorkflowError(
  errorCode: ErrorType,
  technicalMessage: string
): FatalError | RetryableError {
  const handler = ERROR_HANDLERS[errorCode];

  if (!handler) {
    // Unknown error - default to retryable with exponential backoff
    return new RetryableError(technicalMessage || 'Unknown error occurred', {
      retryAfter: 60 * 1000 // 60 seconds
    });
  }

  if (!handler.retryable) {
    // Fatal errors - no retry
    return new FatalError(handler.userMessage);
  }

  // Retryable errors - convert delay from seconds to milliseconds
  return new RetryableError(handler.userMessage, {
    retryAfter: handler.suggestedRetryDelay * 1000
  });
}

/**
 * Get retry status name based on which step is retrying
 */
export function getRetryStatus(stepName: string): GenerationStatus {
  switch (stepName) {
    case 'generateImage':
      return 'image_generation_retrying';
    case 'convert3D':
      return 'conversion_retrying';
    case 'mintNFT':
      return 'nft_minting_retrying';
    default:
      return 'image_generation_retrying';
  }
}

/**
 * Get failed status name based on which step failed permanently
 */
export function getFailedStatus(stepName: string): GenerationStatus {
  switch (stepName) {
    case 'generateImage':
      return 'image_generation_failed';
    case 'convert3D':
      return 'conversion_failed';
    case 'mintNFT':
      return 'nft_minting_failed';
    case 'checkNFTPrerequisites':
      return 'prerequisites_failed';
    default:
      return 'failed_permanent';
  }
}

// NOTE: calculateBackoffDelay was removed - use @/lib/pipeline-errors if needed
