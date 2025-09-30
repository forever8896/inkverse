export type MonsterStyle = 'cute' | 'fierce' | 'mysterious' | 'playful' | 'cosmic';
export type MonsterStage = 'egg' | 'young' | 'adult';

interface PromptTemplate {
  style: MonsterStyle;
  stage: MonsterStage;
  basePrompt: string;
  enhancers: string[];
  negativePrompt: string;
}

// Core creature characteristics inspired by Spore
const CREATURE_FEATURES = {
  bodies: [
    'blob-like body',
    'segmented torso',
    'spherical core',
    'elongated form',
    'compact round shape',
    'asymmetrical structure',
  ],
  limbs: [
    'multiple tentacles',
    'stubby legs',
    'wiggly appendages',
    'floating tendrils',
    'crystalline protrusions',
    'elastic pseudopods',
  ],
  textures: [
    'smooth glossy skin',
    'bumpy textured surface',
    'translucent membrane',
    'fuzzy fur coating',
    'bioluminescent patches',
    'iridescent scales',
  ],
  eyes: [
    'large expressive eyes',
    'multiple eye stalks',
    'single cyclops eye',
    'compound insect eyes',
    'glowing orb eyes',
    'asymmetrical eye placement',
  ],
  colors: [
    'vibrant purple and pink',
    'electric blue and cyan',
    'warm orange and yellow',
    'mint green and teal',
    'cosmic purple and gold',
    'rainbow gradient',
  ],
};

// Style-specific modifiers
const STYLE_MODIFIERS: Record<MonsterStyle, string[]> = {
  cute: [
    'adorable',
    'kawaii',
    'baby-like proportions',
    'big head small body',
    'round and chubby',
    'innocent expression',
    'soft features',
  ],
  fierce: [
    'menacing',
    'powerful',
    'sharp features',
    'aggressive stance',
    'muscular build',
    'predatory look',
    'intimidating presence',
  ],
  mysterious: [
    'ethereal',
    'otherworldly',
    'enigmatic',
    'floating mysteriously',
    'ancient wisdom',
    'cosmic energy',
    'mystical aura',
  ],
  playful: [
    'energetic',
    'bouncy',
    'mischievous grin',
    'dynamic pose',
    'cheerful',
    'animated expression',
    'fun-loving',
  ],
  cosmic: [
    'celestial',
    'nebula-inspired',
    'star-filled',
    'galactic',
    'space creature',
    'aurora patterns',
    'cosmic dust',
  ],
};

// Stage-specific descriptions
const STAGE_DESCRIPTIONS: Record<MonsterStage, string> = {
  egg: 'mysterious egg with cracks showing creature emerging, partial visibility',
  young: 'small juvenile creature, baby proportions, developing features',
  adult: 'fully grown creature, mature proportions, complete features',
};

// Negative prompts to avoid unwanted features
const NEGATIVE_PROMPTS = {
  general: 'human, humanoid, realistic human features, gore, violence, scary, disturbing, text, watermark, signature, low quality, blurry, distorted, deformed, bad anatomy, extra limbs, missing parts',
  cute: 'scary, aggressive, sharp teeth, claws, menacing',
  fierce: 'cute, adorable, soft, friendly, harmless',
  mysterious: 'ordinary, mundane, simple, basic',
  playful: 'serious, static, boring, dull',
  cosmic: 'earthly, terrestrial, mundane, ordinary',
};

export class PromptTemplateBuilder {
  private style: MonsterStyle;
  private stage: MonsterStage;
  private seed?: number;

  constructor(style: MonsterStyle = 'cute', stage: MonsterStage = 'adult') {
    this.style = style;
    this.stage = stage;
  }

  setStyle(style: MonsterStyle): this {
    this.style = style;
    return this;
  }

  setStage(stage: MonsterStage): this {
    this.stage = stage;
    return this;
  }

  setSeed(seed: number): this {
    this.seed = seed;
    return this;
  }

  private getRandomElement<T>(array: T[]): T {
    const index = this.seed ? this.seed % array.length : Math.floor(Math.random() * array.length);
    return array[index];
  }

  private getRandomElements<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => (this.seed ? this.seed * 0.5 - 0.25 : Math.random() - 0.5));
    return shuffled.slice(0, count);
  }

  buildPrompt(): PromptTemplate {
    // Select random features
    const body = this.getRandomElement(CREATURE_FEATURES.bodies);
    const limbs = this.getRandomElement(CREATURE_FEATURES.limbs);
    const texture = this.getRandomElement(CREATURE_FEATURES.textures);
    const eyes = this.getRandomElement(CREATURE_FEATURES.eyes);
    const colors = this.getRandomElement(CREATURE_FEATURES.colors);
    
    // Get style modifiers
    const styleModifiers = this.getRandomElements(STYLE_MODIFIERS[this.style], 3);
    
    // Build the base prompt
    const basePrompt = this.constructBasePrompt(body, limbs, texture, eyes, colors, styleModifiers);
    
    // Add enhancers for quality
    const enhancers = this.getEnhancers();
    
    // Get negative prompt
    const negativePrompt = this.getNegativePrompt();
    
    return {
      style: this.style,
      stage: this.stage,
      basePrompt,
      enhancers,
      negativePrompt,
    };
  }

  private constructBasePrompt(
    body: string,
    limbs: string,
    texture: string,
    eyes: string,
    colors: string,
    styleModifiers: string[]
  ): string {
    const stageDesc = STAGE_DESCRIPTIONS[this.stage];
    
    if (this.stage === 'egg') {
      return `A ${styleModifiers[0]} alien creature egg, ${stageDesc}, ${colors} shell with ${texture}, creature partially visible with ${eyes} peeking through cracks, ${limbs} starting to emerge, magical fantasy art style, 3D render quality, centered composition, plain background`;
    }
    
    const creatureDesc = `A ${styleModifiers.join(', ')} alien creature with ${body}, ${limbs}, ${texture}, ${eyes}, ${colors} coloring`;
    
    const additionalDetails = [
      'Spore-inspired design',
      'cartoon 3D art style',
      'video game character',
      'fantasy creature',
      'imaginative design',
      stageDesc,
    ];
    
    return `${creatureDesc}. ${additionalDetails.join(', ')}. Centered composition, plain background, high quality 3D render, professional game art`;
  }

  private getEnhancers(): string[] {
    return [
      'high resolution',
      'detailed textures',
      'professional lighting',
      'clean composition',
      'centered subject',
      'plain neutral background',
      'no distractions',
      '3D rendered appearance',
      'game asset quality',
      'vibrant colors',
    ];
  }

  private getNegativePrompt(): string {
    const styleNegative = NEGATIVE_PROMPTS[this.style] || '';
    return `${NEGATIVE_PROMPTS.general}, ${styleNegative}`;
  }

  /**
   * Generates a complete prompt string ready for OpenAI
   */
  generateFullPrompt(): string {
    const template = this.buildPrompt();
    return `${template.basePrompt}. ${template.enhancers.join(', ')}`;
  }
}

// Pre-built templates for quick access
export const PRESET_TEMPLATES = {
  cuteBaby: new PromptTemplateBuilder('cute', 'young'),
  fierceAdult: new PromptTemplateBuilder('fierce', 'adult'),
  mysteriousEgg: new PromptTemplateBuilder('mysterious', 'egg'),
  playfulYoung: new PromptTemplateBuilder('playful', 'young'),
  cosmicAdult: new PromptTemplateBuilder('cosmic', 'adult'),
};

// Utility function to generate a random monster prompt
export function generateRandomMonsterPrompt(): string {
  const styles: MonsterStyle[] = ['cute', 'fierce', 'mysterious', 'playful', 'cosmic'];
  const stages: MonsterStage[] = ['young', 'adult']; // Exclude egg for general generation
  
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const randomStage = stages[Math.floor(Math.random() * stages.length)];
  
  const builder = new PromptTemplateBuilder(randomStyle, randomStage);
  return builder.generateFullPrompt();
}

// Example specific prompts for testing
export const TEST_PROMPTS = {
  cute1: `A super cute, adorable alien creature with blob-like body, multiple small tentacles, smooth glossy purple and pink skin, large expressive eyes, baby proportions. Spore-inspired design, cartoon 3D art style, video game character, centered composition, plain background, high quality 3D render, professional lighting`,
  
  fierce1: `A fierce, powerful alien creature with segmented armored torso, sharp crystalline protrusions, metallic scales, multiple glowing red eyes, intimidating stance. Spore-inspired design, cartoon 3D art style, video game boss character, centered composition, plain background, high quality 3D render, dramatic lighting`,
  
  cosmic1: `An ethereal, cosmic alien creature with translucent body filled with stars, floating tendrils of light, nebula patterns, aurora colors, single mystical eye. Spore-inspired design, fantasy 3D art style, magical creature, centered composition, plain background, high quality 3D render, ethereal glow`,
  
  playful1: `A bouncy, energetic alien creature with round springy body, elastic appendages, fuzzy orange and yellow fur, compound eyes, mischievous expression. Spore-inspired design, cartoon 3D art style, video game mascot, centered composition, plain background, high quality 3D render, vibrant colors`,
};