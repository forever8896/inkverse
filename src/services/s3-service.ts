/**
 * S3Service - S3-compatible storage for production pipeline
 * Supports both local MinIO and production S3
 * Used ONLY by production pipeline - existing AI services remain unchanged
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface S3Config {
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  forcePathStyle?: boolean;
}

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  success: boolean;
  error?: string;
}

export interface PresignedUrlOptions {
  expiresIn?: number; // seconds, default 1 hour
}

export interface UploadOptions {
  metadata?: Record<string, string>;
  expiresIn?: number; // For presigned URL generation
}

export class S3Service {
  private static instance: S3Service;
  private client: S3Client;
  private bucket: string;

  private constructor() {
    const config = this.getConfig();
    this.validateConfig(config);

    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle, // Required for MinIO
      // Disable checksum features for MinIO compatibility
      // AWS SDK v3 adds x-amz-checksum-mode=ENABLED which MinIO doesn't support
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });

    this.bucket = config.bucket;
    console.log(`[S3Service] Initialized with bucket: ${this.bucket}, endpoint: ${config.endpoint || 'AWS S3'}`);
  }

  /**
   * Validate required S3 configuration at initialization
   */
  private validateConfig(config: S3Config): void {
    const errors: string[] = [];

    if (!config.accessKeyId || config.accessKeyId.trim().length === 0) {
      errors.push('S3_ACCESS_KEY environment variable is required but not set or empty');
    }

    if (!config.secretAccessKey || config.secretAccessKey.trim().length === 0) {
      errors.push('S3_SECRET_KEY environment variable is required but not set or empty');
    }

    if (!config.bucket || config.bucket.trim().length === 0) {
      errors.push('S3_BUCKET environment variable is required but not set or empty');
    }

    if (!config.region || config.region.trim().length === 0) {
      errors.push('S3_REGION environment variable is required but not set or empty');
    }

    if (errors.length > 0) {
      throw new Error(
        `[S3Service] Configuration validation failed:\n  - ${errors.join('\n  - ')}`
      );
    }

    console.log('[S3Service] Configuration validated successfully');
  }

  public static getInstance(): S3Service {
    if (!S3Service.instance) {
      S3Service.instance = new S3Service();
    }
    return S3Service.instance;
  }

  private getConfig(): S3Config {
    // Environment-based configuration
    const isLocal = !!process.env.S3_ENDPOINT;

    return {
      endpoint: process.env.S3_ENDPOINT, // undefined for AWS S3, set for MinIO
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY || '',
      secretAccessKey: process.env.S3_SECRET_KEY || '',
      bucket: process.env.S3_BUCKET || '',
      forcePathStyle: isLocal, // Required for MinIO
    };
  }

  /**
   * Upload a file buffer to S3 with optional idempotency support
   *
   * @param key - S3 object key
   * @param buffer - File data buffer
   * @param contentType - MIME type
   * @param options - Upload options including metadata for idempotency
   * @returns UploadResult with success status, URL, and error info
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string = 'application/octet-stream',
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      // Idempotency check: If idempotencyKey provided, check if file exists
      if (options?.metadata?.idempotencyKey) {
        try {
          const headResult = await this.client.send(
            new HeadObjectCommand({
              Bucket: this.bucket,
              Key: key
            })
          );

          // File exists - check if idempotency key matches
          if (headResult.Metadata?.idempotencykey === options.metadata.idempotencyKey) {
            console.log(`[S3Service] File ${key} already uploaded (idempotent - skipping upload)`);

            // Return existing file URL
            const presignedUrl = await this.getPresignedUrl(key, {
              expiresIn: options.expiresIn || 7200 // 2 hours default
            });

            return {
              key,
              url: presignedUrl,
              bucket: this.bucket,
              success: true
            };
          } else {
            console.log(`[S3Service] File ${key} exists but idempotency key mismatch - re-uploading`);
          }
        } catch (headError: any) {
          // File doesn't exist (404) - proceed with upload
          if (headError.name !== 'NotFound') {
            throw headError; // Other error - propagate
          }
        }
      }

      // Upload file to S3
      console.log(`[S3Service] Uploading ${key} to S3 (${buffer.length} bytes)`);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: options?.metadata // Include idempotency key in metadata
      });

      await this.client.send(command);

      console.log(`[S3Service] Successfully uploaded ${key}`);

      // Generate presigned URL
      const presignedUrl = await this.getPresignedUrl(key, {
        expiresIn: options?.expiresIn || 7200 // 2 hours default
      });

      return {
        key,
        url: presignedUrl,
        bucket: this.bucket,
        success: true,
      };

    } catch (error) {
      console.error(`[S3Service] Upload failed for ${key}:`, error);

      return {
        key,
        url: '',
        bucket: this.bucket,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
      };
    }
  }

  /**
   * Lightweight connectivity check to ensure the bucket is reachable.
   */
  async checkBucketAccessibility(): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown S3 connectivity error';
      console.error(`[S3Service] Bucket accessibility check failed:`, error);
      return { ok: false, error: message };
    }
  }

  /**
   * Upload from a readable stream (for large files)
   */
  async uploadStream(
    key: string,
    stream: NodeJS.ReadableStream,
    contentType: string = 'application/octet-stream'
  ): Promise<UploadResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: stream as any, // Type assertion for AWS SDK compatibility
        ContentType: contentType,
      });

      await this.client.send(command);

      const url = await this.getPresignedUrl(key, { expiresIn: 3600 });

      console.log(`[S3Service] Uploaded stream: ${key}`);

      return {
        key,
        url,
        bucket: this.bucket,
        success: true,
      };

    } catch (error) {
      console.error(`[S3Service] Stream upload failed for ${key}:`, error);
      
      return {
        key,
        url: '',
        bucket: this.bucket,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
      };
    }
  }

  /**
   * Get a presigned URL for downloading/viewing a file
   */
  async getPresignedUrl(key: string, options: PresignedUrlOptions = {}): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, {
        expiresIn: options.expiresIn || 3600, // 1 hour default
      });

      return url;

    } catch (error) {
      console.error(`[S3Service] Failed to generate presigned URL for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;

    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      console.log(`[S3Service] Deleted file: ${key}`);
      return true;

    } catch (error) {
      console.error(`[S3Service] Failed to delete ${key}:`, error);
      return false;
    }
  }

  /**
   * Generate S3 key for a generation job
   */
  generateKey(jobId: string, type: 'image' | 'model'): string {
    const extension = type === 'image' ? 'png' : 'glb';
    const folder = type === 'image' ? 'images' : 'models';
    return `${folder}/${jobId}-${type}.${extension}`;
  }

  /**
   * Get the bucket name
   */
  getBucket(): string {
    return this.bucket;
  }

  /**
   * Download a file from S3 as a buffer
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        throw new Error('No file body returned from S3');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const stream = response.Body as NodeJS.ReadableStream;

      for await (const chunk of stream) {
        chunks.push(chunk as Uint8Array);
      }
      
      const buffer = Buffer.concat(chunks);
      console.log(`[S3Service] Downloaded file: ${key} (${buffer.length} bytes)`);
      
      return buffer;

    } catch (error) {
      console.error(`[S3Service] Download failed for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Upload a file from a URL (for fal.ai results)
   */
  async uploadFromUrl(key: string, url: string, contentType?: string): Promise<UploadResult> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const finalContentType = contentType || response.headers.get('content-type') || 'application/octet-stream';

      return await this.uploadFile(key, buffer, finalContentType);

    } catch (error) {
      console.error(`[S3Service] Upload from URL failed for ${key}:`, error);
      
      return {
        key,
        url: '',
        bucket: this.bucket,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
      };
    }
  }
}
