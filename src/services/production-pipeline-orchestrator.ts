/**
 * Production Pipeline Orchestrator
 * Coordinates OpenAI image generation → fal.ai 3D conversion using production services
 * Integrates with S3 storage and proper error handling
 */

import { ProductionOpenAIService } from './production-openai-service';
import { ProductionFalService } from './production-fal-service';
import { S3Service } from './s3-service';
import { GenerationJob } from '../lib/generation-job';

export interface GenerationResult {
  id: string;
  success: boolean;
  prompt: string;
  imageS3Key?: string;
  imageUrl?: string;
  glbS3Key?: string;
  glbUrl?: string;
  totalCost: number;
  duration: number; // milliseconds
  error?: string;
  errorCode?: string; // Structured error code for better classification
  httpStatus?: number; // HTTP status from API call
  timestamp: Date;
}

export interface GenerationOptions {
  jobId?: string; // Use job ID for S3 keys
  customPrompt?: string;
  saveToS3?: boolean;
  job?: GenerationJob; // Optional job for cost tracking
}

/**
 * Production orchestrator that coordinates the AI pipeline with S3 integration
 */
export class ProductionPipelineOrchestrator {
  private static instance: ProductionPipelineOrchestrator;
  private openaiService: ProductionOpenAIService;
  private falService: ProductionFalService;
  private s3Service: S3Service;
  
  private constructor() {
    this.openaiService = ProductionOpenAIService.getInstance();
    this.falService = ProductionFalService.getInstance();
    this.s3Service = S3Service.getInstance();
  }

  public static getInstance(): ProductionPipelineOrchestrator {
    if (!ProductionPipelineOrchestrator.instance) {
      ProductionPipelineOrchestrator.instance = new ProductionPipelineOrchestrator();
    }
    return ProductionPipelineOrchestrator.instance;
  }

  /**
   * Generate a complete monster: prompt → image → 3D model with S3 storage
   * 
   * WARNING: Costs ~$0.70 per generation
   */
  async generateMonster(options: GenerationOptions = {}): Promise<GenerationResult> {
    const startTime = Date.now();
    const generationId = options.jobId || crypto.randomUUID();
    
    const result: GenerationResult = {
      id: generationId,
      success: false,
      prompt: options.customPrompt || '',
      totalCost: 0,
      duration: 0,
      timestamp: new Date(),
    };

    try {
      console.log(`🏭 [ProductionPipeline] ==========================================`);
      console.log(`🏭 [ProductionPipeline] Starting generation ${generationId}`);
      console.log(`🏭 [ProductionPipeline] Using prompt: "${result.prompt.substring(0, 100)}..."`);
      console.log(`🏭 [ProductionPipeline] Save to S3: ${options.saveToS3 !== false}`);
      console.log(`🏭 [ProductionPipeline] ==========================================`);

      if (!options.customPrompt) {
        throw new Error('Custom prompt is required');
      }

      // Step 1: Generate image with OpenAI
      console.log(`🏭 [ProductionPipeline] Step 1: Generating image with OpenAI...`);
      const imageResult = await this.openaiService.generateImage(options.customPrompt, {
        job: options.job
      });

      if (!imageResult.success) {
        throw new Error(`Image generation failed: ${imageResult.error}`);
      }

      // Handle S3 upload manually
      if (options.saveToS3 !== false && imageResult.base64Image) {
        const s3Key = `monsters/${generationId}/image.png`;
        console.log(`🏭 [ProductionPipeline] Uploading image to S3: ${s3Key}`);
        
        const imageBuffer = Buffer.from(imageResult.base64Image, 'base64');
        const uploadResult = await this.s3Service.uploadFile(s3Key, imageBuffer, 'image/png');
        
        if (!uploadResult.success) {
           throw new Error(`S3 upload failed: ${uploadResult.error}`);
        }
        
        result.imageS3Key = uploadResult.key;
        result.imageUrl = uploadResult.url;
      } else {
        result.imageUrl = imageResult.imageUrl;
      }

      result.totalCost += imageResult.cost || 0;

      console.log(`✅ [ProductionPipeline] Image generated successfully`);
      console.log(`✅ [ProductionPipeline] Image S3 key: ${result.imageS3Key || 'none'}`);
      console.log(`✅ [ProductionPipeline] Image URL: ${result.imageUrl ? 'present' : 'none'}`);

      // Step 2: Convert to 3D with fal.ai
      console.log(`🏭 [ProductionPipeline] Step 2: Converting to 3D with fal.ai...`);
      
      let imageBuffer: Buffer;

      if (options.saveToS3 === false && imageResult.base64Image) {
        console.log(`🏭 [ProductionPipeline] Using in-memory base64 image (S3 skipped)`);
        imageBuffer = Buffer.from(imageResult.base64Image, 'base64');
      } else {
        if (!result.imageS3Key) {
          throw new Error('No image S3 key available for 3D conversion');
        }
        // Download image from S3 for fal.ai processing
        console.log(`🏭 [ProductionPipeline] Downloading image from S3: ${result.imageS3Key}`);
        imageBuffer = await this.s3Service.downloadFile(result.imageS3Key);
        console.log(`🏭 [ProductionPipeline] Downloaded ${imageBuffer.length} bytes`);
      }

      const modelResult = await this.falService.convertImageTo3D(imageBuffer, {
        job: options.job
      });

      if (!modelResult.success) {
        throw new Error(`3D conversion failed: ${modelResult.error}`);
      }

      // Handle S3 upload manually
      if (options.saveToS3 !== false && modelResult.glbUrl) {
        const s3Key = `monsters/${generationId}/model.glb`;
        console.log(`🏭 [ProductionPipeline] Uploading model to S3: ${s3Key}`);
        
        const uploadResult = await this.s3Service.uploadFromUrl(s3Key, modelResult.glbUrl, 'model/gltf-binary');
        
        if (!uploadResult.success) {
           throw new Error(`S3 upload failed: ${uploadResult.error}`);
        }
        
        result.glbS3Key = uploadResult.key;
        result.glbUrl = uploadResult.url;
      } else {
        result.glbUrl = modelResult.glbUrl;
      }

      result.totalCost += modelResult.cost || 0;

      // Step 3: Success
      result.success = true;
      result.duration = Date.now() - startTime;

      console.log(`🎉 [ProductionPipeline] Generation ${generationId} completed successfully`);
      console.log(`🎉 [ProductionPipeline] Total cost: $${result.totalCost.toFixed(4)}, Duration: ${result.duration}ms`);
      console.log(`🎉 [ProductionPipeline] Image S3: ${result.imageS3Key}`);
      console.log(`🎉 [ProductionPipeline] Model S3: ${result.glbS3Key}`);

      return result;

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;

      // If the error came from a service call that failed, it might have structured error info
      if (error instanceof Error && (error as any).serviceResult) {
        const serviceResult = (error as any).serviceResult;
        result.errorCode = serviceResult.errorCode;
        result.httpStatus = serviceResult.httpStatus;
      }

      console.error(`❌ [ProductionPipeline] Generation ${generationId} failed:`, result.error);
      console.error(`❌ [ProductionPipeline] Duration: ${result.duration}ms`);
      console.error(`❌ [ProductionPipeline] Total cost so far: $${result.totalCost.toFixed(4)}`);

      return result;
    }
  }

  /**
   * Generate only an image (for testing or partial generation)
   */
  async generateImageOnly(prompt: string, jobId?: string, job?: GenerationJob): Promise<GenerationResult> {
    const startTime = Date.now();
    const generationId = jobId || crypto.randomUUID();
    
    const result: GenerationResult = {
      id: generationId,
      success: false,
      prompt,
      totalCost: 0,
      duration: 0,
      timestamp: new Date(),
    };

    try {
      console.log(`🏭 [ProductionPipeline] Generating image only for ${generationId}`);

      const imageResult = await this.openaiService.generateImage(prompt, {
        job
      });

      if (!imageResult.success) {
        throw new Error(`Image generation failed: ${imageResult.error}`);
      }

      // Handle S3 upload manually
      if (imageResult.base64Image) {
        const s3Key = `monsters/${generationId}/image.png`;
        const imageBuffer = Buffer.from(imageResult.base64Image, 'base64');
        const uploadResult = await this.s3Service.uploadFile(s3Key, imageBuffer, 'image/png');
        
        if (!uploadResult.success) {
           throw new Error(`S3 upload failed: ${uploadResult.error}`);
        }
        
        result.imageS3Key = uploadResult.key;
        result.imageUrl = uploadResult.url;
      } else {
        result.imageUrl = imageResult.imageUrl;
      }

      result.totalCost = imageResult.cost || 0;
      result.success = true;
      result.duration = Date.now() - startTime;

      console.log(`✅ [ProductionPipeline] Image-only generation completed: ${generationId}`);

      return result;

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;
      
      console.error(`❌ [ProductionPipeline] Image-only generation failed: ${generationId}`, result.error);
      
      return result;
    }
  }

  /**
   * Convert existing image to 3D (for resuming failed jobs)
   */
  async convertImageTo3D(imageS3Key: string, jobId?: string, job?: GenerationJob): Promise<GenerationResult> {
    const startTime = Date.now();
    const generationId = jobId || crypto.randomUUID();
    
    const result: GenerationResult = {
      id: generationId,
      success: false,
      prompt: 'Converting existing image to 3D',
      imageS3Key,
      totalCost: 0,
      duration: 0,
      timestamp: new Date(),
    };

    try {
      console.log(`🏭 [ProductionPipeline] Converting existing image to 3D: ${generationId}`);
      console.log(`🏭 [ProductionPipeline] Source image: ${imageS3Key}`);

      // Download image from S3
      const imageBuffer = await this.s3Service.downloadFile(imageS3Key);
      
      const modelResult = await this.falService.convertImageTo3D(imageBuffer, {
        job
      });

      if (!modelResult.success) {
        throw new Error(`3D conversion failed: ${modelResult.error}`);
      }

      // Handle S3 upload manually
      if (modelResult.glbUrl) {
        const s3Key = `monsters/${generationId}/model.glb`;
        const uploadResult = await this.s3Service.uploadFromUrl(s3Key, modelResult.glbUrl, 'model/gltf-binary');
        
        if (!uploadResult.success) {
           throw new Error(`S3 upload failed: ${uploadResult.error}`);
        }
        
        result.glbS3Key = uploadResult.key;
        result.glbUrl = uploadResult.url;
      } else {
        result.glbUrl = modelResult.glbUrl;
      }

      result.totalCost = modelResult.cost || 0;
      result.success = true;
      result.duration = Date.now() - startTime;

      console.log(`✅ [ProductionPipeline] 3D conversion completed: ${generationId}`);

      return result;

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;
      
      console.error(`❌ [ProductionPipeline] 3D conversion failed: ${generationId}`, result.error);
      
      return result;
    }
  }

  /**
   * Estimate cost for generating monsters
   */
  estimateCost(count: number = 1): number {
    return count * 0.70; // $0.40 OpenAI + $0.30 fal.ai
  }

  /**
   * Get usage statistics from both services
   */
  getUsageStats() {
    const openaiStats = this.openaiService.getUsageStats();
    const falStats = this.falService.getUsageStats();
    
    return {
      openai: openaiStats,
      fal: falStats,
      combined: {
        totalRequests: openaiStats.requestCount + falStats.requestCount,
        totalCost: openaiStats.totalCost + falStats.totalCost,
        averageCostPerGeneration: ((openaiStats.totalCost + falStats.totalCost) / Math.max(openaiStats.requestCount, falStats.requestCount)) || 0
      }
    };
  }
}