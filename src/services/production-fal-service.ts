/**
 * Production fal.ai Service
 * Based on the test service but designed for production use with S3 integration
 * Handles image-to-3D conversion with proper error handling and S3 upload
 */

import { fal } from "@fal-ai/client";
import { GenerationJob, CostTrackingData } from '../lib/generation-job';
import { FAL_PRICING } from '../config/pricing';

export interface ConversionResult {
  id: string;
  glbUrl?: string;
  success: boolean;
  error?: string;
  errorCode?: string; // Structured error code for better classification
  httpStatus?: number; // HTTP status from API call
  cost?: number;
}

export interface ConversionOptions {
  job?: GenerationJob; // Optional job for cost tracking
}

export class ProductionFalService {
  private static instance: ProductionFalService;
  private requestCount = 0;
  private totalCost = 0;

  // Cost tracking - Updated September 2025
  // See src/config/pricing.ts for latest pricing information
  private readonly CONVERSION_COST = FAL_PRICING.DEFAULT_3D_COST; // $0.30 per conversion with standard textures

  private constructor() {
    this.validateConfig();

    // Configure fal client with API key
    fal.config({
      credentials: process.env.FAL_KEY,
    });
  }

  /**
   * Validate required configuration at initialization
   */
  private validateConfig(): void {
    if (!process.env.FAL_KEY) {
      throw new Error(
        '[ProductionFal] FAL_KEY environment variable is required but not set'
      );
    }

    if (process.env.FAL_KEY.trim().length === 0) {
      throw new Error(
        '[ProductionFal] FAL_KEY environment variable is empty'
      );
    }

    if (process.env.FAL_KEY.length < 20) {
      throw new Error(
        '[ProductionFal] FAL_KEY appears to be invalid (too short)'
      );
    }

    console.log('[ProductionFal] Configuration validated successfully');
  }

  /**
   * Classify fal.ai errors into structured error codes
   */
  private classifyFalError(error: any): { errorCode: string; httpStatus?: number } {
    const errorMessage = error.message?.toLowerCase() || '';

    // Handle fal.ai specific errors
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return { errorCode: 'fal_overloaded', httpStatus: 429 };
    }

    if (errorMessage.includes('unauthorized') || errorMessage.includes('invalid') ||
        errorMessage.includes('api key')) {
      return { errorCode: 'fal_invalid_api_key', httpStatus: 401 };
    }

    if (errorMessage.includes('quota') || errorMessage.includes('billing') ||
        errorMessage.includes('insufficient')) {
      return { errorCode: 'fal_insufficient_quota', httpStatus: 402 };
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('connection') ||
        errorMessage.includes('network')) {
      return { errorCode: 'fal_network_timeout' };
    }

    if (errorMessage.includes('overloaded') || errorMessage.includes('busy') ||
        errorMessage.includes('queue')) {
      return { errorCode: 'fal_overloaded', httpStatus: 503 };
    }

    // Default fal.ai error
    return { errorCode: 'fal_api_error' };
  }

  public static getInstance(): ProductionFalService {
    if (!ProductionFalService.instance) {
      ProductionFalService.instance = new ProductionFalService();
    }
    return ProductionFalService.instance;
  }

  /**
   * Convert image buffer to 3D model using fal.ai tripo3d API
   */
  async convertImageTo3D(
    imageBuffer: Buffer,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const conversionId = crypto.randomUUID();

    try {
      this.requestCount++;

      console.log(`🎯 [ProductionFal] ========================================`);
      console.log(`🎯 [ProductionFal] CONVERTING IMAGE TO 3D`);
      console.log(`🎯 [ProductionFal] Conversion ID: ${conversionId}`);
      console.log(`🎯 [ProductionFal] Request #${this.requestCount}`);
      console.log(`🎯 [ProductionFal] Image size: ${imageBuffer.length} bytes`);
      console.log(`🎯 [ProductionFal] API Key: ${process.env.FAL_KEY ? `${process.env.FAL_KEY.substring(0, 20)}...` : 'NOT SET'}`);
      console.log(`🎯 [ProductionFal] ========================================`);

      // Upload image to fal.ai storage first
      console.log(`🎯 [ProductionFal] 📤 Uploading image to fal.ai storage...`);
      // Convert Buffer to Uint8Array for File constructor compatibility
      const imageFile = new File([new Uint8Array(imageBuffer)], `${conversionId}.png`, {
        type: 'image/png'
      });
      
      const uploadStartTime = Date.now();
      const imageUrl = await fal.storage.upload(imageFile);
      const uploadDuration = Date.now() - uploadStartTime;
      
      console.log(`✅ [ProductionFal] Image uploaded in ${uploadDuration}ms`);
      console.log(`✅ [ProductionFal] Image URL: ${imageUrl}`);

      // Call fal.ai tripo3d API
      console.log(`🎯 [ProductionFal] 📞 Making API call to tripo3d...`);
      const apiCallStart = Date.now();
      
      const result = await fal.subscribe("tripo3d/tripo/v2.5/image-to-3d", {
        input: {
          image_url: imageUrl,
          texture: 'standard',
        }
      });
      
      const apiCallDuration = Date.now() - apiCallStart;
      console.log(`🎯 [ProductionFal] ✅ API call completed in ${apiCallDuration}ms`);
      console.log(`🎯 [ProductionFal] Request ID: ${result.requestId}`);

      if (!result.data) {
        console.error(`❌ [ProductionFal] No 3D model data returned from fal.ai`);
        console.error(`❌ [ProductionFal] Result:`, result);
        throw new Error('No 3D model data returned from fal.ai');
      }

      const modelData = result.data;
      console.log(`🎯 [ProductionFal] Model data received`);
      console.log(`🎯 [ProductionFal] Model mesh URL present: ${!!modelData.model_mesh?.url}`);
      console.log(`🎯 [ProductionFal] Preview image URL present: ${!!modelData.rendered_image?.url}`);

      if (!modelData.model_mesh?.url) {
        console.error(`❌ [ProductionFal] No model mesh URL in response`);
        console.error(`❌ [ProductionFal] Model data:`, modelData);
        throw new Error('No 3D model URL returned from fal.ai');
      }

      // Log cost tracking to database if job is provided
      if (options.job) {
        const costData: CostTrackingData = {
          falEstimatedCost: this.CONVERSION_COST,
          requestSuccessful: true,
          provider: 'fal',
          operation: '3d_conversion',
        };

        // Log cost tracking asynchronously (don't block the response)
        options.job.logCostTracking(costData).catch(error => {
          console.error(`[ProductionFal] Failed to log cost tracking:`, error);
        });
      }

      // Update legacy cost tracking
      this.totalCost += this.CONVERSION_COST;

      const conversionResult: ConversionResult = {
        id: conversionId,
        glbUrl: modelData.model_mesh.url,
        success: true,
        cost: this.CONVERSION_COST,
      };

      console.log(`✅ [ProductionFal] Successfully converted to 3D ${conversionId}`);
      console.log(`✅ [ProductionFal] Cost: $${this.CONVERSION_COST}`);
      console.log(`✅ [ProductionFal] fal.ai URL: ${modelData.model_mesh.url}`);

      return conversionResult;

    } catch (error) {
      console.error(`❌ [ProductionFal] Error converting to 3D ${conversionId}:`, error);

      // Log cost tracking for failed requests if job is provided
      if (options.job) {
        const costData: CostTrackingData = {
          requestSuccessful: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
          provider: 'fal',
          operation: '3d_conversion',
        };

        // Log cost tracking asynchronously (don't block the error response)
        options.job.logCostTracking(costData).catch(trackingError => {
          console.error(`[ProductionFal] Failed to log error cost tracking:`, trackingError);
        });
      }

      // Classify the error for structured handling
      const { errorCode, httpStatus } = this.classifyFalError(error);

      return {
        id: conversionId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorCode,
        httpStatus,
      };
    }
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

export default ProductionFalService.getInstance();