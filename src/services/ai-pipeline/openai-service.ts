import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/lib/logger';
import { getApiCost, DEFAULT_COSTS } from '@/lib/api-costs';
import { OPENAI_CONFIG, STORAGE_CONFIG, FILE_SIZES, formatFileSize } from '@/config/constants';

const logger = createLogger('OpenAI');

export interface GenerationResult {
  id: string;
  imageUrl?: string;
  base64Data?: string;
  filePath?: string;
  success: boolean;
  error?: string;
  cost?: number;
}

export interface GenerationOptions {
  saveToFile?: boolean;
  outputDir?: string;
  filename?: string;
  includeBase64?: boolean;
}

export class OpenAIService {
  private static instance: OpenAIService;
  private requestCount = 0;
  private totalCost = 0;
  private openai: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Generate an image using GPT-Image-1 model
   */
  async generateImage(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const generationId = uuidv4();

    try {
      // Rate limiting check
      this.requestCount++;

      logger.info('Starting image generation', {
        generationId,
        requestNumber: this.requestCount,
        model: OPENAI_CONFIG.MODEL,
        size: OPENAI_CONFIG.IMAGE_SIZE,
        quality: OPENAI_CONFIG.QUALITY,
        promptLength: prompt.length,
      });
      logger.debug('Full prompt', { prompt });
      
      const apiCallStart = Date.now();
      const result = await this.getClient().images.generate({
        model: OPENAI_CONFIG.MODEL,
        prompt,
        size: OPENAI_CONFIG.IMAGE_SIZE,
        response_format: OPENAI_CONFIG.RESPONSE_FORMAT,
        quality: OPENAI_CONFIG.QUALITY,
      });
      const apiCallDuration = Date.now() - apiCallStart;
      
      logger.info('API call completed', {
        duration: apiCallDuration,
        dataLength: result.data?.length || 0,
        hasImageUrl: !!result.data?.[0]?.url,
        hasBase64: !!result.data?.[0]?.b64_json,
      });

      if (!result.data || result.data.length === 0) {
        logger.error('No image data returned from OpenAI', { result });
        throw new Error('No image data returned from OpenAI');
      }

      const imageData = result.data[0];
      let filePath: string | undefined;

      // Handle file saving if requested
      if (options.saveToFile && imageData.b64_json) {
        const outputDir = options.outputDir || STORAGE_CONFIG.DEFAULT_OUTPUT_DIR;
        // Sanitize filename to prevent path traversal
        const sanitizedFilename = path.basename(options.filename || `monster_${generationId}.png`);

        // Validate that filename doesn't contain dangerous patterns
        if (sanitizedFilename.includes('..') || sanitizedFilename.includes('/')) {
          throw new Error('Invalid filename');
        }

        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        filePath = path.join(outputDir, sanitizedFilename);

        // Verify the final path is within the intended directory
        const normalizedPath = path.normalize(filePath);
        const normalizedOutputDir = path.normalize(outputDir);
        if (!normalizedPath.startsWith(normalizedOutputDir)) {
          throw new Error('Path traversal attempt detected');
        }

        // Convert base64 to buffer and save
        const imageBytes = Buffer.from(imageData.b64_json, 'base64');
        fs.writeFileSync(filePath, imageBytes);

        logger.info('Image saved to file', {
          filePath,
          sizeFormatted: formatFileSize(imageBytes.length),
        });
      }

      // Get current cost from database
      const currentCost = await getApiCost('openai', 'gpt-image-1') ?? DEFAULT_COSTS.OPENAI_IMAGE;

      // Update cost tracking
      this.totalCost += currentCost;

      const generationResult: GenerationResult = {
        id: generationId,
        imageUrl: imageData.url,
        base64Data:
          options.includeBase64 !== false ? imageData.b64_json : undefined,
        filePath,
        success: true,
        cost: currentCost,
      };

      logger.info('Successfully generated image', { generationId, cost: currentCost });
      return generationResult;
    } catch (error) {
      logger.error(`Error generating image ${generationId}`, error);

      return {
        id: generationId,
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate a monster image with a templated prompt
   */
  async generateMonsterImage(
    creatureDescription: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const monsterPrompt = `
A cute, friendly Spore-like digital creature for a learning game. 
The creature is ${creatureDescription}.
Style: adorable, colorful, cartoon-like illustration suitable for educational content.
The creature should look approachable and non-threatening, perfect for teaching programming concepts.
High quality, detailed, vibrant colors, transparent background.
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

export default OpenAIService.getInstance();
