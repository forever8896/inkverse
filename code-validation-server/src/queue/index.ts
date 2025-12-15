/**
 * BullMQ Queue Configuration
 *
 * Redis-backed job queue for compilation jobs with:
 * - Persistent storage (survives restarts)
 * - Retry logic with exponential backoff
 * - Job prioritization
 * - Metrics and monitoring
 */

import { Queue, QueueEvents, type ConnectionOptions } from 'bullmq';
import { Redis } from 'ioredis';
import type { CompilationJobData, CompilationResult } from '../types/index.js';
import { getConfig } from '../config.js';

// ============================================================================
// Redis Connection
// ============================================================================

let redisConnection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!redisConnection) {
    const config = getConfig();
    redisConnection = new Redis(config.redisUrl, {
      maxRetriesPerRequest: null, // Required for BullMQ
      retryStrategy: (times: number) => {
        if (times > 10) return null; // Stop retrying after 10 attempts
        return Math.min(times * 100, 3000); // Exponential backoff, max 3s
      },
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisConnection.on('error', (err: Error) => {
      console.error('[Redis] Connection error:', err.message);
    });

    redisConnection.on('connect', () => {
      console.log('[Redis] Connected');
    });

    redisConnection.on('ready', () => {
      console.log('[Redis] Ready');
    });
  }

  return redisConnection;
}

export function getConnectionOptions(): ConnectionOptions {
  return getRedisConnection() as unknown as ConnectionOptions;
}

// ============================================================================
// Compilation Queue
// ============================================================================

let compilationQueue: Queue<CompilationJobData, CompilationResult> | null =
  null;

export function getCompilationQueue(): Queue<
  CompilationJobData,
  CompilationResult
> {
  if (!compilationQueue) {
    compilationQueue = new Queue<CompilationJobData, CompilationResult>(
      'ink-compilation',
      {
        connection: getConnectionOptions(),
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 1000, // Keep max 1000 completed jobs
          },
          removeOnFail: {
            age: 86400, // Keep failed jobs for 24 hours
          },
        },
      }
    );
  }

  return compilationQueue;
}

// ============================================================================
// Queue Events (for SSE streaming)
// ============================================================================

let queueEvents: QueueEvents | null = null;

export function getQueueEvents(): QueueEvents {
  if (!queueEvents) {
    queueEvents = new QueueEvents('ink-compilation', {
      connection: getConnectionOptions(),
    });

    queueEvents.on('completed', ({ jobId }) => {
      console.log(`[Queue] Job ${jobId} completed`);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`[Queue] Job ${jobId} failed:`, failedReason);
    });

    queueEvents.on('progress', ({ jobId }) => {
      // Progress events for SSE streaming (logged for debugging)
      console.log(`[Queue] Job ${jobId} progress update`);
    });
  }

  return queueEvents;
}

// ============================================================================
// Queue Metrics
// ============================================================================

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export async function getQueueMetrics(): Promise<QueueMetrics> {
  const queue = getCompilationQueue();

  const [waiting, active, completed, failed, delayed, paused] =
    await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused().then((p) => (p ? 1 : 0)),
    ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    paused,
  };
}

/**
 * Estimate wait time based on queue depth and average processing time
 */
export async function getEstimatedWaitTime(): Promise<number | null> {
  try {
    const metrics = await getQueueMetrics();
    const queueDepth = metrics.waiting + metrics.active;

    // Assume average 30s per compilation (warm cache)
    const avgTimePerJob = 30;

    // Assume 2 concurrent workers
    const concurrency = getConfig().workerConcurrency;

    if (queueDepth === 0) return 0;

    return Math.ceil((queueDepth * avgTimePerJob) / concurrency);
  } catch {
    return null;
  }
}

// ============================================================================
// Health Check
// ============================================================================

export async function checkRedisHealth(): Promise<{
  connected: boolean;
  latency?: number;
}> {
  try {
    const redis = getRedisConnection();
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;

    return { connected: true, latency };
  } catch {
    return { connected: false };
  }
}

// ============================================================================
// Cleanup
// ============================================================================

export async function closeConnections(): Promise<void> {
  if (queueEvents) {
    await queueEvents.close();
    queueEvents = null;
  }

  if (compilationQueue) {
    await compilationQueue.close();
    compilationQueue = null;
  }

  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }

  console.log('[Queue] All connections closed');
}
