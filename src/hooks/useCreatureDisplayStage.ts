import { MonsterStage } from '@/lib/generation-job';

/**
 * Determines which stage of the creature to display based on step configuration and asset availability.
 * Prioritizes explicit step overrides, then falls back to the highest available asset stage *that is appropriate for the current narrative progress*.
 */
export function useCreatureDisplayStage(
  currentStepData: { displayStage?: MonsterStage } | undefined,
  asset: { imageUrl: string | null; modelUrl: string | null },
  currentStepIndex: number,
  hatchStepIndex: number,
  evolutionStepIndex: number
): MonsterStage {
  // 1. Explicit Override from lesson content
  if (currentStepData?.displayStage) {
    return currentStepData.displayStage;
  }

  // 2. Narrative Gating (Progressive Disclosure)
  // We only show the stage if the user has reached the milestone in the lesson
  const canShowAdult = evolutionStepIndex !== -1 && currentStepIndex >= evolutionStepIndex;
  const canShowYoung = hatchStepIndex !== -1 && currentStepIndex >= hatchStepIndex;

  // 3. Available Assets + Gating
  // If the user has generated the assets AND reached the milestone, show them
  if (canShowAdult && asset.modelUrl) {
    return 'adult';
  }
  
  if (canShowYoung && asset.imageUrl) {
    return 'young';
  }

  // 4. Default to egg
  return 'egg';
}
