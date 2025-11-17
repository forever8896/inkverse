/**
 * Shared helper functions for admin job routes
 * Reduces duplication between DELETE and POST reset handlers
 */

import { GenerationJob } from '@/lib/generation-job';
import { S3Service } from '@/services/s3-service';

/**
 * UUID v4 regex pattern for job ID validation
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validation error - thrown when job ID format is invalid
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error - thrown when job doesn't exist
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Validate job ID format (UUID v4)
 * @throws {ValidationError} if format is invalid
 */
export function validateJobId(jobId: string): void {
  if (!UUID_REGEX.test(jobId)) {
    throw new ValidationError('Invalid job ID format');
  }
}

/**
 * Fetch job by ID
 * @throws {NotFoundError} if job doesn't exist
 */
export async function fetchJobById(jobId: string): Promise<GenerationJob> {
  const job = await GenerationJob.findById(jobId);
  if (!job) {
    throw new NotFoundError('Job not found');
  }
  return job;
}

/**
 * Validate and fetch job in one call
 * Combines UUID validation and job lookup
 * @throws {ValidationError} if format is invalid
 * @throws {NotFoundError} if job doesn't exist
 */
export async function validateAndFetchJob(jobId: string): Promise<GenerationJob> {
  validateJobId(jobId);
  return fetchJobById(jobId);
}

/**
 * Clean up S3 files associated with a job
 * Used by delete handler to remove stored assets
 * Returns array of successfully deleted file types
 */
export async function cleanupJobS3Files(job: GenerationJob): Promise<string[]> {
  const s3Service = S3Service.getInstance();
  const deletedFiles: string[] = [];

  // Delete image file
  if (job.imageS3Key) {
    try {
      await s3Service.deleteFile(job.imageS3Key);
      deletedFiles.push('image');
      console.log(`[ADMIN] Deleted S3 image: ${job.imageS3Key}`);
    } catch (error) {
      console.warn(`[ADMIN] Failed to delete image S3 file: ${error}`);
    }
  }

  // Delete GLB file
  if (job.glbS3Key) {
    try {
      await s3Service.deleteFile(job.glbS3Key);
      deletedFiles.push('3D model');
      console.log(`[ADMIN] Deleted S3 GLB: ${job.glbS3Key}`);
    } catch (error) {
      console.warn(`[ADMIN] Failed to delete GLB S3 file: ${error}`);
    }
  }

  return deletedFiles;
}
