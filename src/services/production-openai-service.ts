/**
 * Production OpenAI Service
 * Based on the test service but designed for production use with S3 integration
 * Handles image generation with proper error classification and S3 upload
 */

import OpenAI from 'openai';
import { S3Service } from './s3-service';
import { GenerationJob, CostTrackingData } from '../lib/generation-job';
import { OPENAI_PRICING } from '../config/pricing';

export interface GenerationResult {
  id: string;
  imageUrl?: string;
  imageS3Key?: string;
  base64Image?: string;
  success: boolean;
  error?: string;
  errorCode?: string; // Structured error code for better classification
  httpStatus?: number; // HTTP status from API call
  cost?: number;
}

export interface GenerationOptions {
  saveToS3?: boolean;
  s3KeyPrefix?: string;
  job?: GenerationJob; // Optional job for cost tracking
}

export class ProductionOpenAIService {
  private static instance: ProductionOpenAIService;
  private requestCount = 0;
  private totalCost = 0;
  private openai: OpenAI | null = null;
  private s3Service: S3Service;

  // Cost tracking - Updated September 2025
  // See src/config/pricing.ts for latest pricing information
  private readonly IMAGE_GENERATION_COST = OPENAI_PRICING.DEFAULT_IMAGE_COST; // $0.04 per 1024x1024 standard image

  private constructor() {
    this.s3Service = S3Service.getInstance();
    this.validateConfig();
  }

  /**
   * Validate required configuration at initialization
   */
  private validateConfig(): void {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        '[ProductionOpenAI] OPENAI_API_KEY environment variable is required but not set'
      );
    }

    if (process.env.OPENAI_API_KEY.trim().length === 0) {
      throw new Error(
        '[ProductionOpenAI] OPENAI_API_KEY environment variable is empty'
      );
    }

    if (process.env.OPENAI_API_KEY.length < 20) {
      throw new Error(
        '[ProductionOpenAI] OPENAI_API_KEY appears to be invalid (too short)'
      );
    }

    console.log('[ProductionOpenAI] Configuration validated successfully');
  }

  /**
   * Classify OpenAI errors into structured error codes
   */
  private classifyOpenAIError(error: any): {
    errorCode: string;
    httpStatus?: number;
  } {
    // Handle OpenAI SDK errors
    if (error instanceof OpenAI.APIError) {
      const status = error.status;

      if (status === 429) {
        return { errorCode: 'openai_rate_limit', httpStatus: status };
      }

      if (status === 401 || status === 403) {
        return { errorCode: 'openai_invalid_api_key', httpStatus: status };
      }

      if (
        status === 402 ||
        error.message?.toLowerCase().includes('quota') ||
        error.message?.toLowerCase().includes('billing')
      ) {
        return { errorCode: 'openai_insufficient_quota', httpStatus: status };
      }

      if (
        status === 400 &&
        (error.message?.toLowerCase().includes('content policy') ||
          error.message?.toLowerCase().includes('safety') ||
          error.message?.toLowerCase().includes('inappropriate'))
      ) {
        return { errorCode: 'openai_content_policy', httpStatus: status };
      }

      if (status && status >= 500) {
        return { errorCode: 'openai_api_error', httpStatus: status };
      }

      return { errorCode: 'openai_api_error', httpStatus: status };
    }

    // Handle network/timeout errors
    const errorMessage = error.message?.toLowerCase() || '';
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('connection')
    ) {
      return { errorCode: 'openai_network_timeout' };
    }

    // Handle S3 upload errors (including marked errors)
    if (
      (error as any).isS3Error ||
      errorMessage.includes('s3 upload') ||
      errorMessage.includes('upload failed')
    ) {
      return { errorCode: 's3_upload_error' };
    }

    // Default fallback
    return { errorCode: 'openai_api_error' };
  }

  private getClient(): OpenAI {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  public static getInstance(): ProductionOpenAIService {
    if (!ProductionOpenAIService.instance) {
      ProductionOpenAIService.instance = new ProductionOpenAIService();
    }
    return ProductionOpenAIService.instance;
  }

  /**
   * Generate an image using GPT-Image-1 model with S3 integration
   */
  async generateImage(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const generationId = crypto.randomUUID();

    try {
      // Rate limiting check
      this.requestCount++;

      console.log(
        `🎨 [ProductionOpenAI] ========================================`
      );
      console.log(`🎨 [ProductionOpenAI] GENERATING IMAGE`);
      console.log(`🎨 [ProductionOpenAI] Generation ID: ${generationId}`);
      console.log(`🎨 [ProductionOpenAI] Request #${this.requestCount}`);
      console.log(`🎨 [ProductionOpenAI] Model: gpt-image-1`);
      console.log(`🎨 [ProductionOpenAI] Size: 1024x1024`);
      console.log(`🎨 [ProductionOpenAI] Prompt: "${prompt}"`);
      console.log(
        `🎨 [ProductionOpenAI] API Key: ${process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 20)}...` : 'NOT SET'}`
      );
      console.log(
        `🎨 [ProductionOpenAI] ========================================`
      );
      console.log(`🎨 [ProductionOpenAI] 📞 Making API call to OpenAI...`);

      const apiCallStart = Date.now();
      const result = await this.getClient().images.generate({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
      });
      const apiCallDuration = Date.now() - apiCallStart;

      console.log(
        `🎨 [ProductionOpenAI] ✅ API call completed in ${apiCallDuration}ms`
      );
      console.log(
        `🎨 [ProductionOpenAI] Response data length: ${result.data?.length || 0}`
      );

      // Log token usage if available
      if (result.usage) {
        console.log(`🎨 [ProductionOpenAI] Token usage:`, result.usage);
      }

      if (result.data?.[0]) {
        console.log(
          `🎨 [ProductionOpenAI] Image URL present: ${!!result.data[0].url}`
        );
        console.log(
          `🎨 [ProductionOpenAI] Base64 data present: ${!!result.data[0].b64_json}`
        );
        console.log(
          `🎨 [ProductionOpenAI] Image URL: ${result.data[0].url || 'none'}`
        );
      }

      if (!result.data || result.data.length === 0) {
        console.error(
          `❌ [ProductionOpenAI] No image data returned from OpenAI`
        );
        console.error(`❌ [ProductionOpenAI] Result:`, result);
        throw new Error('No image data returned from OpenAI');
      }

      const imageData = result.data[0];
      let imageS3Key: string | undefined;

      // Upload to S3 if requested and we have base64 data
      if (options.saveToS3 && imageData.b64_json) {
        const s3KeyPrefix = options.s3KeyPrefix || 'images';
        imageS3Key = `${s3KeyPrefix}/${generationId}.png`;

        console.log(`📤 [ProductionOpenAI] Uploading to S3: ${imageS3Key}`);

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(imageData.b64_json, 'base64');
        console.log(
          `📤 [ProductionOpenAI] Image size: ${imageBuffer.length} bytes`
        );

        const uploadStartTime = Date.now();
        try {
          const uploadResult = await this.s3Service.uploadFile(
            imageS3Key,
            imageBuffer,
            'image/png'
          );
          const uploadDuration = Date.now() - uploadStartTime;

          if (!uploadResult.success) {
            console.error(
              `❌ [ProductionOpenAI] S3 upload failed: ${uploadResult.error}`
            );
            // Create specific S3 upload error
            const s3Error = new Error(
              `S3 upload failed: ${uploadResult.error}`
            );
            (s3Error as any).isS3Error = true;
            throw s3Error;
          }

          console.log(
            `✅ [ProductionOpenAI] S3 upload completed in ${uploadDuration}ms`
          );
          console.log(`✅ [ProductionOpenAI] S3 URL: ${uploadResult.url}`);
        } catch (uploadError) {
          console.error(
            `❌ [ProductionOpenAI] S3 upload failed: ${uploadError}`
          );
          // Mark as S3 error for classification
          const s3Error = new Error(
            `S3 upload failed: ${uploadError instanceof Error ? uploadError.message : uploadError}`
          );
          (s3Error as any).isS3Error = true;
          throw s3Error;
        }
      }

      // Log cost tracking to database if job is provided
      if (options.job && result.usage) {
        const costData: CostTrackingData = {
          openaiTextTokens: (result.usage as any)?.prompt_tokens || 0,
          openaiImageTokens: (result.usage as any)?.completion_tokens || 0,
          openaiTotalTokens: result.usage.total_tokens || 0,
          requestSuccessful: true,
          provider: 'openai',
          operation: 'image_generation',
        };

        // Log cost tracking asynchronously (don't block the response)
        options.job.logCostTracking(costData).catch((error) => {
          console.error(
            `[ProductionOpenAI] Failed to log cost tracking:`,
            error
          );
        });
      }

      // Update legacy cost tracking
      this.totalCost += this.IMAGE_GENERATION_COST;

      const generationResult: GenerationResult = {
        id: generationId,
        imageUrl: imageData.url,
        imageS3Key,
        base64Image: imageData.b64_json,
        success: true,
        cost: this.IMAGE_GENERATION_COST,
      };

      console.log(
        `✅ [ProductionOpenAI] Successfully generated image ${generationId}`
      );
      console.log(`✅ [ProductionOpenAI] Cost: $${this.IMAGE_GENERATION_COST}`);
      console.log(`✅ [ProductionOpenAI] S3 Key: ${imageS3Key || 'none'}`);

      return generationResult;
    } catch (error) {
      console.error(
        `❌ [ProductionOpenAI] Error generating image ${generationId}:`,
        error
      );

      // Log cost tracking for failed requests if job is provided
      if (options.job) {
        const costData: CostTrackingData = {
          requestSuccessful: false,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error occurred',
          provider: 'openai',
          operation: 'image_generation',
        };

        // Log cost tracking asynchronously (don't block the error response)
        options.job.logCostTracking(costData).catch((trackingError) => {
          console.error(
            `[ProductionOpenAI] Failed to log error cost tracking:`,
            trackingError
          );
        });
      }

      // Classify the error for structured handling
      const { errorCode, httpStatus } = this.classifyOpenAIError(error);

      return {
        id: generationId,
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        errorCode,
        httpStatus,
      };
    }
  }

  /**
   * @deprecated - Prompt wrapping now happens in API route before storage
   * This method is kept for backward compatibility but should not be used
   * New code should pass the full prompt directly to generateImage()
   */
  async generateMonsterImage(
    creatureDescription: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    console.warn('[ProductionOpenAI] DEPRECATED: generateMonsterImage() should not be used. Pass full prompt to generateImage() instead.');

    const monsterPrompt = `
Generate a cute, lovable, friendly Spore-like digital creature for a learning game.

Creature description: ${creatureDescription}.

Style: adorable, colorful, cartoon-like illustration suitable for educational content, based on the "Spore".
The creature should look approachable and non-threatening, perfect for teaching programming concepts.
High quality, detailed, vibrant colors, transparent background.
DO NOT include any background elements, halos, floor, ceiling, or decorations surrounding the creature, or too many complex shapes.
The image will later be passed to a 3D modeler, so keep the creature simple and easy to model.
    `.trim();

    return this.generateImage(monsterPrompt, options);
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      requestCount: this.requestCount,
      totalCost: this.totalCost,
      averageCostPerRequest:
        this.requestCount > 0 ? this.totalCost / this.requestCount : 0,
    };
  }

  /**
   * Reset usage statistics
   */
  resetStats() {
    this.requestCount = 0;
    this.totalCost = 0;
  }
}

export default ProductionOpenAIService.getInstance();
