"use step"

/**
 * Mark Evolution Complete Step
 * Records the evolution in history and updates final job status
 */

import { getStepMetadata } from 'workflow';
import { GenerationJob } from '@/lib/generation-job';
import { UserMonster, EvolutionStage } from '@/lib/user-monster';
import { EvolutionHistory } from '@/lib/evolution-history';
import { WorkflowLogger } from '../utils/logging';

export interface EvolutionCompleteResult {
  monsterId: string;
  newStage: EvolutionStage;
  evolutionHistoryId: string;
  completedAt: Date;
}

export async function markEvolutionComplete(
  jobId: string,
  monsterId: string,
  targetStage: EvolutionStage,
  evolutionMilestone?: string,
  assets?: {
    // Image assets (young stage)
    imageS3Key?: string;
    imageCid?: string;
    // Model assets (all stages)
    modelS3Key?: string;
    modelCid?: string;
    // NFT metadata
    metadataCid?: string;
    txHash?: string;
    blockHash?: string;
    // NFT identifiers (young stage mint)
    nftItemId?: number;
    nftCollectionId?: number;
    nftOwnerAddress?: string;
  },
  lessonContext?: {
    lessonId?: number;
    chapterId?: number;
    stepId?: number;
  }
): Promise<EvolutionCompleteResult> {
  const metadata = getStepMetadata();
  const logger = new WorkflowLogger({
    jobId,
    stepName: 'markEvolutionComplete',
    attempt: metadata.attempt,
  });

  logger.info('Marking evolution as complete', { monsterId, targetStage });

  // Get the monster
  const monster = await UserMonster.findById(monsterId);
  if (!monster) {
    throw new Error(`Monster ${monsterId} not found`);
  }

  // Build assets added record for history
  const assetsAdded: { image_cid?: string; model_cid?: string } = {};
  if (assets?.imageCid) assetsAdded.image_cid = assets.imageCid;
  if (assets?.modelCid) assetsAdded.model_cid = assets.modelCid;

  // Record evolution in history
  const historyEntry = await EvolutionHistory.create({
    monsterId,
    stage: targetStage,
    milestoneLabel: evolutionMilestone,
    assetsAdded: Object.keys(assetsAdded).length > 0 ? assetsAdded : undefined,
    metadataCid: assets?.metadataCid,
    txHash: assets?.txHash,
    blockHash: assets?.blockHash,
    generationJobId: jobId,
    lessonId: lessonContext?.lessonId,
    chapterId: lessonContext?.chapterId,
    stepId: lessonContext?.stepId,
  });

  logger.info('Evolution recorded in history', { historyId: historyEntry.id });

  // Build monster update based on stage
  const monsterUpdates: Record<string, unknown> = {
    currentStage: targetStage,
    currentMetadataCid: assets?.metadataCid,
  };

  // Young stage: Store image and model S3 keys (model is hidden until reveal)
  if (targetStage === 'young') {
    if (assets?.imageS3Key) monsterUpdates.youngImageS3Key = assets.imageS3Key;
    if (assets?.modelS3Key) monsterUpdates.youngModelS3Key = assets.modelS3Key;
    if (assets?.imageCid) monsterUpdates.youngImageCid = assets.imageCid;
    // NFT identifiers from mint
    if (assets?.nftItemId !== undefined) monsterUpdates.nftItemId = assets.nftItemId;
    if (assets?.nftCollectionId !== undefined) monsterUpdates.nftCollectionId = assets.nftCollectionId;
    if (assets?.nftOwnerAddress) monsterUpdates.nftOwnerAddress = assets.nftOwnerAddress;

    logger.info('Young stage assets stored', {
      imageS3Key: assets?.imageS3Key,
      modelS3Key: assets?.modelS3Key,
      imageCid: assets?.imageCid,
      nftItemId: assets?.nftItemId,
    });
  }

  // Young_3d stage: Model CID is added to NFT metadata
  if (targetStage === 'young_3d') {
    if (assets?.modelCid) monsterUpdates.youngModelCid = assets.modelCid;

    logger.info('Young_3d stage model revealed', {
      modelCid: assets?.modelCid,
    });
  }

  // Adult stage: Store new adult model
  if (targetStage === 'adult') {
    if (assets?.modelS3Key) monsterUpdates.adultModelS3Key = assets.modelS3Key;
    if (assets?.modelCid) monsterUpdates.adultModelCid = assets.modelCid;

    logger.info('Adult stage assets stored', {
      modelS3Key: assets?.modelS3Key,
      modelCid: assets?.modelCid,
    });
  }

  // Update monster
  await monster.update(monsterUpdates as any);

  // Update job status
  const job = await GenerationJob.findById(jobId);
  if (job) {
    const totalCost = (job.toJSON().openaiEstimatedCost || 0) + (job.toJSON().falEstimatedCost || 0);

    await job.update({
      status: 'completed',
      progress: 100,
      completedAt: new Date(),
      totalCost,
      userMessage: `✨ Evolution to ${targetStage} complete!`,
    });

    logger.info('Job marked as completed', { jobId, totalCost });
  }

  const completedAt = new Date();

  logger.success('Evolution complete', {
    monsterId,
    newStage: targetStage,
    historyId: historyEntry.id,
  });

  return {
    monsterId,
    newStage: targetStage,
    evolutionHistoryId: historyEntry.id,
    completedAt,
  };
}
