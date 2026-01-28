/**
 * Shared constants for onboarding visual assets.
 *
 * These assets are shown during the 3-screen onboarding flow:
 * - Screen 0: Static monster image 1
 * - Screen 1: Static monster image 2
 * - Screen 2: Interactive 3D model
 *
 * The NarrativeLoadingScreen preloads all of these assets before
 * transitioning to the lesson page. If all assets are already cached,
 * the loading screen is skipped entirely.
 */

// Type-safe visual content definitions
export type ImageVisual = {
  type: 'image';
  src: string;
  alt: string;
};

export type ModelVisual = {
  type: '3d';
  modelUrl: string;
};

export type ScreenVisual = ImageVisual | ModelVisual;

/**
 * The visual content for each onboarding screen.
 * Order matters - index corresponds to screen number.
 */
export const ONBOARDING_VISUALS: readonly ScreenVisual[] = [
  {
    type: 'image',
    src: '/monsters/17b3d246-bbee-460d-bf10-96ead31ac702.webp',
    alt: 'A colorful crystalline monster',
  },
  {
    type: 'image',
    src: '/monsters/d0bebeab-0f60-4ebc-aaa2-8a38601485c0.webp',
    alt: 'A winged cyclops creature',
  },
  {
    type: '3d',
    modelUrl: '/monsters/sample_3d.glb',
  },
] as const;

/**
 * Get all image URLs that need to be preloaded.
 */
export function getOnboardingImageUrls(): string[] {
  return ONBOARDING_VISUALS
    .filter((v): v is ImageVisual => v.type === 'image')
    .map(v => v.src);
}

/**
 * Get the 3D model URL that needs to be preloaded.
 * Returns undefined if no 3D model is in the onboarding flow.
 */
export function getOnboardingModelUrl(): string | undefined {
  const model = ONBOARDING_VISUALS.find((v): v is ModelVisual => v.type === '3d');
  return model?.modelUrl;
}

/**
 * Get all asset URLs (images + model) for preloading.
 */
export function getAllOnboardingAssetUrls(): string[] {
  return ONBOARDING_VISUALS.map(v =>
    v.type === 'image' ? v.src : v.modelUrl
  );
}
