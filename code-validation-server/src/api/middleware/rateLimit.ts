/**
 * Rate Limiting Middleware
 *
 * Protects the API from abuse with:
 * - General rate limit for all endpoints
 * - Stricter limit for compilation endpoints
 * - User-friendly error messages
 */

import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { getConfig } from '../../config.js';

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
export function createApiRateLimiter() {
  const config = getConfig();

  return rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(config.rateLimitWindowMs / 1000),
    },
    keyGenerator: (req: Request) => {
      // Use X-Forwarded-For in production (behind proxy)
      return (
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        req.ip ||
        'unknown'
      );
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/v2/health';
    },
  });
}

/**
 * Compilation rate limiter
 * 10 compilation requests per minute per IP (more expensive operation)
 */
export function createCompileRateLimiter() {
  const config = getConfig();

  return rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.compileRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Compilation rate limit exceeded. Please wait before submitting more code.',
      code: 'COMPILE_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(config.rateLimitWindowMs / 1000),
    },
    keyGenerator: (req: Request) => {
      return (
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        req.ip ||
        'unknown'
      );
    },
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        error: 'Compilation rate limit exceeded',
        code: 'COMPILE_RATE_LIMIT_EXCEEDED',
        message:
          'You have submitted too many compilation requests. Please wait a minute before trying again.',
        retryAfter: Math.ceil(config.rateLimitWindowMs / 1000),
      });
    },
  });
}
