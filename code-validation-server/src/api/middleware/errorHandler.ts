/**
 * Error Handling Middleware
 *
 * Centralized error handling with:
 * - Consistent error response format
 * - Logging
 * - No sensitive information leakage
 */

import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

/**
 * Custom error class with status code
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Not Found handler (404)
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    code: 'NOT_FOUND',
    message: `The requested resource ${req.path} was not found`,
  });
}

/**
 * Global error handler
 */
export const globalErrorHandler: ErrorRequestHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error for debugging
  console.error('[Error]', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle known API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
    return;
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'Invalid JSON',
      code: 'INVALID_JSON',
      message: 'The request body contains invalid JSON',
    });
    return;
  }

  // Handle payload too large
  if (err.name === 'PayloadTooLargeError') {
    res.status(413).json({
      error: 'Payload Too Large',
      code: 'PAYLOAD_TOO_LARGE',
      message: 'The request body exceeds the maximum allowed size',
    });
    return;
  }

  // Default: Internal Server Error
  // Don't leak error details in production
  res.status(500).json({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred',
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
