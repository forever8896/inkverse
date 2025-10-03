/**
 * GenerationJob - Database persistence layer for monster generation jobs
 * Handles job state transitions, progress tracking, and S3 file management
 */

import { getPool } from './postgres';
import { S3Service } from '../services/s3-service';
import { v4 as uuidv4 } from 'uuid';

// Error handling configuration
export const ERROR_HANDLERS: Record<ErrorType, Omit<JobError, 'currentRetries' | 'lastRetryAt' | 'technicalMessage'>> = {
  openai_rate_limit: {
    type: 'openai_rate_limit',
    userMessage: "Our image generator is experiencing high demand. We'll automatically retry in 30 seconds.",
    retryable: true,
    suggestedRetryDelay: 30,
    maxRetries: 5
  },
  openai_invalid_api_key: {
    type: 'openai_invalid_api_key',
    userMessage: 'We cannot authenticate with OpenAI right now. Please contact an administrator.',
    retryable: false,
    suggestedRetryDelay: 0,
    maxRetries: 0
  },
  openai_insufficient_quota: {
    type: 'openai_insufficient_quota',
    userMessage: 'OpenAI credits are exhausted. Please top up the account before retrying.',
    retryable: false,
    suggestedRetryDelay: 0,
    maxRetries: 0
  },
  openai_content_policy: {
    type: 'openai_content_policy',
    userMessage: "Your monster description might need tweaking. Try making it more family-friendly and submit again.",
    retryable: false,
    suggestedRetryDelay: 0,
    maxRetries: 0
  },
  openai_network_timeout: {
    type: 'openai_network_timeout',
    userMessage: "Connection hiccup! We're retrying your image generation now...",
    retryable: true,
    suggestedRetryDelay: 15,
    maxRetries: 3
  },
  openai_api_error: {
    type: 'openai_api_error',
    userMessage: "There's a temporary issue with our image service. Please try again in a few minutes.",
    retryable: true,
    suggestedRetryDelay: 120,
    maxRetries: 2
  },
  fal_overloaded: {
    type: 'fal_overloaded',
    userMessage: "Our 3D converter is experiencing high demand. Keep this page open - we'll retry automatically in 2 minutes.",
    retryable: true,
    suggestedRetryDelay: 120,
    maxRetries: 10
  },
  fal_invalid_api_key: {
    type: 'fal_invalid_api_key',
    userMessage: 'We cannot authenticate with the 3D service. Please check the fal.ai key.',
    retryable: false,
    suggestedRetryDelay: 0,
    maxRetries: 0
  },
  fal_insufficient_quota: {
    type: 'fal_insufficient_quota',
    userMessage: 'fal.ai credits are exhausted. Please top up the account before retrying.',
    retryable: false,
    suggestedRetryDelay: 0,
    maxRetries: 0
  },
  fal_network_timeout: {
    type: 'fal_network_timeout',
    userMessage: "3D conversion is taking longer than usual. We're still working on it - no need to refresh!",
    retryable: true,
    suggestedRetryDelay: 60,
    maxRetries: 5
  },
  fal_api_error: {
    type: 'fal_api_error',
    userMessage: "Our 3D service provider seems to be down. Please check back in 10-15 minutes.",
    retryable: true,
    suggestedRetryDelay: 600,
    maxRetries: 3
  },
  database_error: {
    type: 'database_error',
    userMessage: "We're having trouble saving your progress. Retrying now...",
    retryable: true,
    suggestedRetryDelay: 5,
    maxRetries: 3
  },
  s3_upload_error: {
    type: 's3_upload_error',
    userMessage: "Having trouble storing your files. Don't worry, we'll keep trying!",
    retryable: true,
    suggestedRetryDelay: 10,
    maxRetries: 5
  },
  s3_storage_unavailable: {
    type: 's3_storage_unavailable',
    userMessage: 'Storage is unreachable right now. Verify your S3/MinIO service before retrying.',
    retryable: false,
    suggestedRetryDelay: 0,
    maxRetries: 0
  },
  unknown: {
    type: 'unknown',
    userMessage: "Something unexpected happened. We're looking into it - please try again in a few minutes.",
    retryable: true,
    suggestedRetryDelay: 60,
    maxRetries: 2
  }
};

export type MonsterStyle = 'cute' | 'fierce' | 'mysterious' | 'playful' | 'cosmic';
export type MonsterStage = 'egg' | 'young' | 'adult';
export type GenerationType = 'full' | 'image_only';
export type GenerationStatus = 
  | 'pending' 
  | 'generating_image' 
  | 'image_generation_failed'
  | 'image_generation_retrying'
  | 'converting_3d' 
  | 'conversion_failed'
  | 'conversion_retrying'
  | 'completed' 
  | 'failed_permanent'
  | 'waiting_on_storage';

export type ErrorType = 
  | 'openai_rate_limit'
  | 'openai_invalid_api_key'
  | 'openai_insufficient_quota'
  | 'openai_content_policy' 
  | 'openai_network_timeout'
  | 'openai_api_error'
  | 'fal_overloaded'
  | 'fal_invalid_api_key'
  | 'fal_insufficient_quota'
  | 'fal_network_timeout' 
  | 'fal_api_error'
  | 'database_error'
  | 's3_upload_error'
  | 's3_storage_unavailable'
  | 'unknown';

export interface JobError {
  type: ErrorType;
  userMessage: string;
  technicalMessage: string;
  retryable: boolean;
  suggestedRetryDelay: number; // seconds
  maxRetries: number;
  currentRetries: number;
  lastRetryAt?: Date;
}

export interface GenerationJobData {
  id: string;
  userId: string;
  prompt: string;
  style: MonsterStyle;
  stage: MonsterStage;
  generationType: GenerationType;
  status: GenerationStatus;
  progress: number;
  errorMessage?: string;
  userMessage?: string; // User-friendly error message
  imageS3Key?: string;
  imageUrl?: string;
  glbS3Key?: string;
  glbUrl?: string;
  totalCost: number;
  retryCount: number;
  lastError?: JobError;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  // Token tracking fields
  openaiTextTokens: number;
  openaiImageTokens: number;
  openaiTotalTokens: number;
  openaiEstimatedCost: number;
  falEstimatedCost: number;
  costCalculationMethod: string;
  lastCostUpdate: Date;
}

export interface CreateJobParams {
  userId: string;
  prompt: string;
  style: MonsterStyle;
  stage: MonsterStage;
  generationType: GenerationType;
}

export interface UpdateJobParams {
  status?: GenerationStatus;
  progress?: number;
  errorMessage?: string;
  userMessage?: string;
  imageS3Key?: string;
  imageUrl?: string;
  glbS3Key?: string;
  glbUrl?: string;
  totalCost?: number;
  retryCount?: number;
  lastError?: JobError;
  completedAt?: Date;
  generationType?: GenerationType;
  // Token tracking fields
  openaiTextTokens?: number;
  openaiImageTokens?: number;
  openaiTotalTokens?: number;
  openaiEstimatedCost?: number;
  falEstimatedCost?: number;
  costCalculationMethod?: string;
  lastCostUpdate?: Date;
}

// Interface for logging cost tracking data
export interface CostTrackingData {
  openaiTextTokens?: number;
  openaiImageTokens?: number;
  openaiTotalTokens?: number;
  openaiEstimatedCost?: number;
  falEstimatedCost?: number;
  requestSuccessful: boolean;
  errorMessage?: string;
  provider: 'openai' | 'fal';
  operation: 'image_generation' | '3d_conversion';
}

export class GenerationJob {
  private data: GenerationJobData;
  private s3Service: S3Service;

  /**
   * Safely parse JSON, return undefined if invalid
   */
  private static safeParseJSON(jsonString: any): JobError | undefined {
    if (!jsonString) return undefined;
    
    try {
      // Handle case where it's already an object
      if (typeof jsonString === 'object') {
        return jsonString;
      }
      
      // Parse string JSON
      if (typeof jsonString === 'string') {
        return JSON.parse(jsonString);
      }
      
      return undefined;
    } catch (error) {
      console.warn('[GenerationJob] Failed to parse JSON:', jsonString);
      return undefined;
    }
  }

  constructor(data: GenerationJobData) {
    this.data = data;
    this.s3Service = S3Service.getInstance();
  }

  // Getters
  get id(): string { return this.data.id; }
  get userId(): string { return this.data.userId; }
  get prompt(): string { return this.data.prompt; }
  get style(): MonsterStyle { return this.data.style; }
  get stage(): MonsterStage { return this.data.stage; }
  get generationType(): GenerationType { return this.data.generationType; }
  get status(): GenerationStatus { return this.data.status; }
  get progress(): number { return this.data.progress; }
  get errorMessage(): string | undefined { return this.data.errorMessage; }
  get userMessage(): string | undefined { return this.data.userMessage; }
  get imageS3Key(): string | undefined { return this.data.imageS3Key; }
  get imageUrl(): string | undefined { return this.data.imageUrl; }
  get glbS3Key(): string | undefined { return this.data.glbS3Key; }
  get glbUrl(): string | undefined { return this.data.glbUrl; }
  get totalCost(): number { return this.data.totalCost; }
  get retryCount(): number { return this.data.retryCount; }
  get lastError(): JobError | undefined { return this.data.lastError; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }
  get completedAt(): Date | undefined { return this.data.completedAt; }

  /**
   * Create a new generation job in the database
   */
  static async create(params: CreateJobParams): Promise<GenerationJob> {
    const pool = getPool();
    const jobId = uuidv4();

    try {
      const result = await pool.query(`
        INSERT INTO monster_generations (
          id,
          user_id,
          prompt,
          style,
          stage,
          generation_type,
          status,
          progress,
          total_cost,
          retry_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        jobId,
        params.userId,
        params.prompt,
        params.style,
        params.stage,
        params.generationType,
        'pending',
        0,
        0.00,
        0
      ]);

      const row = result.rows[0];
      console.log(`[GenerationJob] Created job ${jobId} for user ${params.userId}`);

      return new GenerationJob({
        id: row.id,
        userId: row.user_id,
        prompt: row.prompt,
        style: row.style,
        stage: row.stage,
        generationType: row.generation_type,
        status: row.status,
        progress: row.progress,
        errorMessage: row.error_message,
        userMessage: row.user_message,
        imageS3Key: row.image_s3_key,
        imageUrl: row.image_url,
        glbS3Key: row.glb_s3_key,
        glbUrl: row.glb_url,
        totalCost: parseFloat(row.total_cost),
        retryCount: row.retry_count || 0,
        lastError: row.last_error ? GenerationJob.safeParseJSON(row.last_error) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at,
        // Token tracking fields
        openaiTextTokens: row.openai_text_tokens || 0,
        openaiImageTokens: row.openai_image_tokens || 0,
        openaiTotalTokens: row.openai_total_tokens || 0,
        openaiEstimatedCost: parseFloat(row.openai_estimated_cost) || 0.0,
        falEstimatedCost: parseFloat(row.fal_estimated_cost) || 0.0,
        costCalculationMethod: row.cost_calculation_method || 'token_based',
        lastCostUpdate: row.last_cost_update || row.created_at,
      });

    } catch (error) {
      console.error('[GenerationJob] Failed to create job:', error);
      throw error;
    }
  }

  /**
   * Find a generation job by ID
   */
  static async findById(jobId: string): Promise<GenerationJob | null> {
    const pool = getPool();

    try {
      const result = await pool.query(`
        SELECT * FROM monster_generations WHERE id = $1
      `, [jobId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return new GenerationJob({
        id: row.id,
        userId: row.user_id,
        prompt: row.prompt,
        style: row.style,
        stage: row.stage,
        generationType: row.generation_type,
        status: row.status,
        progress: row.progress,
        errorMessage: row.error_message,
        userMessage: row.user_message,
        imageS3Key: row.image_s3_key,
        imageUrl: row.image_url,
        glbS3Key: row.glb_s3_key,
        glbUrl: row.glb_url,
        totalCost: parseFloat(row.total_cost),
        retryCount: row.retry_count || 0,
        lastError: row.last_error ? GenerationJob.safeParseJSON(row.last_error) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at,
        // Token tracking fields
        openaiTextTokens: row.openai_text_tokens || 0,
        openaiImageTokens: row.openai_image_tokens || 0,
        openaiTotalTokens: row.openai_total_tokens || 0,
        openaiEstimatedCost: parseFloat(row.openai_estimated_cost) || 0.0,
        falEstimatedCost: parseFloat(row.fal_estimated_cost) || 0.0,
        costCalculationMethod: row.cost_calculation_method || 'token_based',
        lastCostUpdate: row.last_cost_update || row.created_at,
      });

    } catch (error) {
      console.error(`[GenerationJob] Failed to find job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Find generation jobs for a user
   */
  static async findByUserId(
    userId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<GenerationJob[]> {
    const pool = getPool();

    try {
      const result = await pool.query(`
        SELECT * FROM monster_generations 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      return result.rows.map((row: any) => new GenerationJob({
        id: row.id,
        userId: row.user_id,
        prompt: row.prompt,
        style: row.style,
        stage: row.stage,
        generationType: row.generation_type,
        status: row.status,
        progress: row.progress,
        errorMessage: row.error_message,
        userMessage: row.user_message,
        imageS3Key: row.image_s3_key,
        imageUrl: row.image_url,
        glbS3Key: row.glb_s3_key,
        glbUrl: row.glb_url,
        totalCost: parseFloat(row.total_cost),
        retryCount: row.retry_count || 0,
        lastError: row.last_error ? GenerationJob.safeParseJSON(row.last_error) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at,
        // Token tracking fields
        openaiTextTokens: row.openai_text_tokens || 0,
        openaiImageTokens: row.openai_image_tokens || 0,
        openaiTotalTokens: row.openai_total_tokens || 0,
        openaiEstimatedCost: parseFloat(row.openai_estimated_cost) || 0.0,
        falEstimatedCost: parseFloat(row.fal_estimated_cost) || 0.0,
        costCalculationMethod: row.cost_calculation_method || 'token_based',
        lastCostUpdate: row.last_cost_update || row.created_at,
      }));

    } catch (error) {
      console.error(`[GenerationJob] Failed to find jobs for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update the generation job
   */
  async update(params: UpdateJobParams): Promise<void> {
    const pool = getPool();

    try {
      // Build dynamic query based on provided parameters
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (params.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(params.status);
        this.data.status = params.status;
      }

      if (params.progress !== undefined) {
        updates.push(`progress = $${paramIndex++}`);
        values.push(params.progress);
        this.data.progress = params.progress;
      }

      if (params.errorMessage !== undefined) {
        updates.push(`error_message = $${paramIndex++}`);
        values.push(params.errorMessage);
        this.data.errorMessage = params.errorMessage;
      }

      if (params.userMessage !== undefined) {
        updates.push(`user_message = $${paramIndex++}`);
        values.push(params.userMessage);
        this.data.userMessage = params.userMessage;
      }

      if (params.imageS3Key !== undefined) {
        updates.push(`image_s3_key = $${paramIndex++}`);
        values.push(params.imageS3Key);
        this.data.imageS3Key = params.imageS3Key;
      }

      if (params.imageUrl !== undefined) {
        updates.push(`image_url = $${paramIndex++}`);
        values.push(params.imageUrl);
        this.data.imageUrl = params.imageUrl;
      }

      if (params.glbS3Key !== undefined) {
        updates.push(`glb_s3_key = $${paramIndex++}`);
        values.push(params.glbS3Key);
        this.data.glbS3Key = params.glbS3Key;
      }

      if (params.glbUrl !== undefined) {
        updates.push(`glb_url = $${paramIndex++}`);
        values.push(params.glbUrl);
        this.data.glbUrl = params.glbUrl;
      }

      if (params.generationType !== undefined) {
        updates.push(`generation_type = $${paramIndex++}`);
        values.push(params.generationType);
        this.data.generationType = params.generationType;
      }

      if (params.totalCost !== undefined) {
        updates.push(`total_cost = $${paramIndex++}`);
        values.push(params.totalCost);
        this.data.totalCost = params.totalCost;
      }

      if (params.completedAt !== undefined) {
        updates.push(`completed_at = $${paramIndex++}`);
        values.push(params.completedAt);
        this.data.completedAt = params.completedAt;
      }

      if (params.retryCount !== undefined) {
        updates.push(`retry_count = $${paramIndex++}`);
        values.push(params.retryCount);
        this.data.retryCount = params.retryCount;
      }

      if (params.lastError !== undefined) {
        updates.push(`last_error = $${paramIndex++}`);
        values.push(JSON.stringify(params.lastError));
        this.data.lastError = params.lastError;
      }

      // Token tracking fields
      if (params.openaiTextTokens !== undefined) {
        updates.push(`openai_text_tokens = $${paramIndex++}`);
        values.push(params.openaiTextTokens);
        this.data.openaiTextTokens = params.openaiTextTokens;
      }

      if (params.openaiImageTokens !== undefined) {
        updates.push(`openai_image_tokens = $${paramIndex++}`);
        values.push(params.openaiImageTokens);
        this.data.openaiImageTokens = params.openaiImageTokens;
      }

      if (params.openaiTotalTokens !== undefined) {
        updates.push(`openai_total_tokens = $${paramIndex++}`);
        values.push(params.openaiTotalTokens);
        this.data.openaiTotalTokens = params.openaiTotalTokens;
      }

      if (params.openaiEstimatedCost !== undefined) {
        updates.push(`openai_estimated_cost = $${paramIndex++}`);
        values.push(params.openaiEstimatedCost);
        this.data.openaiEstimatedCost = params.openaiEstimatedCost;
      }

      if (params.falEstimatedCost !== undefined) {
        updates.push(`fal_estimated_cost = $${paramIndex++}`);
        values.push(params.falEstimatedCost);
        this.data.falEstimatedCost = params.falEstimatedCost;
      }

      if (params.costCalculationMethod !== undefined) {
        updates.push(`cost_calculation_method = $${paramIndex++}`);
        values.push(params.costCalculationMethod);
        this.data.costCalculationMethod = params.costCalculationMethod;
      }

      if (params.lastCostUpdate !== undefined) {
        updates.push(`last_cost_update = $${paramIndex++}`);
        values.push(params.lastCostUpdate);
        this.data.lastCostUpdate = params.lastCostUpdate;
      }

      if (updates.length === 0) {
        return; // No updates to make
      }

      // Add job ID for WHERE clause
      values.push(this.data.id);

      const query = `
        UPDATE monster_generations 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING updated_at
      `;

      const result = await pool.query(query, values);
      this.data.updatedAt = result.rows[0].updated_at;

      console.log(`[GenerationJob] Updated job ${this.data.id}: ${updates.join(', ')}`);

    } catch (error) {
      console.error(`[GenerationJob] Failed to update job ${this.data.id}:`, error);
      throw error;
    }
  }

  /**
   * Set job status to generating_image and update progress
   */
  async startImageGeneration(): Promise<void> {
    await this.update({
      status: 'generating_image',
      progress: 5,
    });
  }

  /**
   * Complete image generation and store S3 references
   */
  async completeImageGeneration(imageS3Key: string): Promise<void> {
    try {
      const imageUrl = await this.s3Service.getPresignedUrl(imageS3Key, { expiresIn: 7200 }); // 2 hours

      await this.update({
        progress: 40,
        imageS3Key,
        imageUrl,
      });
    } catch (error) {
      console.error(`❌ [GenerationJob] Failed to generate image URL for S3 key ${imageS3Key}:`, error);
      // Throw S3 error to prevent job completion
      throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Set job status to converting_3d and update progress
   */
  async start3DConversion(): Promise<void> {
    await this.update({
      status: 'converting_3d',
      progress: 50,
    });
  }

  /**
   * Complete 3D conversion and store S3 references
   */
  async complete3DConversion(glbS3Key: string): Promise<void> {
    try {
      const glbUrl = await this.s3Service.getPresignedUrl(glbS3Key, { expiresIn: 7200 }); // 2 hours

      await this.update({
        progress: 90,
        glbS3Key,
        glbUrl,
      });
    } catch (error) {
      console.error(`❌ [GenerationJob] Failed to generate GLB URL for S3 key ${glbS3Key}:`, error);
      // Throw S3 error to prevent job completion
      throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Mark job as completed
   */
  async complete(totalCost: number): Promise<void> {
    await this.update({
      status: 'completed',
      progress: 100,
      totalCost,
      completedAt: new Date(),
    });
  }

  /**
   * Mark job as failed
   */
  async fail(errorMessage: string): Promise<void> {
    await this.update({
      status: 'failed_permanent',
      errorMessage,
    });
  }

  /**
   * Check if job can be resumed (failed at a recoverable stage)
   */
  canResume(): boolean {
    return this.data.status === 'failed_permanent' &&
           this.data.progress > 0 &&
           (this.data.imageS3Key != null || this.data.glbS3Key != null);
  }

  /**
   * Get the stage to resume from
   */
  getResumeStage(): 'image' | '3d' | null {
    if (!this.canResume()) return null;
    
    if (this.data.glbS3Key) return null; // Already complete, cannot resume
    if (this.data.imageS3Key) return '3d'; // Resume from 3D conversion
    return 'image'; // Resume from image generation
  }

  /**
   * Refresh presigned URLs (call when URLs expire)
   */
  async refreshUrls(): Promise<void> {
    const updates: UpdateJobParams = {};

    if (this.data.imageS3Key) {
      updates.imageUrl = await this.s3Service.getPresignedUrl(this.data.imageS3Key, { expiresIn: 7200 });
    }

    if (this.data.glbS3Key) {
      updates.glbUrl = await this.s3Service.getPresignedUrl(this.data.glbS3Key, { expiresIn: 7200 });
    }

    if (Object.keys(updates).length > 0) {
      await this.update(updates);
    }
  }

  /**
   * Handle error with automatic retry logic
   */
  async handleError(errorType: ErrorType, technicalMessage: string): Promise<boolean> {
    console.log(`⚠️  [GenerationJob] ========================================`);
    console.log(`⚠️  [GenerationJob] HANDLING ERROR`);
    console.log(`⚠️  [GenerationJob] Job ID: ${this.data.id}`);
    console.log(`⚠️  [GenerationJob] Error Type: ${errorType}`);
    console.log(`⚠️  [GenerationJob] Technical Message: ${technicalMessage}`);
    console.log(`⚠️  [GenerationJob] Current Status: ${this.data.status}`);
    console.log(`⚠️  [GenerationJob] Current Retry Count: ${this.data.retryCount || 0}`);
    console.log(`⚠️  [GenerationJob] ========================================`);
    
    let resolvedType: ErrorType = errorType;
    let errorConfig = ERROR_HANDLERS[resolvedType];

    if (!errorConfig) {
      console.warn(`⚠️  [GenerationJob] Unknown error type '${errorType}' - defaulting to 'unknown' handler.`);
      resolvedType = 'unknown';
      errorConfig = ERROR_HANDLERS[resolvedType];
    }
    const currentRetries = this.data.retryCount || 0;

    console.log(`🔍 [GenerationJob] Error config:`);
    console.log(`🔍 [GenerationJob]   - Retryable: ${errorConfig.retryable}`);
    console.log(`🔍 [GenerationJob]   - Max retries: ${errorConfig.maxRetries}`);
    console.log(`🔍 [GenerationJob]   - Suggested delay: ${errorConfig.suggestedRetryDelay}s`);
    console.log(`🔍 [GenerationJob]   - User message: "${errorConfig.userMessage}"`);
    
    // Create error object
    const error: JobError = {
      ...errorConfig,
      technicalMessage,
      currentRetries,
      lastRetryAt: new Date()
    };

    // Check if we should retry
    const shouldRetry = errorConfig.retryable && currentRetries < errorConfig.maxRetries;
    console.log(`🤔 [GenerationJob] Should retry: ${shouldRetry} (${currentRetries}/${errorConfig.maxRetries})`);

    if (shouldRetry) {
      // Update status to retrying
      const retryStatus = this.data.status.includes('image') ? 'image_generation_retrying' : 'conversion_retrying';
      const userMessage = this.getProgressiveErrorMessage(resolvedType, currentRetries);

      console.log(`🔄 [GenerationJob] → Setting status to: ${retryStatus}`);
      console.log(`🔄 [GenerationJob] → User message: "${userMessage}"`);
      console.log(`🔄 [GenerationJob] → Retry count: ${currentRetries + 1}`);
      
      await this.update({
        status: retryStatus as GenerationStatus,
        userMessage,
        retryCount: currentRetries + 1,
        lastError: error
      });

      console.log(`✅ [GenerationJob] ${this.data.id} - Retry ${currentRetries + 1}/${errorConfig.maxRetries} for ${resolvedType}`);
      return true; // Retry
    } else {
      // Mark as permanently failed
      const failedStatus = this.data.status.includes('image') ? 'image_generation_failed' : 'conversion_failed';
      const userMessage = this.getFinalErrorMessage(resolvedType);
      
      console.log(`❌ [GenerationJob] → Permanently failed - no more retries`);
      console.log(`❌ [GenerationJob] → Setting status to: ${failedStatus}`);
      console.log(`❌ [GenerationJob] → Final user message: "${userMessage}"`);
      
      await this.update({
        status: failedStatus as GenerationStatus,
        userMessage,
        errorMessage: technicalMessage,
        lastError: error
      });

      console.error(`❌ [GenerationJob] ${this.data.id} - Permanently failed: ${resolvedType} after ${currentRetries} retries`);
      return false; // Don't retry
    }
  }

  /**
   * Get progressive error message based on retry attempt
   */
  private getProgressiveErrorMessage(errorType: ErrorType, retryCount: number): string {
    const config = ERROR_HANDLERS[errorType] || ERROR_HANDLERS.unknown;
    const isFirstRetry = retryCount === 0;
    const isLastRetry = retryCount >= config.maxRetries - 1;

    if (isFirstRetry) {
      return config.userMessage;
    }

    // Progressive messaging for multiple retries
    const progressiveMessages: Record<ErrorType, string[]> = {
      openai_rate_limit: [
        config.userMessage,
        "Still experiencing high demand. Retrying again in 60 seconds...",
        "This is taking longer than usual. We're still working on your image - hang tight!"
      ],
      fal_overloaded: [
        config.userMessage,
        "Our 3D converter is still busy. We're continuing to retry every 2 minutes.",
        "High demand for 3D conversion continues. Your job is queued and will complete soon."
      ],
      openai_network_timeout: [
        config.userMessage,
        "Still having connection issues. Trying again...",
        "Network seems unstable. This may take a few more minutes."
      ],
      openai_invalid_api_key: [config.userMessage],
      openai_insufficient_quota: [config.userMessage],
      fal_network_timeout: [
        config.userMessage,
        "3D conversion is still processing. These can take up to 5 minutes during peak times.",
        "Your 3D model is still being generated. Almost there!"
      ],
      openai_api_error: [config.userMessage],
      openai_content_policy: [config.userMessage],
      fal_invalid_api_key: [config.userMessage],
      fal_insufficient_quota: [config.userMessage],
      fal_api_error: [config.userMessage],
      database_error: [config.userMessage],
      s3_upload_error: [config.userMessage],
      s3_storage_unavailable: [config.userMessage],
      unknown: [config.userMessage]
    };

    const messages = progressiveMessages[errorType];
    const messageIndex = Math.min(retryCount, messages.length - 1);
    return messages[messageIndex];
  }

  /**
   * Get final error message when retries are exhausted
   */
  private getFinalErrorMessage(errorType: ErrorType): string {
    const finalMessages: Record<ErrorType, string> = {
      openai_rate_limit: "Our image generator is experiencing very high demand. Please try creating a different monster or check back in 10 minutes.",
      openai_invalid_api_key: "OpenAI credentials are invalid. Please contact support to refresh the API key.",
      openai_insufficient_quota: "OpenAI credits are depleted. Please top up the account and try again.",
      openai_content_policy: "Your monster description needs to be more family-friendly. Please try again with different wording.",
      openai_network_timeout: "We're having persistent connection issues. Please try again in a few minutes.",
      openai_api_error: "There's an ongoing issue with our image service. Please try again later.",
      fal_overloaded: "Our 3D service is experiencing extended high demand. Please bookmark this page and check back in 15-20 minutes.",
      fal_invalid_api_key: "The fal.ai credentials are invalid. Please contact support to refresh the API key.",
      fal_insufficient_quota: "fal.ai credits are depleted. Please top up the account and try again.",
      fal_network_timeout: "The 3D conversion is taking too long. Please try generating a simpler monster design.",
      fal_api_error: "Our 3D service provider is temporarily unavailable. Please try again later.",
      database_error: "We're having trouble saving your progress. Please contact support if this continues.",
      s3_upload_error: "Unable to store your files. Please try again.",
      s3_storage_unavailable: 'Cannot reach storage. Please start MinIO or restore S3 connectivity before retrying.',
      unknown: "Something unexpected went wrong. Please try again or contact support if this continues."
    };

    return finalMessages[errorType];
  }

  /**
   * Check if job can be retried based on current status and error state
   */
  canRetry(): boolean {
    const retryableStatuses: GenerationStatus[] = [
      'image_generation_failed',
      'conversion_failed',
      'image_generation_retrying',
      'conversion_retrying'
    ];

    if (!retryableStatuses.includes(this.data.status)) {
      return false;
    }

    if (!this.data.lastError?.retryable) {
      return false;
    }

    return (this.data.retryCount || 0) < this.data.lastError.maxRetries;
  }

  /**
   * Get seconds until next retry is allowed
   */
  getSecondsUntilRetry(): number {
    if (!this.data.lastError?.lastRetryAt) {
      return 0;
    }

    const now = new Date();
    const lastRetry = new Date(this.data.lastError.lastRetryAt);
    const elapsedSeconds = Math.floor((now.getTime() - lastRetry.getTime()) / 1000);
    const delaySeconds = this.data.lastError.suggestedRetryDelay;

    return Math.max(0, delaySeconds - elapsedSeconds);
  }

  /**
   * Atomically start job processing (prevents race conditions)
   */
  static async atomicStart(jobId: string): Promise<GenerationJob | null> {
    const pool = getPool();

    try {
      // Use UPDATE with WHERE to atomically check and update status
      const result = await pool.query(`
        UPDATE monster_generations 
        SET status = 'generating_image', progress = 5, updated_at = NOW()
        WHERE id = $1 AND status = 'pending'
        RETURNING *
      `, [jobId]);

      if (result.rows.length === 0) {
        return null; // Job already started or not found
      }

      const row = result.rows[0];
      return new GenerationJob({
        id: row.id,
        userId: row.user_id,
        prompt: row.prompt,
        style: row.style,
        stage: row.stage,
        generationType: row.generation_type,
        status: row.status,
        progress: row.progress,
        errorMessage: row.error_message,
        userMessage: row.user_message,
        imageS3Key: row.image_s3_key,
        imageUrl: row.image_url,
        glbS3Key: row.glb_s3_key,
        glbUrl: row.glb_url,
        totalCost: parseFloat(row.total_cost),
        retryCount: row.retry_count || 0,
        lastError: row.last_error ? GenerationJob.safeParseJSON(row.last_error) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at,
        // Token tracking fields
        openaiTextTokens: row.openai_text_tokens || 0,
        openaiImageTokens: row.openai_image_tokens || 0,
        openaiTotalTokens: row.openai_total_tokens || 0,
        openaiEstimatedCost: parseFloat(row.openai_estimated_cost) || 0.0,
        falEstimatedCost: parseFloat(row.fal_estimated_cost) || 0.0,
        costCalculationMethod: row.cost_calculation_method || 'token_based',
        lastCostUpdate: row.last_cost_update || row.created_at,
      });

    } catch (error) {
      console.error(`[GenerationJob] Failed to atomically start job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Log cost tracking data for an API request
   */
  async logCostTracking(costData: CostTrackingData): Promise<void> {
    const updates: UpdateJobParams = {
      lastCostUpdate: new Date(),
    };

    // Define cost rates for calculation
    const CURRENT_RATES = {
      openai_text_tokens: 5.0 / 1_000_000,     // $5 per 1M tokens
      openai_image_tokens: 40.0 / 1_000_000,   // $40 per 1M output tokens
      fal_image_to_3d: 0.30,                   // ~$0.30 per conversion (estimated)
    };

    if (costData.provider === 'openai') {
      // Update OpenAI token counts
      if (costData.openaiTextTokens !== undefined) {
        updates.openaiTextTokens = (this.data.openaiTextTokens || 0) + costData.openaiTextTokens;
      }
      if (costData.openaiImageTokens !== undefined) {
        updates.openaiImageTokens = (this.data.openaiImageTokens || 0) + costData.openaiImageTokens;
      }
      if (costData.openaiTotalTokens !== undefined) {
        updates.openaiTotalTokens = (this.data.openaiTotalTokens || 0) + costData.openaiTotalTokens;
      }

      // Calculate estimated cost
      const textCost = (updates.openaiTextTokens || this.data.openaiTextTokens || 0) * CURRENT_RATES.openai_text_tokens;
      const imageCost = (updates.openaiImageTokens || this.data.openaiImageTokens || 0) * CURRENT_RATES.openai_image_tokens;
      updates.openaiEstimatedCost = textCost + imageCost;

    } else if (costData.provider === 'fal') {
      // Update fal.ai estimated cost
      updates.falEstimatedCost = (this.data.falEstimatedCost || 0) + CURRENT_RATES.fal_image_to_3d;
    }

    updates.costCalculationMethod = 'token_based';

    try {
      await this.update(updates);

      console.log(`[GenerationJob] Cost tracking logged for ${costData.provider} ${costData.operation}:`);
      console.log(`  - Request successful: ${costData.requestSuccessful}`);
      if (costData.openaiTotalTokens) {
        console.log(`  - OpenAI tokens used: ${costData.openaiTotalTokens}`);
      }
      if (costData.openaiEstimatedCost) {
        console.log(`  - OpenAI estimated cost: $${costData.openaiEstimatedCost.toFixed(6)}`);
      }
      if (costData.falEstimatedCost) {
        console.log(`  - fal.ai estimated cost: $${costData.falEstimatedCost.toFixed(6)}`);
      }
      if (costData.errorMessage) {
        console.log(`  - Error: ${costData.errorMessage}`);
      }

    } catch (error) {
      console.error(`[GenerationJob] Failed to log cost tracking for job ${this.data.id}:`, error);
      // Don't throw error - cost tracking failure shouldn't break the generation process
    }
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON(): GenerationJobData {
    return {
      id: this.data.id,
      userId: this.data.userId,
      prompt: this.data.prompt,
      style: this.data.style,
      stage: this.data.stage,
      generationType: this.data.generationType,
      status: this.data.status,
      progress: this.data.progress,
      errorMessage: this.data.errorMessage,
      userMessage: this.data.userMessage,
      imageS3Key: this.data.imageS3Key,
      imageUrl: this.data.imageUrl,
      glbS3Key: this.data.glbS3Key,
      glbUrl: this.data.glbUrl,
      totalCost: this.data.totalCost,
      retryCount: this.data.retryCount,
      lastError: this.data.lastError,
      createdAt: this.data.createdAt,
      updatedAt: this.data.updatedAt,
      completedAt: this.data.completedAt,
      // Token tracking fields
      openaiTextTokens: this.data.openaiTextTokens,
      openaiImageTokens: this.data.openaiImageTokens,
      openaiTotalTokens: this.data.openaiTotalTokens,
      openaiEstimatedCost: this.data.openaiEstimatedCost,
      falEstimatedCost: this.data.falEstimatedCost,
      costCalculationMethod: this.data.costCalculationMethod,
      lastCostUpdate: this.data.lastCostUpdate,
    };
  }

  /**
   * Find jobs that can be resumed from image stage (OpenAI succeeded, fal.ai failed)
   * Internal method to prevent wasting expensive OpenAI results
   */
  static async findResumableJobs(): Promise<GenerationJob[]> {
    const pool = getPool();

    try {
      // Find jobs where image generation succeeded but 3D conversion failed/retrying
      const result = await pool.query(`
        SELECT * FROM monster_generations
        WHERE status IN ('conversion_failed', 'conversion_retrying')
          AND generation_type = 'full'
          AND image_s3_key IS NOT NULL
          AND glb_s3_key IS NULL
          AND retry_count < 10
        ORDER BY created_at ASC
        LIMIT 20
      `);

      return result.rows.map(row => new GenerationJob({
        id: row.id,
        userId: row.user_id,
        prompt: row.prompt,
        style: row.style,
        stage: row.stage,
        generationType: row.generation_type,
        status: row.status,
        progress: row.progress,
        errorMessage: row.error_message,
        userMessage: row.user_message,
        imageS3Key: row.image_s3_key,
        imageUrl: row.image_url,
        glbS3Key: row.glb_s3_key,
        glbUrl: row.glb_url,
        totalCost: row.total_cost,
        retryCount: row.retry_count,
        lastError: GenerationJob.safeParseJSON(row.last_error),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at,
        openaiTextTokens: row.openai_text_tokens || 0,
        openaiImageTokens: row.openai_image_tokens || 0,
        openaiTotalTokens: row.openai_total_tokens || 0,
        openaiEstimatedCost: row.openai_estimated_cost || 0,
        falEstimatedCost: row.fal_estimated_cost || 0,
        costCalculationMethod: row.cost_calculation_method || 'token_based',
        lastCostUpdate: row.last_cost_update || new Date(),
      }));

    } catch (error) {
      console.error('[GenerationJob] Failed to find resumable jobs:', error);
      return [];
    }
  }

}
