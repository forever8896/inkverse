/**
 * Error Type Utilities
 *
 * Provides type-safe error handling patterns to replace `any` in catch blocks.
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   console.error('Operation failed:', message);
 * }
 * ```
 */

/**
 * Standard error with message property.
 */
export interface ErrorWithMessage {
  message: string;
}

/**
 * Error with optional code property (common in API errors).
 */
export interface CodedError extends ErrorWithMessage {
  code?: string;
}

/**
 * Type guard to check if value is an Error object.
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if value has a message property.
 */
export function isErrorWithMessage(value: unknown): value is ErrorWithMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as Record<string, unknown>).message === 'string'
  );
}

/**
 * Type guard to check if value has a code property.
 */
export function hasErrorCode(value: unknown): value is CodedError {
  return (
    isErrorWithMessage(value) &&
    'code' in value &&
    typeof (value as Record<string, unknown>).code === 'string'
  );
}

/**
 * Extract error message from unknown caught value.
 *
 * Safely extracts a string message from any caught error,
 * handling Error objects, objects with message property,
 * strings, and unknown values.
 *
 * @param error - Unknown caught value
 * @param fallback - Fallback message if extraction fails
 * @returns Error message string
 *
 * @example
 * ```typescript
 * catch (error) {
 *   const message = getErrorMessage(error);
 *   return errorResponse(message, 500);
 * }
 * ```
 */
export function getErrorMessage(
  error: unknown,
  fallback: string = 'An unexpected error occurred'
): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}

/**
 * Extract error code from unknown caught value.
 *
 * @param error - Unknown caught value
 * @returns Error code or undefined
 */
export function getErrorCode(error: unknown): string | undefined {
  if (hasErrorCode(error)) {
    return error.code;
  }
  return undefined;
}

/**
 * Log error with consistent formatting.
 *
 * @param context - Context string for the error (e.g., function name)
 * @param error - Unknown caught value
 */
export function logError(context: string, error: unknown): void {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);

  if (code) {
    console.error(`[${context}] Error (${code}): ${message}`);
  } else {
    console.error(`[${context}] Error: ${message}`);
  }

  // Log stack trace if available
  if (isError(error) && error.stack) {
    console.error(error.stack);
  }
}
