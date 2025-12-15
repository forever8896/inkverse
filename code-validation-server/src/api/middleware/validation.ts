/**
 * Request Validation Middleware
 *
 * Validates incoming requests and attaches validated data to the request object.
 */

import type { Request, Response, NextFunction } from 'express';
import { validateContractCode, quickValidate } from '../../validators/contract.js';

/**
 * Validate compilation request body
 */
export function validateCheckRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { code } = req.body;

  // Quick validation first (cheap)
  if (!quickValidate(code)) {
    res.status(400).json({
      error: 'Invalid request',
      code: 'INVALID_CODE',
      message: 'Code must be a non-empty string containing an ink! contract',
    });
    return;
  }

  // Full validation (more expensive)
  const result = validateContractCode(code);

  if (!result.valid) {
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      message: result.error,
    });
    return;
  }

  // Attach validated code to request
  req.validatedCode = result.sanitized;

  next();
}

/**
 * Validate job ID parameter
 */
export function validateJobId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { jobId } = req.params;

  if (!jobId || typeof jobId !== 'string') {
    res.status(400).json({
      error: 'Invalid job ID',
      code: 'INVALID_JOB_ID',
    });
    return;
  }

  // Basic format validation (BullMQ job IDs are typically numbers or UUIDs)
  if (!/^[\w-]+$/.test(jobId)) {
    res.status(400).json({
      error: 'Invalid job ID format',
      code: 'INVALID_JOB_ID_FORMAT',
    });
    return;
  }

  req.jobId = jobId;
  next();
}

/**
 * Ensure JSON content type for POST requests
 */
export function requireJson(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.method === 'POST' && !req.is('application/json')) {
    res.status(415).json({
      error: 'Unsupported Media Type',
      code: 'INVALID_CONTENT_TYPE',
      message: 'Content-Type must be application/json',
    });
    return;
  }

  next();
}
