'use client';

/**
 * CompletionModals - Modal components for lesson completion flows
 *
 * Extracted from LessonLayout.tsx to improve modularity.
 * Includes: Chapter Complete, Lesson Complete modals, and Confetti.
 *
 * Note: GitHubAuthModal is already a separate component and not included here.
 */

import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { signIn, useSession } from '@/lib/auth-client';
import { Github, Loader2, Shield, Zap, BookOpen } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ChapterCompleteModalProps {
  isOpen: boolean;
  chapterTitle: string;
  onContinue: () => void;
  /** Whether authentication is required to continue (Chapter 1 of Lesson 1) */
  requiresAuth?: boolean;
  /** Whether user is currently authenticated */
  isAuthenticated?: boolean;
}

interface LessonCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CompletionConfettiProps {
  isActive: boolean;
  windowWidth: number;
  windowHeight: number;
  /** Use fewer pieces for chapter completion vs lesson completion */
  isChapterComplete?: boolean;
}

interface CompletionModalsProps {
  /** Chapter completion modal state */
  chapterComplete: {
    isOpen: boolean;
    title: string;
    onContinue: () => void;
    /** Whether authentication is required to continue (Chapter 1 of Lesson 1) */
    requiresAuth?: boolean;
    /** Whether user is currently authenticated */
    isAuthenticated?: boolean;
  };
  /** Lesson completion modal state */
  lessonComplete: {
    isOpen: boolean;
    onClose: () => void;
  };
  /** Window dimensions for confetti */
  windowDimensions: {
    width: number;
    height: number;
  };
}

// ============================================================================
// Chapter Complete Modal
// ============================================================================

function ChapterCompleteModal({
  isOpen,
  chapterTitle,
  onContinue,
  requiresAuth = false,
  isAuthenticated = true,
}: ChapterCompleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  // Auto-continue when user authenticates (session becomes available)
  useEffect(() => {
    if (requiresAuth && session?.user && isOpen) {
      // User just authenticated, auto-continue to next chapter
      onContinue();
    }
  }, [session?.user, requiresAuth, isOpen, onContinue]);

  if (!isOpen) return null;

  // Determine if we should show auth prompt
  const showAuthPrompt = requiresAuth && !isAuthenticated && !session?.user;

  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    try {
      // Store pending chapter completion in localStorage before OAuth redirect
      // This allows us to auto-continue after the page reloads post-auth
      localStorage.setItem('pendingChapterComplete', 'true');

      await signIn.social({
        provider: 'github',
        callbackURL: window.location.href, // Stay on current page after auth
      });
      // The signIn will redirect, so we don't need to handle success here
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      localStorage.removeItem('pendingChapterComplete');
      setIsLoading(false);
    }
  };

  // Auth-required variant for Chapter 1 unauthenticated users
  if (showAuthPrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl p-10 flex flex-col items-center max-w-md border border-purple-500/30">
          <div className="text-6xl mb-6 animate-bounce">🎉</div>
          <h2 className="text-3xl font-bold text-white mb-3 text-center">
            Chapter Complete!
          </h2>
          <p className="text-xl text-purple-300 mb-4 text-center font-semibold">
            {chapterTitle}
          </p>

          {/* Auth required message */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6 w-full">
            <p className="text-slate-200 text-center text-sm leading-relaxed">
              To <strong>save your progress</strong> and continue your journey, please sign in with GitHub.
            </p>
          </div>

          {/* Benefits */}
          <div className="w-full mb-6 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen size={16} className="text-purple-400" />
              </div>
              <p className="text-slate-300 text-sm">Save your progress across sessions</p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-cyan-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap size={16} className="text-cyan-400" />
              </div>
              <p className="text-slate-300 text-sm">Unlock AI creature generation</p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-pink-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield size={16} className="text-pink-400" />
              </div>
              <p className="text-slate-300 text-sm">Mint your unique NFT on completion</p>
            </div>
          </div>

          {/* GitHub Sign In Button */}
          <button
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Github size={20} />
                <span>Continue with GitHub</span>
              </>
            )}
          </button>

          {/* Footer */}
          <p className="mt-4 text-slate-500 text-xs text-center">
            We only access basic profile information.
          </p>
        </div>
      </div>
    );
  }

  // Standard authenticated variant
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl p-10 flex flex-col items-center max-w-md border border-purple-500/30">
        <div className="text-6xl mb-6 animate-bounce">🎉</div>
        <h2 className="text-3xl font-bold text-white mb-3 text-center">
          Chapter Complete!
        </h2>
        <p className="text-xl text-purple-300 mb-4 text-center font-semibold">
          {chapterTitle}
        </p>
        <p className="text-slate-400 text-sm mb-6">Your progress has been saved</p>
        <button
          onClick={onContinue}
          className="px-6 py-3 bg-[#4FFFB0]/20 hover:bg-[#4FFFB0]/40 border border-[#4FFFB0]/50 hover:border-[#4FFFB0] text-[#4FFFB0] hover:text-white font-pixel text-[10px] uppercase tracking-wider rounded-lg transition-all hover:shadow-lg hover:shadow-[#4FFFB0]/20"
        >
          Continue to Next Chapter
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Lesson Complete Modal
// ============================================================================

function LessonCompleteModal({
  isOpen,
  onClose,
}: LessonCompleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-slate-900 rounded-lg shadow-2xl p-8 flex flex-col items-center max-w-[90vw] max-h-[90vh] relative">
        <button
          onClick={onClose}
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
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Confetti Effect
// ============================================================================

function CompletionConfetti({
  isActive,
  windowWidth,
  windowHeight,
  isChapterComplete = false,
}: CompletionConfettiProps) {
  if (!isActive) return null;

  return (
    <Confetti
      width={windowWidth}
      height={windowHeight}
      recycle={false}
      numberOfPieces={isChapterComplete ? 150 : 200}
      gravity={0.1}
      colors={[
        '#1E4CDD', // mi-cobalt
        '#4FFFB0', // mi-mint
        '#FFDAB9', // mi-peach
        '#FF9F1C', // mi-orange
        '#2ECC71', // mi-grass
        '#240B4D', // mi-violet
      ]}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 60 }}
    />
  );
}

// ============================================================================
// Main Exported Component
// ============================================================================

/**
 * Combined completion modals component.
 *
 * Renders chapter complete, lesson complete modals,
 * and celebration confetti based on provided state.
 *
 * @example
 * ```tsx
 * <CompletionModals
 *   chapterComplete={{
 *     isOpen: showChapterComplete,
 *     title: completedChapterTitle,
 *     onContinue: moveToNextChapter,
 *   }}
 *   lessonComplete={{
 *     isOpen: showCompletionModal,
 *     onClose: () => setShowCompletionModal(false),
 *   }}
 *   windowDimensions={windowDimensions}
 * />
 * ```
 */
export function CompletionModals({
  chapterComplete,
  lessonComplete,
  windowDimensions,
}: CompletionModalsProps) {
  const showConfetti = chapterComplete.isOpen || lessonComplete.isOpen;

  return (
    <>
      <ChapterCompleteModal
        isOpen={chapterComplete.isOpen}
        chapterTitle={chapterComplete.title}
        onContinue={chapterComplete.onContinue}
        requiresAuth={chapterComplete.requiresAuth}
        isAuthenticated={chapterComplete.isAuthenticated}
      />

      <LessonCompleteModal
        isOpen={lessonComplete.isOpen}
        onClose={lessonComplete.onClose}
      />

      <CompletionConfetti
        isActive={showConfetti}
        windowWidth={windowDimensions.width}
        windowHeight={windowDimensions.height}
        isChapterComplete={chapterComplete.isOpen && !lessonComplete.isOpen}
      />
    </>
  );
}
