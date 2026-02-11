import { describe, it, expect } from 'vitest';
import { validateLesson, validateChapter, validateStep } from '../lesson-editor-validation';

// =============================================================================
// Test Fixtures
// =============================================================================

function validStep(overrides = {}) {
  return {
    id: 1,
    chapterId: 0,
    title: 'Step Title',
    content: '<p>Step content</p>',
    order: 1,
    ...overrides,
  };
}

function validChapter(overrides = {}) {
  return {
    id: 0,
    lessonId: 1,
    title: 'Chapter Title',
    description: 'Chapter description',
    order: 0,
    concept: 'Variables',
    steps: [validStep()],
    estimatedTime: 15,
    requiresPreviousChapter: false,
    ...overrides,
  };
}

function validLesson(overrides = {}) {
  return {
    id: 1,
    title: 'Lesson Title',
    description: 'Lesson description',
    difficulty: 'Beginner' as const,
    duration: '30 minutes',
    objectives: ['Learn variables'],
    chapters: [validChapter()],
    completed: false,
    locked: false,
    ...overrides,
  };
}

// =============================================================================
// validateStep
// =============================================================================

describe('validateStep', () => {
  it('accepts a valid step', () => {
    const result = validateStep(validStep());
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('rejects step without title', () => {
    const result = validateStep(validStep({ title: '' }));
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.some(e => e.message.includes('title'))).toBe(true);
  });

  it('rejects step without content', () => {
    const result = validateStep(validStep({ content: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects step with non-positive id', () => {
    const result = validateStep(validStep({ id: 0 }));
    expect(result.success).toBe(false);
  });

  it('rejects step with non-positive order', () => {
    const result = validateStep(validStep({ order: 0 }));
    expect(result.success).toBe(false);
  });

  it('accepts step with optional fields', () => {
    const result = validateStep(validStep({
      code: 'let x = 1;',
      expectedCode: 'let x = 2;',
      hint: 'Try again',
      requiresAuth: true,
      triggersGeneration: true,
      generationStage: 'young',
      displayStage: 'egg',
      difficulty: 'easy',
      estimatedTime: 5,
    }));
    expect(result.success).toBe(true);
  });

  it('accepts step with validation rules', () => {
    const result = validateStep(validStep({
      validation: [
        { type: 'includes', patterns: ['struct'], message: 'Add a struct' },
        { type: 'regex', patterns: ['fn\\s+new'] },
      ],
    }));
    expect(result.success).toBe(true);
  });

  it('rejects invalid validation rule type', () => {
    const result = validateStep(validStep({
      validation: [{ type: 'invalid_type', patterns: ['x'] }],
    }));
    expect(result.success).toBe(false);
  });

  it('accepts valid generationStage values', () => {
    for (const stage of ['young', 'young_3d', 'adult']) {
      const result = validateStep(validStep({ generationStage: stage }));
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid generationStage', () => {
    const result = validateStep(validStep({ generationStage: 'mega' }));
    expect(result.success).toBe(false);
  });

  it('accepts valid displayStage values', () => {
    for (const stage of ['egg', 'young', 'young_3d', 'adult']) {
      const result = validateStep(validStep({ displayStage: stage }));
      expect(result.success).toBe(true);
    }
  });

  it('preserves extra fields via passthrough', () => {
    const result = validateStep(validStep({ customField: 'preserved' }));
    expect(result.success).toBe(true);
    expect((result.data as Record<string, unknown>).customField).toBe('preserved');
  });
});

// =============================================================================
// validateChapter
// =============================================================================

describe('validateChapter', () => {
  it('accepts a valid chapter', () => {
    const result = validateChapter(validChapter());
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('rejects chapter without title', () => {
    const result = validateChapter(validChapter({ title: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects chapter without description', () => {
    const result = validateChapter(validChapter({ description: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects chapter without concept', () => {
    const result = validateChapter(validChapter({ concept: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects chapter with empty steps array', () => {
    const result = validateChapter(validChapter({ steps: [] }));
    expect(result.success).toBe(false);
    expect(result.errors!.some(e => e.message.includes('at least one step'))).toBe(true);
  });

  it('rejects chapter with non-positive estimatedTime', () => {
    const result = validateChapter(validChapter({ estimatedTime: 0 }));
    expect(result.success).toBe(false);
  });

  it('rejects chapter with negative estimatedTime', () => {
    const result = validateChapter(validChapter({ estimatedTime: -5 }));
    expect(result.success).toBe(false);
  });

  it('validates nested step objects', () => {
    const result = validateChapter(validChapter({
      steps: [{ id: 'not-a-number', title: '', content: '', order: 1 }],
    }));
    expect(result.success).toBe(false);
  });

  it('accepts chapter with optional fields', () => {
    const result = validateChapter(validChapter({
      completed: true,
      currentStepId: 3,
    }));
    expect(result.success).toBe(true);
  });
});

// =============================================================================
// validateLesson
// =============================================================================

describe('validateLesson', () => {
  it('accepts a valid lesson', () => {
    const result = validateLesson(validLesson());
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('rejects lesson without title', () => {
    const result = validateLesson(validLesson({ title: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects lesson without description', () => {
    const result = validateLesson(validLesson({ description: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects lesson with invalid difficulty', () => {
    const result = validateLesson(validLesson({ difficulty: 'Super Hard' }));
    expect(result.success).toBe(false);
  });

  it('accepts all valid difficulty levels', () => {
    for (const difficulty of ['Beginner', 'Intermediate', 'Advanced', 'Expert']) {
      const result = validateLesson(validLesson({ difficulty }));
      expect(result.success).toBe(true);
    }
  });

  it('rejects lesson without duration', () => {
    const result = validateLesson(validLesson({ duration: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects lesson with empty objectives', () => {
    const result = validateLesson(validLesson({ objectives: [] }));
    expect(result.success).toBe(false);
  });

  it('rejects lesson with empty chapters', () => {
    const result = validateLesson(validLesson({ chapters: [] }));
    expect(result.success).toBe(false);
  });

  it('accepts lesson with evolutionPath', () => {
    const result = validateLesson(validLesson({
      evolutionPath: {
        startStage: 'egg',
        endStage: 'young',
        majorEvolution: true,
      },
    }));
    expect(result.success).toBe(true);
  });

  it('validates deeply nested structure (lesson > chapter > step)', () => {
    const result = validateLesson(validLesson({
      chapters: [
        validChapter({
          steps: [validStep({ title: '' })], // invalid step
        }),
      ],
    }));
    expect(result.success).toBe(false);
    // Error path should reference nested location
    expect(result.errors!.some(e => e.field.includes('chapters'))).toBe(true);
  });

  it('returns multiple errors for multiple issues', () => {
    const result = validateLesson({
      // Missing almost everything
      id: 'not-a-number',
      title: '',
    });
    expect(result.success).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(1);
  });

  it('handles non-object input gracefully', () => {
    const result = validateLesson(null);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('handles string input gracefully', () => {
    const result = validateLesson('not an object');
    expect(result.success).toBe(false);
  });
});
