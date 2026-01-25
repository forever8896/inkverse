"use step"

/**
 * Update NFT Metadata Step
 * Uploads new assets to IPFS and updates the on-chain NFT metadata pointer
 * Used during monster evolution to update the NFT with new assets
 */

import { FatalError, RetryableError, getStepMetadata } from 'workflow';
import { GenerationJob } from '@/lib/generation-job';
import { UserMonster } from '@/lib/user-monster';
import { EvolutionHistory } from '@/lib/evolution-history';
import { NFTMetadataService } from '@/services/nft-metadata-service';
import { NFTsPalletService } from '@/services/nfts-pallet-service';
import { S3Service } from '@/services/s3-service';
import { WorkflowLogger } from '../utils/logging';

export interface UpdateMetadataResult {
  modelCid?: string;
  metadataCid: string;
  txHash?: string;
  blockHash?: string;
}

export async function updateNFTMetadata(
  jobId: string,
  monsterId: string,
  targetStage: 'young_3d' | 'adult',
  evolutionMilestone: string,
  assets: {
    modelS3Key?: string;
    modelCid?: string;
  }
): Promise<UpdateMetadataResult> {
  const metadata = getStepMetadata();
  const logger = new WorkflowLogger({
    jobId,
    stepName: 'updateNFTMetadata',
    attempt: metadata.attempt,
  });

  logger.info('Starting NFT metadata update', { monsterId, targetStage });

  // Get the monster record
  const monster = await UserMonster.findById(monsterId);
  if (!monster) {
    throw new FatalError(`Monster ${monsterId} not found`);
  }

  if (!monster.nftItemId) {
    throw new FatalError(`Monster ${monsterId} has not been minted`);
  }

  // Get the job for status updates
  const job = await GenerationJob.findById(jobId);

  try {
    if (job) {
      await job.update({
        status: 'minting_nft', // Reuse status for metadata update
        progress: 85,
        userMessage: '📤 Uploading evolved assets to IPFS...',
      });
    }

    const s3Service = S3Service.getInstance();
    const metadataService = NFTMetadataService.getInstance();

    // Upload new model to IPFS if we have an S3 key
    let modelCid = assets.modelCid;

    if (!modelCid && assets.modelS3Key) {
      logger.info('Downloading model from S3', { s3Key: assets.modelS3Key });
      const modelBuffer = await s3Service.downloadFile(assets.modelS3Key);

      logger.info('Uploading model to IPFS');
      modelCid = await metadataService.uploadAsset(modelBuffer, 'model.glb', 'model/gltf-binary');
      logger.info('Model uploaded to IPFS', { modelCid });
    }

    // Get existing evolution history
    const existingHistory = await EvolutionHistory.getMetadataHistory(monsterId);

    // Create new metadata with evolution history
    const newMetadata = {
      name: `Ink Monster #${monster.nftItemId}`,
      description: 'A creature born from ink! smart contracts, evolved through learning.',
      image: monster.youngImageCid ? `ipfs://${monster.youngImageCid}` : '',
      animation_url: modelCid ? `ipfs://${modelCid}` : undefined,
      external_url: `https://inkverse.app/monster/${monster.nftItemId}`,
      current_stage: targetStage,
      evolution_count: existingHistory.length + 1,
      evolution_history: [
        ...existingHistory,
        {
          stage: targetStage,
          milestone: evolutionMilestone,
          timestamp: new Date().toISOString(),
          assets: modelCid ? { model_cid: modelCid } : {}
        }
      ],
      attributes: [
        { trait_type: 'Stage', value: targetStage === 'adult' ? 'Adult' : 'Young (3D)' },
        { trait_type: 'Evolution Count', value: existingHistory.length + 1 },
        ...Object.entries(monster.attributes || {}).map(([key, value]) => ({
          trait_type: key.charAt(0).toUpperCase() + key.slice(1),
          value: String(value)
        }))
      ],
      inkverse: {
        version: '1.0.0'
      }
    };

    // Upload metadata to IPFS
    logger.info('Uploading evolved metadata to IPFS');
    const metadataCid = await metadataService.uploadMetadata(newMetadata);
    logger.info('Metadata uploaded to IPFS', { metadataCid });

    if (job) {
      await job.update({
        progress: 92,
        userMessage: '⛓️ Updating NFT on blockchain...',
      });
    }

    // Update on-chain metadata
    logger.info('Updating on-chain NFT metadata', {
      collectionId: monster.nftCollectionId,
      itemId: monster.nftItemId,
    });

    const nftsService = NFTsPalletService.getInstance();
    const txResult = await nftsService.setMetadata(
      monster.nftCollectionId,
      monster.nftItemId,
      `ipfs://${metadataCid}`
    );

    if (!txResult.success) {
      logger.error('Failed to update on-chain metadata', null, { error: txResult.error });

      if (job) {
        await job.update({
          status: 'nft_minting_retrying',
          userMessage: `Blockchain update failed. Retrying... (${metadata.attempt + 1})`,
          errorMessage: txResult.error,
        });
      }

      throw new RetryableError(txResult.error || 'Failed to update on-chain metadata');
    }

    logger.info('On-chain metadata updated successfully', {
      txHash: txResult.txHash,
      blockHash: txResult.blockHash,
    });

    // Update monster record with new CIDs
    await monster.update({
      currentStage: targetStage,
      currentMetadataCid: metadataCid,
      ...(targetStage === 'adult' && modelCid ? { adultModelCid: modelCid } : {}),
      ...(targetStage === 'young_3d' && modelCid ? { youngModelCid: modelCid } : {}),
    });

    if (job) {
      await job.update({
        progress: 98,
        userMessage: '✨ Evolution complete!',
        nftMetadataCid: metadataCid,
        ...(modelCid ? { nftModelCid: modelCid } : {}),
      });
    }

    return {
      modelCid,
      metadataCid,
      txHash: txResult.txHash,
      blockHash: txResult.blockHash,
    };

  } catch (error) {
    if (error instanceof FatalError || error instanceof RetryableError) {
      throw error;
    }

    logger.error('Unexpected error during metadata update', error);

    if (job) {
      await job.update({
        status: 'nft_minting_retrying',
        userMessage: `Unexpected error. Retrying... (${metadata.attempt + 1})`,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }

    throw new RetryableError(
      error instanceof Error ? error.message : String(error)
    );
  }
}
