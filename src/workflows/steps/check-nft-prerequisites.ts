"use step"

/**
 * Check NFT Prerequisites Step
 * Pre-flight check for IPFS and blockchain connectivity before starting generation
 */

import { FatalError, getStepMetadata } from 'workflow';
import { GenerationJob } from '@/lib/generation-job';
import { NFTMetadataService } from '@/services/nft-metadata-service';
import { NFTsPalletService } from '@/services/nfts-pallet-service';
import { WorkflowLogger } from '../utils/logging';

export interface NFTPrerequisitesResult {
  ipfsOk: boolean;
  blockchainOk: boolean;
  platformBalanceOk: boolean;
}

export async function checkNFTPrerequisites(
  jobId: string
): Promise<NFTPrerequisitesResult> {
  const metadata = getStepMetadata();
  const logger = new WorkflowLogger({
    jobId,
    stepName: 'checkNFTPrerequisites',
    attempt: metadata.attempt,
  });

  logger.info('Checking NFT prerequisites');

  const job = await GenerationJob.findById(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  try {
    await job.update({
      status: 'checking_prerequisites',
      progress: 2,
      userMessage: 'Checking NFT services...',
    });

    // 1. Check IPFS (Pinata) connectivity
    logger.info('Checking IPFS connectivity...');
    const ipfsService = NFTMetadataService.getInstance();
    const ipfsResult = await ipfsService.testConnectivity();

    if (!ipfsResult.ok) {
      logger.error('IPFS unavailable', null, { error: ipfsResult.error });
      await job.update({
        status: 'prerequisites_failed',
        userMessage: 'IPFS storage is temporarily unavailable.',
        errorMessage: ipfsResult.error,
      });
      throw new FatalError(`IPFS unavailable: ${ipfsResult.error}`);
    }
    logger.info('IPFS OK');

    // 2. Check blockchain connectivity
    logger.info('Checking blockchain connectivity...');
    const nftService = NFTsPalletService.getInstance();
    const rpcResult = await nftService.testConnectivity();

    if (!rpcResult.ok) {
      logger.error('Blockchain unavailable', null, { error: rpcResult.error });
      await job.update({
        status: 'prerequisites_failed',
        userMessage: 'Blockchain is temporarily unavailable.',
        errorMessage: rpcResult.error,
      });
      throw new FatalError(`Blockchain unavailable: ${rpcResult.error}`);
    }
    logger.info('Blockchain OK');

    // 3. Check platform account balance
    logger.info('Checking platform balance...');
    const balanceResult = await nftService.checkBalance();

    if (!balanceResult.ok) {
      logger.error('Platform insufficient funds', null, { error: balanceResult.error });
      await job.update({
        status: 'prerequisites_failed',
        userMessage: 'Platform is temporarily unable to mint NFTs.',
        errorMessage: balanceResult.error,
      });
      throw new FatalError(`Platform balance check failed: ${balanceResult.error}`);
    }
    logger.info('Platform balance OK');

    logger.success('All NFT prerequisites passed');

    return {
      ipfsOk: true,
      blockchainOk: true,
      platformBalanceOk: true,
    };
  } catch (error) {
    if (error instanceof FatalError) {
      throw error;
    }

    logger.error('Unexpected error during prerequisites check', error);
    await job.update({
      status: 'prerequisites_failed',
      userMessage: 'Failed to verify NFT services.',
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw new FatalError(
      `Prerequisites check failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
