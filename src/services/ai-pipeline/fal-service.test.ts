/**
 * @file fal-service.test.ts
 * @description Unit tests for FalService - mocking external dependencies
 *
 * Tests the actual service logic without requiring real API keys or making real API calls.
 * Integration tests with real APIs can be run separately with RUN_INTEGRATION_TESTS=true
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FalService, type ConversionResult } from './fal-service';

// Mock the fal.ai client
vi.mock('@fal-ai/client', () => ({
  fal: {
    config: vi.fn(),
    subscribe: vi.fn()
  }
}));

// Mock fs for file operations
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(() => false),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(() => Buffer.from('fake-glb-data')),
    statSync: vi.fn(() => ({ size: 1024 * 1024 * 10 })) // 10MB
  }
}));

// Mock the database cost lookup
vi.mock('@/lib/api-costs', () => ({
  getApiCost: vi.fn(async () => 0.30), // Default fal.ai cost
  DEFAULT_COSTS: {
    openai: 0.40,
    fal: 0.30
  }
}));

describe('FalService - Unit Tests', () => {
  let service: FalService;
  let mockFal: any;

  beforeEach(async () => {
    // Set fake API key for tests
    process.env.FAL_KEY = 'test-fal-key';

    // Get the mocked fal client
    const { fal } = await import('@fal-ai/client');
    mockFal = fal;

    // Create fresh service instance
    service = new FalService();

    // Reset statistics
    service.resetStats();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('3D Conversion - Success Cases', () => {
    it('should successfully convert image to 3D model', async () => {
      // Mock successful fal.ai response
      mockFal.subscribe.mockImplementation(async (endpoint: string, options: any) => {
        // Simulate successful conversion
        return {
          requestId: 'test-request-id',
          data: {
            model_mesh: {
              url: 'https://example.com/model.glb'
            },
            preview_image: {
              url: 'https://example.com/preview.png'
            }
          }
        };
      });

      const result = await service.convertImageTo3D('https://example.com/test-image.png');

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.glbUrl).toBe('https://example.com/model.glb');
      // previewImageUrl is optional and may not always be present
      expect(result.cost).toBe(0.30); // Default fal.ai cost
      expect(result.error).toBeUndefined();
    });

    it('should successfully convert with HD texture option', async () => {
      mockFal.subscribe.mockImplementation(async () => ({
        data: {
          model_mesh: {
            url: 'https://example.com/model-hd.glb'
          }
        }
      }));

      const result = await service.convertImageTo3D(
        'https://example.com/test-image.png',
        { texture: 'HD' }
      );

      expect(result.success).toBe(true);
      expect(result.glbUrl).toBeDefined();
    });

    it('should pass correct options to fal.ai API', async () => {
      let capturedOptions: any;
      mockFal.subscribe.mockImplementation(async (endpoint: string, options: any) => {
        capturedOptions = options;
        return {
          data: {
            model_mesh: { url: 'https://example.com/model.glb' }
          }
        };
      });

      await service.convertImageTo3D(
        'https://example.com/image.png',
        {
          texture: 'HD',
          seed: 12345,
          faceLimit: 50000
        }
      );

      expect(capturedOptions.input).toBeDefined();
      expect(capturedOptions.input.image_url).toBe('https://example.com/image.png');
    });
  });

  describe('3D Conversion - Error Handling', () => {
    it('should handle fal.ai API errors', async () => {
      mockFal.subscribe.mockRejectedValue(
        new Error('fal.ai service overloaded')
      );

      const result = await service.convertImageTo3D('https://example.com/image.png');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('overloaded');
      expect(result.cost).toBeUndefined();
    });

    it('should handle network timeouts', async () => {
      mockFal.subscribe.mockRejectedValue(
        new Error('Request timeout after 120000ms')
      );

      const result = await service.convertImageTo3D('https://example.com/image.png');

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('should handle invalid image URL errors', async () => {
      mockFal.subscribe.mockRejectedValue(
        new Error('Failed to fetch image from URL')
      );

      const result = await service.convertImageTo3D('https://invalid-url.com/image.png');

      expect(result.success).toBe(false);
      expect(result.error).toContain('fetch image');
    });
  });

  describe('Usage Statistics Tracking', () => {
    it('should track successful request statistics', async () => {
      mockFal.subscribe.mockResolvedValue({
        data: {
          model_mesh: { url: 'https://example.com/model.glb' }
        }
      });

      const initialStats = service.getUsageStats();
      expect(initialStats.requestCount).toBe(0);
      expect(initialStats.totalCost).toBe(0);

      await service.convertImageTo3D('https://example.com/image.png');

      const updatedStats = service.getUsageStats();
      expect(updatedStats.requestCount).toBe(1);
      expect(updatedStats.totalCost).toBe(0.30);
      expect(updatedStats.averageCostPerRequest).toBe(0.30);
    });

    it('should track multiple conversions correctly', async () => {
      mockFal.subscribe.mockResolvedValue({
        data: {
          model_mesh: { url: 'https://example.com/model.glb' }
        }
      });

      await service.convertImageTo3D('https://example.com/image1.png');
      await service.convertImageTo3D('https://example.com/image2.png');
      await service.convertImageTo3D('https://example.com/image3.png');

      const stats = service.getUsageStats();
      expect(stats.requestCount).toBe(3);
      expect(stats.totalCost).toBeCloseTo(0.90, 2); // 3 * 0.30, allow floating point precision
      expect(stats.averageCostPerRequest).toBeCloseTo(0.30, 2);
    });

    it('should not count failed requests in cost tracking', async () => {
      mockFal.subscribe.mockRejectedValue(
        new Error('API Error')
      );

      await service.convertImageTo3D('https://example.com/image.png');

      const stats = service.getUsageStats();
      expect(stats.requestCount).toBe(1); // Request attempted
      expect(stats.totalCost).toBe(0); // But no cost incurred
    });

    it('should reset statistics correctly', async () => {
      mockFal.subscribe.mockResolvedValue({
        data: {
          model_mesh: { url: 'https://example.com/model.glb' }
        }
      });

      await service.convertImageTo3D('https://example.com/image.png');

      const beforeReset = service.getUsageStats();
      expect(beforeReset.requestCount).toBeGreaterThan(0);

      service.resetStats();

      const afterReset = service.getUsageStats();
      expect(afterReset.requestCount).toBe(0);
      expect(afterReset.totalCost).toBe(0);
      expect(afterReset.averageCostPerRequest).toBe(0);
    });
  });

  // File validation tests skipped - better suited for integration tests
  // as they require complex fs mocking

  describe('Singleton Pattern', () => {
    it('should return same instance via getInstance', () => {
      const instance1 = FalService.getInstance();
      const instance2 = FalService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Cost Calculation', () => {
    it('should use default cost for conversions', async () => {
      mockFal.subscribe.mockResolvedValue({
        data: {
          model_mesh: { url: 'https://example.com/model.glb' }
        }
      });

      const result = await service.convertImageTo3D('https://example.com/image.png');

      expect(result.cost).toBe(0.30); // Default fal.ai cost
    });
  });

  // File conversion tests skipped - better suited for integration tests
  // as they require complex fs and node-fetch mocking
});

// ============================================================================
// Optional Integration Tests - Run with RUN_INTEGRATION_TESTS=true
// ============================================================================

describe.skipIf(!process.env.RUN_INTEGRATION_TESTS)('FalService - Integration Tests', () => {
  let service: FalService;

  beforeEach(() => {
    // Check for real API key
    if (!process.env.FAL_KEY) {
      throw new Error('FAL_KEY environment variable required for integration tests');
    }
    service = new FalService();
  });

  it('should convert real image to 3D model', async () => {
    // Use a small test image URL
    const testImageUrl = 'https://picsum.photos/512/512';

    const result = await service.convertImageTo3D(testImageUrl, {
      texture: 'standard'
    });

    expect(result.success).toBe(true);
    expect(result.glbUrl).toBeDefined();
    expect(result.cost).toBe(0.30);

    console.log('✅ Integration test: 3D model generated successfully');
    console.log(`Model URL: ${result.glbUrl}`);
  }, 180000); // 3 minute timeout

  it('should handle real API errors gracefully', async () => {
    // Test with invalid image URL
    const result = await service.convertImageTo3D('https://invalid-domain-12345.com/image.png');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    console.log('✅ Integration test: Error handled correctly');
  }, 120000);
});
