import { describe, it, expect } from 'vitest';
import {
  generateRandomMonsterRequest,
  generatePromptFromStructuredData,
  MONSTER_EYES,
  MONSTER_BODY_TYPES,
  MONSTER_SIZES,
  MONSTER_ATTITUDES,
  MONSTER_FLYING,
  MONSTER_SPECIAL_POWERS,
  MONSTER_MAGICAL_AURAS,
  MONSTER_COLOR_SCHEMES,
  MONSTER_TEXTURES,
  MONSTER_HABITATS,
  type GenerateMonsterRequest,
} from '../monster-prompts';

// =============================================================================
// Option Constants — Completeness
// =============================================================================

describe('option constants', () => {
  it('MONSTER_EYES has expected values', () => {
    expect(MONSTER_EYES).toEqual([1, 2, 3, 8]);
  });

  it('MONSTER_BODY_TYPES has 5 options', () => {
    expect(MONSTER_BODY_TYPES).toHaveLength(5);
    expect(MONSTER_BODY_TYPES).toContain('fluffy');
    expect(MONSTER_BODY_TYPES).toContain('skeletal');
  });

  it('MONSTER_SIZES has 5 options', () => {
    expect(MONSTER_SIZES).toHaveLength(5);
    expect(MONSTER_SIZES).toContain('tiny');
    expect(MONSTER_SIZES).toContain('massive');
  });

  it('MONSTER_ATTITUDES has 8 options', () => {
    expect(MONSTER_ATTITUDES).toHaveLength(8);
  });

  it('MONSTER_SPECIAL_POWERS has 8 options', () => {
    expect(MONSTER_SPECIAL_POWERS).toHaveLength(8);
  });

  it('MONSTER_COLOR_SCHEMES has 8 options', () => {
    expect(MONSTER_COLOR_SCHEMES).toHaveLength(8);
  });

  it('MONSTER_TEXTURES has 6 options', () => {
    expect(MONSTER_TEXTURES).toHaveLength(6);
  });

  it('MONSTER_HABITATS has 8 options', () => {
    expect(MONSTER_HABITATS).toHaveLength(8);
  });

  it('MONSTER_FLYING has 3 options', () => {
    expect(MONSTER_FLYING).toHaveLength(3);
    expect(MONSTER_FLYING).toContain('wings');
    expect(MONSTER_FLYING).toContain('floating');
    expect(MONSTER_FLYING).toContain('no');
  });

  it('MONSTER_MAGICAL_AURAS has 5 options', () => {
    expect(MONSTER_MAGICAL_AURAS).toHaveLength(5);
  });
});

// =============================================================================
// generateRandomMonsterRequest
// =============================================================================

describe('generateRandomMonsterRequest', () => {
  it('returns an object with all required fields', () => {
    const request = generateRandomMonsterRequest();
    expect(request.eyes).toBeDefined();
    expect(request.bodyType).toBeDefined();
    expect(request.size).toBeDefined();
    expect(request.attitude).toBeDefined();
    expect(request.canFly).toBeDefined();
    expect(request.specialPower).toBeDefined();
    expect(request.magicalAura).toBeDefined();
    expect(request.colorScheme).toBeDefined();
    expect(request.texture).toBeDefined();
    expect(request.habitat).toBeDefined();
    expect(request.stage).toBeDefined();
    expect(request.generationType).toBeDefined();
  });

  it('always sets stage to young', () => {
    // Run multiple times since it is random
    for (let i = 0; i < 10; i++) {
      expect(generateRandomMonsterRequest().stage).toBe('young');
    }
  });

  it('always sets generationType to full', () => {
    for (let i = 0; i < 10; i++) {
      expect(generateRandomMonsterRequest().generationType).toBe('full');
    }
  });

  it('picks eyes from valid options', () => {
    for (let i = 0; i < 20; i++) {
      const eyes = generateRandomMonsterRequest().eyes;
      expect(MONSTER_EYES as readonly number[]).toContain(eyes);
    }
  });

  it('picks bodyType from valid options', () => {
    for (let i = 0; i < 20; i++) {
      const bodyType = generateRandomMonsterRequest().bodyType;
      expect(MONSTER_BODY_TYPES as readonly string[]).toContain(bodyType);
    }
  });

  it('picks size from valid options', () => {
    for (let i = 0; i < 20; i++) {
      const size = generateRandomMonsterRequest().size;
      expect(MONSTER_SIZES as readonly string[]).toContain(size);
    }
  });
});

// =============================================================================
// generatePromptFromStructuredData
// =============================================================================

describe('generatePromptFromStructuredData', () => {
  const baseRequest: GenerateMonsterRequest = {
    eyes: 2,
    bodyType: 'fluffy',
    size: 'medium',
    attitude: 'wise',
    canFly: 'wings',
    specialPower: 'fire',
    magicalAura: 'sparkly',
    colorScheme: 'purple',
    texture: 'fur',
    habitat: 'forest',
    stage: 'young',
  };

  it('returns a non-empty string', () => {
    const prompt = generatePromptFromStructuredData(baseRequest);
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(100);
  });

  it('includes eye description', () => {
    const prompt1 = generatePromptFromStructuredData({ ...baseRequest, eyes: 1 });
    expect(prompt1).toContain('one eye');

    const prompt2 = generatePromptFromStructuredData({ ...baseRequest, eyes: 2 });
    expect(prompt2).toContain('two eyes');

    const prompt3 = generatePromptFromStructuredData({ ...baseRequest, eyes: 3 });
    expect(prompt3).toContain('three eyes');

    const prompt8 = generatePromptFromStructuredData({ ...baseRequest, eyes: 8 });
    expect(prompt8).toContain('many eyes');
  });

  it('includes flying description', () => {
    const wings = generatePromptFromStructuredData({ ...baseRequest, canFly: 'wings' });
    expect(wings).toContain('wings for flying');

    const floating = generatePromptFromStructuredData({ ...baseRequest, canFly: 'floating' });
    expect(floating).toContain('floats magically');

    const grounded = generatePromptFromStructuredData({ ...baseRequest, canFly: 'no' });
    expect(grounded).toContain('grounded');
  });

  it('includes stage description for young', () => {
    const prompt = generatePromptFromStructuredData({ ...baseRequest, stage: 'young' });
    expect(prompt).toContain('juvenile');
  });

  it('includes stage description for adult', () => {
    const prompt = generatePromptFromStructuredData({ ...baseRequest, stage: 'adult' });
    expect(prompt).toContain('adult');
    expect(prompt).toContain('mature');
  });

  it('includes stage description for egg', () => {
    const prompt = generatePromptFromStructuredData({ ...baseRequest, stage: 'egg' });
    expect(prompt).toContain('egg');
    expect(prompt).toContain('shell');
  });

  it('includes body type, texture, color scheme', () => {
    const prompt = generatePromptFromStructuredData(baseRequest);
    expect(prompt).toContain('fluffy');
    expect(prompt).toContain('fur');
    expect(prompt).toContain('purple');
  });

  it('includes special power and aura', () => {
    const prompt = generatePromptFromStructuredData(baseRequest);
    expect(prompt).toContain('fire');
    expect(prompt).toContain('sparkly');
  });

  it('includes habitat', () => {
    const prompt = generatePromptFromStructuredData(baseRequest);
    expect(prompt).toContain('forest');
  });

  it('includes attitude and size', () => {
    const prompt = generatePromptFromStructuredData(baseRequest);
    expect(prompt).toContain('wise');
    expect(prompt).toContain('medium');
  });

  it('includes critical requirements for AI generation', () => {
    const prompt = generatePromptFromStructuredData(baseRequest);
    expect(prompt).toContain('TRANSPARENT BACKGROUND');
    expect(prompt).toContain('THREE-DIMENSIONAL');
    expect(prompt).toContain('Spore');
  });

  it('instructs against environmental elements', () => {
    const prompt = generatePromptFromStructuredData(baseRequest);
    expect(prompt).toContain('NO floor');
    expect(prompt).toContain('NO separate environmental elements');
  });
});
