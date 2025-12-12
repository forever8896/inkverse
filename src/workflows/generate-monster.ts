"use workflow"

/**
 * Main Monster Generation Workflow
 * Orchestrates the complete pipeline:
 *   prerequisites → storage → image → 3D → NFT minting → completion
 *
 * This workflow is durable and survives Vercel function timeouts through event sourcing.
 * Each step is automatically retried on failure with proper error handling.
 */

import { checkNFTPrerequisites } from './steps/check-nft-prerequisites';
import { checkStorage } from './steps/check-storage';
import { generateImage, type ImageGenerationResult } from './steps/generate-image';
import { convert3D, type Conversion3DResult } from './steps/convert-3d';
import { mintNFT, type MintNFTResult } from './steps/mint-nft';
import { markComplete, type CompleteJobResult } from './steps/mark-complete';
import { type GenerationType } from '@/lib/generation-job';

export interface GenerateMonsterInput {
  jobId: string;
  userId: string;
  prompt: string;
  generationType: GenerationType;
}

export interface GenerateMonsterResult {
  jobId: string;
  imageS3Key: string;
  imageUrl: string;
  glbS3Key?: string;
  glbUrl?: string;
  totalCost: number;
  completedAt: Date;
  // NFT fields
  nftItemId?: number;
  nftCollectionId?: number;
  nftTxHash?: string;
}

/**
 * Main workflow function
 * Note: "use workflow" directive means this function runs in sandboxed environment
 * - No direct database access
 * - No direct external API calls
 * - All heavy lifting done in "use step" functions
 *
 * IMPORTANT: Must be a named export, not default export, for Vercel Workflow bundler
 */
export async function generateMonster(
  input: GenerateMonsterInput
): Promise<GenerateMonsterResult> {
  const { jobId, userId, prompt, generationType } = input;

  // Step 0: Check NFT prerequisites (IPFS, blockchain, platform balance)
  // Fail fast if NFT services are unavailable before expensive operations
  await checkNFTPrerequisites(jobId);

  // Step 1: Check S3 storage availability
  // This is a pre-flight check to fail fast if storage is down
  await checkStorage(jobId);

  // Step 2: Generate image with OpenAI
  // Includes automatic retry logic for rate limits, network issues, etc.
  const imageResult: ImageGenerationResult = await generateImage(jobId, prompt, userId);

  let glbResult: Conversion3DResult | null = null;

  // Step 3: Convert to 3D (only for 'full' generation type)
  if (generationType === 'full') {
    glbResult = await convert3D(jobId, imageResult.imageS3Key, userId);
  }

  // Step 4: Mint NFT (upload to IPFS + blockchain mint)
  // Single responsibility: only handles IPFS and minting, not completion
  const nftResult: MintNFTResult = await mintNFT(jobId);

  // Step 5: Mark job as complete in database
  const completeResult: CompleteJobResult = await markComplete(
    jobId,
    imageResult.imageS3Key,
    glbResult?.glbS3Key || '',
    imageResult.cost,
    glbResult?.cost || 0
  );

  // Return final result
  return {
    jobId: completeResult.jobId,
    imageS3Key: imageResult.imageS3Key,
    imageUrl: imageResult.imageUrl,
    glbS3Key: glbResult?.glbS3Key,
    glbUrl: glbResult?.glbUrl,
    totalCost: completeResult.totalCost,
    completedAt: completeResult.completedAt,
    // NFT fields
    nftItemId: nftResult.nftItemId,
    nftCollectionId: nftResult.nftCollectionId,
    nftTxHash: nftResult.txHash,
  };
}
