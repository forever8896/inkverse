"use step"

/**
 * Convert to 3D Step
 * Handles fal.ai 3D conversion with proper error classification and retry logic
 */

import { getStepMetadata, FatalError, RetryableError } from 'workflow';
import { ProductionFalService } from '@/services/production-fal-service';
import { S3Service } from '@/services/s3-service';
import { GenerationJob, type ErrorType } from '@/lib/generation-job';
import { WorkflowLogger } from '../utils/logging';
import { mapServiceErrorToWorkflowError, getRetryStatus } from '../utils/error-mapping';

export interface Conversion3DResult {
  glbS3Key: string;
  glbUrl: string;
  cost: number;
}

export async function convert3D(
  jobId: string,
  imageS3Key: string,
  userId: string
): Promise<Conversion3DResult> {
  const metadata = getStepMetadata();
  const logger = new WorkflowLogger({
    jobId,
    stepName: 'convert3D',
    attempt: metadata.attempt,
    userId
  });

  logger.info('Starting 3D conversion', { imageS3Key });

  const job = await GenerationJob.findById(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  try {
    // Update job to converting status
    await job.update({
      status: 'converting_3d',
      progress: 50,
      userMessage: '🎯 Converting your image to 3D model...',
      retryCount: metadata.attempt
    });

    // Download image from S3
    const s3Service = S3Service.getInstance();
    logger.info('Downloading image from S3', { imageS3Key });

    const imageBuffer = await s3Service.downloadFile(imageS3Key);
    logger.info('Image downloaded successfully', { size: imageBuffer.length });

    // Convert to 3D with fal.ai
    const falService = ProductionFalService.getInstance();
    const result = await falService.convertImageTo3D(imageBuffer, {
      saveToS3: false, // We'll handle S3 upload separately for idempotency
      job: job
    });

    if (!result.success) {
      logger.error('3D conversion failed', null, {
        errorCode: result.errorCode,
        httpStatus: result.httpStatus
      });

      // Map service error to Workflow error type
      const workflowError = mapServiceErrorToWorkflowError(
        (result.errorCode || 'unknown') as ErrorType,
        result.error || '3D conversion failed'
      );

      // Update job status based on error type
      if (workflowError instanceof FatalError) {
        await job.update({
          status: 'conversion_failed',
          userMessage: result.error || '3D conversion failed permanently',
          errorMessage: result.error
        });
      } else {
        await job.update({
          status: getRetryStatus('convert3D'),
          userMessage: `${result.error || '3D conversion issue'}. Auto-retry ${metadata.attempt + 1}...`,
          errorMessage: result.error,
          retryCount: metadata.attempt
        });
      }

      throw workflowError;
    }

    // 3D model generated successfully - now upload to S3 with idempotency
    if (!result.glbUrl) {
      logger.error('3D model generated but URL is missing');
      throw new Error('GLB URL is missing from conversion result');
    }

    logger.info('3D model generated successfully, downloading for S3 upload');

    // Download GLB model from fal.ai URL
    const response = await fetch(result.glbUrl);
    if (!response.ok) {
      throw new Error(`Failed to download GLB model: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const modelBuffer = Buffer.from(arrayBuffer);

    logger.info('GLB model downloaded, uploading to S3', {
      size: modelBuffer.length
    });

    // Upload to S3 with idempotency metadata
    const s3Key = `monsters/${jobId}.glb`;

    const uploadResult = await s3Service.uploadFile(
      s3Key,
      modelBuffer,
      'model/gltf-binary',
      {
        metadata: { idempotencyKey: metadata.stepId },
        expiresIn: 7200 // 2 hours
      }
    );

    if (!uploadResult.success) {
      logger.error('S3 upload failed', null, { error: uploadResult.error });

      await job.update({
        status: getRetryStatus('convert3D'),
        userMessage: 'Storage upload issue. Retrying...',
        errorMessage: uploadResult.error,
        retryCount: metadata.attempt
      });

      // S3 upload errors are retryable
      throw mapServiceErrorToWorkflowError('s3_upload_error', uploadResult.error || 'S3 upload failed');
    }

    logger.success('GLB model uploaded to S3', {
      s3Key: uploadResult.key,
      cost: result.cost
    });

    // Update job with 3D conversion results
    await job.complete3DConversion(uploadResult.key);
    await job.update({
      progress: 90,
      userMessage: '✨ 3D model ready! Finalizing...'
    });

    return {
      glbS3Key: uploadResult.key,
      glbUrl: uploadResult.url,
      cost: result.cost || 0.30
    };

  } catch (error) {
    // Re-throw Workflow error types (already handled status above)
    if (error instanceof RetryableError || error instanceof FatalError) {
      throw error;
    }

    // Unknown error - default to retryable
    logger.error('Unexpected error during 3D conversion', error);

    await job.update({
      status: getRetryStatus('convert3D'),
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
