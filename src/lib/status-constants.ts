/**
 * Centralized Status Constants & Type Guards
 *
 * Single source of truth for generation job statuses.
 * Eliminates duplicate status arrays across hooks and components.
 */

// =============================================================================
// Status Type Definition
// =============================================================================

/**
 * All possible generation job statuses
 */
export type GenerationStatus =
  | 'pending'
  | 'generating_image'
  | 'image_generation_failed'
  | 'image_generation_retrying'
  | 'converting_3d'
  | 'conversion_failed'
  | 'conversion_retrying'
  | 'minting_nft'
  | 'nft_minting_retrying'
  | 'nft_mint_failed'
  | 'evolving'
  | 'evolution_retrying'
  | 'evolution_failed'
  | 'completed'
  | 'failed_permanent'
  | 'failed' // Legacy/General
  | 'waiting_on_storage';

// =============================================================================
// Status Category Arrays
// =============================================================================

/**
 * Statuses indicating permanent failure (no more retries)
 */
export const FAILED_STATUSES = [
  'failed',
  'failed_permanent',
  'image_generation_failed',
  'conversion_failed',
  'nft_mint_failed',
  'evolution_failed',
] as const;

/**
 * Statuses indicating job is actively being processed (including retries)
 */
export const PROCESSING_STATUSES = [
  'pending',
  'generating_image',
  'converting_3d',
  'minting_nft',
  'evolving',
  'image_generation_retrying',
  'conversion_retrying',
  'nft_minting_retrying',
  'evolution_retrying',
  'waiting_on_storage',
] as const;

/**
 * Statuses indicating job is in a terminal state (no further changes expected)
 */
export const TERMINAL_STATUSES = [
  ...FAILED_STATUSES,
  'completed',
] as const;

/**
 * Statuses that are currently retrying
 */
export const RETRYING_STATUSES = [
  'image_generation_retrying',
  'conversion_retrying',
  'nft_minting_retrying',
  'evolution_retrying',
] as const;

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if status indicates a failed job
 */
export function isFailed(status: string | null | undefined): boolean {
  return !!status && (FAILED_STATUSES as readonly string[]).includes(status);
}

/**
 * Check if status indicates job is processing (in progress)
 */
export function isProcessing(status: string | null | undefined): boolean {
  return !!status && (PROCESSING_STATUSES as readonly string[]).includes(status);
}

/**
 * Check if status indicates job is in a terminal state
 */
export function isTerminal(status: string | null | undefined): boolean {
  return !!status && (TERMINAL_STATUSES as readonly string[]).includes(status);
}

/**
 * Check if status indicates job is completed successfully
 */
export function isCompleted(status: string | null | undefined): boolean {
  return status === 'completed';
}

/**
 * Check if status indicates job is currently retrying
 */
export function isRetrying(status: string | null | undefined): boolean {
  return !!status && (RETRYING_STATUSES as readonly string[]).includes(status);
}

// =============================================================================
// Status Display Constants
// =============================================================================

/**
 * Human-readable status messages
 */
export const STATUS_MESSAGES: Record<GenerationStatus, string> = {
  pending: 'Initializing your monster...',
  generating_image: 'AI is painting your creature...',
  image_generation_retrying: 'Retrying image generation...',
  image_generation_failed: 'Image generation failed',
  converting_3d: 'Building your monster in 3D...',
  conversion_retrying: 'Retrying 3D conversion...',
  conversion_failed: '3D conversion failed',
  minting_nft: 'Minting your NFT on-chain...',
  nft_minting_retrying: 'Retrying NFT minting...',
  nft_mint_failed: 'NFT minting failed',
  evolving: 'Evolving your monster...',
  evolution_retrying: 'Retrying evolution...',
  evolution_failed: 'Evolution failed',
  completed: 'Your monster is ready!',
  failed: 'Something went wrong...',
  failed_permanent: 'Generation failed permanently',
  waiting_on_storage: 'Waiting for storage to come online...',
};

/**
 * Emoji icons for each status
 */
export const STATUS_EMOJIS: Record<GenerationStatus, string> = {
  pending: '🥚',
  generating_image: '🎨',
  image_generation_retrying: '🎨',
  image_generation_failed: '❌',
  converting_3d: '🏗️',
  conversion_retrying: '🏗️',
  conversion_failed: '❌',
  minting_nft: '⛓️',
  nft_minting_retrying: '⛓️',
  nft_mint_failed: '❌',
  evolving: '🦋',
  evolution_retrying: '🦋',
  evolution_failed: '❌',
  completed: '✨',
  failed: '💥',
  failed_permanent: '💥',
  waiting_on_storage: '🧰',
};

/**
 * Get status message with emoji prefix
 */
export function getStatusDisplay(status: GenerationStatus): string {
  return `${STATUS_EMOJIS[status]} ${STATUS_MESSAGES[status]}`;
}

// =============================================================================
// Progress Steps (for UI display)
// =============================================================================

export interface ProgressStep {
  threshold: number;
  label: string;
  emoji: string;
}

/**
 * Progress milestones for the generation pipeline
 */
export const PROGRESS_STEPS: ProgressStep[] = [
  { threshold: 0, label: 'Queuing creation request', emoji: '📋' },
  { threshold: 5, label: 'Starting AI image generation', emoji: '🎨' },
  { threshold: 40, label: 'Image generation complete', emoji: '🖼️' },
  { threshold: 50, label: 'Beginning 3D conversion', emoji: '🔄' },
  { threshold: 90, label: '3D model created', emoji: '🏗️' },
  { threshold: 100, label: 'Monster ready!', emoji: '🎉' },
];
