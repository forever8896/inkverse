import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { OpenAIService } from './openai-service';
import fs from 'fs';
import path from 'path';

describe('OpenAIService', () => {
  let openaiService: OpenAIService;
  const testOutputDir = path.join(process.cwd(), 'test-output');

  beforeAll(() => {
    openaiService = new OpenAIService();
    
    // Ensure test output directory exists
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Keep generated images for visual verification
    // Clean up happens manually or via git ignore
    console.log(`\n📁 Generated test images saved in: ${testOutputDir}`);
  });


  describe('Image Generation (Integration Tests)', () => {
    it.skipIf(!process.env.RUN_INTEGRATION_TESTS)('should generate and save monster image to file', async () => {
      const result = await openaiService.generateMonsterImage(
        "a small purple dragon with tiny wings and big friendly eyes",
        {
          saveToFile: true,
          outputDir: testOutputDir,
          filename: "test-monster.png"
        }
      );

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.cost).toBe(0.40);
      expect(result.filePath).toBeDefined();
      expect(result.base64Data).toBeDefined();

      // Verify file was created
      if (result.filePath) {
        expect(fs.existsSync(result.filePath)).toBe(true);
        
        const stats = fs.statSync(result.filePath);
        expect(stats.size).toBeGreaterThan(0);
        
        // Verify it's a reasonable image file size (should be > 100KB for 1024x1024)
        expect(stats.size).toBeGreaterThan(100 * 1024);
        
        console.log(`✅ Generated image: ${result.filePath} (${(stats.size / 1024).toFixed(2)} KB)`);
      }
    }, 120000);

    it('should handle API errors gracefully', async () => {
      // Test with empty prompt to potentially trigger an error
      const result = await openaiService.generateImage("");

      // We expect this to fail with empty prompt
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.cost).toBeUndefined();
    });
  });

  describe('Usage Statistics', () => {
    it('should track usage statistics correctly (unit test)', () => {
      const initialStats = openaiService.getUsageStats();
      
      // Test the statistics functions without API calls
      expect(typeof initialStats.requestCount).toBe('number');
      expect(typeof initialStats.totalCost).toBe('number');
      expect(typeof initialStats.averageCostPerRequest).toBe('number');
    });

    it('should reset statistics correctly', () => {
      openaiService.resetStats();
      const stats = openaiService.getUsageStats();
      
      expect(stats.requestCount).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.averageCostPerRequest).toBe(0);
    });
  });

  describe('Environment Configuration', () => {
    it('should have OpenAI API key configured', () => {
      expect(process.env.OPENAI_API_KEY).toBeDefined();
      expect(process.env.OPENAI_API_KEY).not.toBe('');
      expect(process.env.OPENAI_API_KEY).not.toBe('your_openai_api_key_here');
    });
  });
});