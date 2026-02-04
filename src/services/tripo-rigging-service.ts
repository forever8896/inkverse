/**
 * Tripo Rigging Service
 *
 * Client for Tripo's Animation API to rig and animate 3D models.
 * Handles the complete flow: STS credentials -> Upload -> Import -> Rig -> Animate
 *
 * API Docs: https://docs.tripo3d.ai/
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { RigType as PricingRigType } from '@/config/pricing';

// ============================================================================
// Types
// ============================================================================

export type RigType = 'biped' | 'quadruped' | 'hexapod' | 'octopod' | 'avian' | 'serpentine' | 'aquatic';
export type RiggingSpec = 'tripo' | 'mixamo';
export type TaskStatus = 'queued' | 'running' | 'success' | 'failed' | 'cancelled' | 'unknown';
export type OutputFormat = 'glb' | 'fbx';
export type ModelVersion = 'v2.0-20250506' | 'v1.0-20240301';

export interface STSCredentials {
  bucket: string;
  key: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  endpoint: string;
}

export interface TripoTaskResponse {
  code: number;
  data?: {
    task_id: string;
  };
  message?: string;
}

export interface TripoTaskStatusResponse {
  code: number;
  data?: {
    task_id: string;
    type: string;
    status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled' | 'unknown';
    progress: number;
    input?: Record<string, unknown>;
    output?: {
      model?: string;          // URL to output model (for rig/retarget)
      riggable?: boolean;      // For prerigcheck
      rig_type?: RigType;      // For prerigcheck
    };
    create_time?: number;
    running_left_time?: number;
  };
  message?: string;
}

export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  progress?: number;
  output?: {
    model?: string;
    riggable?: boolean;
    rigType?: RigType;
  };
  error?: string;
}

export interface RigParams {
  originalTaskId: string;
  outFormat?: OutputFormat;
  modelVersion?: ModelVersion;
  rigType?: RigType;
  spec?: RiggingSpec;
}

export interface RetargetParams {
  rigTaskId: string;
  outFormat?: OutputFormat;
  animation?: string;
  animations?: string[];
  bakeAnimation?: boolean;
  animateInPlace?: boolean;
}

// Error codes from Tripo API
const TRIPO_ERROR_CODES: Record<number, string> = {
  2000: 'Rate limit exceeded',
  2001: 'Task not found',
  2002: 'Unsupported task type',
  2003: 'Empty input file',
  2004: 'Unsupported file type',
  2006: 'Invalid input task for animate',
  2007: 'Original task not successful',
  2008: 'Content policy violation',
  2010: 'Insufficient credits',
  2014: 'Audit service error',
  2016: 'Deprecated task type',
  2019: 'File not found in storage',
};

// ============================================================================
// Tripo Rigging Service
// ============================================================================

export class TripoRiggingService {
  private apiKey: string;
  private baseUrl = 'https://api.tripo3d.ai/v2/openapi';
  private static instance: TripoRiggingService | null = null;

  constructor() {
    const apiKey = process.env.TRIPO_API_KEY;
    if (!apiKey) {
      throw new Error('TRIPO_API_KEY environment variable is not set');
    }
    this.apiKey = apiKey;
  }

  /**
   * Get singleton instance of TripoRiggingService
   */
  static getInstance(): TripoRiggingService {
    if (!TripoRiggingService.instance) {
      TripoRiggingService.instance = new TripoRiggingService();
    }
    return TripoRiggingService.instance;
  }

  /**
   * Make authenticated request to Tripo API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    // Check for Tripo-specific error codes
    if (data.code !== 0) {
      const errorMessage = TRIPO_ERROR_CODES[data.code] || data.message || 'Unknown Tripo API error';
      throw new Error(`Tripo API Error (${data.code}): ${errorMessage}`);
    }

    return data;
  }

  // ============================================================================
  // Import Flow (required for external models)
  // ============================================================================

  /**
   * Get STS credentials for uploading to Tripo's S3 bucket
   */
  async getSTSCredentials(): Promise<STSCredentials> {
    const response = await this.request<{
      code: number;
      data: {
        bucket: string;
        key: string;
        access_key_id: string;
        secret_access_key: string;
        session_token: string;
        s3_endpoint: string;
      };
    }>('/upload/sts', {
      method: 'POST',
    });

    return {
      bucket: response.data.bucket,
      key: response.data.key,
      accessKeyId: response.data.access_key_id,
      secretAccessKey: response.data.secret_access_key,
      sessionToken: response.data.session_token,
      endpoint: response.data.s3_endpoint,
    };
  }

  /**
   * Upload a GLB file to Tripo's S3 bucket using STS credentials
   */
  async uploadToTripoStorage(glbBuffer: Buffer, credentials: STSCredentials): Promise<void> {
    // Create S3 client with Tripo's credentials
    const s3Client = new S3Client({
      endpoint: credentials.endpoint,
      region: 'us-east-1', // Tripo uses us-east-1
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
      forcePathStyle: true,
    });

    const command = new PutObjectCommand({
      Bucket: credentials.bucket,
      Key: credentials.key,
      Body: glbBuffer,
      ContentType: 'model/gltf-binary',
    });

    await s3Client.send(command);
  }

  /**
   * Import an uploaded model into Tripo's system
   * @returns Task ID for the import operation
   */
  async importModel(bucket: string, key: string): Promise<{ taskId: string }> {
    const response = await this.request<TripoTaskResponse>('/task', {
      method: 'POST',
      body: JSON.stringify({
        type: 'import_model',
        file: {
          object: {
            bucket,
            key,
          },
        },
      }),
    });

    if (!response.data?.task_id) {
      throw new Error('Import model response missing task_id');
    }

    return { taskId: response.data.task_id };
  }

  /**
   * Full import flow: get creds -> upload -> import
   * @param glbBuffer - The GLB file to import
   * @returns Task ID representing the imported model
   */
  async importGLBFromBuffer(glbBuffer: Buffer): Promise<{ taskId: string; credentials: STSCredentials }> {
    // Step 1: Get STS credentials
    const credentials = await this.getSTSCredentials();

    // Step 2: Upload to Tripo's S3
    await this.uploadToTripoStorage(glbBuffer, credentials);

    // Step 3: Import the model
    const { taskId } = await this.importModel(credentials.bucket, credentials.key);

    return { taskId, credentials };
  }

  // ============================================================================
  // Rigging Flow
  // ============================================================================

  /**
   * Check if a model can be rigged (PreRigCheck)
   * @param originalTaskId - Task ID of the imported model
   * @returns Task ID for the prerigcheck operation
   */
  async preRigCheck(originalTaskId: string): Promise<{ taskId: string }> {
    const response = await this.request<TripoTaskResponse>('/task', {
      method: 'POST',
      body: JSON.stringify({
        type: 'animate_prerigcheck',
        original_model_task_id: originalTaskId,
      }),
    });

    if (!response.data?.task_id) {
      throw new Error('PreRigCheck response missing task_id');
    }

    return { taskId: response.data.task_id };
  }

  /**
   * Apply rigging to a model
   * @param params - Rigging parameters
   * @returns Task ID for the rig operation
   */
  async rig(params: RigParams): Promise<{ taskId: string }> {
    const {
      originalTaskId,
      outFormat = 'glb',
      modelVersion = 'v2.0-20250506',
      rigType = 'biped',
      spec = 'tripo',
    } = params;

    const response = await this.request<TripoTaskResponse>('/task', {
      method: 'POST',
      body: JSON.stringify({
        type: 'animate_rig',
        original_model_task_id: originalTaskId,
        out_format: outFormat,
        model_version: modelVersion,
        rig_type: rigType,
        spec,
      }),
    });

    if (!response.data?.task_id) {
      throw new Error('Rig response missing task_id');
    }

    return { taskId: response.data.task_id };
  }

  /**
   * Apply animation to a rigged model (Retarget)
   * @param params - Animation parameters
   * @returns Task ID for the retarget operation
   */
  async retarget(params: RetargetParams): Promise<{ taskId: string }> {
    const {
      rigTaskId,
      outFormat = 'glb',
      animation,
      animations,
      bakeAnimation = true,
      animateInPlace = false,
    } = params;

    // Build request body
    const body: Record<string, unknown> = {
      type: 'animate_retarget',
      original_model_task_id: rigTaskId,
      out_format: outFormat,
      bake_animation: bakeAnimation,
      animate_in_place: animateInPlace,
    };

    // Use animations array if provided, otherwise use single animation
    if (animations && animations.length > 0) {
      if (animations.length > 5) {
        throw new Error('Maximum 5 animations allowed per retarget request');
      }
      body.animations = animations;
    } else if (animation) {
      body.animation = animation;
    } else {
      throw new Error('Either animation or animations must be provided');
    }

    const response = await this.request<TripoTaskResponse>('/task', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.data?.task_id) {
      throw new Error('Retarget response missing task_id');
    }

    return { taskId: response.data.task_id };
  }

  // ============================================================================
  // Task Management
  // ============================================================================

  /**
   * Get current status of a task
   */
  async getTaskStatus(taskId: string): Promise<TaskResult> {
    const response = await this.request<TripoTaskStatusResponse>(`/task/${taskId}`, {
      method: 'GET',
    });

    const data = response.data;
    if (!data) {
      throw new Error('Task status response missing data');
    }

    return {
      taskId: data.task_id,
      status: data.status,
      progress: data.progress,
      output: data.output ? {
        model: data.output.model,
        riggable: data.output.riggable,
        rigType: data.output.rig_type,
      } : undefined,
    };
  }

  /**
   * Poll until task completes or times out
   */
  async pollUntilComplete(
    taskId: string,
    options: {
      timeoutMs?: number;
      intervalMs?: number;
      onProgress?: (result: TaskResult) => void;
    } = {}
  ): Promise<TaskResult> {
    const {
      timeoutMs = 300000, // 5 minutes default
      intervalMs = 2000,  // 2 seconds default
      onProgress,
    } = options;

    const startTime = Date.now();

    while (true) {
      const result = await this.getTaskStatus(taskId);

      if (onProgress) {
        onProgress(result);
      }

      // Check for terminal states
      if (result.status === 'success' || result.status === 'failed' || result.status === 'cancelled') {
        return result;
      }

      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Task ${taskId} timed out after ${timeoutMs}ms`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  /**
   * Wait for import task to complete and verify success
   */
  async waitForImport(taskId: string, timeoutMs: number = 120000): Promise<TaskResult> {
    const result = await this.pollUntilComplete(taskId, { timeoutMs });

    if (result.status !== 'success') {
      throw new Error(`Import task failed with status: ${result.status}`);
    }

    return result;
  }

  /**
   * Wait for prerigcheck task and get riggability info
   */
  async waitForPreRigCheck(taskId: string, timeoutMs: number = 60000): Promise<{
    riggable: boolean;
    rigType?: RigType;
  }> {
    const result = await this.pollUntilComplete(taskId, { timeoutMs });

    if (result.status !== 'success') {
      throw new Error(`PreRigCheck task failed with status: ${result.status}`);
    }

    return {
      riggable: result.output?.riggable ?? false,
      rigType: result.output?.rigType,
    };
  }

  /**
   * Wait for rig task and get rigged model URL
   */
  async waitForRig(taskId: string, timeoutMs: number = 180000): Promise<{
    modelUrl: string;
  }> {
    const result = await this.pollUntilComplete(taskId, { timeoutMs });

    if (result.status !== 'success') {
      throw new Error(`Rig task failed with status: ${result.status}`);
    }

    if (!result.output?.model) {
      throw new Error('Rig task succeeded but no model URL returned');
    }

    return {
      modelUrl: result.output.model,
    };
  }

  /**
   * Wait for retarget task and get animated model URL
   */
  async waitForRetarget(taskId: string, timeoutMs: number = 180000): Promise<{
    modelUrl: string;
  }> {
    const result = await this.pollUntilComplete(taskId, { timeoutMs });

    if (result.status !== 'success') {
      throw new Error(`Retarget task failed with status: ${result.status}`);
    }

    if (!result.output?.model) {
      throw new Error('Retarget task succeeded but no model URL returned');
    }

    return {
      modelUrl: result.output.model,
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Download a model from Tripo's output URL
   */
  async downloadModel(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download model: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Convert RigType to pricing RigType
   */
  static toPricingRigType(rigType: RigType): PricingRigType {
    return rigType as PricingRigType;
  }
}

// Export singleton getter
export function getTripoRiggingService(): TripoRiggingService {
  return TripoRiggingService.getInstance();
}
