import { fal } from "@fal-ai/client";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { createLogger } from '@/lib/logger';
import { getApiCost, DEFAULT_COSTS } from '@/lib/api-costs';
import { API_TIMEOUTS, RETRY_CONFIG, FILE_SIZES, STORAGE_CONFIG, formatFileSize } from '@/config/constants';

const logger = createLogger('Fal');

export interface ConversionResult {
  id: string;
  glbUrl?: string;
  glbFilePath?: string;
  previewImageUrl?: string;
  success: boolean;
  error?: string;
  cost?: number;
  taskId?: string;
}

export interface ConversionOptions {
  saveToFile?: boolean;
  outputDir?: string;
  filename?: string;
  texture?: 'no' | 'standard' | 'HD';
  seed?: number;
  faceLimit?: number;
}

export class FalService {
  private static instance: FalService;
  private requestCount = 0;
  private totalCost = 0;

  constructor() {
    // Configure fal client with API key
    fal.config({
      credentials: process.env.FAL_KEY,
    });
  }

  public static getInstance(): FalService {
    if (!FalService.instance) {
      FalService.instance = new FalService();
    }
    return FalService.instance;
  }

  /**
   * Convert an image to 3D GLB model using tripo3d v2.5
   */
  async convertImageTo3D(
    imageUrl: string,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const conversionId = uuidv4();
    
    try {
      this.requestCount++;
      
      logger.info('Converting image to 3D', { conversionId, imageUrl });
      
      const result = await fal.subscribe("tripo3d/tripo/v2.5/image-to-3d", {
        input: {
          image_url: imageUrl,
          texture: options.texture || 'standard',
          ...(options.seed && { seed: options.seed }),
          ...(options.faceLimit && { face_limit: options.faceLimit }),
        }
      });

      if (!result.data) {
        throw new Error('No 3D model data returned from fal.ai');
      }

      const modelData = result.data;
      let glbFilePath: string | undefined;
      
      // Handle file saving if requested
      if (options.saveToFile && modelData.model_mesh && modelData.model_mesh.url) {
        const outputDir = options.outputDir || STORAGE_CONFIG.DEFAULT_OUTPUT_DIR;
        // Sanitize filename to prevent path traversal
        const sanitizedFilename = path.basename(options.filename || `monster_3d_${conversionId}.glb`);

        // Validate that filename doesn't contain dangerous patterns
        if (sanitizedFilename.includes('..') || sanitizedFilename.includes('/')) {
          throw new Error('Invalid filename');
        }

        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        glbFilePath = path.join(outputDir, sanitizedFilename);

        // Verify the final path is within the intended directory
        const normalizedPath = path.normalize(glbFilePath);
        const normalizedOutputDir = path.normalize(outputDir);
        if (!normalizedPath.startsWith(normalizedOutputDir)) {
          throw new Error('Path traversal attempt detected');
        }
        
        // Download the GLB file from URL with retry
        const fetch = (await import('node-fetch')).default;
        let response;
        let retries = RETRY_CONFIG.MAX_ATTEMPTS;
        
        while (retries > 0) {
          try {
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.DOWNLOAD);

            response = await fetch(modelData.model_mesh.url, {
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) break;
          } catch (error) {
            retries--;
            if (retries === 0) throw error;
            logger.warn(`Download retry ${RETRY_CONFIG.MAX_ATTEMPTS - retries}/${RETRY_CONFIG.MAX_ATTEMPTS}`);
            await new Promise(resolve => setTimeout(resolve, API_TIMEOUTS.RETRY_DELAY));
          }
        }
        
        if (!response || !response.ok) {
          throw new Error(`Failed to download GLB file: ${response?.statusText}`);
        }
        
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(glbFilePath, buffer);
        
        logger.info('3D model saved', {
          filePath: glbFilePath,
          sizeFormatted: formatFileSize(buffer.length),
        });
      }

      // Get current cost from database
      const currentCost = await getApiCost('fal', 'tripo3d-v2.5') ?? DEFAULT_COSTS.FAL_CONVERSION;

      // Update cost tracking
      this.totalCost += currentCost;

      const conversionResult: ConversionResult = {
        id: conversionId,
        glbUrl: modelData.model_mesh?.url,
        glbFilePath,
        previewImageUrl: modelData.rendered_image?.url,
        success: true,
        cost: currentCost,
        taskId: result.requestId,
      };

      logger.info('Successfully converted to 3D model', { conversionId, cost: currentCost });
      return conversionResult;

    } catch (error) {
      logger.error(`Error converting image to 3D ${conversionId}`, error);
      
      return {
        id: conversionId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Convert an image file to 3D GLB model
   */
  async convertImageFileTo3D(
    imagePath: string,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    try {
      // First upload the image file to get a URL
      const imageUrl = await this.uploadImageFile(imagePath);
      
      // Then convert using the URL
      return this.convertImageTo3D(imageUrl, options);
    } catch (error) {
      logger.error('Error converting image file to 3D', error);
      
      return {
        id: uuidv4(),
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload image file",
      };
    }
  }

  /**
   * Upload an image file and get a URL for processing
   */
  private async uploadImageFile(imagePath: string): Promise<string> {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Upload to fal.ai's storage
    const imageFile = new File([imageBuffer], path.basename(imagePath), {
      type: 'image/png'
    });
    
    const uploadedImageUrl = await fal.storage.upload(imageFile);
    
    logger.debug('Image uploaded', { url: uploadedImageUrl });
    return uploadedImageUrl;
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      requestCount: this.requestCount,
      totalCost: this.totalCost,
      averageCostPerRequest: this.requestCount > 0 ? this.totalCost / this.requestCount : 0,
    };
  }

  /**
   * Reset usage statistics
   */
  resetStats() {
    this.requestCount = 0;
    this.totalCost = 0;
  }

  /**
   * Validate GLB file
   */
  validateGLBFile(filePath: string): { valid: boolean; size?: number; error?: string } {
    try {
      if (!fs.existsSync(filePath)) {
        return { valid: false, error: 'File does not exist' };
      }

      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // Check file size (GLB files should be substantial for 3D models)
      if (fileSize < FILE_SIZES.MIN_GLB_FILE_SIZE) {
        return { valid: false, error: `File too small to be a valid GLB model (minimum ${formatFileSize(FILE_SIZES.MIN_GLB_FILE_SIZE)})` };
      }

      // Check if file starts with GLB magic bytes (67 6C 54 46)
      const fileDescriptor = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(4);
      fs.readSync(fileDescriptor, buffer, 0, 4, 0);
      fs.closeSync(fileDescriptor);
      const magicBytes = buffer.toString('ascii');
      
      if (magicBytes !== 'glTF') {
        return { valid: false, error: 'File does not appear to be a valid GLB model' };
      }

      return { valid: true, size: fileSize };

    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }
}

export default FalService.getInstance();