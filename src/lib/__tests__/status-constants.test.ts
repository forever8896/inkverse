import { describe, it, expect } from 'vitest';
import {
  isFailed,
  isProcessing,
  isTerminal,
  isCompleted,
  isRetrying,
  getStatusDisplay,
  FAILED_STATUSES,
  PROCESSING_STATUSES,
  TERMINAL_STATUSES,
  RETRYING_STATUSES,
  STATUS_MESSAGES,
  STATUS_EMOJIS,
  PROGRESS_STEPS,
} from '../status-constants';
import type { GenerationStatus } from '../status-constants';

// =============================================================================
// Status Arrays — Consistency
// =============================================================================

describe('status arrays', () => {
  it('TERMINAL_STATUSES contains all FAILED_STATUSES plus completed', () => {
    for (const status of FAILED_STATUSES) {
      expect(TERMINAL_STATUSES).toContain(status);
    }
    expect(TERMINAL_STATUSES).toContain('completed');
  });

  it('RETRYING_STATUSES are a subset of PROCESSING_STATUSES', () => {
    for (const status of RETRYING_STATUSES) {
      expect(PROCESSING_STATUSES).toContain(status);
    }
  });

  it('FAILED and PROCESSING statuses do not overlap', () => {
    for (const status of FAILED_STATUSES) {
      expect(PROCESSING_STATUSES).not.toContain(status);
    }
  });

  it('completed is terminal but not failed', () => {
    expect(TERMINAL_STATUSES).toContain('completed');
    expect(FAILED_STATUSES).not.toContain('completed');
  });
});

// =============================================================================
// isFailed
// =============================================================================

describe('isFailed', () => {
  it('returns true for all failed statuses', () => {
    expect(isFailed('failed')).toBe(true);
    expect(isFailed('failed_permanent')).toBe(true);
    expect(isFailed('image_generation_failed')).toBe(true);
    expect(isFailed('conversion_failed')).toBe(true);
    expect(isFailed('nft_mint_failed')).toBe(true);
    expect(isFailed('evolution_failed')).toBe(true);
  });

  it('returns false for non-failed statuses', () => {
    expect(isFailed('pending')).toBe(false);
    expect(isFailed('completed')).toBe(false);
    expect(isFailed('generating_image')).toBe(false);
    expect(isFailed('converting_3d')).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isFailed(null)).toBe(false);
    expect(isFailed(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isFailed('')).toBe(false);
  });
});

// =============================================================================
// isProcessing
// =============================================================================

describe('isProcessing', () => {
  it('returns true for active processing statuses', () => {
    expect(isProcessing('pending')).toBe(true);
    expect(isProcessing('generating_image')).toBe(true);
    expect(isProcessing('converting_3d')).toBe(true);
    expect(isProcessing('minting_nft')).toBe(true);
    expect(isProcessing('evolving')).toBe(true);
    expect(isProcessing('waiting_on_storage')).toBe(true);
  });

  it('returns true for retrying statuses', () => {
    expect(isProcessing('image_generation_retrying')).toBe(true);
    expect(isProcessing('conversion_retrying')).toBe(true);
    expect(isProcessing('nft_minting_retrying')).toBe(true);
    expect(isProcessing('evolution_retrying')).toBe(true);
  });

  it('returns false for terminal statuses', () => {
    expect(isProcessing('completed')).toBe(false);
    expect(isProcessing('failed')).toBe(false);
    expect(isProcessing('failed_permanent')).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isProcessing(null)).toBe(false);
    expect(isProcessing(undefined)).toBe(false);
  });
});

// =============================================================================
// isTerminal
// =============================================================================

describe('isTerminal', () => {
  it('returns true for completed', () => {
    expect(isTerminal('completed')).toBe(true);
  });

  it('returns true for all failed statuses', () => {
    for (const status of FAILED_STATUSES) {
      expect(isTerminal(status)).toBe(true);
    }
  });

  it('returns false for processing statuses', () => {
    expect(isTerminal('pending')).toBe(false);
    expect(isTerminal('generating_image')).toBe(false);
    expect(isTerminal('converting_3d')).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isTerminal(null)).toBe(false);
    expect(isTerminal(undefined)).toBe(false);
  });
});

// =============================================================================
// isCompleted
// =============================================================================

describe('isCompleted', () => {
  it('returns true only for completed', () => {
    expect(isCompleted('completed')).toBe(true);
  });

  it('returns false for everything else', () => {
    expect(isCompleted('pending')).toBe(false);
    expect(isCompleted('failed')).toBe(false);
    expect(isCompleted('generating_image')).toBe(false);
    expect(isCompleted(null)).toBe(false);
    expect(isCompleted(undefined)).toBe(false);
  });
});

// =============================================================================
// isRetrying
// =============================================================================

describe('isRetrying', () => {
  it('returns true for all retrying statuses', () => {
    expect(isRetrying('image_generation_retrying')).toBe(true);
    expect(isRetrying('conversion_retrying')).toBe(true);
    expect(isRetrying('nft_minting_retrying')).toBe(true);
    expect(isRetrying('evolution_retrying')).toBe(true);
  });

  it('returns false for non-retrying statuses', () => {
    expect(isRetrying('pending')).toBe(false);
    expect(isRetrying('completed')).toBe(false);
    expect(isRetrying('failed')).toBe(false);
    expect(isRetrying('generating_image')).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isRetrying(null)).toBe(false);
    expect(isRetrying(undefined)).toBe(false);
  });
});

// =============================================================================
// STATUS_MESSAGES & STATUS_EMOJIS completeness
// =============================================================================

describe('STATUS_MESSAGES', () => {
  const allStatuses: GenerationStatus[] = [
    'pending', 'generating_image', 'image_generation_failed', 'image_generation_retrying',
    'converting_3d', 'conversion_failed', 'conversion_retrying',
    'minting_nft', 'nft_minting_retrying', 'nft_mint_failed',
    'evolving', 'evolution_retrying', 'evolution_failed',
    'completed', 'failed_permanent', 'failed', 'waiting_on_storage',
  ];

  it('has a message for every status', () => {
    for (const status of allStatuses) {
      expect(STATUS_MESSAGES[status]).toBeDefined();
      expect(typeof STATUS_MESSAGES[status]).toBe('string');
      expect(STATUS_MESSAGES[status].length).toBeGreaterThan(0);
    }
  });

  it('has an emoji for every status', () => {
    for (const status of allStatuses) {
      expect(STATUS_EMOJIS[status]).toBeDefined();
      expect(typeof STATUS_EMOJIS[status]).toBe('string');
    }
  });
});

// =============================================================================
// getStatusDisplay
// =============================================================================

describe('getStatusDisplay', () => {
  it('combines emoji and message', () => {
    const display = getStatusDisplay('completed');
    expect(display).toContain('✨');
    expect(display).toContain('Your monster is ready!');
  });

  it('works for pending status', () => {
    const display = getStatusDisplay('pending');
    expect(display).toContain('🥚');
    expect(display).toContain('Initializing');
  });

  it('works for failed status', () => {
    const display = getStatusDisplay('failed');
    expect(display).toContain('💥');
  });
});

// =============================================================================
// PROGRESS_STEPS
// =============================================================================

describe('PROGRESS_STEPS', () => {
  it('starts at threshold 0', () => {
    expect(PROGRESS_STEPS[0].threshold).toBe(0);
  });

  it('ends at threshold 100', () => {
    expect(PROGRESS_STEPS[PROGRESS_STEPS.length - 1].threshold).toBe(100);
  });

  it('thresholds are in ascending order', () => {
    for (let i = 1; i < PROGRESS_STEPS.length; i++) {
      expect(PROGRESS_STEPS[i].threshold).toBeGreaterThan(PROGRESS_STEPS[i - 1].threshold);
    }
  });

  it('every step has label and emoji', () => {
    for (const step of PROGRESS_STEPS) {
      expect(step.label.length).toBeGreaterThan(0);
      expect(step.emoji.length).toBeGreaterThan(0);
    }
  });
});
