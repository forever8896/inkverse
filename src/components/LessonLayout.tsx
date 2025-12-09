'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lesson, validateCode, ValidationRule } from '@/lib/lessons';
import MonacoCodeEditor from '@/components/MonacoCodeEditor';
import ShaderBackground from '@/components/ShaderBackground';
import LessonContent from '@/components/LessonContent';
import dynamic from 'next/dynamic';
import { HSLValues } from '@/components/CreatureColorPicker';
import Confetti from 'react-confetti';
import { Camera, Loader2 } from 'lucide-react';
import { MintCreatureNFT } from './MintCreatureNFT';
import GitHubAuthModal from '@/components/GitHubAuthModal';
import { useSession } from '@/lib/auth-client';
import '@/styles/lesson-content.css';
import { useMonsterAsset } from '@/hooks/useMonsterAsset';
import { CreatureStageDisplay } from '@/components/CreatureStageDisplay';
import { useCreatureDisplayStage } from '@/hooks/useCreatureDisplayStage';

// wallet stuff
import { ReactiveDotProvider, ChainProvider, SignerProvider, useAccounts } from '@reactive-dot/react';
import { ConnectButton } from '@/components/web3/connect-button';
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

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [creatureColor, setCreatureColor] = useState<HSLValues>({
    hue: 0,
    saturation: 0,
    lightness: 0,
  });
  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showShutter, setShowShutter] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(true);
  const [showChapterComplete, setShowChapterComplete] = useState(false);
  const [completedChapterTitle, setCompletedChapterTitle] = useState('');
  const [showNFTMinting, setShowNFTMinting] = useState(false);
  const creatureDisplayRef = useRef<HTMLDivElement>(null);
  const lessonContentRef = useRef<HTMLDivElement>(null);

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

  // Load saved creature color from localStorage
  useEffect(() => {
    const savedColor = localStorage.getItem('creatureColor');
    if (savedColor) {
      try {
        const parsedColor = JSON.parse(savedColor);
        setCreatureColor(parsedColor);
      } catch (error) {
        console.error('Error parsing saved color:', error);
      }
    }
  }, []);

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

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
             addToast({
               type: 'info',
               title: '🧬 DNA Synthesis Started',
               message: 'Your creature is being generated in the background...',
             });
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

  // Enhanced validation with detailed feedback
  const validateCodeWithFeedback = (code: string, rules: ValidationRule[]) => {
    for (const rule of rules) {
      switch (rule.type) {
        case 'includes':
          for (const pattern of rule.patterns) {
            if (!code.includes(pattern)) {
              return {
                isValid: false,
                feedback: getPatternFeedback(pattern, currentStep),
              };
            }
          }
          break;
        case 'excludes':
          for (const pattern of rule.patterns) {
            if (code.includes(pattern)) {
              return {
                isValid: false,
                feedback: `Remove "${pattern}" from your code.`,
              };
            }
          }
          break;
        case 'regex':
          for (const pattern of rule.patterns) {
            if (!new RegExp(pattern).test(code)) {
              return {
                isValid: false,
                feedback: `Make sure your code matches the required pattern.`,
              };
            }
          }
          break;
        case 'custom':
          // Handle custom validation rules if needed
          break;
      }
    }
    return { isValid: true, feedback: '' };
  };

  // Specific feedback for different patterns
  const getPatternFeedback = (pattern: string, step: number): string => {
    const feedbackMap: Record<string, string> = {
      '#[ink(storage)]':
        'Add the #[ink(storage)] attribute above your struct. This tells ink! that this struct will store data on the blockchain.',
      'struct Creature':
        "Create a struct called 'Creature' - this will be your creature's blueprint. Use 'pub struct Creature {' syntax.",
      is_conscious:
        "Add an 'is_conscious' field inside your struct. This should be of type 'bool' to track if your creature is awake.",
      bool: "Make sure your is_conscious field is of type 'bool' (true/false values).",
      'impl Creature':
        "Create an implementation block with 'impl Creature {' - this is where your creature's abilities will live.",
      '#[ink(constructor)]':
        'Add the #[ink(constructor)] attribute above your constructor function. This tells ink! this function creates new creatures.',
      birth_awake:
        "Create a constructor function called 'birth_awake' that takes a 'conscious: bool' parameter.",
      birth_sleeping:
        "Create a second constructor called 'birth_sleeping' with no parameters. It should call 'Self::birth_awake(false)'.",
      '#[ink(message)]':
        'Add the #[ink(message)] attribute above your function. This makes it callable from outside the contract.',
      'pub fn is_awake':
        "Create a public function called 'is_awake' that takes '&self' and returns 'bool'.",
      '&self':
        "Your is_awake function should take '&self' as a parameter (read-only access to the creature).",
      'self.is_conscious':
        "Return 'self.is_conscious' from your function to tell others if the creature is awake.",
      'pub fn toggle_consciousness':
        "Create a function called 'toggle_consciousness' that takes '&mut self' (mutable access).",
      '&mut self':
        "Use '&mut self' because you're changing the creature's state. The 'mut' means mutable/changeable.",
      'self.is_conscious = !self.is_conscious':
        "Flip the consciousness state using 'self.is_conscious = !self.is_conscious;' - the ! operator flips true to false and vice versa.",
    };

    return (
      feedbackMap[pattern] || `Make sure to include "${pattern}" in your code.`
    );
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
    if (!lesson || !currentChapterData) return;

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

  // Generate CSS filter string from HSL values
  const getImageFilter = () => {
    const { hue, saturation, lightness } = creatureColor;
    return `hue-rotate(${hue}deg) saturate(${100 + saturation}%) brightness(${
      100 + lightness
    }%) drop-shadow(0 0 20px rgba(147, 51, 234, 0.5))`;
  };

  // NFT capture functionality
  const captureNFT = useCallback(async () => {
    if (!creatureDisplayRef.current) return;

    setIsCapturing(true);
    setShowShutter(true);

    // Shutter effect timing
    setTimeout(() => setShowShutter(false), 800);

    try {
      // Create a new canvas for the NFT with square dimensions
      const nftCanvas = document.createElement('canvas');
      const nftSize = 1024;
      nftCanvas.width = nftSize;
      nftCanvas.height = nftSize;

      const ctx = nftCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get 2D context');
      }

      // Fill background with gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, nftSize);
      gradient.addColorStop(0, '#1e293b'); // slate-800
      gradient.addColorStop(1, '#0f172a'); // slate-900
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, nftSize, nftSize);

      // Get creature element
      const creatureElement = creatureDisplayRef.current.querySelector('img, span');
      if (creatureElement) {
        if (creatureElement.tagName === 'IMG') {
          // Handle image elements
          const img = creatureElement as HTMLImageElement;
          await new Promise((resolve) => {
            if (img.complete) {
              resolve(undefined);
            } else {
              img.onload = () => resolve(undefined);
            }
          });

          // Draw the creature image centered with padding
          const padding = nftSize * 0.1;
          const targetSize = nftSize - padding * 2;
          
          ctx.drawImage(
            img,
            padding,
            padding,
            targetSize,
            targetSize
          );
        } else {
          // Handle emoji/text elements
          const span = creatureElement as HTMLSpanElement;
          const fontSize = nftSize * 0.4; // 40% of canvas size
          ctx.font = `${fontSize}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = window.getComputedStyle(span).color || '#ffffff';
          
          // Apply any filters if present
          const filter = window.getComputedStyle(span).filter;
          if (filter && filter !== 'none') {
            ctx.filter = filter;
          }
          
          ctx.fillText(
            span.textContent || '🔬',
            nftSize / 2,
            nftSize / 2
          );
        }
      }

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        nftCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });

      // Send to backend
      const formData = new FormData();
      formData.append('image', blob, 'creature-nft.png');

      const response = await fetch('/api/nft-snapshot', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Show success overlay
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        addToast({
          type: 'success',
          title: '📸 NFT Created!',
          message: 'Your creature has been captured successfully',
        });
      } else {
        throw new Error(result.error || 'Failed to save NFT');
      }
    } catch (error) {
      console.error('Error creating NFT:', error);
      addToast({
        type: 'error',
        title: '❌ Capture Failed',
        message: 'Failed to create NFT snapshot. Please try again.',
      });
    } finally {
      setIsCapturing(false);
    }
  }, [addToast]);

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
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-1000 flex flex-col items-center space-y-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              px-6 py-4 rounded-lg shadow-lg border
              ${
                toast.type === 'success'
                  ? 'bg-pink-700/90 border-pink-400 text-white'
                  : ''
              }
              ${
                toast.type === 'error'
                  ? 'bg-red-700/90 border-red-400 text-white'
                  : ''
              }
              ${
                toast.type === 'info'
                  ? 'bg-blue-700/90 border-blue-400 text-white'
                  : ''
              }
              animate-fade-in-up pointer-events-auto
            `}
            style={{ minWidth: 280, maxWidth: 400 }}
            role="alert"
            aria-live="polite"
          >
            <div className="font-semibold mb-1">{toast.title}</div>
            <div className="text-sm mb-2">{toast.message}</div>
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors duration-200 border border-white/30"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s cubic-bezier(.4,0,.2,1) both;
        }
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(147, 51, 234, 0.3), 0 0 40px rgba(6, 182, 212, 0.2);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 25px rgba(147, 51, 234, 0.5), 0 0 50px rgba(6, 182, 212, 0.3);
            transform: scale(1.02);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-bounce-in {
          animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(20px);
          }
          50% {
            opacity: 1;
            transform: scale(1.1) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0px);
          }
        }

        .camera-shutter {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }

        .shutter-blade {
          position: absolute;
          background: #1a1a1a;
          border: 2px solid #333;
          transform-origin: center;
          opacity: 0.95;
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
        }

        /* Individual blade positioning and animations */
        .blade-1 {
          width: 60vw;
          height: 60vh;
          top: 50%;
          left: 50%;
          clip-path: polygon(50% 50%, 100% 0%, 100% 25%);
          transform: translate(-50%, -50%) rotate(0deg);
          animation: shutterBlade1 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .blade-2 {
          width: 60vw;
          height: 60vh;
          top: 50%;
          left: 50%;
          clip-path: polygon(50% 50%, 100% 25%, 100% 50%);
          transform: translate(-50%, -50%) rotate(0deg);
          animation: shutterBlade2 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .blade-3 {
          width: 60vw;
          height: 60vh;
          top: 50%;
          left: 50%;
          clip-path: polygon(50% 50%, 100% 50%, 100% 75%);
          transform: translate(-50%, -50%) rotate(0deg);
          animation: shutterBlade3 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .blade-4 {
          width: 60vw;
          height: 60vh;
          top: 50%;
          left: 50%;
          clip-path: polygon(50% 50%, 100% 75%, 100% 100%);
          transform: translate(-50%, -50%) rotate(0deg);
          animation: shutterBlade4 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .blade-5 {
          width: 60vw;
          height: 60vh;
          top: 50%;
          left: 50%;
          clip-path: polygon(50% 50%, 75% 100%, 50% 100%);
          transform: translate(-50%, -50%) rotate(0deg);
          animation: shutterBlade5 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .blade-6 {
          width: 60vw;
          height: 60vh;
          top: 50%;
          left: 50%;
          clip-path: polygon(50% 50%, 25% 100%, 0% 100%);
          transform: translate(-50%, -50%) rotate(0deg);
          animation: shutterBlade6 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .blade-7 {
          width: 60vw;
          height: 60vh;
          top: 50%;
          left: 50%;
          clip-path: polygon(50% 50%, 0% 75%, 0% 25%);
          transform: translate(-50%, -50%) rotate(0deg);
          animation: shutterBlade7 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .blade-8 {
          width: 60vw;
          height: 60vh;
          top: 50%;
          left: 50%;
          clip-path: polygon(50% 50%, 0% 25%, 0% 0%, 25% 0%);
          transform: translate(-50%, -50%) rotate(0deg);
          animation: shutterBlade8 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        /* Blade animations - each closes and opens at slightly different times */
        @keyframes shutterBlade1 {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(0); }
          30% { transform: translate(-50%, -50%) rotate(5deg) scale(1.2); }
          70% { transform: translate(-50%, -50%) rotate(-2deg) scale(1.2); }
          100% { transform: translate(-50%, -50%) rotate(0deg) scale(0); }
        }

        @keyframes shutterBlade2 {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(0); }
          35% { transform: translate(-50%, -50%) rotate(-3deg) scale(1.2); }
          65% { transform: translate(-50%, -50%) rotate(4deg) scale(1.2); }
          100% { transform: translate(-50%, -50%) rotate(0deg) scale(0); }
        }

        @keyframes shutterBlade3 {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(0); }
          40% { transform: translate(-50%, -50%) rotate(2deg) scale(1.2); }
          60% { transform: translate(-50%, -50%) rotate(-5deg) scale(1.2); }
          100% { transform: translate(-50%, -50%) rotate(0deg) scale(0); }
        }

        @keyframes shutterBlade4 {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(0); }
          45% { transform: translate(-50%, -50%) rotate(-4deg) scale(1.2); }
          55% { transform: translate(-50%, -50%) rotate(3deg) scale(1.2); }
          100% { transform: translate(-50%, -50%) rotate(0deg) scale(0); }
        }

        @keyframes shutterBlade5 {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(0); }
          50% { transform: translate(-50%, -50%) rotate(1deg) scale(1.2); }
          50% { transform: translate(-50%, -50%) rotate(-1deg) scale(1.2); }
          100% { transform: translate(-50%, -50%) rotate(0deg) scale(0); }
        }

        @keyframes shutterBlade6 {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(0); }
          45% { transform: translate(-50%, -50%) rotate(4deg) scale(1.2); }
          55% { transform: translate(-50%, -50%) rotate(-2deg) scale(1.2); }
          100% { transform: translate(-50%, -50%) rotate(0deg) scale(0); }
        }

        @keyframes shutterBlade7 {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(0); }
          40% { transform: translate(-50%, -50%) rotate(-1deg) scale(1.2); }
          60% { transform: translate(-50%, -50%) rotate(5deg) scale(1.2); }
          100% { transform: translate(-50%, -50%) rotate(0deg) scale(0); }
        }

        @keyframes shutterBlade8 {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(0); }
          35% { transform: translate(-50%, -50%) rotate(3deg) scale(1.2); }
          65% { transform: translate(-50%, -50%) rotate(-4deg) scale(1.2); }
          100% { transform: translate(-50%, -50%) rotate(0deg) scale(0); }
        }
      `}</style>

      <div className="h-screen w-screen bg-slate-900 flex flex-col overflow-hidden">
        {/* Full-screen Shader Background */}
        <ShaderBackground />

        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Panel: Creature Display */}
          <div className={`relative overflow-hidden backdrop-blur-md transition-all duration-500 ${
            currentStepData?.code !== undefined ? 'w-1/2' : 'w-1/2'
          }`}>
            <div className="absolute top-0 flex justify-between w-full z-20 ">
              <div className="p-5">
                <Link href="/" className="flex items-center space-x-2">
                  <img
                    src="/logo.png"
                    alt="Monsters ink!"
                    className="h-[120px]"
                  />
                </Link>
              </div>

              <div className="p-5 flex items-center space-x-3">
                {/* Wallet connection temporarily disabled - was causing loading issues */}
                {/* <ReactiveDotProvider config={config}>
                  <WalletConnection />
                </ReactiveDotProvider> */}
                
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
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                ref={creatureDisplayRef}
                className={`relative transition-all duration-300 ease-out w-full h-full p-8 ${
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
        {/* Chapter Completion Modal */}
        {showChapterComplete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl p-10 flex flex-col items-center max-w-md border border-purple-500/30">
              <div className="text-6xl mb-6 animate-bounce">🎉</div>
              <h2 className="text-3xl font-bold text-white mb-3 text-center">
                Chapter Complete!
              </h2>
              <p className="text-xl text-purple-300 mb-6 text-center font-semibold">
                {completedChapterTitle}
              </p>
              <div className="bg-purple-600/20 border border-purple-500/50 rounded-lg p-4 mb-6 text-center">
                <p className="text-slate-200">
                  Your progress has been saved! ✨
                </p>
              </div>
              <button
                onClick={moveToNextChapter}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-lg text-white font-semibold shadow-lg transition-all duration-200 hover:scale-105"
              >
                Continue to Next Chapter →
              </button>
            </div>
          </div>
        )}

        {/* Lesson Completion Modal */}
        {showCompletionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-slate-900 rounded-lg shadow-2xl p-8 flex flex-col items-center max-w-[90vw] max-h-[90vh] relative">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl font-bold focus:outline-none"
                aria-label="Close"
              >
                ×
              </button>
              <video
                src="/creatures/video.mp4"
                autoPlay
                loop
                controls
                className="w-[min(480px,70vw)] h-[min(270px,40vw)] mx-auto rounded-lg shadow-lg mb-6 bg-black"
                style={{ objectFit: 'contain' }}
              />
              <h2 className="text-3xl font-bold text-white mb-2 text-center">
                Congratulations!
              </h2>
              <p className="text-lg text-slate-200 text-center mb-6">
                You just wrote your first ever contract.
                <br />
                Welcome to the world of ink! smart contracts!
              </p>
              
              {/* Wallet Connection & NFT Minting Section - Only in completion modal */}
              <div className="mb-6">
                <div className="mb-4 flex justify-center">
                  <ConnectButton />
                </div>
                <MintCreatureNFT
                  lessonId={lesson.id}
                />
              </div>
              
              <div className="flex space-x-4">
                <a
                  href="https://use.ink/docs/v6/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-lg text-white font-semibold shadow-md transition-all duration-200 flex items-center space-x-2"
                >
                  <span>📚</span>
                  <span>View ink! Docs</span>
                </a>
                <Link
                  href="/playground"
                  className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-lg text-white font-semibold shadow-md transition-all duration-200 flex items-center space-x-2"
                >
                  <span>🚀</span>
                  <span>What&apos;s Next</span>
                </Link>
              </div>
            </div>
          </div>
        )}

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

        {/* NFT Minting Modal (triggered by step completion) */}
        {showNFTMinting && lesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl p-10 flex flex-col items-center max-w-md border border-purple-500/30 relative">
              <div className="text-6xl mb-6 animate-bounce">🎨</div>
              <h2 className="text-3xl font-bold text-white mb-3 text-center">
                Mint Your Creature NFT!
              </h2>
              <p className="text-lg text-purple-300 mb-6 text-center">
                You've completed a major milestone! Mint your creature NFT as proof of your progress.
              </p>

              {/* Wallet Connection & NFT Minting */}
              <div className="w-full mb-6">
                <div className="mb-4 flex justify-center">
                  <ConnectButton />
                </div>
                <MintCreatureNFT
                  lessonId={lesson.id}
                />
              </div>

              <button
                onClick={() => setShowNFTMinting(false)}
                className="px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 rounded-lg text-white font-semibold shadow-md transition-all duration-200"
              >
                Continue Without Minting →
              </button>
            </div>
          </div>
        )}

        {/* Confetti */}
        {(showCompletionModal || showChapterComplete) && (
          <Confetti
            width={windowDimensions.width}
            height={windowDimensions.height}
            recycle={false}
            numberOfPieces={showChapterComplete ? 150 : 200}
            gravity={0.1}
            colors={[
              '#9333ea',
              '#06b6d4',
              '#ec4899',
              '#10b981',
              '#f59e0b',
              '#ef4444',
            ]}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 60 }}
          />
        )}
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
