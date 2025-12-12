"use step"

/**
 * Mint NFT Step
 * Single responsibility: Upload assets to IPFS and mint NFT on blockchain
 * Does NOT handle completion - that's markComplete's job
 *
 * CRITICAL FIXES IMPLEMENTED:
 * - FIX #1: Idempotency - save allocated ID to DB before blockchain mint
 * - FIX #2: IPFS checkpoint - save CIDs to DB before blockchain mint
 * - FIX #3: Partial state recovery - check on-chain if ID exists but no txHash
 * - FIX #4: Use stored wallet from job, not parameter (security)
 */

import { FatalError, RetryableError, getStepMetadata } from 'workflow';
import { GenerationJob, type ErrorType } from '@/lib/generation-job';
import { NFTMetadataService } from '@/services/nft-metadata-service';
import { NFTsPalletService } from '@/services/nfts-pallet-service';
import { WorkflowLogger } from '../utils/logging';
import { mapServiceErrorToWorkflowError } from '../utils/error-mapping';

export interface MintNFTResult {
  nftItemId: number;
  nftCollectionId: number;
  metadataCID: string;
  imageCID: string;
  modelCID: string | null;
  txHash: string;
  blockHash: string;
  recovered?: boolean;  // True if recovered from partial state
}

export async function mintNFT(
  jobId: string
): Promise<MintNFTResult> {
  const metadata = getStepMetadata();
  const logger = new WorkflowLogger({
    jobId,
    stepName: 'mintNFT',
    attempt: metadata.attempt,
  });

  logger.info('Starting NFT minting');

  const job = await GenerationJob.findById(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  // FIX #4: Use stored wallet address from job, not a parameter
  // Wallet was validated and stored at job creation time
  const ownerAddress = job.nftOwnerAddress;
  if (!ownerAddress) {
    throw new FatalError('No wallet address stored for job - cannot mint NFT');
  }

  logger.info('Using owner address from job', { ownerAddress });

  // ============================================================
  // IDEMPOTENCY CHECK: If NFT fully minted, return existing data
  // ============================================================
  if (job.nftItemId !== undefined && job.nftTxHash) {
    logger.info('NFT already minted (idempotent)', {
      itemId: job.nftItemId,
      txHash: job.nftTxHash
    });
    return {
      nftItemId: job.nftItemId,
      nftCollectionId: job.nftCollectionId!,
      metadataCID: job.nftMetadataCid!,
      imageCID: job.nftImageCid!,
      modelCID: job.nftModelCid || null,
      txHash: job.nftTxHash,
      blockHash: job.nftBlockHash!,
    };
  }

  const nftService = NFTsPalletService.getInstance();
  const collectionId = nftService.getCollectionId();

  // ============================================================
  // FIX #3: PARTIAL STATE RECOVERY
  // If we have itemId but no txHash, check if NFT exists on-chain
  // (handles crash between mint success and DB update)
  // ============================================================
  if (job.nftItemId !== undefined && !job.nftTxHash) {
    logger.warn('Detected partial state - checking on-chain', {
      itemId: job.nftItemId,
      hasTxHash: false
    });

    const existsOnChain = await nftService.verifyNFTExists(collectionId, job.nftItemId);

    if (existsOnChain) {
      logger.info('NFT found on-chain - recovering from partial state', {
        itemId: job.nftItemId
      });

      // Update job with recovered state
      await job.update({
        nftTxHash: 'recovered',  // Mark as recovered (actual hash unknown)
        nftBlockHash: 'recovered',
        nftMintedAt: new Date(),
        userMessage: '✨ NFT recovered from blockchain!',
      });

      return {
        nftItemId: job.nftItemId,
        nftCollectionId: collectionId,
        metadataCID: job.nftMetadataCid!,
        imageCID: job.nftImageCid!,
        modelCID: job.nftModelCid || null,
        txHash: 'recovered',
        blockHash: 'recovered',
        recovered: true,
      };
    }

    logger.info('NFT not found on-chain - will retry mint with same ID', {
      itemId: job.nftItemId
    });
  }

  try {
    await job.update({
      status: 'minting_nft',
      progress: 92,
      userMessage: '🎁 Minting your NFT...',
      retryCount: metadata.attempt,
    });

    const ipfsService = NFTMetadataService.getInstance();

    // ============================================================
    // FIX #2: IPFS CHECKPOINT
    // Check if IPFS upload already completed (resume from checkpoint)
    // ============================================================
    let ipfsResult: {
      imageCID: string;
      modelCID: string | null;
      metadataCID: string;
      metadataUrl: string;
    };

    if (job.nftMetadataCid && job.nftImageCid) {
      // Resume from IPFS checkpoint
      logger.info('Resuming from IPFS checkpoint', {
        imageCID: job.nftImageCid,
        metadataCID: job.nftMetadataCid
      });
      ipfsResult = {
        imageCID: job.nftImageCid,
        modelCID: job.nftModelCid || null,
        metadataCID: job.nftMetadataCid,
        metadataUrl: `ipfs://${job.nftMetadataCid}`,
      };
    } else {
      // Fresh IPFS upload
      logger.info('Uploading assets to IPFS...');
      await job.update({ userMessage: '📤 Uploading to IPFS...', progress: 93 });

      try {
        ipfsResult = await ipfsService.prepareNFTAssets({
          jobId: job.id,
          name: `Monster #${job.id.slice(0, 8)}`,
          description: job.prompt,
          imageS3Key: job.imageS3Key!,
          glbS3Key: job.glbS3Key || null,
          style: job.style,
          stage: job.stage,
        });

        // FIX #2: Checkpoint IPFS CIDs immediately after upload
        logger.info('Checkpointing IPFS CIDs to database...');
        await job.update({
          nftImageCid: ipfsResult.imageCID,
          nftModelCid: ipfsResult.modelCID ?? undefined,
          nftMetadataCid: ipfsResult.metadataCID,
        });
        logger.info('IPFS checkpoint saved');

      } catch (error) {
        logger.error('IPFS upload failed', error);

        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorType: ErrorType = errorMsg.includes('rate')
          ? 'ipfs_rate_limit'
          : errorMsg.includes('credentials') || errorMsg.includes('401')
          ? 'pinata_invalid_credentials'
          : 'ipfs_upload_failed';

        await job.update({
          status: 'nft_minting_retrying',
          userMessage: `IPFS upload issue. Retrying... (${metadata.attempt + 1})`,
          errorMessage: errorMsg,
          retryCount: metadata.attempt,
        });

        throw mapServiceErrorToWorkflowError(errorType, errorMsg);
      }
    }

    logger.info('IPFS upload complete', {
      imageCID: ipfsResult.imageCID,
      modelCID: ipfsResult.modelCID,
      metadataCID: ipfsResult.metadataCID,
    });

    // ============================================================
    // FIX #1: IDEMPOTENT ID ALLOCATION
    // Reuse existing ID if already allocated, or allocate new one
    // ============================================================
    let itemId: number;

    if (job.nftItemId !== undefined) {
      // Reuse existing ID (retry scenario)
      itemId = job.nftItemId;
      logger.info('Reusing previously allocated item ID', { itemId });
    } else {
      // Allocate new ID and save immediately
      logger.info('Allocating new NFT item ID...');
      itemId = await nftService.getNextItemId();

      // FIX #1: Save allocated ID to DB BEFORE blockchain mint
      logger.info('Saving allocated ID to database...', { itemId, collectionId });
      await job.update({
        nftItemId: itemId,
        nftCollectionId: collectionId,
      });
      logger.info('Item ID checkpoint saved');
    }

    // ============================================================
    // BLOCKCHAIN MINT
    // ============================================================
    logger.info('Minting on blockchain...', { itemId, collectionId });
    await job.update({ userMessage: '⛓️ Minting on blockchain...', progress: 96 });

    let mintResult;
    try {
      mintResult = await nftService.mintNFT({
        collectionId,
        itemId,
        ownerAddress,
        metadataUri: ipfsResult.metadataUrl,
      });
    } catch (error) {
      logger.error('Blockchain mint failed', error);

      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorType: ErrorType = errorMsg.includes('timeout')
        ? 'blockchain_tx_timeout'
        : errorMsg.includes('connection')
        ? 'blockchain_connection_failed'
        : 'blockchain_tx_failed';

      await job.update({
        status: 'nft_minting_retrying',
        userMessage: `Blockchain issue. Retrying... (${metadata.attempt + 1})`,
        errorMessage: errorMsg,
        retryCount: metadata.attempt,
      });

      throw mapServiceErrorToWorkflowError(errorType, errorMsg);
    }

    if (!mintResult.success) {
      logger.error('Mint transaction failed', null, { error: mintResult.error });

      const errorType: ErrorType = mintResult.error?.includes('NotFound')
        ? 'nft_collection_not_found'
        : mintResult.error?.includes('AlreadyExists')
        ? 'blockchain_tx_failed'  // Item already exists - might be partial recovery
        : 'blockchain_tx_failed';

      // Check if "AlreadyExists" - might mean we crashed after mint
      if (mintResult.error?.includes('AlreadyExists')) {
        logger.warn('NFT already exists on-chain - checking if ours');
        const existsOnChain = await nftService.verifyNFTExists(collectionId, itemId);
        if (existsOnChain) {
          logger.info('Confirmed NFT exists - recovering');
          await job.update({
            nftTxHash: 'recovered-from-AlreadyExists',
            nftBlockHash: 'recovered',
            nftMintedAt: new Date(),
          });
          return {
            nftItemId: itemId,
            nftCollectionId: collectionId,
            metadataCID: ipfsResult.metadataCID,
            imageCID: ipfsResult.imageCID,
            modelCID: ipfsResult.modelCID,
            txHash: 'recovered-from-AlreadyExists',
            blockHash: 'recovered',
            recovered: true,
          };
        }
      }

      if (errorType === 'nft_collection_not_found') {
        await job.update({
          status: 'nft_minting_failed',
          userMessage: 'NFT collection configuration error.',
          errorMessage: mintResult.error,
        });
        throw new FatalError(mintResult.error || 'Collection not found');
      }

      await job.update({
        status: 'nft_minting_retrying',
        userMessage: `Mint failed. Retrying... (${metadata.attempt + 1})`,
        errorMessage: mintResult.error,
        retryCount: metadata.attempt,
      });

      throw mapServiceErrorToWorkflowError(errorType, mintResult.error || 'Mint failed');
    }

    logger.info('NFT minted successfully', {
      txHash: mintResult.txHash,
      blockHash: mintResult.blockHash,
    });

    // Update job with final NFT data (completion is markComplete's job)
    await job.update({
      progress: 98,
      userMessage: '✨ NFT minted! Finalizing...',
      nftTxHash: mintResult.txHash,
      nftBlockHash: mintResult.blockHash,
      nftMintedAt: new Date(),
    });

    logger.success('NFT minting complete', {
      itemId,
      collectionId,
      txHash: mintResult.txHash,
    });

    return {
      nftItemId: itemId,
      nftCollectionId: collectionId,
      metadataCID: ipfsResult.metadataCID,
      imageCID: ipfsResult.imageCID,
      modelCID: ipfsResult.modelCID,
      txHash: mintResult.txHash!,
      blockHash: mintResult.blockHash!,
    };
  } catch (error) {
    if (error instanceof RetryableError || error instanceof FatalError) {
      throw error;
    }

    logger.error('Unexpected error during NFT minting', error);

    await job.update({
      status: 'nft_minting_retrying',
      userMessage: `Unexpected error. Retrying... (${metadata.attempt + 1})`,
      errorMessage: error instanceof Error ? error.message : String(error),
      retryCount: metadata.attempt,
    });

    throw mapServiceErrorToWorkflowError(
      'unknown',
      error instanceof Error ? error.message : String(error)
    );
  }
}
