"use workflow"

/**
 * Monster Evolution Workflow
 * Orchestrates the evolution process for existing monsters:
 *
 * For adult stage:
 *   generate adult 3D → upload to IPFS → update metadata → update on-chain
 *
 * This workflow handles:
 * - Generating new adult 3D models using fal.ai
 * - Creating updated NFT metadata with evolution history
 * - Updating the on-chain NFT metadata pointer
 * - Recording evolution in the database
 */

import { convert3D, type Conversion3DResult } from './steps/convert-3d';
import { updateNFTMetadata, type UpdateMetadataResult } from './steps/update-nft-metadata';
import { markEvolutionComplete, type EvolutionCompleteResult } from './steps/mark-evolution-complete';
import type { EvolutionStage } from '@/lib/user-monster';

export interface EvolveMonsterInput {
  jobId: string;
  monsterId: string;
  targetStage: EvolutionStage;
  evolutionMilestone?: string;
  lessonContext?: {
    lessonId?: number;
    chapterId?: number;
    stepId?: number;
  };
}

export interface EvolveMonsterResult {
  jobId: string;
  monsterId: string;
  newStage: EvolutionStage;
  modelCid?: string;
  metadataCid: string;
  txHash?: string;
  completedAt: Date;
}

/**
 * Main evolution workflow function
 * Handles the adult stage evolution which requires new 3D generation
 */
export async function evolveMonster(
  input: EvolveMonsterInput
): Promise<EvolveMonsterResult> {
  const { jobId, monsterId, targetStage, evolutionMilestone, lessonContext } = input;

  // Currently only supporting adult evolution through this workflow
  // young_3d is handled synchronously in the API since no generation is needed

  if (targetStage !== 'adult') {
    throw new Error(`Unexpected target stage in evolution workflow: ${targetStage}`);
  }

  // Step 1: Get the monster's existing 2D image for 3D conversion
  // The adult 3D model is generated from the existing young 2D image
  const { getMonsterImageKey } = await import('./steps/get-monster-assets');
  const imageS3Key = await getMonsterImageKey(monsterId);

  // Step 2: Generate adult 3D model using fal.ai
  // We reuse the convert3D step but with a different prompt/style for adult
  const glbResult: Conversion3DResult = await convert3D(
    jobId,
    imageS3Key,
    monsterId // Use monsterId as the "user" context for S3 path
  );

  // Step 3: Update NFT metadata on-chain
  // This uploads the new model to IPFS and updates the on-chain metadata pointer
  const metadataResult: UpdateMetadataResult = await updateNFTMetadata(
    jobId,
    monsterId,
    'adult',
    evolutionMilestone || 'Adult Form Achieved',
    {
      modelS3Key: glbResult.glbS3Key,
      modelCid: undefined // Will be generated in the step
    }
  );

  // Step 4: Mark evolution as complete
  const completeResult: EvolutionCompleteResult = await markEvolutionComplete(
    jobId,
    monsterId,
    'adult',
    evolutionMilestone,
    {
      modelS3Key: glbResult.glbS3Key,
      modelCid: metadataResult.modelCid,
      metadataCid: metadataResult.metadataCid,
      txHash: metadataResult.txHash,
      blockHash: metadataResult.blockHash
    },
    lessonContext
  );

  return {
    jobId,
    monsterId,
    newStage: 'adult',
    modelCid: metadataResult.modelCid,
    metadataCid: metadataResult.metadataCid,
    txHash: metadataResult.txHash,
    completedAt: completeResult.completedAt
  };
}
