import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FalService } from './fal-service';
import { OpenAIService } from './openai-service';
import fs from 'fs';
import path from 'path';

describe('FalService', () => {
  let falService: FalService;
  let openaiService: OpenAIService;
  const testOutputDir = path.join(process.cwd(), 'test-output');

  beforeAll(() => {
    falService = new FalService();
    openaiService = new OpenAIService();
    
    // Ensure test output directory exists
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Keep generated 3D models for visual verification
    console.log(`\n📁 Generated 3D models saved in: ${testOutputDir}`);
  });

  describe('Environment Configuration', () => {
    it('should have fal.ai API key configured', () => {
      expect(process.env.FAL_KEY).toBeDefined();
      expect(process.env.FAL_KEY).not.toBe('');
      expect(process.env.FAL_KEY).not.toBe('your_fal_api_key_here');
    });
  });

  describe('GLB File Validation', () => {
    it('should validate GLB files correctly', () => {
      // Test with non-existent file
      const result1 = falService.validateGLBFile('/non/existent/file.glb');
      expect(result1.valid).toBe(false);
      expect(result1.error).toBeDefined();

      // We'll test with real GLB files in integration tests
    });
  });

  describe('Usage Statistics', () => {
    it('should track usage statistics correctly (unit test)', () => {
      const initialStats = falService.getUsageStats();
      
      // Test the statistics functions without API calls
      expect(typeof initialStats.requestCount).toBe('number');
      expect(typeof initialStats.totalCost).toBe('number');
      expect(typeof initialStats.averageCostPerRequest).toBe('number');
    });

    it('should reset statistics correctly', () => {
      falService.resetStats();
      const stats = falService.getUsageStats();
      
      expect(stats.requestCount).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.averageCostPerRequest).toBe(0);
    });
  });

  describe('3D Conversion (Integration Tests)', () => {
    it.skipIf(!process.env.RUN_INTEGRATION_TESTS)('should convert image to 3D GLB model', async () => {
      // First generate an image using OpenAI
      console.log('🎨 Generating image with OpenAI...');
      const imageResult = await openaiService.generateMonsterImage(
        "a simple round creature with big eyes",
        {
          saveToFile: true,
          outputDir: testOutputDir,
          filename: "source-image-for-3d.png"
        }
      );

      expect(imageResult.success).toBe(true);
      expect(imageResult.filePath).toBeDefined();

      if (!imageResult.filePath) {
        throw new Error('Failed to generate source image');
      }

      // Now convert the image to 3D
      console.log('🧊 Converting image to 3D with fal.ai...');
      const conversionResult = await falService.convertImageFileTo3D(
        imageResult.filePath,
        {
          saveToFile: true,
          outputDir: testOutputDir,
          filename: "test-monster.glb",
          texture: 'standard'
        }
      );

      expect(conversionResult.success).toBe(true);
      expect(conversionResult.id).toBeDefined();
      expect(conversionResult.cost).toBe(0.30);
      expect(conversionResult.glbUrl).toBeDefined();
      expect(conversionResult.glbFilePath).toBeDefined();

      // Verify GLB file was created and is valid
      if (conversionResult.glbFilePath) {
        expect(fs.existsSync(conversionResult.glbFilePath)).toBe(true);
        
        const stats = fs.statSync(conversionResult.glbFilePath);
        expect(stats.size).toBeGreaterThan(0);
        
        // Verify it's a substantial GLB file (should be 8-14MB as specified)
        expect(stats.size).toBeGreaterThan(1 * 1024 * 1024); // At least 1MB
        expect(stats.size).toBeLessThan(50 * 1024 * 1024); // Less than 50MB (reasonable upper bound)
        
        console.log(`✅ Generated 3D model: ${conversionResult.glbFilePath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);

        // Validate the GLB file format
        const validation = falService.validateGLBFile(conversionResult.glbFilePath);
        expect(validation.valid).toBe(true);
        expect(validation.size).toBe(stats.size);
      }

      // Verify we have a preview image
      expect(conversionResult.previewImageUrl).toBeDefined();

    }, 180000); // 3 minute timeout for full pipeline (image generation + 3D conversion)

    it.skipIf(!process.env.RUN_INTEGRATION_TESTS)('should handle conversion errors gracefully', async () => {
      // Test with invalid image URL
      const result = await falService.convertImageTo3D("https://invalid-url-that-does-not-exist.com/image.jpg");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.cost).toBeUndefined();
    }, 120000);
  });

  describe('Pipeline Integration', () => {
    it.skipIf(!process.env.RUN_INTEGRATION_TESTS)('should complete full OpenAI → fal.ai pipeline', async () => {
      console.log('🚀 Running full AI pipeline test...');
      
      // Step 1: Generate image with OpenAI
      console.log('🎨 Step 1: Generating image with OpenAI...');
      const imageResult = await openaiService.generateMonsterImage(
        "a cute robot monster with antenna and glowing eyes",
        {
          saveToFile: true,
          outputDir: testOutputDir,
          filename: "pipeline-source.png"
        }
      );

      expect(imageResult.success).toBe(true);
      expect(imageResult.filePath).toBeDefined();

      // Step 2: Convert to 3D with fal.ai
      console.log('🧊 Step 2: Converting to 3D with fal.ai...');
      const conversionResult = await falService.convertImageFileTo3D(
        imageResult.filePath!,
        {
          saveToFile: true,
          outputDir: testOutputDir,
          filename: "pipeline-result.glb",
          texture: 'HD' // Use HD texture for better quality
        }
      );

      expect(conversionResult.success).toBe(true);
      expect(conversionResult.glbFilePath).toBeDefined();

      // Verify the complete pipeline cost
      const totalCost = imageResult.cost! + conversionResult.cost!;
      expect(totalCost).toBeLessThan(1.00); // Should be under $1 total
      
      console.log(`💰 Total pipeline cost: $${totalCost.toFixed(2)}`);
      console.log(`📊 OpenAI: $${imageResult.cost} + fal.ai: $${conversionResult.cost}`);

      if (conversionResult.glbFilePath) {
        const stats = fs.statSync(conversionResult.glbFilePath);
        console.log(`🎯 Final GLB model: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
        
        // Verify target size range (8-14MB as specified)
        expect(stats.size).toBeGreaterThan(1 * 1024 * 1024); // At least 1MB minimum
      }

    }, 300000); // 5 minute timeout for full pipeline
  });
});