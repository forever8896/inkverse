/**
 * Centralized Configuration Constants
 *
 * This file contains all configuration constants used throughout the application.
 * All timeouts, retry configurations, size limits, and other magic numbers should
 * be defined here with clear documentation about their purpose and units.
 *
 * Benefits:
 * - Single source of truth for all configuration values
 * - Easy tuning for different environments (dev/test/prod)
 * - Self-documenting code with clear intent
 * - Prevents inconsistent values across the codebase
 * - Enables easy testing with different configurations
 */

// ============================================================================
// API TIMEOUTS
// ============================================================================

/**
 * Timeout configurations for external API calls (in milliseconds)
 *
 * These values control how long we wait for external services to respond
 * before considering the request failed. Adjust based on network conditions
 * and service SLAs.
 */
export const API_TIMEOUTS = {
  /**
   * Standard timeout for most API operations
   * Used for: OpenAI image generation, fal.ai initial requests
   * 60 seconds is typically enough for most API calls
   */
  DEFAULT: 60_000, // 60 seconds

  /**
   * Extended timeout for long-running operations
   * Used for: Complex 3D conversions, batch processing
   * Some operations legitimately take longer than a minute
   */
  LONG_OPERATION: 120_000, // 2 minutes

  /**
   * Timeout for file download operations
   * Used for: Downloading generated GLB models from fal.ai
   * Large 3D models can take time to transfer
   */
  DOWNLOAD: 60_000, // 60 seconds

  /**
   * Delay between retry attempts
   * Used for: All retry logic when operations fail
   * 2 seconds gives services time to recover without hammering them
   */
  RETRY_DELAY: 2_000, // 2 seconds
} as const;

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

/**
 * Retry strategy configuration for resilient API calls
 *
 * These values control how we handle transient failures from external services.
 * Too many retries waste money (for paid APIs), too few reduce reliability.
 */
export const RETRY_CONFIG = {
  /**
   * Maximum number of retry attempts for failed operations
   * Used for: All API calls to OpenAI and fal.ai
   * 3 attempts = 1 initial + 2 retries, balancing reliability with cost
   */
  MAX_ATTEMPTS: 3,

  /**
   * Exponential backoff multiplier for retry delays
   * Used for: Calculating increasing delays between retries
   * Example: 2s, 4s, 8s delays with multiplier of 2
   */
  BACKOFF_MULTIPLIER: 2,

  /**
   * Maximum delay between retries (in milliseconds)
   * Used for: Capping exponential backoff to prevent excessive waits
   * 30 seconds max prevents unreasonably long delays
   */
  MAX_RETRY_DELAY: 30_000, // 30 seconds

  /**
   * Jitter factor for retry delays (0-1)
   * Used for: Adding randomness to prevent thundering herd
   * 0.1 = ±10% randomness on retry delays
   */
  JITTER_FACTOR: 0.1,
} as const;

// ============================================================================
// FILE SIZE CONSTANTS
// ============================================================================

/**
 * File size units and limits (in bytes unless specified)
 *
 * These constants define size calculations and validation limits for
 * uploaded/generated files. Consistent use prevents calculation errors.
 */
export const FILE_SIZES = {
  /**
   * Bytes in a kilobyte
   * Used for: Converting file sizes to KB for display
   */
  KB: 1024,

  /**
   * Bytes in a megabyte
   * Used for: Converting file sizes to MB for display
   */
  MB: 1024 * 1024,

  /**
   * Bytes in a gigabyte
   * Used for: Large file size calculations (future use)
   */
  GB: 1024 * 1024 * 1024,

  /**
   * Minimum valid image size (in KB)
   * Used for: Validating OpenAI-generated images
   * Images smaller than this are likely corrupted
   */
  MIN_IMAGE_SIZE_KB: 100, // 100 KB

  /**
   * Minimum valid 3D model size (in MB)
   * Used for: Validating fal.ai-generated GLB files
   * 3D models smaller than this are likely invalid
   */
  MIN_MODEL_SIZE_MB: 1, // 1 MB

  /**
   * Maximum allowed 3D model size (in MB)
   * Used for: Preventing excessive storage/bandwidth usage
   * Models larger than this indicate potential issues
   */
  MAX_MODEL_SIZE_MB: 50, // 50 MB

  /**
   * Minimum GLB file size (in bytes)
   * Used for: Quick validation that file has content
   * GLB files have headers that make them at least 1KB
   */
  MIN_GLB_FILE_SIZE: 1024, // 1 KB
} as const;

// ============================================================================
// OPENAI CONFIGURATION
// ============================================================================

/**
 * OpenAI API specific configuration
 *
 * These settings control how we interact with OpenAI's image generation API.
 * Changes here affect quality, cost, and generation time.
 */
export const OPENAI_CONFIG = {
  /**
   * Image dimensions for DALL-E generation
   * Used for: All monster image generation requests
   * Options: '256x256', '512x512', '1024x1024'
   * Larger = better quality but higher cost
   */
  IMAGE_SIZE: '1024x1024' as const,

  /**
   * OpenAI model identifier for image generation
   * Used for: API calls to OpenAI
   * 'gpt-image-1' is an alias for DALL-E 3
   */
  MODEL: 'gpt-image-1' as const,

  /**
   * Image quality setting
   * Used for: Trading off between quality and generation speed
   * Options: 'standard', 'hd' (HD is 2x cost)
   */
  QUALITY: 'standard' as const,

  /**
   * Response format for generated images
   * Used for: Determining how images are returned
   * Options: 'url', 'b64_json'
   */
  RESPONSE_FORMAT: 'b64_json' as const,
} as const;

// ============================================================================
// FAL.AI CONFIGURATION
// ============================================================================

/**
 * fal.ai API specific configuration
 *
 * These settings control 3D model generation from 2D images.
 * Adjust based on quality requirements and processing time constraints.
 */
export const FAL_CONFIG = {
  /**
   * 3D conversion model identifier
   * Used for: API calls to fal.ai
   * Different models have different quality/speed tradeoffs
   */
  MODEL: 'tripo3d/tripo/v2.5/image-to-3d' as const,

  /**
   * Texture quality for 3D models
   * Used for: Controlling output quality and file size
   * Options: 'no', 'standard', 'HD'
   */
  DEFAULT_TEXTURE: 'standard' as const,

  /**
   * Maximum face count for 3D models
   * Used for: Limiting polygon complexity
   * Higher = more detail but larger files
   */
  DEFAULT_FACE_LIMIT: 50000,
} as const;

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Rate limiting and throttling configuration
 *
 * These values prevent abuse and ensure fair usage of resources.
 * Adjust based on user load and available API quotas.
 */
export const RATE_LIMITS = {
  /**
   * Maximum concurrent active jobs per user
   * Used for: Preventing single user from monopolizing resources
   * 2 allows some parallelism without abuse
   */
  MAX_ACTIVE_JOBS_PER_USER: 2,

  /**
   * Maximum generations per hour per user
   * Used for: Preventing runaway costs from single user
   * 10/hour = ~$7/hour max cost per user at current prices
   */
  MAX_GENERATIONS_PER_HOUR: 10,

  /**
   * Default number of recent jobs to fetch
   * Used for: Pagination in job history queries
   * 10 provides good overview without overwhelming UI
   */
  DEFAULT_JOB_FETCH_LIMIT: 10,

  /**
   * Maximum number of jobs to return in single query
   * Used for: Preventing excessive database load
   * 100 prevents massive result sets
   */
  MAX_JOB_FETCH_LIMIT: 100,

  /**
   * Cooldown period between generations (in milliseconds)
   * Used for: Preventing rapid-fire generation requests
   * 5 seconds prevents accidental double-clicks
   */
  GENERATION_COOLDOWN: 5_000, // 5 seconds
} as const;

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================

/**
 * File storage and path configuration
 *
 * These settings control where and how generated files are stored.
 * Paths are relative or absolute depending on deployment environment.
 */
export const STORAGE_CONFIG = {
  /**
   * Default directory for temporary file storage
   * Used for: Local development and testing
   * Should be overridden by S3 in production
   */
  DEFAULT_OUTPUT_DIR: '/tmp/monster-generation',

  /**
   * Public directory for web-accessible files
   * Used for: Storing files that need URL access
   * Relative to project root
   */
  PUBLIC_OUTPUT_DIR: 'public/models/generated',

  /**
   * Maximum age for temporary files (in days)
   * Used for: Cleanup jobs to remove old files
   * 7 days balances storage costs with user access needs
   */
  TEMP_FILE_MAX_AGE_DAYS: 7,

  /**
   * File naming pattern for generated assets
   * Used for: Consistent file naming across services
   * Includes timestamp for uniqueness
   */
  FILE_NAME_PATTERN: {
    IMAGE: 'monster_{id}_image_{timestamp}.png',
    MODEL: 'monster_{id}_model_{timestamp}.glb',
  },
} as const;

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

/**
 * Test-specific timeout overrides (in milliseconds)
 *
 * Tests may need longer timeouts due to setup/teardown or CI environment
 * performance differences. These values override defaults during testing.
 */
export const TEST_TIMEOUTS = {
  /**
   * Timeout for integration tests involving real API calls
   * Used for: Tests that actually call OpenAI/fal.ai
   * 2 minutes allows for slow API responses in tests
   */
  INTEGRATION_TEST: 120_000, // 2 minutes

  /**
   * Timeout for full end-to-end pipeline tests
   * Used for: Tests that run complete generation pipeline
   * 5 minutes allows for full image + 3D generation
   */
  E2E_PIPELINE_TEST: 300_000, // 5 minutes

  /**
   * Timeout for unit tests
   * Used for: Fast, isolated component tests
   * 10 seconds is plenty for unit tests
   */
  UNIT_TEST: 10_000, // 10 seconds
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * TypeScript type exports for strong typing throughout the application
 */

export type ApiTimeout = typeof API_TIMEOUTS[keyof typeof API_TIMEOUTS];
export type RetryConfig = typeof RETRY_CONFIG;
export type FileSize = typeof FILE_SIZES[keyof typeof FILE_SIZES];
export type RateLimit = typeof RATE_LIMITS[keyof typeof RATE_LIMITS];

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Helper function to convert bytes to human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted string like "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < FILE_SIZES.KB) return `${bytes} B`;
  if (bytes < FILE_SIZES.MB) return `${(bytes / FILE_SIZES.KB).toFixed(2)} KB`;
  if (bytes < FILE_SIZES.GB) return `${(bytes / FILE_SIZES.MB).toFixed(2)} MB`;
  return `${(bytes / FILE_SIZES.GB).toFixed(2)} GB`;
}

/**
 * Helper function to validate file size is within limits
 * @param size - File size in bytes
 * @param type - Type of file ('image' or 'model')
 * @returns True if size is valid
 */
export function isValidFileSize(size: number, type: 'image' | 'model'): boolean {
  if (type === 'image') {
    return size >= FILE_SIZES.MIN_IMAGE_SIZE_KB * FILE_SIZES.KB;
  } else {
    return size >= FILE_SIZES.MIN_MODEL_SIZE_MB * FILE_SIZES.MB &&
           size <= FILE_SIZES.MAX_MODEL_SIZE_MB * FILE_SIZES.MB;
  }
}

/**
 * Get timeout value with environment override support
 * @param key - Timeout key from API_TIMEOUTS
 * @returns Timeout value in milliseconds
 */
export function getTimeout(key: keyof typeof API_TIMEOUTS): number {
  const envKey = `TIMEOUT_${key}`;
  const envValue = process.env[envKey];
  if (envValue && !isNaN(Number(envValue))) {
    return Number(envValue);
  }
  return API_TIMEOUTS[key];
}