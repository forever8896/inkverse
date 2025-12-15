/**
 * Compilation Check Routes
 *
 * Endpoints for submitting and monitoring ink! contract compilation jobs.
 */

import { Router, Request, Response } from 'express';
import {
  getCompilationQueue,
  getQueueEvents,
  getEstimatedWaitTime,
} from '../../queue/index.js';
import {
  validateCheckRequest,
  validateJobId,
} from '../middleware/validation.js';
import { createCompileRateLimiter } from '../middleware/rateLimit.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import type { CompilationJobData, JobStatusResponse } from '../../types/index.js';

const router = Router();
const compileRateLimiter = createCompileRateLimiter();

// ============================================================================
// POST /api/v2/check - Submit compilation job
// ============================================================================

router.post(
  '/',
  compileRateLimiter,
  validateCheckRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const code = req.validatedCode!;
    const queue = getCompilationQueue();

    // Create job data
    const jobData: CompilationJobData = {
      code,
      timestamp: Date.now(),
      clientIp:
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip,
    };

    // Add to queue
    const job = await queue.add('check', jobData, {
      priority: 1, // Normal priority
    });

    // Get estimated wait time
    const estimatedWait = await getEstimatedWaitTime();

    res.status(202).json({
      jobId: job.id,
      status: 'queued',
      estimatedWait,
      message: 'Compilation job queued successfully',
    });
  })
);

// ============================================================================
// GET /api/v2/check/:jobId - Get job status
// ============================================================================

router.get(
  '/:jobId',
  validateJobId,
  asyncHandler(async (req: Request, res: Response) => {
    const jobId = req.jobId!;
    const queue = getCompilationQueue();

    const job = await queue.getJob(jobId);

    if (!job) {
      throw new ApiError(404, 'JOB_NOT_FOUND', 'Job not found');
    }

    const state = await job.getState();
    const progress =
      typeof job.progress === 'number' ? job.progress : (job.progress as { progress?: number })?.progress || 0;

    const response: JobStatusResponse = {
      jobId: job.id!,
      status: state as JobStatusResponse['status'],
      progress,
      result: state === 'completed' ? job.returnvalue : null,
      error: state === 'failed' ? job.failedReason || 'Unknown error' : null,
      createdAt: new Date(job.timestamp).toISOString(),
      startedAt: job.processedOn
        ? new Date(job.processedOn).toISOString()
        : null,
      completedAt: job.finishedOn
        ? new Date(job.finishedOn).toISOString()
        : null,
    };

    res.json(response);
  })
);

// ============================================================================
// GET /api/v2/check/:jobId/stream - Stream job output via SSE
// ============================================================================

router.get(
  '/:jobId/stream',
  validateJobId,
  asyncHandler(async (req: Request, res: Response) => {
    const jobId = req.jobId!;
    const queue = getCompilationQueue();
    const queueEvents = getQueueEvents();

    const job = await queue.getJob(jobId);

    if (!job) {
      throw new ApiError(404, 'JOB_NOT_FOUND', 'Job not found');
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send initial status
    const initialState = await job.getState();
    res.write(`event: status\n`);
    res.write(
      `data: ${JSON.stringify({ jobId, status: initialState })}\n\n`
    );

    // If already completed/failed, send result and close
    if (initialState === 'completed') {
      res.write(`event: completed\n`);
      res.write(`data: ${JSON.stringify({ jobId, result: job.returnvalue })}\n\n`);
      res.end();
      return;
    }

    if (initialState === 'failed') {
      res.write(`event: failed\n`);
      res.write(
        `data: ${JSON.stringify({ jobId, error: job.failedReason })}\n\n`
      );
      res.end();
      return;
    }

    // Set up event listeners
    const onCompleted = ({
      jobId: completedJobId,
      returnvalue,
    }: {
      jobId: string;
      returnvalue: unknown;
    }) => {
      if (completedJobId === jobId) {
        res.write(`event: completed\n`);
        res.write(`data: ${JSON.stringify({ jobId, result: returnvalue })}\n\n`);
        cleanup();
        res.end();
      }
    };

    const onFailed = ({
      jobId: failedJobId,
      failedReason,
    }: {
      jobId: string;
      failedReason: string;
    }) => {
      if (failedJobId === jobId) {
        res.write(`event: failed\n`);
        res.write(`data: ${JSON.stringify({ jobId, error: failedReason })}\n\n`);
        cleanup();
        res.end();
      }
    };

    const onProgress = ({
      jobId: progressJobId,
      data,
    }: {
      jobId: string;
      data: unknown;
    }) => {
      if (progressJobId === jobId) {
        res.write(`event: progress\n`);
        res.write(`data: ${JSON.stringify({ jobId, progress: data })}\n\n`);
      }
    };

    // Subscribe to events
    queueEvents.on('completed', onCompleted);
    queueEvents.on('failed', onFailed);
    queueEvents.on('progress', onProgress);

    // Cleanup function
    const cleanup = () => {
      queueEvents.off('completed', onCompleted);
      queueEvents.off('failed', onFailed);
      queueEvents.off('progress', onProgress);
    };

    // Handle client disconnect
    req.on('close', () => {
      cleanup();
    });

    // Send heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(`:heartbeat\n\n`);
    }, 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
    });
  })
);

export default router;
