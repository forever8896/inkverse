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
import { useCodeCompilation, type CompilationError, type CompilationResult } from '@/hooks/useCodeCompilation';
import { useAccounts } from '@reactive-dot/react';
import { isProcessing } from '@/lib/status-constants';
import { playSound } from '@/lib/sound-manager';

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
  validateUserCode: () => Promise<boolean>;
  resetCode: () => void;
  showSolution: () => void;
  showCodeEditor: boolean;
  setShowCodeEditor: (show: boolean) => void;
  showHint: boolean;
  setShowHint: (show: boolean) => void;

  // Compilation
  isCompiling: boolean;
  compilationResult: CompilationResult | null;
  compilationErrors: CompilationError[];
  compilationWarnings: CompilationError[];
  clearCompilationErrors: () => void;
  showSuccessSquink: boolean;
  dismissSquink: () => void;

  // Modals
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  showCompletionModal: boolean;
  setShowCompletionModal: (show: boolean) => void;
  showChapterComplete: boolean;
  setShowChapterComplete: (show: boolean) => void;
  completedChapterTitle: string;
  moveToNextChapter: () => void;
  /** Whether auth is required to continue from the current chapter completion modal */
  chapterRequiresAuth: boolean;

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

  // Sound effects
  playClickSound: () => void;
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
  const [chapterRequiresAuth, setChapterRequiresAuth] = useState(false);
  const [showSuccessSquink, setShowSuccessSquink] = useState(false);

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
  const {
    compile,
    isCompiling,
    lastResult: compilationResult,
    reset: resetCompilation,
  } = useCodeCompilation();

  // Sound effect functions - using playSound directly for reliability
  const playCorrectSound = useCallback(() => playSound('CORRECT'), []);
  const playWrongSound = useCallback(() => playSound('WRONG'), []);
  const playLevelUpSound = useCallback(() => playSound('LVL_UP'), []);
  const playClickSound = useCallback(() => playSound('CLICK'), []);

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
  // Auto-continue after OAuth redirect (handles page reload after GitHub auth)
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const pendingComplete = localStorage.getItem('pendingChapterComplete');

    // If there's a pending chapter completion AND user is now authenticated
    if (pendingComplete && session?.user && !isAuthLoading) {
      // Clear the flag first to prevent re-triggering
      localStorage.removeItem('pendingChapterComplete');

      // Auto-navigate to Chapter 2 (Chapter 1 is index 0, so we go to index 1)
      // Only if we're still on Chapter 1 (lesson 1)
      if (lesson?.id === 1 && currentChapter === 0) {
        // Small delay to ensure smooth transition after page load
        setTimeout(() => {
          setCurrentChapter(1);
          setCurrentStep(0);
          // Update URL
          window.history.replaceState(null, '', `/lesson/${lesson.id}/2/1`);
        }, 100);
      }
    }
  }, [session?.user, isAuthLoading, lesson?.id, currentChapter]);

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
  const validateUserCode = useCallback(async (): Promise<boolean> => {
    // Clear any previous feedback (errors and success)
    resetCompilation();
    setShowSuccessSquink(false);

    if (currentStepData?.validation) {
      // Check if code matches expected pattern (for lesson progression)
      const validationResult = validateCodeWithFeedback(userCode, currentStepData.validation);

      if (validationResult.isValid) {
        setIsValidated(true);

        // Play success sound
        playCorrectSound();

        // Always show success via the Squink character
        setShowSuccessSquink(true);

        // Additionally handle generation triggers
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
        }
        return true;
      } else {
        // Pattern validation failed - run actual compilation to get real Rust errors
        setIsValidated(false);

        // Show compiling indicator (no sound yet - wait for result)
        addToast({
          type: 'info',
          title: '🔧 Compiling...',
          message: 'Running Rust compiler to check your code...',
        });

        // Call the compilation service for real Rust compiler errors
        const compilationResponse = await compile(userCode);

        if (compilationResponse.serviceUnavailable) {
          // Service unavailable - play error sound
          playWrongSound();
          addToast({
            type: 'error',
            title: '🔌 Service Unavailable',
            message: 'Code validation service is offline. Please try again later.',
          });
        } else if (!compilationResponse.success && compilationResponse.errors.length > 0) {
          // Show actual Rust compilation errors - play error sound
          playWrongSound();
          const firstError = compilationResponse.errors[0];
          addToast({
            type: 'error',
            title: `🔍 Compiler Error${firstError.code ? ` [${firstError.code}]` : ''}`,
            message: firstError.message,
          });
        } else if (compilationResponse.success) {
          // Code compiles successfully but doesn't match expected pattern
          // This is a "soft" error - code works but not what we expected
          // Use a different tone - info sound or no sound
          addToast({
            type: 'info',
            title: '✓ Code Compiles!',
            message: validationResult.feedback,
          });
        } else {
          // Unknown error - play error sound
          playWrongSound();
          addToast({
            type: 'error',
            title: '🔍 Check Failed',
            message: 'Unable to validate code. Please try again.',
          });
        }
        return false;
      }
    } else {
      addToast({
        type: 'success',
        title: '✅ Step Complete!',
        message: 'Ready to move on to the next step.',
      });
      return true;
    }
  }, [currentStepData, currentChapterData, userCode, session?.user, addToast, triggerWithWallet, compile, resetCompilation, playCorrectSound, playWrongSound]);

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

    // Clear any Squink feedback when navigating
    setShowSuccessSquink(false);
    resetCompilation();

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
      // Check if Chapter 1 of Lesson 1 requires auth to continue
      const requiresAuth = lesson.id === 1 && currentChapter === 0 && !session?.user;
      setChapterRequiresAuth(requiresAuth);

      setCompletedChapterTitle(currentChapterData.title);
      setShowChapterComplete(true);

      // Play level up sound for chapter completion
      playLevelUpSound();
    }
  }, [lesson, currentChapterData, currentStepData, currentStep, currentChapter, session?.user, addToast, triggerWithWallet, saveStepProgress, transitionTo, resetCompilation, playLevelUpSound]);

  const previousStep = useCallback(() => {
    // Clear any Squink feedback when navigating
    setShowSuccessSquink(false);
    resetCompilation();

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
  }, [currentStep, currentChapter, lesson?.chapters, transitionTo, resetCompilation]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex !== currentStep) {
      // Clear any Squink feedback when navigating
      setShowSuccessSquink(false);
      resetCompilation();
      transitionTo(() => setCurrentStep(stepIndex));
    }
  }, [currentStep, transitionTo, resetCompilation]);

  const goToChapter = useCallback((chapterIndex: number) => {
    // Clear any Squink feedback when navigating
    setShowSuccessSquink(false);
    resetCompilation();
    transitionTo(() => {
      setCurrentChapter(chapterIndex);
      setCurrentStep(0);
    });
  }, [transitionTo, resetCompilation]);

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

  // Dismiss the Squink (both error and success states)
  const dismissSquink = useCallback(() => {
    setShowSuccessSquink(false);
    resetCompilation();
  }, [resetCompilation]);

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

    // Compilation
    isCompiling,
    compilationResult,
    compilationErrors: compilationResult?.errors || [],
    compilationWarnings: compilationResult?.warnings || [],
    clearCompilationErrors: resetCompilation,
    showSuccessSquink,
    dismissSquink,

    // Modals
    showAuthModal,
    setShowAuthModal,
    showCompletionModal,
    setShowCompletionModal,
    showChapterComplete,
    setShowChapterComplete,
    completedChapterTitle,
    moveToNextChapter,
    chapterRequiresAuth,

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

    // Sound effects
    playClickSound,
  };

  return (
    <LessonContext.Provider value={value}>
      <ToastContainer toasts={toasts} />
      {children}
    </LessonContext.Provider>
  );
}
