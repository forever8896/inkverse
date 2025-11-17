"use step"

/**
 * Mark Complete Step
 * Final database update to mark job as completed with all metadata
 */

import { getStepMetadata } from 'workflow';
import { GenerationJob } from '@/lib/generation-job';
import { WorkflowLogger } from '../utils/logging';

export interface CompleteJobResult {
  jobId: string;
  completedAt: Date;
  totalCost: number;
}

export async function markComplete(
  jobId: string,
  imageS3Key: string,
  glbS3Key: string,
  imageCost: number,
  conversionCost: number
): Promise<CompleteJobResult> {
  const metadata = getStepMetadata();
  const logger = new WorkflowLogger({
    jobId,
    stepName: 'markComplete',
    attempt: metadata.attempt
  });

  logger.info('Marking job as complete', {
    imageS3Key,
    glbS3Key,
    totalCost: imageCost + conversionCost
  });

  const job = await GenerationJob.findById(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  try {
    const totalCost = imageCost + conversionCost;
    const completedAt = new Date();

    // Update job to completed status
    await job.update({
      status: 'completed',
      progress: 100,
      userMessage: '🎉 Your monster is ready!',
      totalCost,
      completedAt
    });

    logger.success('Job marked as complete', {
      totalCost,
      completedAt: completedAt.toISOString()
    });

    return {
      jobId: job.id,
      completedAt,
      totalCost
    };

  } catch (error) {
    logger.error('Failed to mark job as complete', error);

    // Even if this fails, we should retry (database might be temporarily unavailable)
    throw new Error(`Failed to mark job complete: ${error instanceof Error ? error.message : String(error)}`);
  }
}
