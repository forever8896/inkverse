'use client';

/**
 * useLessonNavigation - Navigation state management for lessons
 *
 * Handles chapter/step tracking, navigation functions, and URL sync.
 * Extracted from LessonContext for better separation of concerns.
 */

import { useState, useCallback, useEffect } from 'react';
import type { Lesson } from '@/lib/lessons';

// Helper types for lesson data
type LessonChapterData = NonNullable<Lesson['chapters']>[number];

interface UseLessonNavigationProps {
  lesson?: Lesson;
  initialChapter?: number; // 1-based from URL
  initialStep?: number;    // 1-based from URL
  onChapterComplete?: (chapterTitle: string) => void;
}

interface UseLessonNavigationReturn {
  // Current position
  currentChapter: number;
  currentStep: number;
  currentChapterData: LessonChapterData | undefined;
  currentStepData: LessonChapterData['steps'][number] | undefined;

  // Navigation state
  isTransitioning: boolean;
  isLastStep: boolean;
  isFirstStep: boolean;

  // Navigation functions
  setCurrentChapter: (chapter: number) => void;
  setCurrentStep: (step: number) => void;
  transitionTo: (action: () => void) => void;
  goToStep: (stepIndex: number, onBeforeNavigate?: () => void) => void;
  goToChapter: (chapterIndex: number, onBeforeNavigate?: () => void) => void;
  navigateToPreviousStep: (onBeforeNavigate?: () => void) => void;
  navigateToNextStep: () => boolean; // Returns true if moved to next step, false if end of chapter
}

export function useLessonNavigation({
  lesson,
  initialChapter,
  initialStep,
  onChapterComplete,
}: UseLessonNavigationProps): UseLessonNavigationReturn {
  // Initialize from props (1-based from URL route)
  const initChapter = initialChapter ? initialChapter - 1 : 0;
  const initStep = initialStep ? initialStep - 1 : 0;

  // Navigation state
  const [currentChapter, setCurrentChapter] = useState(initChapter);
  const [currentStep, setCurrentStep] = useState(initStep);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Derived data
  const currentChapterData = lesson?.chapters?.[currentChapter];
  const currentStepData = currentChapterData?.steps[currentStep];

  const isLastStep = !!(
    lesson?.chapters &&
    currentChapter === lesson.chapters.length - 1 &&
    currentChapterData &&
    currentStep === currentChapterData.steps.length - 1
  );

  const isFirstStep = currentStep === 0 && currentChapter === 0;

  // URL sync
  useEffect(() => {
    if (!lesson?.id) return;
    const newUrl = `/lesson/${lesson.id}/${currentChapter + 1}/${currentStep + 1}`;
    window.history.replaceState(null, '', newUrl);
  }, [currentChapter, currentStep, lesson?.id]);

  // Transition helper for smooth animations
  const transitionTo = useCallback((action: () => void) => {
    setIsTransitioning(true);
    setTimeout(() => {
      action();
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  }, []);

  // Navigate to a specific step within current chapter
  const goToStep = useCallback((stepIndex: number, onBeforeNavigate?: () => void) => {
    if (stepIndex !== currentStep) {
      onBeforeNavigate?.();
      transitionTo(() => setCurrentStep(stepIndex));
    }
  }, [currentStep, transitionTo]);

  // Navigate to a specific chapter
  const goToChapter = useCallback((chapterIndex: number, onBeforeNavigate?: () => void) => {
    onBeforeNavigate?.();
    transitionTo(() => {
      setCurrentChapter(chapterIndex);
      setCurrentStep(0);
    });
  }, [transitionTo]);

  // Navigate to previous step (can cross chapter boundaries)
  const navigateToPreviousStep = useCallback((onBeforeNavigate?: () => void) => {
    if (currentStep > 0) {
      onBeforeNavigate?.();
      transitionTo(() => setCurrentStep(currentStep - 1));
    } else if (currentChapter > 0 && lesson?.chapters) {
      const prevChapter = lesson.chapters[currentChapter - 1];
      if (prevChapter) {
        onBeforeNavigate?.();
        transitionTo(() => {
          setCurrentChapter(currentChapter - 1);
          setCurrentStep(prevChapter.steps.length - 1);
        });
      }
    }
  }, [currentStep, currentChapter, lesson?.chapters, transitionTo]);

  // Navigate to next step (returns false if at end of chapter)
  const navigateToNextStep = useCallback(() => {
    if (!currentChapterData) return false;

    if (currentStep < currentChapterData.steps.length - 1) {
      transitionTo(() => setCurrentStep(currentStep + 1));
      return true;
    } else {
      // End of chapter - trigger callback if provided
      if (onChapterComplete && currentChapterData) {
        onChapterComplete(currentChapterData.title);
      }
      return false;
    }
  }, [currentChapterData, currentStep, transitionTo, onChapterComplete]);

  return {
    // Current position
    currentChapter,
    currentStep,
    currentChapterData,
    currentStepData,

    // Navigation state
    isTransitioning,
    isLastStep,
    isFirstStep,

    // Navigation functions
    setCurrentChapter,
    setCurrentStep,
    transitionTo,
    goToStep,
    goToChapter,
    navigateToPreviousStep,
    navigateToNextStep,
  };
}
