"use step"

/**
 * Mark Complete Step
 * Final database update to mark job as completed with all metadata.
 * Also syncs S3 keys, NFT data, and IPFS CIDs to the user_monsters record
 * so the creature is visible in the UI.
 */

import { getStepMetadata } from 'workflow';
import { GenerationJob } from '@/lib/generation-job';
import { UserMonster } from '@/lib/user-monster';
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

    // Sync assets to user_monsters so the creature is visible in the UI.
    // The user_monsters record was created at generation start (without S3 keys).
    if (job.monsterId) {
      try {
        const monster = await UserMonster.findById(job.monsterId);
        if (monster) {
          await monster.update({
            youngImageS3Key: imageS3Key || undefined,
            youngModelS3Key: glbS3Key || undefined,
            nftItemId: job.nftItemId,
            nftCollectionId: job.nftCollectionId,
            nftOwnerAddress: job.nftOwnerAddress,
            youngImageCid: job.nftImageCid || undefined,
            currentMetadataCid: job.nftMetadataCid || undefined,
          });
          logger.info('Synced assets to user_monsters', { monsterId: job.monsterId });
        } else {
          logger.warn('Monster record not found, skipping sync', { monsterId: job.monsterId });
        }
      } catch (syncError) {
        // Log but don't fail the completion — job is already marked complete
        logger.error('Failed to sync assets to user_monsters (non-fatal)', syncError);
      }
    } else {
      logger.warn('No monsterId on job, skipping user_monsters sync');
    }

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
