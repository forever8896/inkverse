"use step"

/**
 * Generate Image Step
 * Handles OpenAI image generation with proper error classification and retry logic
 */

import { getStepMetadata, FatalError, RetryableError } from 'workflow';
import { ProductionOpenAIService } from '@/services/production-openai-service';
import { S3Service } from '@/services/s3-service';
import { GenerationJob, type ErrorType } from '@/lib/generation-job';
import { WorkflowLogger } from '../utils/logging';
import { mapServiceErrorToWorkflowError, getRetryStatus } from '../utils/error-mapping';

export interface ImageGenerationResult {
  imageS3Key: string;
  imageUrl: string;
  cost: number;
}

export async function generateImage(
  jobId: string,
  prompt: string,
  userId: string
): Promise<ImageGenerationResult> {
  const metadata = getStepMetadata();
  const logger = new WorkflowLogger({
    jobId,
    stepName: 'generateImage',
    attempt: metadata.attempt,
    userId
  });

  logger.info('Starting image generation', { promptLength: prompt.length });

  const job = await GenerationJob.findById(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  try {
    // Update job to generating status
    await job.update({
      status: 'generating_image',
      progress: 10,
      userMessage: '🎨 Generating your monster image...',
      retryCount: metadata.attempt
    });

    // Generate image with OpenAI and upload to S3
    const openaiService = ProductionOpenAIService.getInstance();
    const result = await openaiService.generateImage(prompt, {
      saveToS3: true, // Service handles S3 upload with base64 data
      s3KeyPrefix: `monsters/${jobId}`,
      job: job
    });

    if (!result.success) {
      logger.error('Image generation failed', null, {
        errorCode: result.errorCode,
        httpStatus: result.httpStatus
      });

      // Map service error to Workflow error type
      const workflowError = mapServiceErrorToWorkflowError(
        (result.errorCode || 'unknown') as ErrorType,
        result.error || 'Image generation failed'
      );

      // Update job status based on error type
      if (workflowError instanceof FatalError) {
        await job.update({
          status: 'image_generation_failed',
          userMessage: result.error || 'Image generation failed permanently',
          errorMessage: result.error
        });
      } else {
        await job.update({
          status: getRetryStatus('generateImage'),
          userMessage: `${result.error || 'Image generation issue'}. Auto-retry ${metadata.attempt + 1}...`,
          errorMessage: result.error,
          retryCount: metadata.attempt
        });
      }

      throw workflowError;
    }

    // Verify S3 upload succeeded
    if (!result.imageS3Key) {
      logger.error('Image generated but S3 key is missing');
      throw new Error('S3 upload did not complete successfully');
    }

    logger.success('Image generated and uploaded to S3', {
      s3Key: result.imageS3Key,
      cost: result.cost
    });

    // Get S3 URL for the uploaded image
    const s3Service = S3Service.getInstance();
    const s3Url = await s3Service.getPresignedUrl(result.imageS3Key, { expiresIn: 7200 }); // 2 hours

    // Update job with image generation results
    await job.completeImageGeneration(result.imageS3Key);
    await job.update({
      progress: 40,
      userMessage: '✅ Image generated! Now creating your 3D model...'
    });

    return {
      imageS3Key: result.imageS3Key,
      imageUrl: s3Url,
      cost: result.cost || 0.04
    };

  } catch (error) {
    // Re-throw Workflow error types (already handled status above)
    if (error instanceof RetryableError || error instanceof FatalError) {
      throw error;
    }

    // Unknown error - default to retryable
    logger.error('Unexpected error during image generation', error);

    await job.update({
      status: getRetryStatus('generateImage'),
      userMessage: `Unexpected error. Auto-retry ${metadata.attempt + 1}...`,
      errorMessage: error instanceof Error ? error.message : String(error),
      retryCount: metadata.attempt
    });

    throw mapServiceErrorToWorkflowError(
      'unknown',
      error instanceof Error ? error.message : String(error)
    );
  }
}
