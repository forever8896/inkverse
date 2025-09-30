/**
 * Async Job Processor - Handles background monster generation processing
 * Integrates with existing PipelineOrchestrator and AI services
 * Supports resilient error handling and retry logic
 */

import { GenerationJob, ErrorType } from './generation-job';
import { ProductionPipelineOrchestrator, GenerationResult } from '../services/production-pipeline-orchestrator';
import { S3Service } from '../services/s3-service';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

export interface ProcessingResult {
  success: boolean;
  completed: boolean;
  shouldRetry: boolean;
  error?: string;
  nextRetryDelay?: number;
}

export class JobProcessor {
  private static instance: JobProcessor;
  private s3Service: S3Service;
  private orchestrator: ProductionPipelineOrchestrator;

  private constructor() {
    this.s3Service = S3Service.getInstance();
    this.orchestrator = ProductionPipelineOrchestrator.getInstance();
  }

  private logStructured(
    level: 'info' | 'error' | 'warn',
    stage: 'image' | '3d' | 'orchestration' | 'error',
    jobId: string,
    message: string,
    extra?: Record<string, any>
  ) {
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      stage,
      jobId,
      message,
      ...extra
    };

    const logMessage = `[${level.toUpperCase()}] [${stage}] [job:${jobId}] ${message}`;
    if (extra && Object.keys(extra).length > 0) {
      console.log(`${logMessage} |`, JSON.stringify(extra));
    } else {
      console.log(logMessage);
    }
  }

  public static getInstance(): JobProcessor {
    if (!JobProcessor.instance) {
      JobProcessor.instance = new JobProcessor();
    }
    return JobProcessor.instance;
  }

  /**
   * Process a generation job asynchronously
   * This runs in the background while the user polls for status
   */
  async processJob(job: GenerationJob): Promise<ProcessingResult> {
    // Keep original logging for readability
    console.log(`🏭 [JobProcessor] ==========================================`);
    console.log(`🏭 [JobProcessor] Starting processing for job ${job.id}`);
    console.log(`🏭 [JobProcessor] User: ${job.userId}`);
    console.log(`🏭 [JobProcessor] Prompt: "${job.prompt}"`);
    console.log(`🏭 [JobProcessor] Style: ${job.style}, Stage: ${job.stage}`);
    console.log(`🏭 [JobProcessor] Current Status: ${job.status}`);
    console.log(`🏭 [JobProcessor] Current Progress: ${job.progress}%`);
    console.log(`🏭 [JobProcessor] Retry Count: ${job.retryCount}`);
    console.log(`🏭 [JobProcessor] ==========================================`);

    // Add structured logging
    this.logStructured('info', 'orchestration', job.id, 'Job processing started', {
      userId: job.userId,
      status: job.status,
      stage: job.stage,
      progress: job.progress,
      retryCount: job.retryCount,
      style: job.style,
      promptLength: job.prompt.length
    });

    try {
      // Determine what stage to start from
      const resumeStage = this.determineStartStage(job);
      console.log(`🏭 [JobProcessor] Determined resume stage: ${resumeStage}`);
      
      switch (resumeStage) {
        case 'image':
          console.log(`🎨 [JobProcessor] → Starting IMAGE GENERATION stage`);
          return await this.processImageGeneration(job);
        case '3d':
          console.log(`🎯 [JobProcessor] → Starting 3D CONVERSION stage`);
          return await this.process3DConversion(job);
        default:
          console.log(`⚠️  [JobProcessor] → Job cannot be processed (status: ${job.status})`);
          return {
            success: false,
            completed: false,
            shouldRetry: false,
            error: 'Job is already completed or in invalid state'
          };
      }

    } catch (error) {
      console.error(`❌ [JobProcessor] UNEXPECTED ERROR processing job ${job.id}:`);
      console.error(`❌ [JobProcessor] Error type: ${error?.constructor?.name}`);
      console.error(`❌ [JobProcessor] Error message: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`❌ [JobProcessor] Stack trace:`, error);

      // Add structured error logging
      this.logStructured('error', 'error', job.id, 'Unexpected error in job processing', {
        errorType: error?.constructor?.name || 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        userId: job.userId,
        stage: job.stage,
        retryCount: job.retryCount,
        canRetry: job.canRetry(),
        status: job.status
      });

      await job.handleError('unknown', error instanceof Error ? error.message : String(error));

      return {
        success: false,
        completed: false,
        shouldRetry: job.canRetry(),
        nextRetryDelay: job.getSecondsUntilRetry()
      };
    }
  }

  /**
   * Process image generation stage
   */
  private async processImageGeneration(job: GenerationJob): Promise<ProcessingResult> {
    console.log(`🎨 [JobProcessor] ========================================`);
    console.log(`🎨 [JobProcessor] PROCESSING IMAGE GENERATION`);
    console.log(`🎨 [JobProcessor] Job ID: ${job.id}`);
    console.log(`🎨 [JobProcessor] ========================================`);

    try {
      // Update progress to indicate we're starting
      console.log(`💾 [JobProcessor] Updating job status to 'generating_image'...`);
      await job.update({
        status: 'generating_image',
        progress: 10,
        userMessage: '🎨 Generating your monster image...'
      });
      console.log(`✅ [JobProcessor] Job status updated successfully`);

      // Generate the image using production pipeline
      console.log(`🤖 [JobProcessor] Calling ProductionPipelineOrchestrator.generateImageOnly()...`);
      console.log(`🤖 [JobProcessor] Parameters:`);
      console.log(`🤖 [JobProcessor]   - prompt: "${job.prompt}"`);
      console.log(`🤖 [JobProcessor]   - jobId: ${job.id}`);
      console.log(`🤖 [JobProcessor]   - saveToS3: true`);

      // Structured logging for image generation start
      this.logStructured('info', 'image', job.id, 'Starting OpenAI image generation', {
        provider: 'OpenAI',
        promptLength: job.prompt.length,
        userId: job.userId,
        retryCount: job.retryCount
      });

      const startTime = Date.now();
      const result = await this.orchestrator.generateImageOnly(job.prompt, job.id, job);
      const duration = Date.now() - startTime;
      
      console.log(`🔄 [JobProcessor] ProductionPipelineOrchestrator completed in ${duration}ms`);
      console.log(`🔄 [JobProcessor] Result success: ${result.success}`);
      console.log(`🔄 [JobProcessor] Result cost: $${result.totalCost}`);
      if (result.imageS3Key) {
        console.log(`🔄 [JobProcessor] Image S3 key: ${result.imageS3Key}`);
      }
      if (result.imageUrl) {
        console.log(`🔄 [JobProcessor] Image URL: ${result.imageUrl}`);
      }
      if (result.error) {
        console.log(`🔄 [JobProcessor] Error: ${result.error}`);
      }

      // Structured logging for image generation result
      this.logStructured(result.success ? 'info' : 'error', 'image', job.id,
        result.success ? 'OpenAI image generation completed' : 'OpenAI image generation failed', {
          provider: 'OpenAI',
          success: result.success,
          duration,
          cost: result.totalCost,
          hasImageS3Key: !!result.imageS3Key,
          hasImageUrl: !!result.imageUrl,
          errorMessage: result.error || null,
          userId: job.userId
        });

      if (!result.success || !result.imageS3Key) {
        console.error(`❌ [JobProcessor] IMAGE GENERATION FAILED`);
        console.error(`❌ [JobProcessor] Success: ${result.success}`);
        console.error(`❌ [JobProcessor] Image S3 key exists: ${!!result.imageS3Key}`);
        console.error(`❌ [JobProcessor] Error message: ${result.error || 'Unknown error'}`);
        
        // Handle specific errors
        const errorType = this.classifyImageGenerationError(result.error || 'Unknown error', result);
        console.log(`🔍 [JobProcessor] Classified error as: ${errorType}`);

        // Structured logging for error classification
        this.logStructured('warn', 'image', job.id, 'Image generation error classified', {
          errorType,
          originalError: result.error || 'Unknown error',
          provider: 'OpenAI',
          retryCount: job.retryCount,
          canRetryAfter: job.canRetry(),
          userId: job.userId,
          structuredErrorCode: result.errorCode || null,
          httpStatus: result.httpStatus || null
        });

        await job.handleError(errorType, result.error || 'Image generation failed');
        console.log(`💾 [JobProcessor] Error handled, job updated`);
        
        return {
          success: false,
          completed: false,
          shouldRetry: job.canRetry(),
          nextRetryDelay: job.getSecondsUntilRetry()
        };
      }

      // Image generation successful - already uploaded to S3
      console.log(`📋 [JobProcessor] IMAGE GENERATION SUCCESSFUL!`);
      console.log(`📋 [JobProcessor] Image S3 key: ${result.imageS3Key}`);

      // Update job with image results
      console.log(`💾 [JobProcessor] Updating job with image completion...`);
      try {
        await job.completeImageGeneration(result.imageS3Key!);
        console.log(`✅ [JobProcessor] Job image completion updated`);
      } catch (error) {
        console.error(`❌ [JobProcessor] Failed to complete image generation (S3 error):`, error);
        await job.handleError('s3_upload_error', error instanceof Error ? error.message : String(error));
        return {
          success: false,
          completed: false,
          shouldRetry: job.canRetry(),
          nextRetryDelay: job.getSecondsUntilRetry()
        };
      }

      await job.update({
        totalCost: result.totalCost,
        userMessage: '✅ Image generated! Now creating your 3D model...'
      });
      console.log(`✅ [JobProcessor] Job cost and message updated`);
      console.log(`💰 [JobProcessor] Total cost so far: $${result.totalCost}`);

      // Continue to 3D conversion
      return await this.process3DConversion(job);

    } catch (error) {
      console.error(`[JobProcessor] Image generation failed for job ${job.id}:`, error);

      const errorType = this.classifyImageGenerationError(error instanceof Error ? error.message : String(error));
      await job.handleError(errorType, error instanceof Error ? error.message : String(error));
      
      return {
        success: false,
        completed: false,
        shouldRetry: job.canRetry(),
        nextRetryDelay: job.getSecondsUntilRetry()
      };
    }
  }

  /**
   * Process 3D conversion stage
   */
  private async process3DConversion(job: GenerationJob): Promise<ProcessingResult> {
    console.log(`🎯 [JobProcessor] ========================================`);
    console.log(`🎯 [JobProcessor] PROCESSING 3D CONVERSION`);
    console.log(`🎯 [JobProcessor] Job ID: ${job.id}`);
    console.log(`🎯 [JobProcessor] ========================================`);

    try {
      // Update progress to indicate we're starting 3D conversion
      console.log(`💾 [JobProcessor] Updating job status to 'converting_3d'...`);
      await job.start3DConversion();
      console.log(`✅ [JobProcessor] Job status updated to converting_3d`);
      
      await job.update({
        userMessage: '🎯 Converting your image to 3D model...'
      });
      console.log(`✅ [JobProcessor] User message updated`);

      // Use production orchestrator for 3D conversion
      if (!job.imageS3Key) {
        console.error(`❌ [JobProcessor] No image S3 key found for job ${job.id}`);
        throw new Error('No image S3 key found for 3D conversion');
      }
      
      console.log(`🤖 [JobProcessor] Calling ProductionPipelineOrchestrator.convertImageTo3D()...`);
      console.log(`🤖 [JobProcessor] Parameters:`);
      console.log(`🤖 [JobProcessor]   - imageS3Key: ${job.imageS3Key}`);
      console.log(`🤖 [JobProcessor]   - jobId: ${job.id}`);

      // Structured logging for 3D conversion start
      this.logStructured('info', '3d', job.id, 'Starting fal.ai 3D conversion', {
        provider: 'fal.ai',
        imageS3Key: job.imageS3Key,
        userId: job.userId,
        retryCount: job.retryCount
      });

      const conversionStartTime = Date.now();
      const result = await this.orchestrator.convertImageTo3D(job.imageS3Key, job.id);
      const conversionDuration = Date.now() - conversionStartTime;
      
      console.log(`🔄 [JobProcessor] 3D conversion completed in ${conversionDuration}ms`);
      console.log(`🔄 [JobProcessor] Result success: ${result.success}`);
      console.log(`🔄 [JobProcessor] Result cost: $${result.totalCost || 0}`);
      if (result.glbS3Key) {
        console.log(`🔄 [JobProcessor] 3D model S3 key: ${result.glbS3Key}`);
      }
      if (result.glbUrl) {
        console.log(`🔄 [JobProcessor] 3D model URL: ${result.glbUrl}`);
      }
      if (result.error) {
        console.log(`🔄 [JobProcessor] Error: ${result.error}`);
      }

      // Structured logging for 3D conversion result
      this.logStructured(result.success ? 'info' : 'error', '3d', job.id,
        result.success ? 'fal.ai 3D conversion completed' : 'fal.ai 3D conversion failed', {
          provider: 'fal.ai',
          success: result.success,
          duration: conversionDuration,
          cost: result.totalCost || 0,
          hasGlbS3Key: !!result.glbS3Key,
          hasGlbUrl: !!result.glbUrl,
          errorMessage: result.error || null,
          userId: job.userId
        });

      if (!result.success || !result.glbS3Key) {
        console.error(`❌ [JobProcessor] 3D CONVERSION FAILED`);
        console.error(`❌ [JobProcessor] Success: ${result.success}`);
        console.error(`❌ [JobProcessor] GLB S3 key exists: ${!!result.glbS3Key}`);
        console.error(`❌ [JobProcessor] Error message: ${result.error || 'Unknown error'}`);
        
        const errorType = this.classify3DConversionError(result.error || 'Unknown error', result);
        console.log(`🔍 [JobProcessor] Classified error as: ${errorType}`);

        // Structured logging for error classification
        this.logStructured('warn', '3d', job.id, '3D conversion error classified', {
          errorType,
          originalError: result.error || 'Unknown error',
          provider: 'fal.ai',
          retryCount: job.retryCount,
          canRetryAfter: job.canRetry(),
          userId: job.userId,
          structuredErrorCode: result.errorCode || null,
          httpStatus: result.httpStatus || null
        });

        await job.handleError(errorType, result.error || '3D conversion failed');
        console.log(`💾 [JobProcessor] Error handled, job updated`);
        
        return {
          success: false,
          completed: false,
          shouldRetry: job.canRetry(),
          nextRetryDelay: job.getSecondsUntilRetry()
        };
      }

      // 3D conversion successful - already uploaded to S3
      console.log(`📋 [JobProcessor] 3D CONVERSION SUCCESSFUL!`);
      console.log(`📋 [JobProcessor] 3D model S3 key: ${result.glbS3Key}`);

      // Complete the job
      console.log(`💾 [JobProcessor] Completing 3D conversion in database...`);
      try {
        await job.complete3DConversion(result.glbS3Key!);
        console.log(`✅ [JobProcessor] 3D conversion completion updated`);
      } catch (error) {
        console.error(`❌ [JobProcessor] Failed to complete 3D conversion (S3 error):`, error);
        await job.handleError('s3_upload_error', error instanceof Error ? error.message : String(error));
        return {
          success: false,
          completed: false,
          shouldRetry: job.canRetry(),
          nextRetryDelay: job.getSecondsUntilRetry()
        };
      }

      const finalCost = job.totalCost + result.totalCost;
      console.log(`💰 [JobProcessor] Final total cost: $${finalCost}`);
      await job.complete(finalCost);
      console.log(`✅ [JobProcessor] Job marked as complete`);

      await job.update({
        userMessage: '🎉 Your monster is ready! Click to view your 3D creature.'
      });
      console.log(`✅ [JobProcessor] Final success message updated`);

      console.log(`🎉 [JobProcessor] ========================================`);
      console.log(`🎉 [JobProcessor] JOB COMPLETED SUCCESSFULLY!`);
      console.log(`🎉 [JobProcessor] Job ID: ${job.id}`);
      console.log(`🎉 [JobProcessor] Total Cost: $${finalCost}`);
      console.log(`🎉 [JobProcessor] Image S3 Key: ${job.imageS3Key}`);
      console.log(`🎉 [JobProcessor] Model S3 Key: ${result.glbS3Key}`);
      console.log(`🎉 [JobProcessor] ========================================`);

      // Structured logging for successful completion
      this.logStructured('info', 'orchestration', job.id, 'Job completed successfully', {
        userId: job.userId,
        totalCost: finalCost,
        imageS3Key: job.imageS3Key,
        glbS3Key: result.glbS3Key,
        finalStatus: 'completed'
      });

      return {
        success: true,
        completed: true,
        shouldRetry: false
      };

    } catch (error) {
      console.error(`[JobProcessor] 3D conversion failed for job ${job.id}:`, error);

      const errorType = this.classify3DConversionError(error instanceof Error ? error.message : String(error));
      await job.handleError(errorType, error instanceof Error ? error.message : String(error));
      
      return {
        success: false,
        completed: false,
        shouldRetry: job.canRetry(),
        nextRetryDelay: job.getSecondsUntilRetry()
      };
    }
  }

  /**
   * Determine which stage to start processing from
   */
  private determineStartStage(job: GenerationJob): 'image' | '3d' | null {
    // If job is completed, don't process
    if (job.status === 'completed') {
      return null;
    }

    // If job has failed permanently and can't retry, don't process
    if ((job.status === 'image_generation_failed' || job.status === 'conversion_failed') && !job.canRetry()) {
      return null;
    }

    // If we have a 3D model, job is already complete
    if (job.glbS3Key) {
      return null;
    }

    // If we have an image but no 3D model, start from 3D conversion
    if (job.imageS3Key) {
      return '3d';
    }

    // Otherwise, start from image generation
    return 'image';
  }

  /**
   * Classify image generation errors for appropriate handling
   * Now prefers structured error codes from services, falls back to message substring matching
   */
  private classifyImageGenerationError(errorMessage: string, result?: any): ErrorType {
    // Prefer structured error code from service if available
    if (result?.errorCode) {
      return result.errorCode as ErrorType;
    }

    // Fallback to substring matching (existing behavior)
    const message = errorMessage.toLowerCase();

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'openai_rate_limit';
    }

    if (message.includes('content policy') || message.includes('safety') || message.includes('inappropriate')) {
      return 'openai_content_policy';
    }

    if (message.includes('timeout') || message.includes('connection')) {
      return 'openai_network_timeout';
    }

    if (message.includes('s3') || message.includes('upload failed')) {
      return 's3_upload_error';
    }

    if (message.includes('openai') || message.includes('api')) {
      return 'openai_api_error';
    }

    return 'unknown';
  }

  /**
   * Classify 3D conversion errors for appropriate handling
   * Now prefers structured error codes from services, falls back to message substring matching
   */
  private classify3DConversionError(errorMessage: string, result?: any): ErrorType {
    // Prefer structured error code from service if available
    if (result?.errorCode) {
      return result.errorCode as ErrorType;
    }

    // Fallback to substring matching (existing behavior)
    const message = errorMessage.toLowerCase();

    if (message.includes('overloaded') || message.includes('busy') || message.includes('queue')) {
      return 'fal_overloaded';
    }

    if (message.includes('timeout') || message.includes('connection')) {
      return 'fal_network_timeout';
    }

    if (message.includes('s3') || message.includes('upload failed') || message.includes('download')) {
      return 's3_upload_error';
    }

    if (message.includes('fal') || message.includes('api')) {
      return 'fal_api_error';
    }

    return 'unknown';
  }

  /**
   * Check if enough time has passed for a retry
   */
  canRetryNow(job: GenerationJob): boolean {
    return job.canRetry() && job.getSecondsUntilRetry() <= 0;
  }
}