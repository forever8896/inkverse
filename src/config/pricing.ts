/**
 * AI Service Pricing Constants (2025)
 *
 * This file contains the latest pricing information for OpenAI and fal.ai services.
 * Update these values when pricing changes to ensure accurate cost tracking.
 *
 * Last updated: September 2025
 * Sources:
 * - OpenAI: https://openai.com/api/pricing/
 * - fal.ai: https://fal.ai/pricing
 */

// ============================================================================
// OPENAI PRICING (2025)
// ============================================================================

/**
 * OpenAI GPT-Image-1 / DALL-E 3 Pricing
 *
 * GPT-Image-1 is OpenAI's enhanced image generation model (DALL-E 3)
 * Pricing is per image generated, varies by resolution and quality
 */
export const OPENAI_PRICING = {
  /**
   * Standard quality 1024x1024 image generation
   * Used for: Default monster image generation
   * Cost: $0.04 per image
   */
  IMAGE_GENERATION_STANDARD_1024: 0.04,

  /**
   * HD quality 1024x1024 image generation
   * Used for: High-quality monster images (not currently used)
   * Cost: $0.08 per image (2x standard)
   */
  IMAGE_GENERATION_HD_1024: 0.08,

  /**
   * Standard quality 1024x1792 image generation
   * Used for: Non-square images (not currently used)
   * Cost: $0.08 per image
   */
  IMAGE_GENERATION_STANDARD_1024x1792: 0.08,

  /**
   * HD quality 1024x1792 image generation
   * Used for: High-quality non-square images (not currently used)
   * Cost: $0.12 per image
   */
  IMAGE_GENERATION_HD_1024x1792: 0.12,

  /**
   * Default cost for image generation (what we actually use)
   * This is for standard quality 1024x1024 images
   */
  DEFAULT_IMAGE_COST: 0.04,
} as const;

// ============================================================================
// FAL.AI PRICING (2025)
// ============================================================================

/**
 * fal.ai Tripo3D Image-to-3D Conversion Pricing
 *
 * Tripo3D converts 2D images to 3D GLB models
 * Pricing varies based on texture quality
 */
export const FAL_PRICING = {
  /**
   * Image-to-3D without textures
   * Used for: Basic 3D shape only (not currently used)
   * Cost: $0.20 per request
   */
  IMAGE_TO_3D_NO_TEXTURE: 0.20,

  /**
   * Image-to-3D with standard textures
   * Used for: Default monster 3D model generation
   * Cost: $0.30 per request
   */
  IMAGE_TO_3D_STANDARD_TEXTURE: 0.30,

  /**
   * Image-to-3D with HD textures
   * Used for: High-quality 3D models (not currently used)
   * Cost: $0.40 per request
   */
  IMAGE_TO_3D_HD_TEXTURE: 0.40,

  /**
   * Additional cost for Style option
   * Used for: Enhanced stylization (optional)
   * Cost: +$0.05 per request
   */
  ADDON_STYLE: 0.05,

  /**
   * Additional cost for Quad option
   * Used for: Quad topology (optional)
   * Cost: +$0.05 per request
   */
  ADDON_QUAD: 0.05,

  /**
   * Default cost for 3D conversion (what we actually use)
   * This is for standard texture quality without add-ons
   */
  DEFAULT_3D_COST: 0.30,
} as const;

// ============================================================================
// TOTAL COSTS
// ============================================================================

/**
 * Combined costs for complete monster generation
 */
export const TOTAL_COSTS = {
  /**
   * Total cost for one complete monster generation
   * OpenAI image ($0.04) + fal.ai 3D conversion ($0.30)
   */
  COMPLETE_MONSTER_GENERATION: OPENAI_PRICING.DEFAULT_IMAGE_COST + FAL_PRICING.DEFAULT_3D_COST,

  /**
   * Total cost per generation (rounded for display)
   * $0.34 per monster
   */
  DISPLAY_COST: 0.34,
} as const;

// ============================================================================
// LEGACY COSTS
// ============================================================================

/**
 * Old pricing constants for backward compatibility
 * @deprecated Use OPENAI_PRICING and FAL_PRICING instead
 */
export const LEGACY_COSTS = {
  /**
   * Old estimated image generation cost
   * @deprecated This was an overestimate
   */
  OLD_IMAGE_COST: 0.40,

  /**
   * Old total cost estimate
   * @deprecated Use TOTAL_COSTS.COMPLETE_MONSTER_GENERATION instead
   */
  OLD_TOTAL_COST: 0.70,
} as const;

// ============================================================================
// COST CALCULATION HELPERS
// ============================================================================

/**
 * Calculate cost for image generation based on quality and size
 * @param quality - 'standard' or 'hd'
 * @param size - '1024x1024' or '1024x1792'
 * @returns Cost in USD
 */
export function calculateImageCost(
  quality: 'standard' | 'hd' = 'standard',
  size: '1024x1024' | '1024x1792' = '1024x1024'
): number {
  if (size === '1024x1024') {
    return quality === 'hd'
      ? OPENAI_PRICING.IMAGE_GENERATION_HD_1024
      : OPENAI_PRICING.IMAGE_GENERATION_STANDARD_1024;
  } else {
    return quality === 'hd'
      ? OPENAI_PRICING.IMAGE_GENERATION_HD_1024x1792
      : OPENAI_PRICING.IMAGE_GENERATION_STANDARD_1024x1792;
  }
}

/**
 * Calculate cost for 3D conversion based on texture quality and add-ons
 * @param texture - 'none', 'standard', or 'hd'
 * @param addons - Array of addon names ('style', 'quad')
 * @returns Cost in USD
 */
export function calculate3DCost(
  texture: 'none' | 'standard' | 'hd' = 'standard',
  addons: Array<'style' | 'quad'> = []
): number {
  let baseCost: number;

  switch (texture) {
    case 'none':
      baseCost = FAL_PRICING.IMAGE_TO_3D_NO_TEXTURE;
      break;
    case 'hd':
      baseCost = FAL_PRICING.IMAGE_TO_3D_HD_TEXTURE;
      break;
    default:
      baseCost = FAL_PRICING.IMAGE_TO_3D_STANDARD_TEXTURE;
  }

  const addonCost = addons.reduce((total, addon) => {
    return total + (addon === 'style' ? FAL_PRICING.ADDON_STYLE : FAL_PRICING.ADDON_QUAD);
  }, 0);

  return baseCost + addonCost;
}

/**
 * Calculate total cost for a complete monster generation
 * @param imageQuality - Image quality setting
 * @param textureQuality - 3D texture quality setting
 * @returns Total cost in USD
 */
export function calculateTotalCost(
  imageQuality: 'standard' | 'hd' = 'standard',
  textureQuality: 'none' | 'standard' | 'hd' = 'standard'
): number {
  const imageCost = calculateImageCost(imageQuality);
  const modelCost = calculate3DCost(textureQuality);
  return imageCost + modelCost;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ImageQuality = 'standard' | 'hd';
export type TextureQuality = 'none' | 'standard' | 'hd';
export type Addon = 'style' | 'quad';