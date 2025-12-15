/**
 * Health Check Routes
 *
 * Endpoints for monitoring server health and status.
 */

import { Router, Request, Response } from 'express';
import { getQueueMetrics, checkRedisHealth } from '../../queue/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import type { HealthResponse } from '../../types/index.js';

const router = Router();

// Version from package.json
const VERSION = '2.0.0';

// ============================================================================
// GET /health - Simple health check
// ============================================================================

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: VERSION,
  });
});

// ============================================================================
// GET /api/v2/health - Detailed health check
// ============================================================================

router.get(
  '/detailed',
  asyncHandler(async (_req: Request, res: Response) => {
    const [queueMetrics, redisHealth] = await Promise.all([
      getQueueMetrics().catch(() => ({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
      })),
      checkRedisHealth(),
    ]);

    // Determine overall health status
    let status: HealthResponse['status'] = 'healthy';

    if (!redisHealth.connected) {
      status = 'unhealthy';
    } else if (queueMetrics.waiting > 50) {
      // Queue is backing up
      status = 'degraded';
    } else if (redisHealth.latency && redisHealth.latency > 100) {
      // High Redis latency
      status = 'degraded';
    }

    const response: HealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      version: VERSION,
      queue: {
        waiting: queueMetrics.waiting,
        active: queueMetrics.active,
        completed: queueMetrics.completed,
        failed: queueMetrics.failed,
      },
      redis: redisHealth,
    };

    // Return 503 if unhealthy (for load balancer health checks)
    const statusCode = status === 'unhealthy' ? 503 : 200;
    res.status(statusCode).json(response);
  })
);

// ============================================================================
// GET /api/v2/metrics - Prometheus-style metrics
// ============================================================================

router.get(
  '/metrics',
  asyncHandler(async (_req: Request, res: Response) => {
    const queueMetrics = await getQueueMetrics().catch(() => ({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: 0,
    }));

    const redisHealth = await checkRedisHealth();

    // Prometheus text format
    const lines = [
      '# HELP ink_checker_queue_jobs_waiting Number of jobs waiting in queue',
      '# TYPE ink_checker_queue_jobs_waiting gauge',
      `ink_checker_queue_jobs_waiting ${queueMetrics.waiting}`,
      '',
      '# HELP ink_checker_queue_jobs_active Number of jobs currently processing',
      '# TYPE ink_checker_queue_jobs_active gauge',
      `ink_checker_queue_jobs_active ${queueMetrics.active}`,
      '',
      '# HELP ink_checker_queue_jobs_completed_total Total number of completed jobs',
      '# TYPE ink_checker_queue_jobs_completed_total counter',
      `ink_checker_queue_jobs_completed_total ${queueMetrics.completed}`,
      '',
      '# HELP ink_checker_queue_jobs_failed_total Total number of failed jobs',
      '# TYPE ink_checker_queue_jobs_failed_total counter',
      `ink_checker_queue_jobs_failed_total ${queueMetrics.failed}`,
      '',
      '# HELP ink_checker_redis_connected Redis connection status',
      '# TYPE ink_checker_redis_connected gauge',
      `ink_checker_redis_connected ${redisHealth.connected ? 1 : 0}`,
      '',
      '# HELP ink_checker_redis_latency_ms Redis ping latency in milliseconds',
      '# TYPE ink_checker_redis_latency_ms gauge',
      `ink_checker_redis_latency_ms ${redisHealth.latency || 0}`,
    ];

    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(lines.join('\n'));
  })
);

export default router;
