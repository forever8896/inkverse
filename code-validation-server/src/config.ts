/**
 * Server Configuration
 *
 * All configuration is loaded from environment variables with sensible defaults.
 */

import type { ServerConfig } from './types/index.js';

let config: ServerConfig | null = null;

export function getConfig(): ServerConfig {
  if (!config) {
    config = {
      // Server
      port: parseInt(process.env.PORT || '3000', 10),

      // Redis
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

      // Worker
      workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '2', 10),

      // Compilation
      compilationTimeout: parseInt(
        process.env.COMPILATION_TIMEOUT || '120000',
        10
      ), // 2 minutes
      maxCodeSize: parseInt(process.env.MAX_CODE_SIZE || '102400', 10), // 100KB
      maxOutputSize: parseInt(process.env.MAX_OUTPUT_SIZE || '524288', 10), // 512KB

      // Rate Limiting
      rateLimitWindowMs: parseInt(
        process.env.RATE_LIMIT_WINDOW_MS || '60000',
        10
      ), // 1 minute
      rateLimitMaxRequests: parseInt(
        process.env.RATE_LIMIT_MAX_REQUESTS || '100',
        10
      ),
      compileRateLimitMax: parseInt(
        process.env.COMPILE_RATE_LIMIT_MAX || '10',
        10
      ),

      // Paths
      cargoHome:
        process.env.CARGO_HOME || '/app/compile_cache/cargo_home',
      targetDir:
        process.env.CARGO_TARGET_DIR || '/app/compile_cache/target',
      tempDir: process.env.TEMP_DIR || '/app/compile_cache/temp',

      // API Key (optional - if set, all /api/* routes require it)
      apiKey: process.env.API_KEY || null,
    };
  }

  return config;
}

/**
 * Validate configuration on startup
 */
export function validateConfig(): void {
  const cfg = getConfig();

  if (cfg.port < 1 || cfg.port > 65535) {
    throw new Error(`Invalid port: ${cfg.port}`);
  }

  if (cfg.workerConcurrency < 1 || cfg.workerConcurrency > 10) {
    throw new Error(
      `Invalid worker concurrency: ${cfg.workerConcurrency}. Must be 1-10.`
    );
  }

  if (cfg.compilationTimeout < 10000 || cfg.compilationTimeout > 600000) {
    throw new Error(
      `Invalid compilation timeout: ${cfg.compilationTimeout}. Must be 10s-10min.`
    );
  }

  console.log('[Config] Loaded configuration:');
  console.log(`  Port: ${cfg.port}`);
  console.log(`  Redis: ${cfg.redisUrl.replace(/\/\/.*@/, '//***@')}`); // Hide credentials
  console.log(`  Worker Concurrency: ${cfg.workerConcurrency}`);
  console.log(`  Compilation Timeout: ${cfg.compilationTimeout}ms`);
  console.log(`  Rate Limit: ${cfg.compileRateLimitMax} compiles/min`);
  console.log(`  API Key: ${cfg.apiKey ? 'enabled' : 'disabled (open access)'}`);
}
