/**
 * API Key Authentication Middleware
 *
 * Protects API routes with a simple API key.
 * If API_KEY is not set, authentication is disabled (open access).
 */

import type { Request, Response, NextFunction } from 'express';
import { getConfig } from '../../config.js';

/**
 * Middleware that requires a valid API key in the Authorization header.
 * Expects: Authorization: Bearer <api-key>
 *
 * If API_KEY env var is not set, this middleware passes through (no auth required).
 */
export function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const config = getConfig();

  // If no API key configured, skip authentication
  if (!config.apiKey) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'Missing Authorization header',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  // Expect "Bearer <token>" format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    res.status(401).json({
      error: 'Invalid Authorization header format. Expected: Bearer <api-key>',
      code: 'AUTH_INVALID_FORMAT',
    });
    return;
  }

  const providedKey = parts[1];

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(providedKey, config.apiKey)) {
    res.status(403).json({
      error: 'Invalid API key',
      code: 'AUTH_INVALID_KEY',
    });
    return;
  }

  next();
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
