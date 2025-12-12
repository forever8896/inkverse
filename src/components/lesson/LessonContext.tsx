'use client';

/**
 * LessonContext - Shared state management for lesson components
 *
 * This context provides centralized state for:
 * - Navigation (chapter/step tracking)
 * - Code editor state
 * - Modal visibility
 * - Validation state
 * - Asset management
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { Lesson, validateCodeWithFeedback } from '@/lib/lessons';
import { useSession } from '@/lib/auth-client';
import { useMonsterAsset } from '@/hooks/useMonsterAsset';
import { useCreatureDisplayStage } from '@/hooks/useCreatureDisplayStage';
import { useToastNotifications, ToastContainer } from '@/hooks/useToastNotifications';
import { useNFTCapture } from '@/hooks/useNFTCapture';
import { useAccounts } from '@reactive-dot/react';
import { isProcessing } from '@/lib/status-constants';

// ============================================================================
// Types
// ============================================================================

// Helper types for lesson data
type LessonChapterData = NonNullable<Lesson['chapters']>[number];
type LessonStepData = LessonChapterData['steps'][number];

interface LessonContextValue {
  // Lesson data
  lesson: Lesson | undefined;
  currentChapter: number;
  currentStep: number;
  currentChapterData: LessonChapterData | undefined;
  currentStepData: LessonStepData | undefined;

  // Navigation
  nextStep: () => Promise<void>;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  goToChapter: (chapterIndex: number) => void;
  isTransitioning: boolean;
  isLastStep: boolean;
  isFirstStep: boolean;

  // Code editor
  userCode: string;
  setUserCode: (code: string) => void;
  isValidated: boolean;
  validateUserCode: () => boolean;
  resetCode: () => void;
  showSolution: () => void;
  showCodeEditor: boolean;
  setShowCodeEditor: (show: boolean) => void;
  showHint: boolean;
  setShowHint: (show: boolean) => void;

  // Modals
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  showCompletionModal: boolean;
  setShowCompletionModal: (show: boolean) => void;
  showChapterComplete: boolean;
  setShowChapterComplete: (show: boolean) => void;
  completedChapterTitle: string;
  showNFTMinting: boolean;
  setShowNFTMinting: (show: boolean) => void;
  moveToNextChapter: () => void;

  // Auth
  session: any;
  isAuthLoading: boolean;

  // Monster asset
  asset: ReturnType<typeof useMonsterAsset>;
  targetStage: 'egg' | 'young' | 'adult';
  effectiveLoading: boolean;
  isDisplayRevealing: boolean;
  handleRetry: () => void;
  handleWalletConnected: (address: string) => void;

  // NFT capture
  captureNFT: () => void;
  isCapturing: boolean;
  showShutter: boolean;
  showSuccess: boolean;
  creatureDisplayRef: React.RefObject<HTMLDivElement | null>;

  // Toast notifications
  toasts: ReturnType<typeof useToastNotifications>['toasts'];
  addToast: ReturnType<typeof useToastNotifications>['addToast'];

  // Window dimensions (for confetti)
  windowDimensions: { width: number; height: number };

  // Refs
  lessonContentRef: React.RefObject<HTMLDivElement | null>;
}

const LessonContext = createContext<LessonContextValue | null>(null);

// ============================================================================
// Hook to use lesson context
// ============================================================================

export function useLessonContext() {
  const context = useContext(LessonContext);
  if (!context) {
    throw new Error('useLessonContext must be used within a LessonProvider');
  }
  return context;
}

// ============================================================================
// Provider Props
// ============================================================================

interface LessonProviderProps {
  children: ReactNode;
  lesson?: Lesson;
  initialChapter?: number; // 1-based from URL
  initialStep?: number;    // 1-based from URL
}

// ============================================================================
// Provider Component
// ============================================================================

export function LessonProvider({
  children,
  lesson,
  initialChapter: propChapter,
  initialStep: propStep
}: LessonProviderProps) {
  // Initialize from props (1-based from URL route)
  const initChapter = propChapter ? propChapter - 1 : 0;
  const initStep = propStep ? propStep - 1 : 0;

  // -------------------------------------------------------------------------
  // Navigation State
  // -------------------------------------------------------------------------
  const [currentChapter, setCurrentChapter] = useState(initChapter);
  const [currentStep, setCurrentStep] = useState(initStep);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // -------------------------------------------------------------------------
  // Code Editor State
  // -------------------------------------------------------------------------
  const [userCode, setUserCode] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(true);

  // -------------------------------------------------------------------------
  // Modal State
  // -------------------------------------------------------------------------
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showChapterComplete, setShowChapterComplete] = useState(false);
  const [completedChapterTitle, setCompletedChapterTitle] = useState('');
  const [showNFTMinting, setShowNFTMinting] = useState(false);

  // -------------------------------------------------------------------------
  // UI State
  // -------------------------------------------------------------------------
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  // -------------------------------------------------------------------------
  // Refs
  // -------------------------------------------------------------------------
  const creatureDisplayRef = useRef<HTMLDivElement>(null);
  const lessonContentRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // External Hooks
  // -------------------------------------------------------------------------
  const { data: session, isPending: isAuthLoading } = useSession();
  const { toasts, addToast } = useToastNotifications();
  const accounts = useAccounts();

  // -------------------------------------------------------------------------
  // Derived Data
  // -------------------------------------------------------------------------
  const currentChapterData = lesson?.chapters?.[currentChapter];
  const currentStepData = currentChapterData?.steps[currentStep];
  const isLastStep = !!(
    lesson?.chapters &&
    currentChapter === lesson.chapters.length - 1 &&
    currentChapterData &&
    currentStep === currentChapterData.steps.length - 1
  );
  const isFirstStep = currentStep === 0 && currentChapter === 0;

  // History Calculation for progressive disclosure
  const hatchStepIndex = currentChapterData?.steps.findIndex(s => s.displayStage === 'young') ?? -1;
  const evolutionStepIndex = currentChapterData?.steps.findIndex(s => s.displayStage === 'adult') ?? -1;

  // -------------------------------------------------------------------------
  // Monster Asset Management
  // -------------------------------------------------------------------------
  const effectiveStage = currentStepData?.displayStage || currentStepData?.generationStage;
  const asset = useMonsterAsset(session?.user?.id, lesson?.id || 0, effectiveStage as any);

  const targetStage = useCreatureDisplayStage(
    currentStepData as any,
    asset,
    currentStep,
    hatchStepIndex,
    evolutionStepIndex
  );

  const effectiveLoading = !asset.error && (
    asset.isLoadingInitialState ||
    (currentStepData?.displayStage === 'adult' && !asset.isModelReady) ||
    (currentStepData?.displayStage === 'young' && !asset.isImageReady)
  );

  const isDisplayRevealing = currentStepData?.displayStage === 'young' || currentStepData?.displayStage === 'adult';

  // -------------------------------------------------------------------------
  // NFT Capture
  // -------------------------------------------------------------------------
  const { captureNFT, isCapturing, showShutter, showSuccess } = useNFTCapture({
    creatureDisplayRef,
    addToast,
  });

  // -------------------------------------------------------------------------
  // Generation Refs (for stable callbacks)
  // -------------------------------------------------------------------------
  const triggerGenerationRef = useRef(asset.triggerGeneration);
  triggerGenerationRef.current = asset.triggerGeneration;

  const forceRefreshRef = useRef(asset.forceRefresh);
  forceRefreshRef.current = asset.forceRefresh;

  const pendingGenerationRef = useRef<{
    chapterId: number;
    stepId: number;
    stage: 'young' | 'adult';
    force?: boolean;
  } | null>(null);

  // -------------------------------------------------------------------------
  // Wallet Helpers
  // -------------------------------------------------------------------------
  const getWalletAddress = useCallback(() => {
    return accounts?.[0]?.address || undefined;
  }, [accounts]);

  const triggerWithWallet = useCallback((
    chapterId: number,
    stepId: number,
    stage: 'young' | 'adult' = 'young',
    force: boolean = false
  ) => {
    const walletAddress = getWalletAddress();
    pendingGenerationRef.current = { chapterId, stepId, stage, force };
    triggerGenerationRef.current(chapterId, stepId, stage, force, walletAddress);
  }, [getWalletAddress]);

  const handleWalletConnected = useCallback((address: string) => {
    asset.clearWalletRequired();
    if (pendingGenerationRef.current) {
      const { chapterId, stepId, stage, force } = pendingGenerationRef.current;
      triggerGenerationRef.current(chapterId, stepId, stage, force || false, address);
      pendingGenerationRef.current = null;
    }
  }, [asset]);

  const handleRetry = useCallback(() => {
    if (!currentChapterData || !currentStepData) return;
    const stageToRetry = targetStage === 'adult' ? 'adult' : 'young';
    triggerWithWallet(currentChapterData.id, currentStepData.id, stageToRetry, true);
  }, [currentChapterData, currentStepData, targetStage, triggerWithWallet]);

  // -------------------------------------------------------------------------
  // URL Sync
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!lesson?.id) return;
    const newUrl = `/lesson/${lesson.id}/${currentChapter + 1}/${currentStep + 1}`;
    window.history.replaceState(null, '', newUrl);
  }, [currentChapter, currentStep, lesson?.id]);

  // -------------------------------------------------------------------------
  // Force refresh on reveal steps
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (currentStepData?.displayStage === 'young' || currentStepData?.displayStage === 'adult') {
      forceRefreshRef.current();
    }
  }, [currentStep, currentStepData?.displayStage]);

  // -------------------------------------------------------------------------
  // Initialize code on step change
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (currentStepData?.code) {
      setUserCode(currentStepData.code);
    }
    setIsValidated(false);
    setShowHint(false);
    setShowCompletionModal(false);

    if (lessonContentRef.current) {
      lessonContentRef.current.scrollTop = 0;
    }
  }, [currentStep, currentStepData]);

  // -------------------------------------------------------------------------
  // Window dimensions for confetti
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // -------------------------------------------------------------------------
  // Check Auth Requirement
  // -------------------------------------------------------------------------
  const checkAuthRequirement = useCallback(() => {
    if (lesson?.id === 1 && currentStep === 3 && isValidated && !session?.user && !isAuthLoading) {
      localStorage.setItem(`auth-flow-lesson-${lesson.id}-step`, currentStep.toString());
      setTimeout(() => setShowAuthModal(true), 1000);
    }
  }, [lesson?.id, currentStep, isValidated, session?.user, isAuthLoading]);

  // -------------------------------------------------------------------------
  // Save Progress
  // -------------------------------------------------------------------------
  const saveStepProgress = useCallback(async (completed: boolean = false) => {
    if (!lesson || !currentChapterData || !currentStepData || !session?.user) return;

    try {
      await fetch('/api/progress/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          chapterId: currentChapterData.id,
          stepId: currentStepData.id,
          contractCode: userCode,
          completed,
          validationPassed: isValidated,
        }),
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [lesson, currentChapterData, currentStepData, session?.user, userCode, isValidated]);

  // -------------------------------------------------------------------------
  // Validate Code
  // -------------------------------------------------------------------------
  const validateUserCode = useCallback(() => {
    if (currentStepData?.validation) {
      const validationResult = validateCodeWithFeedback(userCode, currentStepData.validation);

      if (validationResult.isValid) {
        setIsValidated(true);

        if (currentStepData?.triggersGeneration && currentChapterData) {
          if (!session?.user) {
            addToast({
              type: 'info',
              title: '🔐 Authentication Required',
              message: 'Please sign in to generate your unique creature.',
            });
            setShowAuthModal(true);
          } else {
            triggerWithWallet(
              currentChapterData.id,
              currentStepData.id,
              currentStepData.generationStage || 'young'
            );
          }
        } else {
          addToast({
            type: 'success',
            title: '🎉 Perfect!',
            message: 'Your creature responds beautifully to the code!',
          });
        }

        checkAuthRequirement();
      } else {
        setIsValidated(false);
        addToast({
          type: 'error',
          title: '🔍 Not quite there yet',
          message: validationResult.feedback,
        });
      }
      return validationResult.isValid;
    } else {
      addToast({
        type: 'success',
        title: '✅ Step Complete!',
        message: 'Ready to move on to the next step.',
      });
      checkAuthRequirement();
      return true;
    }
  }, [currentStepData, currentChapterData, userCode, session?.user, addToast, triggerWithWallet, checkAuthRequirement]);

  // -------------------------------------------------------------------------
  // Navigation Functions
  // -------------------------------------------------------------------------
  const transitionTo = useCallback((action: () => void) => {
    setIsTransitioning(true);
    setTimeout(() => {
      action();
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  }, []);

  const nextStep = useCallback(async () => {
    if (!lesson || !currentChapterData || !currentStepData) return;

    if (currentStepData.triggersGeneration) {
      if (!session?.user) {
        addToast({
          type: 'info',
          title: '🔐 Authentication Required',
          message: 'Please sign in to generate your unique creature.',
        });
        setShowAuthModal(true);
        return;
      } else {
        triggerWithWallet(
          currentChapterData.id,
          currentStepData.id,
          currentStepData.generationStage || 'young'
        );
      }
    }

    await saveStepProgress(true);

    if (currentStep < currentChapterData.steps.length - 1) {
      transitionTo(() => setCurrentStep(currentStep + 1));
    } else if (lesson.chapters && currentChapter < lesson.chapters.length - 1) {
      setCompletedChapterTitle(currentChapterData.title);
      setShowChapterComplete(true);
    }
  }, [lesson, currentChapterData, currentStepData, currentStep, currentChapter, session?.user, addToast, triggerWithWallet, saveStepProgress, transitionTo]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      transitionTo(() => setCurrentStep(currentStep - 1));
    } else if (currentChapter > 0 && lesson?.chapters) {
      const prevChapter = lesson.chapters[currentChapter - 1];
      if (prevChapter) {
        transitionTo(() => {
          setCurrentChapter(currentChapter - 1);
          setCurrentStep(prevChapter.steps.length - 1);
        });
      }
    }
  }, [currentStep, currentChapter, lesson?.chapters, transitionTo]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex !== currentStep) {
      transitionTo(() => setCurrentStep(stepIndex));
    }
  }, [currentStep, transitionTo]);

  const goToChapter = useCallback((chapterIndex: number) => {
    transitionTo(() => {
      setCurrentChapter(chapterIndex);
      setCurrentStep(0);
    });
  }, [transitionTo]);

  const moveToNextChapter = useCallback(() => {
    setShowChapterComplete(false);
    transitionTo(() => {
      setCurrentChapter(currentChapter + 1);
      setCurrentStep(0);
    });
  }, [currentChapter, transitionTo]);

  // -------------------------------------------------------------------------
  // Code Editor Functions
  // -------------------------------------------------------------------------
  const resetCode = useCallback(() => {
    if (currentStepData?.code) {
      setUserCode(currentStepData.code);
      setIsValidated(false);
    }
  }, [currentStepData?.code]);

  const showSolution = useCallback(() => {
    if (currentStepData?.expectedCode) {
      setUserCode(currentStepData.expectedCode);
      setIsValidated(true);
    }
  }, [currentStepData?.expectedCode]);

  // -------------------------------------------------------------------------
  // Context Value
  // -------------------------------------------------------------------------
  const value: LessonContextValue = {
    // Lesson data
    lesson,
    currentChapter,
    currentStep,
    currentChapterData,
    currentStepData,

    // Navigation
    nextStep,
    previousStep,
    goToStep,
    goToChapter,
    isTransitioning,
    isLastStep,
    isFirstStep,

    // Code editor
    userCode,
    setUserCode,
    isValidated,
    validateUserCode,
    resetCode,
    showSolution,
    showCodeEditor,
    setShowCodeEditor,
    showHint,
    setShowHint,

    // Modals
    showAuthModal,
    setShowAuthModal,
    showCompletionModal,
    setShowCompletionModal,
    showChapterComplete,
    setShowChapterComplete,
    completedChapterTitle,
    showNFTMinting,
    setShowNFTMinting,
    moveToNextChapter,

    // Auth
    session,
    isAuthLoading,

    // Monster asset
    asset,
    targetStage,
    effectiveLoading,
    isDisplayRevealing,
    handleRetry,
    handleWalletConnected,

    // NFT capture
    captureNFT,
    isCapturing,
    showShutter,
    showSuccess,
    creatureDisplayRef,

    // Toast notifications
    toasts,
    addToast,

    // Window dimensions
    windowDimensions,

    // Refs
    lessonContentRef,
  };

  return (
    <LessonContext.Provider value={value}>
      <ToastContainer toasts={toasts} />
      {children}
    </LessonContext.Provider>
  );
}
