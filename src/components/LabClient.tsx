'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Lesson, LessonChapter } from '@/lib/lesson-types';
import { useSession } from '@/lib/auth-client';
import { useAccounts } from '@reactive-dot/react';
import type { LabDataResponse, UserMonster, UserProgress } from '@/app/api/user/lab-data/route';
import { NarrativeLoadingScreen } from '@/components/NarrativeLoadingScreen';
import { MonsterGallery } from '@/components/gallery';

// Lazy load 3D viewer for performance (~500KB Three.js)
const MonsterViewer = dynamic(() => import('./MonsterViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-mi-mint border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Floating particles for atmosphere (matching landing page)
function FloatingParticles() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => {
        const size = 2 + Math.random() * 3;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              background: `rgba(79, 255, 176, ${0.15 + Math.random() * 0.2})`,
              boxShadow: `0 0 ${size * 2}px rgba(79, 255, 176, 0.2)`,
              left: `${Math.random() * 100}%`,
            }}
            initial={{ top: '100%', opacity: 0 }}
            animate={{
              top: '-5%',
              opacity: [0, 0.8, 0.8, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 8,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
}

// Helper to format wallet address
function formatAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function LabClient({ chapters }: { chapters: Lesson[] }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);

  // User data state
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [userMonster, setUserMonster] = useState<UserMonster | null>(null);
  const [continueUrl, setContinueUrl] = useState<string>('/lesson/1/1/1');
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const fetchedForUser = useRef<string | null>(null);

  // Auth, wallet, and navigation hooks
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  const accounts = useAccounts();
  const connectedWallet = accounts?.[0];


  // Fetch user lab data when session is available
  useEffect(() => {
    if (isSessionLoading) return;

    const userId = session?.user?.id || 'none';

    // Skip if already fetched for this user
    if (fetchedForUser.current === userId) return;
    fetchedForUser.current = userId;

    if (!session?.user) {
      setUserProgress(null);
      setUserMonster(null);
      setContinueUrl('/lesson/1/1/1');
      setIsLoadingUserData(false);
      return;
    }

    (async () => {
      try {
        const response = await fetch('/api/user/lab-data');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const pos = data.currentPosition;
            setUserProgress(pos);
            setUserMonster(data.monster);
            setContinueUrl(pos
              ? `/lesson/${pos.lessonId}/${pos.chapterId}/${pos.stepId}`
              : '/lesson/1/1/1'
            );
          }
        }
      } catch (error) {
        console.error('Failed to fetch lab data:', error);
      } finally {
        setIsLoadingUserData(false);
      }
    })();
  }, [session?.user?.id, isSessionLoading]);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    setTimeout(() => setShowContent(true), 300);
  };

  // Auto-expand current lesson when progress loads (or lesson 1 for new users)
  useEffect(() => {
    if (!isLoadingUserData) {
      setExpandedLesson(userProgress?.lessonId || 1);
    }
  }, [userProgress?.lessonId, isLoadingUserData]);

  // Find the next lesson to continue (based on user progress or first incomplete)
  const nextLesson = userProgress
    ? chapters.find((ch) => ch.id === userProgress.lessonId) || chapters[0]
    : chapters.find((ch) => !ch.completed) || chapters[0];

  // Check if user has a monster to display
  const hasUserMonster = userMonster && (userMonster.imageUrl || userMonster.modelUrl);

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {isLoading && <NarrativeLoadingScreen onComplete={handleLoadingComplete} />}
      </AnimatePresence>
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative min-h-screen"
            style={{
              background:
                'linear-gradient(180deg, #240B4D 0%, #1a0a3a 50%, #0f0520 100%)',
            }}
          >
            <FloatingParticles />

            {/* Community Monster Gallery - Background layer */}
            <MonsterGallery />

            <div className="relative z-10">
              <div className="max-w-5xl mx-auto px-6 py-16">
                {/* Header with Logo and Wallet */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-12"
                >
                  {/* Wallet Connection Display - Top Right */}
                  {connectedWallet && (
                    <div className="flex justify-end mb-4">
                      <div
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{
                          background: 'rgba(79, 255, 176, 0.1)',
                          border: '1px solid rgba(79, 255, 176, 0.3)',
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: 'var(--mi-mint)' }}
                        />
                        <span className="text-xs text-[var(--mi-mint)] font-mono">
                          {connectedWallet.name || formatAddress(connectedWallet.address)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <Link href="/">
                      <Image
                        src="/logo.png"
                        alt="Monsters Ink!"
                        width={280}
                        height={140}
                        className="object-contain mx-auto mb-6 hover:scale-105 transition-transform cursor-pointer"
                      />
                    </Link>
                    <p className="text-[var(--mi-mint)] font-pixel text-xs tracking-wider">
                      Your journey so far
                    </p>
                  </div>
                </motion.div>

                {/* Creature Preview - User's NFT or Default with Color Picker */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mb-12"
                >
                  <div className="max-w-3xl mx-auto">
                    {hasUserMonster ? (
                      /* User has a monster - Display their NFT */
                      <div className="flex flex-col items-center">
                        <div className="relative flex items-center justify-center mb-6">
                          <div
                            className="absolute rounded-full"
                            style={{
                              width: 350,
                              height: 350,
                              background:
                                'radial-gradient(circle, rgba(79, 255, 176, 0.2) 0%, transparent 70%)',
                            }}
                          />
                          
                          {userMonster.modelUrl ? (
                            /* 3D Model Display */
                            <div
                              className="relative z-10"
                              style={{
                                width: 364,
                                height: 364,
                                filter: 'drop-shadow(0 0 30px rgba(79, 255, 176, 0.4))',
                              }}
                            >
                              <MonsterViewer
                                modelUrl={userMonster.modelUrl}
                                className="w-full h-full"
                                height=""
                                autoRotate={true}
                                showControls={false}
                                minimal={true}
                                enableZoom={false}
                              />
                            </div>
                          ) : (
                            /* 2D Image Fallback */
                            <div className="relative z-10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={userMonster.imageUrl!}
                                alt="Your Monster"
                                width={280}
                                height={280}
                                className="object-contain rounded-lg"
                                style={{
                                  filter: 'drop-shadow(0 0 30px rgba(79, 255, 176, 0.4))',
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* NFT Metadata Card */}
                        {userMonster.nftItemId !== null ? (
                          <div
                            className="w-full max-w-sm rounded-xl p-4 mt-2"
                            style={{
                              background: 'rgba(46, 204, 113, 0.08)',
                              border: '1px solid rgba(46, 204, 113, 0.25)',
                            }}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center text-xs"
                                style={{ background: 'rgba(46, 204, 113, 0.2)' }}
                              >
                                ✓
                              </div>
                              <span className="text-sm font-pixel text-[var(--color-mi-grass)] tracking-wider">
                                MINTED ON-CHAIN
                              </span>
                            </div>

                            <div className="space-y-2 text-xs">
                              {/* NFT ID & Collection */}
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500">Token ID</span>
                                <span className="text-white font-mono">
                                  #{userMonster.nftItemId}
                                  {userMonster.nftCollectionId && (
                                    <span className="text-slate-500 ml-1">
                                      (Collection {userMonster.nftCollectionId})
                                    </span>
                                  )}
                                </span>
                              </div>

                              {/* Owner */}
                              {userMonster.nftOwnerAddress && (
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500">Owner</span>
                                  <span className="text-[var(--mi-mint)] font-mono">
                                    {formatAddress(userMonster.nftOwnerAddress)}
                                  </span>
                                </div>
                              )}

                              {/* Stage */}
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500">Evolution</span>
                                <span className="text-white capitalize">
                                  {userMonster.stage === 'young' ? '🐣 Young' :
                                   userMonster.stage === 'adult' ? '🦖 Adult' :
                                   '🥚 Egg'}
                                </span>
                              </div>

                              {/* Minted Date */}
                              {userMonster.nftMintedAt && (
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500">Minted</span>
                                  <span className="text-slate-300">
                                    {new Date(userMonster.nftMintedAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* View Full Experience Button */}
                            <button
                              onClick={() => router.push('/my-monster')}
                              className="w-full mt-3 py-2.5 rounded-lg font-pixel text-[10px] uppercase tracking-wider transition-all hover:scale-[1.02]"
                              style={{
                                background: 'rgba(79, 255, 176, 0.15)',
                                border: '1px solid rgba(79, 255, 176, 0.3)',
                                color: 'var(--mi-mint)',
                              }}
                            >
                              View Full Experience
                            </button>
                          </div>
                        ) : (
                          /* Not yet minted badge */
                          <div
                            className="flex items-center gap-2 px-4 py-2 rounded-full"
                            style={{
                              background: 'rgba(255, 159, 28, 0.15)',
                              border: '1px solid rgba(255, 159, 28, 0.4)',
                            }}
                          >
                            <span className="text-xs text-[var(--mi-orange)]">
                              🎨 Generated · Not yet minted
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* No user monster - Show mystery placeholder */
                      <div className="flex flex-col items-center">
                        {/* Question Mark Placeholder */}
                        <div className="relative flex items-center justify-center mb-8">
                          <div
                            className="absolute rounded-full"
                            style={{
                              width: 300,
                              height: 300,
                              background:
                                'radial-gradient(circle, rgba(79, 255, 176, 0.1) 0%, transparent 70%)',
                            }}
                          />
                          <motion.div
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className="relative z-10 w-48 h-48 flex items-center justify-center"
                          >
                            <span
                              className="text-[180px] font-bold leading-none select-none"
                              style={{
                                color: '#0a0a0a',
                                textShadow: '0 0 40px rgba(79, 255, 176, 0.3), 0 0 80px rgba(79, 255, 176, 0.1)',
                              }}
                            >
                              ?
                            </span>
                          </motion.div>
                        </div>

                        {/* Call to action text */}
                        <p
                          className="text-center font-pixel text-sm tracking-wider max-w-xs"
                          style={{ color: 'var(--mi-mint)' }}
                        >
                          Continue your education to awaken your creature
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Lessons Grid - Expandable with Chapter/Step Progress */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="space-y-3"
                >
                  <h3 className="text-sm font-pixel text-slate-400 mb-6 tracking-wider text-center">
                    Lessons
                  </h3>

                  {chapters.map((lesson, index) => {
                    const isLocked =
                      lesson.id > 1 && !chapters[index - 1]?.completed;
                    const isCompleted = lesson.completed;
                    const isCurrent = lesson.id === nextLesson?.id;
                    const isExpanded = expandedLesson === lesson.id;
                    const lessonChapters = lesson.chapters || [];

                    // Calculate progress for this lesson
                    const totalSteps = lessonChapters.reduce(
                      (sum, ch) => sum + (ch.steps?.length || 0),
                      0
                    );
                    const currentChapterIndex = userProgress?.lessonId === lesson.id
                      ? (userProgress.chapterId - 1)
                      : (isCompleted ? lessonChapters.length : 0);
                    const currentStepIndex = userProgress?.lessonId === lesson.id
                      ? (userProgress.stepId - 1)
                      : 0;

                    // Count completed steps
                    let completedSteps = 0;
                    if (isCompleted) {
                      completedSteps = totalSteps;
                    } else if (userProgress?.lessonId === lesson.id) {
                      for (let i = 0; i < currentChapterIndex; i++) {
                        completedSteps += lessonChapters[i]?.steps?.length || 0;
                      }
                      completedSteps += currentStepIndex;
                    }

                    const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

                    return (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 * index }}
                      >
                        {isLocked ? (
                          <div
                            className="flex items-center gap-4 p-4 rounded-xl opacity-40"
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                            }}
                          >
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                              🔒
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-500">
                                Lesson {lesson.id}
                              </p>
                              <p className="text-slate-400">{lesson.title}</p>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`rounded-xl overflow-hidden transition-all duration-300 ${
                              isCurrent ? 'ring-2 ring-[var(--mi-mint)]/50' : ''
                            }`}
                            style={{
                              background: isCompleted
                                ? 'rgba(46, 204, 113, 0.1)'
                                : 'rgba(255, 255, 255, 0.05)',
                              border: isCompleted
                                ? '1px solid rgba(46, 204, 113, 0.3)'
                                : '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            {/* Lesson Header - Click to expand */}
                            <button
                              onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                              className="w-full text-left p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
                            >
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                                style={{
                                  background: isCompleted
                                    ? 'rgba(46, 204, 113, 0.2)'
                                    : 'rgba(79, 255, 176, 0.1)',
                                }}
                              >
                                {isCompleted ? '✓' : lesson.id}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-500 mb-1">
                                  Lesson {lesson.id} · {lesson.duration} · {lessonChapters.length} chapters
                                </p>
                                <p className="text-white font-medium truncate">
                                  {lesson.title}
                                </p>
                                {/* Progress bar */}
                                {!isCompleted && progressPercent > 0 && (
                                  <div className="mt-2 h-1 rounded-full bg-slate-700/50 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-[var(--mi-mint)]"
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isCompleted && (
                                  <span className="text-xs text-[var(--color-mi-grass)]">
                                    Completed
                                  </span>
                                )}
                                <motion.span
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="text-slate-400"
                                >
                                  ▼
                                </motion.span>
                              </div>
                            </button>

                            {/* Expanded Content - Chapter/Step List */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 space-y-2">
                                    {lessonChapters.map((chapter, chapterIdx) => {
                                      const isChapterCompleted = isCompleted ||
                                        (userProgress?.lessonId === lesson.id && chapterIdx < currentChapterIndex);
                                      const isCurrentChapter = userProgress?.lessonId === lesson.id &&
                                        chapterIdx === currentChapterIndex;
                                      const chapterSteps = chapter.steps || [];

                                      return (
                                        <div
                                          key={chapter.id}
                                          className="rounded-lg overflow-hidden"
                                          style={{
                                            background: 'rgba(0, 0, 0, 0.2)',
                                          }}
                                        >
                                          {/* Chapter Header */}
                                          <div className="px-3 py-2 flex items-center gap-2">
                                            <span
                                              className={`w-5 h-5 rounded text-xs flex items-center justify-center ${
                                                isChapterCompleted
                                                  ? 'bg-[var(--color-mi-grass)]/20 text-[var(--color-mi-grass)]'
                                                  : isCurrentChapter
                                                  ? 'bg-[var(--mi-mint)]/20 text-[var(--mi-mint)]'
                                                  : 'bg-slate-700/50 text-slate-500'
                                              }`}
                                            >
                                              {isChapterCompleted ? '✓' : chapter.id}
                                            </span>
                                            <span
                                              className={`text-sm font-medium ${
                                                isChapterCompleted
                                                  ? 'text-[var(--color-mi-grass)]'
                                                  : isCurrentChapter
                                                  ? 'text-white'
                                                  : 'text-slate-400'
                                              }`}
                                            >
                                              {chapter.title}
                                            </span>
                                          </div>

                                          {/* Steps List */}
                                          <div className="px-3 pb-2 space-y-1">
                                            {chapterSteps.map((step, stepIdx) => {
                                              const isStepCompleted = isChapterCompleted ||
                                                (isCurrentChapter && stepIdx < currentStepIndex);
                                              const isCurrentStep = isCurrentChapter && stepIdx === currentStepIndex;
                                              const stepUrl = `/lesson/${lesson.id}/${chapter.id}/${step.id}`;

                                              return (
                                                <button
                                                  key={step.id}
                                                  onClick={() => router.push(stepUrl)}
                                                  className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 transition-colors ${
                                                    isCurrentStep
                                                      ? 'bg-[var(--mi-cobalt)]/30 hover:bg-[var(--mi-cobalt)]/40'
                                                      : 'hover:bg-white/5'
                                                  }`}
                                                >
                                                  <span
                                                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center flex-shrink-0 ${
                                                      isStepCompleted
                                                        ? 'bg-[var(--color-mi-grass)]/30 text-[var(--color-mi-grass)]'
                                                        : isCurrentStep
                                                        ? 'bg-[var(--mi-cobalt)] text-white'
                                                        : 'bg-slate-700/50 text-slate-500'
                                                    }`}
                                                  >
                                                    {isStepCompleted ? '✓' : stepIdx + 1}
                                                  </span>
                                                  <span
                                                    className={`text-xs truncate ${
                                                      isStepCompleted
                                                        ? 'text-slate-400'
                                                        : isCurrentStep
                                                        ? 'text-white font-medium'
                                                        : 'text-slate-500'
                                                    }`}
                                                  >
                                                    {step.title}
                                                  </span>
                                                  {isCurrentStep && (
                                                    <span className="ml-auto text-[10px] text-[var(--mi-mint)] font-pixel">
                                                      YOU ARE HERE
                                                    </span>
                                                  )}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* Continue CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-center mt-12"
                >
                  <button
                    onClick={() => router.push(continueUrl)}
                    disabled={isLoadingUserData}
                    className="inline-block px-8 py-4 rounded-xl font-pixel text-sm tracking-wider transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'var(--mi-cobalt)',
                      color: 'white',
                      boxShadow: '0 0 30px rgba(30, 76, 221, 0.3)',
                    }}
                  >
                    {isLoadingUserData
                      ? 'Loading...'
                      : userProgress
                        ? 'Continue learning'
                        : 'Start learning'}
                  </button>
                </motion.div>

                {/* Footer */}
                <motion.footer
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-center mt-16"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className="text-xs text-slate-500 font-unbounded"
                      style={{ fontFamily: 'var(--font-unbounded)' }}
                    >
                      Funded by
                    </span>
                    <Image
                      src="/Polkadot_Logo_Pink-White.png"
                      alt="Polkadot"
                      width={66}
                      height={22}
                      className="object-contain -translate-y-0.5"
                    />
                  </div>
                </motion.footer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
