/**
 * Monster Prompt Generation Utilities
 * 
 * This module handles the generation of AI prompts from structured monster data.
 * It encapsulates the logic for translating user choices into detailed descriptive
 * prompts for the AI generation pipeline.
 */

export interface GenerateMonsterRequest {
  // Physical Features
  eyes: number;
  bodyType: 'skeletal' | 'muscular' | 'fluffy' | 'serpentine' | 'rocky';
  size: 'tiny' | 'small' | 'medium' | 'large' | 'massive';

  // Personality & Style
  attitude:
    | 'sassy'
    | 'crypto-degen'
    | 'rainbow'
    | 'wise'
    | 'mischievous'
    | 'regal'
    | 'robotic'
    | 'kawaii';

  // Magical Abilities
  canFly: 'wings' | 'floating' | 'no';
  specialPower:
    | 'fire'
    | 'ice'
    | 'lightning'
    | 'nature'
    | 'psychic'
    | 'star'
    | 'crystal'
    | 'wind';
  magicalAura: 'sparkly' | 'fiery' | 'cosmic' | 'watery' | 'floral';

  // Appearance
  colorScheme:
    | 'red'
    | 'blue'
    | 'green'
    | 'purple'
    | 'rainbow'
    | 'dark'
    | 'light'
    | 'metallic';
  texture: 'scales' | 'fur' | 'metal' | 'crystal' | 'plant' | 'ethereal';

  // Environment
  habitat:
    | 'mountains'
    | 'ocean'
    | 'forest'
    | 'space'
    | 'desert'
    | 'ruins'
    | 'city'
    | 'clouds';

  // Keep existing for backward compatibility
  style?: 'cute' | 'fierce' | 'mysterious' | 'playful' | 'cosmic'; // Legacy - defaults to 'cute'
  stage: 'egg' | 'young' | 'adult';
  generationType?: 'full' | 'image_only';
  
  // Lesson Context (Optional)
  lessonId?: number;
  chapterId?: number;
  stepId?: number;

  // Wallet Address for NFT minting
  walletAddress?: string;
}

// Option Constants
export const MONSTER_EYES = [1, 2, 3, 8] as const;
export const MONSTER_BODY_TYPES = ['skeletal', 'muscular', 'fluffy', 'serpentine', 'rocky'] as const;
export const MONSTER_SIZES = ['tiny', 'small', 'medium', 'large', 'massive'] as const;
export const MONSTER_ATTITUDES = ['sassy', 'crypto-degen', 'rainbow', 'wise', 'mischievous', 'regal', 'robotic', 'kawaii'] as const;
export const MONSTER_FLYING = ['wings', 'floating', 'no'] as const;
export const MONSTER_SPECIAL_POWERS = ['fire', 'ice', 'lightning', 'nature', 'psychic', 'star', 'crystal', 'wind'] as const;
export const MONSTER_MAGICAL_AURAS = ['sparkly', 'fiery', 'cosmic', 'watery', 'floral'] as const;
export const MONSTER_COLOR_SCHEMES = ['red', 'blue', 'green', 'purple', 'rainbow', 'dark', 'light', 'metallic'] as const;
export const MONSTER_TEXTURES = ['scales', 'fur', 'metal', 'crystal', 'plant', 'ethereal'] as const;
export const MONSTER_HABITATS = ['mountains', 'ocean', 'forest', 'space', 'desert', 'ruins', 'city', 'clouds'] as const;

/**
 * Generates a random monster request configuration
 * Useful for "Surprise Me" functionality or generating diverse examples
 */
export function generateRandomMonsterRequest(): GenerateMonsterRequest {
  const getRandom = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

  return {
    eyes: getRandom(MONSTER_EYES),
    bodyType: getRandom(MONSTER_BODY_TYPES),
    size: getRandom(MONSTER_SIZES),
    attitude: getRandom(MONSTER_ATTITUDES),
    canFly: getRandom(MONSTER_FLYING),
    specialPower: getRandom(MONSTER_SPECIAL_POWERS),
    magicalAura: getRandom(MONSTER_MAGICAL_AURAS),
    colorScheme: getRandom(MONSTER_COLOR_SCHEMES),
    texture: getRandom(MONSTER_TEXTURES),
    habitat: getRandom(MONSTER_HABITATS),
    stage: 'young', // Default to young for random generation
    generationType: 'full'
  };
}

/**
 * Generates a detailed AI prompt from structured monster data.
 * This generates the FULL prompt that gets sent to OpenAI, including all wrapper instructions.
 * 
 * @param data - The structured monster configuration
 * @returns The complete prompt string for the AI model
 */
export function generatePromptFromStructuredData(
  data: GenerateMonsterRequest
): string {
  const eyeText =
    data.eyes === 1
      ? 'one eye'
      : data.eyes === 2
        ? 'two eyes'
        : data.eyes === 3
          ? 'three eyes'
          : 'many eyes';
  const flyText =
    data.canFly === 'wings'
      ? 'with wings for flying'
      : data.canFly === 'floating'
        ? 'that floats magically'
        : 'that is grounded';

  // Core creature description - include stage for proper lifecycle representation
  const stageDescription = data.stage === 'egg'
    ? 'in egg form, unhatched with visible shell'
    : data.stage === 'young'
      ? 'in juvenile/baby form, small and youthful'
      : 'in fully grown adult form, mature and majestic';

  const creatureDescription = `A cute, friendly Spore-like ${data.size} ${data.attitude} ${data.stage} digital creature ${stageDescription} with ${eyeText}, ${data.bodyType} body type, ${data.texture} texture, ${data.colorScheme} colors, ${data.specialPower} powers, ${data.magicalAura} magical aura, ${flyText}, living in ${data.habitat}. Adorable, colorful, cartoon-like illustration suitable for educational content. The creature should look approachable and non-threatening, perfect for teaching programming concepts. High quality, detailed, vibrant colors.`;

  // Wrap with production instructions (matches production-openai-service.ts wrapper)
  return `Generate a cute, lovable, friendly Spore-like digital creature for a learning game.

Creature description: ${creatureDescription}

CRITICAL REQUIREMENTS:
- Style: adorable, colorful, cartoon-like 3D character based on "Spore" game
- THREE-DIMENSIONAL FORM with rounded, volumetric shapes that show depth and dimension
- Use soft shading, highlights, and shadows to emphasize the creature's 3D form and curved surfaces
- The creature should have clear dimensional depth - front/back, top/bottom distinctions visible
- Approachable and non-threatening, perfect for teaching programming concepts
- High quality, detailed, vibrant colors with gradients that enhance 3D appearance
- TRANSPARENT BACKGROUND - absolutely clear/transparent, no colors, no gradient, pure transparency
- Isolated subject suspended in void with no environment whatsoever
- The creature is NOT standing, sitting, or resting on anything
- NO floor, ground, platform, surface, grass, rocks, or terrain of any kind
- NO separate environmental elements floating in space (stars, sparkles, fairy dust, halos, auras, glowing orbs)
- Magical effects should be integrated INTO the creature's body as physical features (like glowing spots ON skin, crystalline horns, energy patterns IN fur)
- NO detached ambient effects or floating decorative elements surrounding the creature
- Avoid overly flat or symmetrical compositions - show the creature at a slight angle to reveal dimensionality

The creature itself should be fully three-dimensional and volumetric, like a 3D game character model, rendered with clear depth cues and shading. All magical/decorative elements must be part of the creature's anatomy, not floating around it. Pure transparent background with absolutely nothing except the creature itself.`;
}
