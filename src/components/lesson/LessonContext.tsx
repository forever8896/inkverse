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
import { useCodeCompilation, type CompilationError, type CompilationResult } from '@/hooks/useCodeCompilation';
import { useLessonNavigation } from '@/hooks/useLessonNavigation';
import { useLessonModals } from '@/hooks/useLessonModals';
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
  validationFailureCount: number;

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

  // Creature display ref
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
  // -------------------------------------------------------------------------
  // Navigation State (extracted hook)
  // -------------------------------------------------------------------------
  const navigation = useLessonNavigation({
    lesson,
    initialChapter: propChapter,
    initialStep: propStep,
  });

  const {
    currentChapter,
    currentStep,
    currentChapterData,
    currentStepData,
    isTransitioning,
    isLastStep,
    isFirstStep,
    setCurrentChapter,
    setCurrentStep,
    transitionTo,
    goToStep: navGoToStep,
    goToChapter: navGoToChapter,
    navigateToPreviousStep,
    navigateToNextStep,
  } = navigation;

  // -------------------------------------------------------------------------
  // Modal State (extracted hook)
  // -------------------------------------------------------------------------
  const modals = useLessonModals();

  const {
    showAuthModal,
    setShowAuthModal,
    showCompletionModal,
    setShowCompletionModal,
    showChapterComplete,
    setShowChapterComplete,
    completedChapterTitle,
    chapterRequiresAuth,
    setChapterRequiresAuth,
    openChapterComplete,
    closeChapterComplete,
  } = modals;

  // -------------------------------------------------------------------------
  // Code Editor State
  // -------------------------------------------------------------------------
  const [userCode, setUserCode] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(true);
  const [showSuccessSquink, setShowSuccessSquink] = useState(false);
  const [validationFailureCount, setValidationFailureCount] = useState(0);

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
  // Derived Data (for progressive disclosure)
  // -------------------------------------------------------------------------
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
  // Generation Refs (for stable callbacks)
  // -------------------------------------------------------------------------
  const triggerGenerationRef = useRef(asset.triggerGeneration);
  triggerGenerationRef.current = asset.triggerGeneration;

  const triggerEvolutionRef = useRef(asset.triggerEvolution);
  triggerEvolutionRef.current = asset.triggerEvolution;

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

  // Trigger evolution (for young_3d reveal stage)
  const triggerEvolutionWithWallet = useCallback(async (
    targetStage: 'young_3d' | 'adult',
    evolutionMilestone?: string
  ) => {
    const walletAddress = getWalletAddress();
    if (!walletAddress) {
      addToast({
        type: 'error',
        title: 'Wallet Required',
        message: 'Please connect your wallet to evolve your monster.',
      });
      return;
    }
    const result = await triggerEvolutionRef.current(targetStage, walletAddress, evolutionMilestone);
    if (!result.success) {
      addToast({
        type: 'error',
        title: 'Evolution Failed',
        message: result.error || 'Failed to evolve your monster.',
      });
    }
  }, [getWalletAddress, addToast]);

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

        // Reset failure count on successful validation
        setValidationFailureCount(0);

        return true;
      } else {
        // Pattern validation failed - run actual compilation to get real Rust errors
        setIsValidated(false);

        // Increment failure count
        setValidationFailureCount(prev => prev + 1);

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
  }, [currentStepData, currentChapterData, userCode, session?.user, addToast, triggerWithWallet, triggerEvolutionWithWallet, compile, resetCompilation, playCorrectSound, playWrongSound, setValidationFailureCount]);

  // -------------------------------------------------------------------------
  // Navigation Functions (using extracted hook)
  // -------------------------------------------------------------------------
  const clearFeedbackOnNavigate = useCallback(() => {
    setShowSuccessSquink(false);
    resetCompilation();
  }, [resetCompilation]);

  const nextStep = useCallback(async () => {
    if (!lesson || !currentChapterData || !currentStepData) return;

    // Clear any Squink feedback when navigating
    clearFeedbackOnNavigate();

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
        const genStage = currentStepData.generationStage;

        if (genStage === 'young_3d') {
          // Evolution reveal - update existing NFT metadata
          triggerEvolutionWithWallet('young_3d', currentStepData.evolutionMilestone);
        } else {
          // Generation - create new assets (young or adult)
          const triggerStage: 'young' | 'adult' = genStage === 'adult' ? 'adult' : 'young';
          triggerWithWallet(
            currentChapterData.id,
            currentStepData.id,
            triggerStage
          );
        }
      }
    }

    await saveStepProgress(true);

    // Try to navigate to next step
    const movedToNextStep = navigateToNextStep();

    if (!movedToNextStep && lesson.chapters && currentChapter < lesson.chapters.length - 1) {
      // End of chapter - show chapter complete modal
      const requiresAuth = lesson.id === 1 && currentChapter === 0 && !session?.user;
      openChapterComplete(currentChapterData.title, requiresAuth);

      // Play level up sound for chapter completion
      playLevelUpSound();
    }
  }, [lesson, currentChapterData, currentStepData, currentChapter, session?.user, addToast, triggerWithWallet, triggerEvolutionWithWallet, saveStepProgress, navigateToNextStep, clearFeedbackOnNavigate, openChapterComplete, playLevelUpSound]);

  const previousStep = useCallback(() => {
    navigateToPreviousStep(clearFeedbackOnNavigate);
  }, [navigateToPreviousStep, clearFeedbackOnNavigate]);

  const goToStep = useCallback((stepIndex: number) => {
    navGoToStep(stepIndex, clearFeedbackOnNavigate);
  }, [navGoToStep, clearFeedbackOnNavigate]);

  const goToChapter = useCallback((chapterIndex: number) => {
    navGoToChapter(chapterIndex, clearFeedbackOnNavigate);
  }, [navGoToChapter, clearFeedbackOnNavigate]);

  const moveToNextChapter = useCallback(() => {
    closeChapterComplete();
    transitionTo(() => {
      setCurrentChapter(currentChapter + 1);
      setCurrentStep(0);
    });
  }, [currentChapter, transitionTo, closeChapterComplete, setCurrentChapter, setCurrentStep]);

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
    if (currentStepData?.expectedCode && validationFailureCount >= 3) {
      setUserCode(currentStepData.expectedCode);
      setIsValidated(true);
    } else if (currentStepData?.expectedCode) {
      addToast({
        type: 'info',
        title: '💡 Keep Trying!',
        message: `Solution available after ${3 - validationFailureCount} more failed attempt${validationFailureCount + 1 === 3 ? '' : 's'}.`,
      });
    }
  }, [currentStepData?.expectedCode, validationFailureCount]);

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
    validationFailureCount,

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

    // Creature display ref
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
