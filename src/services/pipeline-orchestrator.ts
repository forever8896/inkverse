/**
 * Simple Pipeline Orchestrator
 * Coordinates OpenAI image generation → fal.ai 3D conversion
 * Uses existing services without modification
 */

import { OpenAIService } from './ai-pipeline/openai-service';
import { FalService } from './ai-pipeline/fal-service';
import { PromptTemplateBuilder, MonsterStyle, MonsterStage } from './monster-generation/prompt-templates';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { createLogger } from '@/lib/logger';
import { calculateGenerationCost } from '@/lib/api-costs';
import { STORAGE_CONFIG } from '@/config/constants';

const logger = createLogger('Pipeline');

export interface GenerationResult {
  id: string;
  success: boolean;
  prompt: string;
  style?: MonsterStyle;
  stage?: MonsterStage;
  imageUrl?: string;
  imagePath?: string;
  glbUrl?: string;
  glbPath?: string;
  totalCost: number;
  duration: number; // milliseconds
  error?: string;
  timestamp: Date;
}

export interface GenerationOptions {
  style?: MonsterStyle;
  stage?: MonsterStage;
  customPrompt?: string;
  saveFiles?: boolean;
  outputDir?: string;
}

/**
 * Simple orchestrator that coordinates the AI pipeline
 * Uses existing OpenAI and fal.ai services directly
 */
export class PipelineOrchestrator {
  private static instance: PipelineOrchestrator;
  
  private constructor() {}

  public static getInstance(): PipelineOrchestrator {
    if (!PipelineOrchestrator.instance) {
      PipelineOrchestrator.instance = new PipelineOrchestrator();
    }
    return PipelineOrchestrator.instance;
  }

  /**
   * Generate a complete monster: prompt → image → 3D model
   * 
   * WARNING: Costs ~$0.70 per generation
   */
  async generateMonster(options: GenerationOptions = {}): Promise<GenerationResult> {
    const startTime = Date.now();
    const generationId = uuidv4();
    
    const result: GenerationResult = {
      id: generationId,
      success: false,
      prompt: '',
      style: options.style,
      stage: options.stage,
      totalCost: 0,
      duration: 0,
      timestamp: new Date(),
    };

    try {
      // Step 1: Build prompt
      result.prompt = this.buildPrompt(options);
      logger.info('Starting generation', {
        generationId,
        promptPreview: result.prompt.length > 100 ? result.prompt.substring(0, 100) + '...' : result.prompt,
        style: options.style,
        stage: options.stage,
      });

      // Step 2: Generate image with OpenAI (existing service)
      logger.debug('Generating image with OpenAI');
      const imageResult = await OpenAIService.getInstance().generateImage(result.prompt, {
        saveToFile: options.saveFiles !== false,
        outputDir: options.outputDir || path.join(process.cwd(), STORAGE_CONFIG.PUBLIC_OUTPUT_DIR),
        filename: `${generationId}-image.png`,
      });

      if (!imageResult.success) {
        throw new Error(`Image generation failed: ${imageResult.error}`);
      }

      result.imageUrl = imageResult.imageUrl;
      result.imagePath = imageResult.filePath;
      result.totalCost += imageResult.cost || 0;

      logger.debug('Image generated successfully');

      // Step 3: Convert to 3D with fal.ai (existing service)
      logger.debug('Converting to 3D with fal.ai');
      
      if (!imageResult.filePath) {
        throw new Error('No image file available for 3D conversion');
      }

      const modelResult = await FalService.getInstance().convertImageFileTo3D(imageResult.filePath, {
        saveToFile: options.saveFiles !== false,
        outputDir: options.outputDir || path.join(process.cwd(), STORAGE_CONFIG.PUBLIC_OUTPUT_DIR),
        filename: `${generationId}-model.glb`,
      });

      if (!modelResult.success) {
        throw new Error(`3D conversion failed: ${modelResult.error}`);
      }

      result.glbUrl = modelResult.glbUrl;
      result.glbPath = modelResult.glbFilePath;
      result.totalCost += modelResult.cost || 0;

      // Step 4: Success
      result.success = true;
      result.duration = Date.now() - startTime;

      logger.info('Generation completed successfully', {
        generationId,
        totalCost: result.totalCost,
        duration: result.duration,
      });

      return result;

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;
      
      logger.error(`Generation ${generationId} failed`, new Error(result.error));
      
      return result;
    }
  }

  /**
   * Build a prompt for monster generation
   */
  private buildPrompt(options: GenerationOptions): string {
    if (options.customPrompt) {
      return options.customPrompt;
    }

    const builder = new PromptTemplateBuilder(
      options.style || 'cute', 
      options.stage || 'adult'
    );

    return builder.generateFullPrompt();
  }

  /**
   * Estimate cost for generating monsters using current database prices
   */
  async estimateCost(count: number = 1): Promise<number> {
    const costs = await calculateGenerationCost(new Date());
    return count * costs.totalCost;
  }
}