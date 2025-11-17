"use step"

/**
 * Check S3 Storage Availability
 * Pre-flight check to ensure S3/MinIO is reachable before starting generation
 */

import { FatalError, getStepMetadata } from 'workflow';
import { S3Service } from '@/services/s3-service';
import { GenerationJob } from '@/lib/generation-job';
import { WorkflowLogger } from '../utils/logging';

export async function checkStorage(jobId: string): Promise<{ available: boolean }> {
  const metadata = getStepMetadata();
  const logger = new WorkflowLogger({
    jobId,
    stepName: 'checkStorage',
    attempt: metadata.attempt
  });

  logger.info('Checking S3 storage availability');

  // Get job first so we can update status even if storage check fails
  const job = await GenerationJob.findById(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  try {
    const s3Service = S3Service.getInstance();
    const checkResult = await s3Service.checkBucketAccessibility();

    if (!checkResult.ok) {
      logger.error('S3 storage is not available', null, { error: checkResult.error });

      // Update job to waiting_on_storage status
      await job.update({
        status: 'waiting_on_storage',
        userMessage: 'Storage is unreachable right now. Please verify your S3/MinIO service.',
        errorMessage: checkResult.error || 'S3 bucket accessibility check failed'
      });

      throw new FatalError('S3 storage unavailable - service is not reachable');
    }

    logger.success('S3 storage is available and healthy');

    return { available: true };

  } catch (error) {
    if (error instanceof FatalError) {
      throw error;
    }

    logger.error('Unexpected error during storage check', error);
    throw new FatalError(`Storage check failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
