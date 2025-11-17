"use workflow"

/**
 * Main Monster Generation Workflow
 * Orchestrates the complete pipeline: storage check → image generation → 3D conversion → completion
 *
 * This workflow is durable and survives Vercel function timeouts through event sourcing.
 * Each step is automatically retried on failure with proper error handling.
 */

import { checkStorage } from './steps/check-storage';
import { generateImage, type ImageGenerationResult } from './steps/generate-image';
import { convert3D, type Conversion3DResult } from './steps/convert-3d';
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

  // Step 4: Mark job as complete in database
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
    completedAt: completeResult.completedAt
  };
}
