import { useLessonContext } from '@/components/lesson/LessonContext';
import { isProcessing } from '@/lib/status-constants';

/**
 * Determines what should be displayed in the left panel based on priority hierarchy:
 *
 * Priority order (highest to lowest):
 * 1. Generated Creature (if available and generation is complete)
 * 2. Generation Status (if generation is in progress)
 * 3. Lesson Step Image (if no generation involved)
 * 4. Default Egg (fallback)
 */
export function useLeftPanelDisplay() {
  const {
    currentStepData,
    asset,
    targetStage,
    effectiveLoading,
    isDisplayRevealing,
    handleRetry,
  } = useLessonContext();

  // 1. Has this lesson ever triggered generation and generation is complete?
  const hasGeneratedCreature = asset.imageUrl || asset.modelUrl;
  const isGenerationInProgress =
    isProcessing(asset.status) || asset.isGenerating;

  // 2. Does this step have a lesson image?
  const hasLessonImage = currentStepData?.image;

  // Decision hierarchy:
  // Only show creature if we have assets AND the stage is appropriate (not 'egg')
  // The 'egg' stage means the user hasn't reached the reveal milestone yet,
  // so we should show lesson images instead of the generated creature
  if (hasGeneratedCreature && !isGenerationInProgress && targetStage !== 'egg') {
    // Show the creature - generation is complete and user has reached reveal stage
    return {
      type: 'creature' as const,
      stage: targetStage,
      imageUrl: asset.imageUrl,
      modelUrl: asset.modelUrl,
      isRevealing: isDisplayRevealing,
      isLoading: effectiveLoading,
      error: asset.error,
      onRetry: handleRetry,
    };
  }

  if (isGenerationInProgress) {
    // Show generation status
    return {
      type: 'generation' as const,
      status: asset.status || 'unknown',
      error: asset.error,
      onRetry: handleRetry,
    };
  }

  if (hasLessonImage) {
    // Show lesson step image
    return {
      type: 'lesson-image' as const,
      imageUrl: currentStepData.image!,
      title: currentStepData.title || 'Lesson Image',
    };
  }

  // Default fallback - show egg
  return {
    type: 'egg' as const,
  };
}

export type LeftPanelDisplay = ReturnType<typeof useLeftPanelDisplay>;
