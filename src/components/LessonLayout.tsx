'use client';

/**
 * LessonLayout - Main orchestrator for lesson display
 *
 * This component orchestrates the modular lesson components:
 * - LessonProvider: Centralized state management
 * - LessonCreaturePanel: Left panel with creature display
 * - LessonInstructionsPanel: Instructions and hints
 * - LessonCodeEditorPanel: Code editor section
 * - LessonNavigation: Navigation controls
 *
 * All business logic is in LessonContext. This component focuses on layout and composition.
 */

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Lesson } from '@/lib/lessons';
import GitHubAuthModal from '@/components/GitHubAuthModal';
import { WalletRequiredOverlay } from '@/components/WalletRequiredOverlay';
import { CompletionModals } from '@/components/lesson/CompletionModals';
import '@/styles/lesson-content.css';
import '@/styles/lesson-animations.css';

// Modular lesson components
import { LessonProvider, useLessonContext } from '@/components/lesson/LessonContext';
import { LessonCreaturePanel } from '@/components/lesson/LessonCreaturePanel';
import { LessonInstructionsPanel } from '@/components/lesson/LessonInstructionsPanel';
import { LessonCodeEditorPanel } from '@/components/lesson/LessonCodeEditorPanel';
import { LessonNavigation } from '@/components/lesson/LessonNavigation';

// ============================================================================
// PERFORMANCE: Dynamic imports for heavy components
// Reduces initial bundle by ~1.5MB, improves TTI by 3-5 seconds
// ============================================================================

// ShaderBackground - CSS gradient version for better performance
const ShaderBackground = dynamic(
  () => import('@/components/ShaderBackground'),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-[#1a0a2e] to-slate-950" />
  }
);

// Wallet Providers (~300KB Polkadot API) - Lazy loaded
const WalletProviders = dynamic(
  () => import('@/components/WalletProviders').then(mod => ({ default: mod.WalletProviders })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-[#1a0a2e] to-slate-950" />
      </div>
    )
  }
);

// ============================================================================
// Types
// ============================================================================

interface LessonLayoutProps {
  lesson?: Lesson;
  authRequired?: boolean;
  authError?: string;
  initialChapter?: number; // 1-based from URL
  initialStep?: number;    // 1-based from URL
}

// ============================================================================
// Inner Layout Component (uses context)
// ============================================================================

function LessonLayoutInner() {
  const {
    lesson,
    showAuthModal,
    setShowAuthModal,
    showCompletionModal,
    setShowCompletionModal,
    showChapterComplete,
    completedChapterTitle,
    moveToNextChapter,
    chapterRequiresAuth,
    session,
    asset,
    handleWalletConnected,
    addToast,
    windowDimensions,
  } = useLessonContext();

  // Onboarding state: right panel hidden until user clicks left panel
  const [showRightPanel, setShowRightPanel] = useState(false);

  const handleLeftPanelClick = useCallback(() => {
    if (!showRightPanel) {
      setShowRightPanel(true);
    }
  }, [showRightPanel]);

  // Empty lesson state
  if (!lesson) {
    return <EmptyLessonView />;
  }

  return (
    <>
      <div className="h-screen w-screen bg-slate-900 flex flex-col overflow-hidden">
        {/* Full-screen Shader Background */}
        <ShaderBackground />

        <div className="flex-1 overflow-hidden relative">
          {/* Left Panel: Creature Display */}
          <div
            className={`absolute top-0 bottom-0 left-0 transition-all duration-700 ease-out ${
              showRightPanel ? 'w-1/2' : 'w-full'
            }`}
            onClick={handleLeftPanelClick}
            style={{ cursor: showRightPanel ? 'default' : 'pointer' }}
          >
            <LessonCreaturePanel showLogo={showRightPanel} />
          </div>

          {/* Right Panel: Instructions + Code Editor + Navigation */}
          {/* Rendered at final size off-screen, then slides in */}
          <div
            className={`absolute top-0 bottom-0 right-0 w-1/2 flex flex-col py-10 px-[50px] min-h-0 transition-transform duration-700 ease-out ${
              showRightPanel ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <LessonInstructionsPanel />
            <LessonCodeEditorPanel />
            <LessonNavigation />
          </div>
        </div>

        {/* Completion Modals (Chapter, Lesson) + Confetti */}
        <CompletionModals
          chapterComplete={{
            isOpen: showChapterComplete,
            title: completedChapterTitle,
            onContinue: moveToNextChapter,
            requiresAuth: chapterRequiresAuth,
            isAuthenticated: !!session?.user,
          }}
          lessonComplete={{
            isOpen: showCompletionModal,
            onClose: () => setShowCompletionModal(false),
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

        {/* Wallet Connection Modal - shown when NFT minting requires wallet */}
        <WalletRequiredOverlay
          isOpen={asset.walletRequired}
          onWalletConnected={handleWalletConnected}
          onClose={() => asset.clearWalletRequired()}
        />
      </div>
    </>
  );
}

// ============================================================================
// Empty Lesson View
// ============================================================================

function EmptyLessonView() {
  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
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

// ============================================================================
// Main Export - Wraps everything with providers
// ============================================================================

export default function LessonLayout({ lesson, initialChapter, initialStep }: LessonLayoutProps) {
  return (
    // WalletProviders is lazy-loaded (~300KB Polkadot API)
    // HydrationGuard provides CSS fade-in (single render, not double)
    <WalletProviders>
      <HydrationGuard>
        <Suspense fallback={<LessonLayoutLoading />}>
          <LessonProvider
            lesson={lesson}
            initialChapter={initialChapter}
            initialStep={initialStep}
          >
            <LessonLayoutInner />
          </LessonProvider>
        </Suspense>
      </HydrationGuard>
    </WalletProviders>
  );
}

// ============================================================================
// Loading State
// ============================================================================

function LessonLayoutLoading() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Silent loading - just the background for seamless transition */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-[#1a0a2e] to-slate-950" />
    </div>
  );
}

// ============================================================================
// PERFORMANCE: Optimized HydrationGuard with CSS-based fade-in
// - Single render of children (not double render)
// - Smooth fade-in transition
// - Content is in DOM immediately (better for SEO)
// - Hooks only initialize once
// ============================================================================

function HydrationGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay for smoother transition
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <div
      className={`transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      style={{ pointerEvents: mounted ? 'auto' : 'none' }}
    >
      {children}
    </div>
  );
}
