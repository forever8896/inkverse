/**
 * ink! Contract Checker Server
 *
 * Production-grade server for validating ink! smart contract code.
 * Uses BullMQ for job queue, Redis for persistence, and proper process management.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getConfig, validateConfig } from './config.js';
import { getRedisConnection, closeConnections } from './queue/index.js';
import { startWorker, stopWorker } from './worker/compiler.js';
import { createApiRateLimiter } from './api/middleware/rateLimit.js';
import { requireJson } from './api/middleware/validation.js';
import { requireApiKey } from './api/middleware/auth.js';
import {
  notFoundHandler,
  globalErrorHandler,
} from './api/middleware/errorHandler.js';
import checkRoutes from './api/routes/check.js';
import healthRoutes from './api/routes/health.js';

// ============================================================================
// Server Setup
// ============================================================================

async function createServer() {
  const app = express();
  const config = getConfig();

  // Trust proxy (for Railway/Vercel)
  app.set('trust proxy', 1);

  // -------------------------------------------------------------------------
  // Security Middleware
  // -------------------------------------------------------------------------

  // Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Not needed for API
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS - allow all origins for educational platform
  app.use(
    cors({
      origin: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
      credentials: true,
    })
  );

  // -------------------------------------------------------------------------
  // Request Parsing
  // -------------------------------------------------------------------------

  // JSON body parser with size limit
  app.use(
    express.json({
      limit: `${Math.ceil(config.maxCodeSize / 1024)}kb`,
    })
  );

  // Require JSON content type for POST requests
  app.use(requireJson);

  // -------------------------------------------------------------------------
  // API Authentication & Rate Limiting
  // -------------------------------------------------------------------------

  // API key required for all /api/* routes (if API_KEY env var is set)
  app.use('/api/', requireApiKey);

  // Rate limiting for all /api/* routes
  app.use('/api/', createApiRateLimiter());

  // -------------------------------------------------------------------------
  // Routes
  // -------------------------------------------------------------------------

  // Health check (no version prefix for load balancer compatibility)
  app.use('/health', healthRoutes);

  // API v2 routes
  app.use('/api/v2/check', checkRoutes);
  app.use('/api/v2/health', healthRoutes);

  // Legacy routes (redirect to v2)
  app.post('/compile', (_req, res) => {
    res.redirect(307, '/api/v2/check');
  });

  app.post('/compile-job', (_req, res) => {
    res.redirect(307, '/api/v2/check');
  });

  // -------------------------------------------------------------------------
  // Error Handling
  // -------------------------------------------------------------------------

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}

// ============================================================================
// Startup
// ============================================================================

async function main() {
  console.log('====================================');
  console.log(' ink! Contract Checker Server v2.0');
  console.log('====================================');

  try {
    // Validate configuration
    validateConfig();

    // Connect to Redis
    console.log('\n[Startup] Connecting to Redis...');
    const redis = getRedisConnection();
    await redis.connect();

    // Verify Redis connection
    await redis.ping();
    console.log('[Startup] Redis connected');

    // Start worker
    console.log('[Startup] Starting compilation worker...');
    startWorker();

    // Create and start server
    const app = await createServer();
    const config = getConfig();

    app.listen(config.port, () => {
      console.log(`\n[Server] Listening on port ${config.port}`);
      console.log('\nAvailable endpoints:');
      console.log('  GET  /health              - Simple health check');
      console.log('  GET  /api/v2/health       - Detailed health check');
      console.log('  GET  /api/v2/health/metrics - Prometheus metrics');
      console.log('  POST /api/v2/check        - Submit compilation job');
      console.log('  GET  /api/v2/check/:jobId - Get job status');
      console.log('  GET  /api/v2/check/:jobId/stream - Stream job output (SSE)');
      console.log('\n[Server] Ready to accept connections');
    });

    // -------------------------------------------------------------------------
    // Graceful Shutdown
    // -------------------------------------------------------------------------

    const shutdown = async (signal: string) => {
      console.log(`\n[Shutdown] Received ${signal}, shutting down gracefully...`);

      try {
        // Stop accepting new requests
        console.log('[Shutdown] Stopping worker...');
        await stopWorker();

        // Close connections
        console.log('[Shutdown] Closing connections...');
        await closeConnections();

        console.log('[Shutdown] Complete');
        process.exit(0);
      } catch (err) {
        console.error('[Shutdown] Error during shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (err) => {
      console.error('[Fatal] Uncaught exception:', err);
      shutdown('uncaughtException').catch(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason) => {
      console.error('[Fatal] Unhandled rejection:', reason);
      // Don't exit on unhandled rejections, just log
    });
  } catch (err) {
    console.error('[Startup] Failed to start server:', err);
    process.exit(1);
  }
}

// ============================================================================
// Entry Point
// ============================================================================

main();
