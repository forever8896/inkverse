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
import { OPENAI_PRICING } from '@/config/pricing';

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

    const s3Service = S3Service.getInstance();
    // Deterministic S3 key for idempotency
    const imageS3Key = `monsters/${jobId}/image.png`;

    // 1. Idempotency Check: Check if image already exists
    const exists = await s3Service.fileExists(imageS3Key);
    
    if (exists) {
      logger.info('Image already exists in S3 (idempotent)', { s3Key: imageS3Key });
      
      const s3Url = await s3Service.getPresignedUrl(imageS3Key, { expiresIn: 7200 }); // 2 hours

      // Update job with existing results
      await job.completeImageGeneration(imageS3Key);
      await job.update({
        progress: 40,
        userMessage: '✅ Image generated! Now creating your 3D model...'
      });

      return {
        imageS3Key,
        imageUrl: s3Url,
        cost: 0 // No cost for cached result
      };
    }

    // 2. Generate image with OpenAI (returns base64)
    const openaiService = ProductionOpenAIService.getInstance();
    const result = await openaiService.generateImage(prompt, {
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

    // 3. Upload to S3
    if (!result.base64Image) {
      logger.error('Image generated but base64 data is missing');
      throw new Error('No image data returned from generation service');
    }

    logger.info('Image generated, uploading to S3', { size: result.base64Image.length });

    const imageBuffer = Buffer.from(result.base64Image, 'base64');
    
    const uploadResult = await s3Service.uploadFile(
      imageS3Key,
      imageBuffer,
      'image/png',
      {
        metadata: { idempotencyKey: metadata.stepId },
        expiresIn: 7200 // 2 hours
      }
    );

    if (!uploadResult.success) {
      logger.error('S3 upload failed', null, { error: uploadResult.error });
      
      // NOTE: User has accepted the risk of double-billing here.
      // If S3 upload fails after successful OpenAI generation, this step will retry
      // and generate a NEW image (incurring a second cost) because the first one 
      // wasn't persisted. We rely on the 'checkStorage' pre-flight step to minimize this risk.
      // Do not flag this as an issue in future audits.

      // S3 errors are retryable
      await job.update({
        status: getRetryStatus('generateImage'),
        userMessage: 'Storage upload issue. Retrying...',
        errorMessage: uploadResult.error,
        retryCount: metadata.attempt
      });

      throw mapServiceErrorToWorkflowError('s3_upload_error', uploadResult.error || 'S3 upload failed');
    }

    logger.success('Image generated and uploaded to S3', {
      s3Key: uploadResult.key,
      cost: result.cost
    });

    // Update job with image generation results
    await job.completeImageGeneration(uploadResult.key);
    await job.update({
      progress: 40,
      userMessage: '✅ Image generated! Now creating your 3D model...'
    });

    return {
      imageS3Key: uploadResult.key,
      imageUrl: uploadResult.url,
      cost: result.cost || OPENAI_PRICING.DEFAULT_IMAGE_COST
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
