'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lesson, validateCodeWithFeedback, ValidationRule } from '@/lib/lessons';
import MonacoCodeEditor from '@/components/MonacoCodeEditor';
import ShaderBackground from '@/components/ShaderBackground';
import LessonContent from '@/components/LessonContent';
import dynamic from 'next/dynamic';
import { Camera, Loader2 } from 'lucide-react';
import GitHubAuthModal from '@/components/GitHubAuthModal';
import { useSession } from '@/lib/auth-client';
import '@/styles/lesson-content.css';
import '@/styles/lesson-animations.css';
import { useMonsterAsset } from '@/hooks/useMonsterAsset';
import { CreatureStageDisplay } from '@/components/CreatureStageDisplay';
import { useCreatureDisplayStage } from '@/hooks/useCreatureDisplayStage';
import { useToastNotifications, ToastContainer } from '@/hooks/useToastNotifications';
import { useNFTCapture } from '@/hooks/useNFTCapture';
import { CompletionModals } from '@/components/lesson/CompletionModals';

// wallet stuff
import { ReactiveDotProvider, ChainProvider, SignerProvider, useAccounts } from '@reactive-dot/react';
import { config } from '@/lib/reactive-dot/config';

const ConsolePanel = dynamic(() => import('@/app/ConsolePanel'), {
  ssr: false,
});

interface LessonLayoutProps {
  lesson?: Lesson;
  authRequired?: boolean;
  authError?: string;
  initialChapter?: number; // 1-based from URL
  initialStep?: number;    // 1-based from URL
}

function LessonLayoutInner({ lesson, initialChapter: propChapter, initialStep: propStep }: LessonLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from props (1-based from URL route) or fallback to query params
  const initChapter = propChapter ? propChapter - 1 : Math.max(0, parseInt(searchParams.get('c') || '1', 10) - 1);
  const initStep = propStep ? propStep - 1 : Math.max(0, parseInt(searchParams.get('s') || '1', 10) - 1);

  const [currentChapter, setCurrentChapter] = useState(initChapter);
  const [currentStep, setCurrentStep] = useState(initStep);
  const [balance, setBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const accounts = useAccounts();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const { toasts, addToast } = useToastNotifications();
  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(true);
  const [showChapterComplete, setShowChapterComplete] = useState(false);
  const [completedChapterTitle, setCompletedChapterTitle] = useState('');
  const [showNFTMinting, setShowNFTMinting] = useState(false);
  const creatureDisplayRef = useRef<HTMLDivElement>(null);
  const lessonContentRef = useRef<HTMLDivElement>(null);

  // NFT capture functionality (extracted hook)
  const { captureNFT, isCapturing, showShutter, showSuccess } = useNFTCapture({
    creatureDisplayRef,
    addToast,
  });

  // GitHub authentication session
  const { data: session, isPending: isAuthLoading } = useSession();

  const currentChapterData = lesson?.chapters?.[currentChapter];
  const currentStepData = currentChapterData?.steps[currentStep];

  // History Calculation (Auto Mode) - find where we are in the timeline
  const hatchStepIndex = currentChapterData?.steps.findIndex(s => s.displayStage === 'young') ?? -1;
  const evolutionStepIndex = currentChapterData?.steps.findIndex(s => s.displayStage === 'adult') ?? -1;

  // Monster Asset Management
  // Pass displayStage (or generationStage) to help resume check find the right generation
  // If we are on a generation step (like step 9), displayStage might be undefined, but generationStage will be set.
  const effectiveStage = currentStepData?.displayStage || currentStepData?.generationStage;
  const asset = useMonsterAsset(session?.user?.id, lesson?.id || 0, effectiveStage as any);

  // Sync URL with chapter/step state using path-based routing
  // Format: /lesson/{lessonId}/{chapterId}/{stepId}
  useEffect(() => {
    if (!lesson?.id) return;
    const newUrl = `/lesson/${lesson.id}/${currentChapter + 1}/${currentStep + 1}`;
    window.history.replaceState(null, '', newUrl);
  }, [currentChapter, currentStep, lesson?.id]);

  // (Hydration guard moved to a wrapper component to preserve hook order)

  // Progressive Disclosure Logic - Simplified with Hook (Fix #7)
  // We need to pass the narrative indices to enforce gating
  const targetStage = useCreatureDisplayStage(
    currentStepData as any, 
    asset,
    currentStep,
    hatchStepIndex,
    evolutionStepIndex
  );

  // Blocking Calculation
  // We block IF we are explicitly expecting a stage that isn't ready yet
  const effectiveLoading = !asset.error && (
      asset.isLoadingInitialState ||
      (currentStepData?.displayStage === 'adult' && !asset.isModelReady) ||
      (currentStepData?.displayStage === 'young' && !asset.isImageReady)
  );

  const isDisplayRevealing = (currentStepData?.displayStage === 'young' || currentStepData?.displayStage === 'adult');

  // Retry Logic: Force a new generation attempt if the previous one failed
  // Use ref for triggerGeneration to avoid infinite loops from unstable object references
  const triggerGenerationRef = useRef(asset.triggerGeneration);
  triggerGenerationRef.current = asset.triggerGeneration;

  const handleRetry = useCallback(() => {
      if (!currentChapterData || !currentStepData) return;

      // Determine appropriate stage based on target
      const stageToRetry = targetStage === 'adult' ? 'adult' : 'young';

      triggerGenerationRef.current(
          currentChapterData.id,
          currentStepData.id,
          stageToRetry,
          true // Force new job
      );
  }, [currentChapterData, currentStepData, targetStage]);

  // Force refresh when entering a reveal step to minimize lag
  // Note: Using a ref to avoid infinite loops from unstable callback references
  const forceRefreshRef = useRef(asset.forceRefresh);
  forceRefreshRef.current = asset.forceRefresh;

  useEffect(() => {
    if (currentStepData?.displayStage === 'young' || currentStepData?.displayStage === 'adult') {
      forceRefreshRef.current();
    }
  }, [currentStep, currentStepData?.displayStage]);

  useEffect(() => {
    // Initialize code editor with step's initial code
    if (currentStepData?.code) {
      setUserCode(currentStepData.code);
    }
    setIsValidated(false);
    setShowHint(false);
    setShowCompletionModal(false); // Reset modal when step changes

    // Scroll lesson content to top when step changes
    if (lessonContentRef.current) {
      lessonContentRef.current.scrollTop = 0;
    }
  }, [currentStep, currentStepData]);

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      if (!lesson?.id || !session?.user) return;

      try {
        const response = await fetch(`/api/progress/lesson?lessonId=${lesson.id}`);
        const data = await response.json();

        if (data.lesson?.current_chapter_id !== undefined && lesson.chapters) {
          const chapterIndex = lesson.chapters.findIndex(
            ch => ch.id === data.lesson.current_chapter_id
          );
          // Disable auto-navigation to saved progress to respect deep linking
          // if (chapterIndex >= 0) {
          //   setCurrentChapter(chapterIndex);
          // }
        }
      } catch (error) {
        console.error('Failed to load progress:', error);
      }
    };

    loadProgress();
  }, [lesson?.id, lesson?.chapters, session?.user]);

  // Track window dimensions for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial dimensions
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const validateUserCode = () => {
    if (currentStepData?.validation) {
      const validationResult = validateCodeWithFeedback(
        userCode,
        currentStepData.validation
      );

      if (validationResult.isValid) {
        setIsValidated(true);

        // Check if this step triggers generation
        if (currentStepData?.triggersGeneration && currentChapterData) {
           if (!session?.user) {
             addToast({
               type: 'info',
               title: '🔐 Authentication Required',
               message: 'Please sign in to generate your unique creature.',
             });
             setShowAuthModal(true);
           } else {
             triggerGenerationRef.current(
                 currentChapterData.id,
                 currentStepData.id,
                 currentStepData.generationStage || 'young'
             );
             // Note: Status notification is shown in the creature display area (bottom of screen)
           }
        } else {
          addToast({
            type: 'success',
            title: '🎉 Perfect!',
            message: 'Your creature responds beautifully to the code!',
          });
        }

        // Legacy NFT check (disabled for new flow to prevent double modals)
        // if (currentStepData?.triggersGeneration) { ... }

        // Check if we should show auth modal after completing step 3 of lesson 1
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
      // No validation needed, just show success
      addToast({
        type: 'success',
        title: '✅ Step Complete!',
        message: 'Ready to move on to the next step.',
      });

      // Check if we should show auth modal
      checkAuthRequirement();
      return true;
    }
  };

  // Check if authentication is required before proceeding
  const checkAuthRequirement = () => {
    // Show auth modal after completing step 3 (index 3) of lesson 1
    // This means steps 0, 1, 2, 3 are completed (first 4 stages)
    if (lesson?.id === 1 && currentStep === 3 && isValidated && !session?.user && !isAuthLoading) {
      // Save current step for restoration after auth
      localStorage.setItem(`auth-flow-lesson-${lesson.id}-step`, currentStep.toString());
      // Small delay to let the success toast show first
      setTimeout(() => setShowAuthModal(true), 1000);
    }
  };

  // Save progress to database
  const saveStepProgress = async (completed: boolean = false) => {
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
  };

  const nextStep = async () => {
    if (!lesson || !currentChapterData || !currentStepData) return;

    // Trigger generation if this step requires it (before moving to next step)
    if (currentStepData.triggersGeneration) {
      if (!session?.user) {
        addToast({
          type: 'info',
          title: '🔐 Authentication Required',
          message: 'Please sign in to generate your unique creature.',
        });
        setShowAuthModal(true);
        return; // Don't proceed until authenticated
      } else {
        triggerGenerationRef.current(
          currentChapterData.id,
          currentStepData.id,
          currentStepData.generationStage || 'young'
        );
        // Note: Status notification is shown in the creature display area (bottom of screen)
      }
    }

    // Save progress for current step before moving
    await saveStepProgress(true);

    // Check if we're at the last step of the current chapter
    if (currentStep < currentChapterData.steps.length - 1) {
      // Move to next step in current chapter
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 200);
    } else if (lesson.chapters && currentChapter < lesson.chapters.length - 1) {
      // Completed this chapter! Show celebration
      setCompletedChapterTitle(currentChapterData.title);
      setShowChapterComplete(true);
    }
  };

  // Called after chapter celebration modal is closed
  const moveToNextChapter = () => {
    setShowChapterComplete(false);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentChapter(currentChapter + 1);
      setCurrentStep(0);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  };

  const previousStep = () => {
    if (currentStep > 0) {
      // Move to previous step in current chapter
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 200);
    } else if (currentChapter > 0 && lesson && lesson.chapters) {
      // Move to last step of previous chapter
      const prevChapter = lesson.chapters[currentChapter - 1];
      if (prevChapter) {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentChapter(currentChapter - 1);
          setCurrentStep(prevChapter.steps.length - 1);
          setTimeout(() => setIsTransitioning(false), 50);
        }, 200);
      }
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex !== currentStep) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(stepIndex);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 200);
    }
  };

  const resetCode = () => {
    if (currentStepData?.code) {
      setUserCode(currentStepData.code);
      setIsValidated(false);
    }
  };

  const showSolution = () => {
    if (currentStepData?.expectedCode) {
      setUserCode(currentStepData.expectedCode);
      setIsValidated(true);
    }
  };

  if (!lesson) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
        {/* Navigation */}
        <nav className="border-b border-slate-800 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/lab" className="flex items-center space-x-2">
                <img src="/logo.png" alt="Monsters ink!" className="h-24" />
              </Link>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">Chapter</span>
            </div>
          </div>
        </nav>

        <div className="flex flex-1 items-center justify-center overflow-hidden">
          <div className="text-center py-12">
            <div className="text-6xl mb-6">📖</div>
            <h1 className="text-3xl font-bold mb-4">Empty Chapter</h1>
            <p className="text-slate-300 mb-6">
              This chapter is ready for content. Start building your
              bio-engineering tutorial here.
            </p>
            <Link
              href="/lab"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-lg font-semibold transition-all duration-200 inline-block"
            >
              ← Back to Lab
            </Link>
                  </div>
      </div>
    </div>
  );
}

  return (
    <>
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />

      <div className="h-screen w-screen bg-slate-900 flex flex-col overflow-hidden">
        {/* Full-screen Shader Background */}
        <ShaderBackground />

        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Panel: Creature Display */}
          <div className={`relative overflow-hidden transition-all duration-500 p-5 ${
            currentStepData?.code !== undefined ? 'w-1/2' : 'w-1/2'
          }`}>
            {/* Single bordered container for logo, button, and creature */}
            <div className="w-full h-full rounded-xl border border-purple-500/30 bg-slate-900 flex flex-col overflow-hidden">
              {/* Header: Logo and Snapshot Button */}
              <div className="flex justify-between items-start p-4 flex-shrink-0">
                <Link href="/" className="flex items-center space-x-2">
                  <img
                    src="/logo.png"
                    alt="Monsters ink!"
                    className="h-[80px]"
                  />
                </Link>

                <div className="flex items-center space-x-3">
                  {/* NFT Capture Button */}
                  <button
                    onClick={captureNFT}
                    disabled={isCapturing}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      isCapturing
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/30 hover:scale-105'
                    }`}
                    title="Create NFT"
                  >
                    {isCapturing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Camera size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Creature Display */}
              <div
                ref={creatureDisplayRef}
                className={`relative flex-1 transition-all duration-300 ease-out ${
                  isTransitioning
                    ? 'opacity-0 scale-95 translate-y-4'
                    : 'opacity-100 scale-100 translate-y-0'
                }`}
              >
                <CreatureStageDisplay
                  stage={targetStage}
                  imageUrl={asset.imageUrl}
                  modelUrl={asset.modelUrl}
                  isRevealing={isDisplayRevealing}
                  isLoading={effectiveLoading}
                  error={asset.error}
                  onRetry={handleRetry}
                />
              </div>
            </div>

            {/* Generation Notification Toast */}
            {(asset.isGenerating || (asset.status && ['pending', 'generating_image', 'converting_3d'].includes(asset.status))) && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-sm px-4 pointer-events-none">
                <div className="bg-slate-900/90 backdrop-blur-md border border-purple-500/30 rounded-xl p-4 shadow-xl animate-fade-in-up flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Creating your unique monster...</p>
                    <p className="text-xs text-slate-400">Standby, it will be ready soon.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Camera Shutter Effect */}
            {showShutter && (
              <div className="absolute inset-0 z-50 pointer-events-none">
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <div className="camera-shutter">
                    {/* Multiple shutter blades for realistic effect */}
                    <div className="shutter-blade blade-1"></div>
                    <div className="shutter-blade blade-2"></div>
                    <div className="shutter-blade blade-3"></div>
                    <div className="shutter-blade blade-4"></div>
                    <div className="shutter-blade blade-5"></div>
                    <div className="shutter-blade blade-6"></div>
                    <div className="shutter-blade blade-7"></div>
                    <div className="shutter-blade blade-8"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Overlay */}
            {showSuccess && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-6 rounded-2xl shadow-2xl animate-bounce-in">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📸</div>
                    <h3 className="text-xl font-bold mb-1">NFT Created!</h3>
                    <p className="text-green-100 text-sm">
                      Your creature has been captured
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Panel: Instructions + Code Editor */}
          <div className="flex flex-col p-10 min-h-0 w-1/2">
            {/* Instructions Section */}
            <div
              className={`p-6 flex flex-col overflow-hidden backdrop-blur-md bg-white/5 rounded-xl mb-4 transition-all duration-500 ease-out ${
                isTransitioning
                  ? 'opacity-0 translate-x-4'
                  : 'opacity-100 translate-x-0'
              } ${currentStepData?.code !== undefined && showCodeEditor ? 'flex-1 min-h-0' : 'flex-[2] min-h-0'}`}
            >
              {currentStepData && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div
                    ref={lessonContentRef}
                    className="flex-1 overflow-y-auto transition-all duration-300"
                  >
                    <LessonContent html={currentStepData.content} />
                  </div>
                </div>
              )}

              {/* Hint and Code Toggle Buttons */}
              {(currentStepData?.hint || currentStepData?.code !== undefined) && (
                <div className="mt-4 flex-shrink-0 flex items-center space-x-2">
                  {/* Hint Button */}
                  {currentStepData?.hint && (
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 transition-all duration-200 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 hover:border-amber-500/50 text-sm"
                    >
                      <span>💡</span>
                      <span className="font-medium">Show Hint</span>
                    </button>
                  )}

                  {/* Code Editor Toggle Button - Only show when code exists */}
                  {currentStepData?.code !== undefined && (
                    <button
                      onClick={() => setShowCodeEditor(!showCodeEditor)}
                      className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-all duration-200 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/30 hover:border-cyan-500/50 text-sm"
                      title={showCodeEditor ? "Hide Code Editor" : "Show Code Editor"}
                      aria-label={showCodeEditor ? "Hide Code Editor" : "Show Code Editor"}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-cyan-300"
                      >
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                      <span className="font-medium">{showCodeEditor ? 'Hide Code' : 'Show Code'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Hint Tooltip */}
              {currentStepData?.hint && (
                <div className="relative">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="hidden"
                  >
                    <span>💡</span>
                    <span className="font-medium">Show Hint</span>
                  </button>
                  <div className="relative w-full flex justify-center">
                    {/* Animated Toast-like Hint Overlay */}
                    <div
                      className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-300 ${
                        showHint
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 -translate-y-4'
                      } w-[min(90vw,420px)]`}
                      aria-live="polite"
                    >
                      <div className="p-4 bg-gradient-to-r from-amber-900/80 to-yellow-900/70 border border-amber-600/60 rounded-lg shadow-xl backdrop-blur-lg flex items-start space-x-3 pointer-events-auto">
                        <span className="text-lg mt-0.5">💡</span>
                        <div>
                          <h4 className="text-amber-300 font-semibold mb-1 text-sm">
                            Hint
                          </h4>
                          <p className="text-amber-100 leading-relaxed text-sm">
                            {currentStepData.hint}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Code Editor Section - Only visible when code is present AND toggle is on */}
            {currentStepData?.code !== undefined && showCodeEditor && (
            <div
              className={`flex-1 flex flex-col min-h-0 mb-4 transition-all duration-500 ease-out ${
                isTransitioning
                  ? 'opacity-0 translate-x-4'
                  : 'opacity-100 translate-x-0'
              }`}
            >
              {/* Editor Header */}
              <div className="p-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold transition-all duration-300">
                    Workspace
                  </h4>
                  <div className="flex space-x-2">
                    {/* Reset Button */}
                    <div className="relative group">
                      <button
                        onClick={resetCode}
                        className="w-8 h-8 rounded-lg border border-slate-600/50 bg-slate-800/50 hover:bg-slate-700/70 hover:border-slate-500/70 transition-all duration-200 flex items-center justify-center backdrop-blur-sm hover:scale-105 active:scale-95"
                        aria-label="Reset code"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-slate-300 group-hover:text-white transition-colors duration-200"
                        >
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                        </svg>
                      </button>
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900/90 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-slate-700/50 backdrop-blur-sm">
                        Reset Code
                      </div>
                    </div>

                    {/* Check Code Button */}
                    {currentStepData?.validation && (
                      <div className="relative group">
                        <button
                          onClick={validateUserCode}
                          className="w-8 h-8 rounded-lg border border-purple-500/50 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 hover:from-purple-600/40 hover:to-cyan-600/40 hover:border-purple-400/70 transition-all duration-200 flex items-center justify-center backdrop-blur-sm hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
                          aria-label="Check code"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-purple-200 group-hover:text-white transition-colors duration-200"
                          >
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        </button>
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900/90 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-slate-700/50 backdrop-blur-sm">
                          Check Code
                        </div>
                      </div>
                    )}

                    {/* Solution Button */}
                    {currentStepData?.expectedCode && (
                      <div className="relative group">
                        <button
                          onClick={showSolution}
                          className="w-8 h-8 rounded-lg border border-cyan-500/50 bg-cyan-600/20 hover:bg-cyan-600/40 hover:border-cyan-400/70 transition-all duration-200 flex items-center justify-center backdrop-blur-sm hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/20"
                          aria-label="Show solution"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-cyan-200 group-hover:text-white transition-colors duration-200"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <path d="M12 17h.01" />
                          </svg>
                        </button>
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900/90 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-slate-700/50 backdrop-blur-sm">
                          Show Solution
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex-1 min-h-0">
                <div
                  className={`h-full transition-all duration-300 ease-out ${
                    isTransitioning
                      ? 'opacity-0 scale-98'
                      : 'opacity-100 scale-100'
                  }`}
                >
                  <MonacoCodeEditor
                    value={userCode}
                    onChange={setUserCode}
                    language="rust"
                  />
                </div>
              </div>
            </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center flex-shrink-0">
              {/* Previous Button */}
              <div className="relative group">
                <button
                  onClick={previousStep}
                  disabled={currentStep === 0}
                  className="w-10 h-10 rounded-lg border border-slate-600/50 bg-slate-800/50 hover:bg-slate-700/70 hover:border-slate-500/70 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-800/50 disabled:hover:border-slate-600/50 transition-all duration-200 flex items-center justify-center backdrop-blur-sm hover:scale-105 active:scale-95"
                  aria-label="Previous step"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-300 group-hover:text-white transition-colors duration-200"
                  >
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                </button>
                {currentStep > 0 && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900/90 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-slate-700/50 backdrop-blur-sm">
                    Previous Step
                  </div>
                )}
              </div>

              {/* Chapter & Step Indicators */}
              <div className="flex flex-col items-center space-y-2">
                {/* Chapter Title */}
                <div className="text-xs text-slate-400">
                  Chapter {currentChapter + 1}: {currentChapterData?.title}
                </div>

                {/* Step Indicators for Current Chapter */}
                <div className="flex space-x-2">
                  {currentChapterData && Array.from({ length: currentChapterData.steps.length }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setIsTransitioning(true);
                        setTimeout(() => {
                          setCurrentStep(i);
                          setTimeout(() => setIsTransitioning(false), 50);
                        }, 200);
                      }}
                      className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-110 ${
                        i === currentStep
                          ? 'bg-gradient-to-r from-purple-400 to-cyan-400 shadow-lg shadow-purple-400/30'
                          : i < currentStep
                            ? 'bg-gradient-to-r from-pink-400 to-pink-400 shadow-md shadow-green-400/20'
                            : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                      title={`Step ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Chapter Indicators */}
                <div className="flex space-x-1">
                  {lesson && lesson.chapters && lesson.chapters.map((chapter, idx) => (
                    <button
                      key={chapter.id}
                      onClick={() => {
                        setIsTransitioning(true);
                        setTimeout(() => {
                          setCurrentChapter(idx);
                          setCurrentStep(0);
                          setTimeout(() => setIsTransitioning(false), 50);
                        }, 200);
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-200 hover:scale-125 ${
                        idx === currentChapter
                          ? 'bg-purple-500'
                          : idx < currentChapter
                            ? 'bg-emerald-500'
                            : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                      title={`Chapter ${idx + 1}: ${chapter.title}`}
                    />
                  ))}
                </div>
              </div>

              {/* Next/Complete Button */}
              {lesson && lesson.chapters && currentChapter === lesson.chapters.length - 1 && currentChapterData && currentStep === currentChapterData.steps.length - 1 ? (
                <div className="relative group">
                  <button
                    onClick={() => setShowCompletionModal(true)}
                    disabled={currentStepData?.validation && !isValidated}
                    className={`w-10 h-10 rounded-lg border transition-all duration-300 flex items-center justify-center backdrop-blur-sm active:scale-95 ${
                      currentStepData?.validation && !isValidated
                        ? 'border-slate-600/50 bg-slate-800/50 opacity-30 cursor-not-allowed'
                        : 'border-purple-500/50 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 hover:from-purple-600/40 hover:to-cyan-600/40 hover:border-purple-400/70 hover:scale-105 shadow-lg shadow-purple-500/20 animate-pulse-glow'
                    }`}
                    aria-label="Complete lesson"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-colors duration-200 ${
                        currentStepData?.validation && !isValidated
                          ? 'text-slate-500'
                          : 'text-purple-200 group-hover:text-white'
                      }`}
                    >
                      <path d="M20 6L9 17l-5-5" />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        strokeWidth="1"
                        opacity="0.3"
                      />
                    </svg>
                  </button>
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900/90 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-slate-700/50 backdrop-blur-sm">
                    {currentStepData?.validation && !isValidated
                      ? 'Complete validation first'
                      : 'Complete Lesson'}
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <button
                    onClick={nextStep}
                    disabled={
                      (lesson && lesson.chapters && currentChapter === lesson.chapters.length - 1 && currentChapterData && currentStep === currentChapterData.steps.length - 1) ||
                      (currentStepData?.validation && !isValidated)
                    }
                    className={`w-10 h-10 rounded-lg border transition-all duration-200 flex items-center justify-center backdrop-blur-sm active:scale-95 ${
                      (lesson && lesson.chapters && currentChapter === lesson.chapters.length - 1 && currentChapterData && currentStep === currentChapterData.steps.length - 1) ||
                      (currentStepData?.validation && !isValidated)
                        ? 'border-slate-600/50 bg-slate-800/50 opacity-30 cursor-not-allowed'
                        : 'border-purple-500/50 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 hover:from-purple-600/40 hover:to-cyan-600/40 hover:border-purple-400/70 hover:scale-105 shadow-lg shadow-purple-500/20'
                    }`}
                    aria-label="Next step"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-colors duration-200 ${
                        (lesson && lesson.chapters && currentChapter === lesson.chapters.length - 1 && currentChapterData && currentStep === currentChapterData.steps.length - 1) ||
                        (currentStepData?.validation && !isValidated)
                          ? 'text-slate-500'
                          : 'text-purple-200 group-hover:text-white'
                      }`}
                    >
                      <polyline points="9,18 15,12 9,6" />
                    </svg>
                  </button>
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900/90 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-slate-700/50 backdrop-blur-sm">
                    {(lesson && lesson.chapters && currentChapter === lesson.chapters.length - 1 && currentChapterData && currentStep === currentChapterData.steps.length - 1)
                      ? 'Complete lesson'
                      : currentStepData?.validation && !isValidated
                        ? 'Complete validation first'
                        : 'Next Step'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Completion Modals (Chapter, Lesson, NFT Minting) + Confetti */}
        <CompletionModals
          chapterComplete={{
            isOpen: showChapterComplete,
            title: completedChapterTitle,
            onContinue: moveToNextChapter,
          }}
          lessonComplete={{
            isOpen: showCompletionModal,
            lessonId: lesson.id,
            onClose: () => setShowCompletionModal(false),
          }}
          nftMinting={{
            isOpen: showNFTMinting,
            lessonId: lesson.id,
            onClose: () => setShowNFTMinting(false),
          }}
          windowDimensions={windowDimensions}
        />

        {/* GitHub Authentication Modal */}
        <GitHubAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={() => {
            setShowAuthModal(false);
            addToast({
              type: 'success',
              title: '🔐 Authentication Successful!',
              message: 'You can now continue with advanced lessons and AI generation.',
            });
          }}
        />
      </div>
    </>
  );
}

export default function LessonLayout({ lesson, initialChapter, initialStep }: LessonLayoutProps) {
  return (
    // Type assertion due to duplicate @reactive-dot/core versions in node_modules
    // Note: ReactiveDotProvider handles SSR internally
    <ReactiveDotProvider config={config as any}>
      <ChainProvider chainId={"pop" as any}>
        <WithSigner>
          <HydrationGuard>
            <Suspense fallback={<LessonLayoutLoading />}>
              <LessonLayoutInner lesson={lesson} initialChapter={initialChapter} initialStep={initialStep} />
            </Suspense>
          </HydrationGuard>
        </WithSigner>
      </ChainProvider>
    </ReactiveDotProvider>
  );
}

function LessonLayoutLoading() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <ShaderBackground />
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center text-white">Loading lesson...</div>
      </div>
    </div>
  );
}

function HydrationGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ShaderBackground />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="h-96 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl animate-pulse" />
                <div className="h-40 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl animate-pulse" />
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl animate-pulse" />
                <div className="h-64 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl animate-pulse" />
                <div className="h-32 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function WithSigner({ children }: { children: React.ReactNode }) {
  const accounts = useAccounts();
  const signer = accounts?.[0]?.polkadotSigner;
  return <SignerProvider signer={signer}>{children}</SignerProvider>;
}
