'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useCallback } from 'react';
import CreatureColorPicker from '@/components/CreatureColorPicker';
import { HSLValues, createHSLFilter } from '@/lib/image-filters';
import Image from 'next/image';
import { Lesson } from '@/lib/lesson-types';

function LabLoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [loadingStage, setLoadingStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // Narrative-driven loading messages that continue the creature story
  const narrativeStages = [
    'Your creature stirs...',
    'A connection forms...',
    'Neural pathways linking...',
    'Memories awakening...',
    'The bond strengthens...',
    'Ready to learn together.',
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setLoadingStage((prev) => Math.min(prev + 1, narrativeStages.length - 1));
    }, 600);
    return () => clearInterval(stageInterval);
  }, [narrativeStages.length]);

  // Floating particles component (mint colored, matching new palette)
  const FloatingParticles = () => {
    if (!isClient) return null;

    return (
      <>
        {Array.from({ length: 15 }).map((_, i) => {
          const size = 2 + Math.random() * 4;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                background: `rgba(79, 255, 176, ${0.2 + Math.random() * 0.3})`,
                boxShadow: `0 0 ${size * 2}px rgba(79, 255, 176, 0.3)`,
                left: `${Math.random() * 100}%`,
              }}
              initial={{ top: '100%', opacity: 0 }}
              animate={{
                top: '-10%',
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 8 + Math.random() * 6,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: 'linear',
              }}
            />
          );
        })}
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #240B4D 0%, #1a0a3a 50%, #0f0520 100%)',
      }}
    >
      {/* Subtle vertical lines - deep violet theme */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px h-full"
            style={{
              left: `${(i + 1) * 6.25}%`,
              background:
                'linear-gradient(to bottom, transparent, rgba(79, 255, 176, 0.3), transparent)',
            }}
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>

      {/* Floating particles */}
      <FloatingParticles />

      <div className="relative z-10 text-center px-6">
        {/* Creature silhouette with pulsing glow */}
        <motion.div
          className="mb-10 mx-auto relative"
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Glow backdrop */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              width: 200,
              height: 200,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background:
                'radial-gradient(circle, rgba(79, 255, 176, 0.2) 0%, rgba(79, 255, 176, 0.05) 50%, transparent 70%)',
            }}
          />
          <Image
            src="/creatures/first_awake.png"
            alt="Your creature"
            width={140}
            height={140}
            className="object-contain relative z-10"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(79, 255, 176, 0.4))',
              opacity: 0.3 + (progress / 100) * 0.7, // Creature becomes more visible as loading progresses
            }}
          />
        </motion.div>

        {/* Narrative message */}
        <motion.div
          key={loadingStage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-8 h-8"
        >
          <p
            className="text-lg font-pixel tracking-wider"
            style={{ color: '#4FFFB0' }}
          >
            {narrativeStages[loadingStage]}
          </p>
        </motion.div>

        {/* Bond strength indicator (progress bar) */}
        <div className="w-64 mx-auto mb-6">
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(79, 255, 176, 0.1)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #4FFFB0, #2ECC71)',
                boxShadow: '0 0 10px rgba(79, 255, 176, 0.5)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Subtle percentage - smaller, less prominent */}
        <motion.p
          className="text-xs text-slate-500"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {Math.round(progress)}%
        </motion.p>
      </div>
    </motion.div>
  );
}

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

export default function LabClient({ chapters }: { chapters: Lesson[] }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [creatureColor, setCreatureColor] = useState<HSLValues>({
    hue: 0,
    saturation: 0,
    lightness: 0,
  });

  const handleLoadingComplete = () => {
    setIsLoading(false);
    setTimeout(() => setShowContent(true), 300);
  };

  const handleColorChange = useCallback((hslValues: HSLValues) => {
    setCreatureColor(hslValues);
  }, []);

  // Find the next lesson to continue (first incomplete)
  const nextLesson = chapters.find((ch) => !ch.completed) || chapters[0];

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {isLoading && <LabLoadingScreen onComplete={handleLoadingComplete} />}
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

            <div className="relative z-10">
              <div className="max-w-5xl mx-auto px-6 py-16">
                {/* Header with Logo */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-12"
                >
                  <Link href="/">
                    <Image
                      src="/logo.png"
                      alt="Monsters Ink!"
                      width={280}
                      height={140}
                      className="object-contain mx-auto mb-6 hover:scale-105 transition-transform cursor-pointer"
                    />
                  </Link>
                  <p className="text-[#4FFFB0] font-pixel text-xs tracking-wider">
                    Your journey so far
                  </p>
                </motion.div>

                {/* Creature Preview with Color Picker */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mb-12"
                >
                  <div className="max-w-3xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      {/* Creature Display */}
                      <div className="relative flex items-center justify-center">
                        <div
                          className="absolute rounded-full"
                          style={{
                            width: 300,
                            height: 300,
                            background:
                              'radial-gradient(circle, rgba(79, 255, 176, 0.15) 0%, transparent 70%)',
                          }}
                        />
                        <motion.div
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          <Image
                            src="/creatures/first_awake.png"
                            alt="Your Creature"
                            width={200}
                            height={200}
                            className="object-contain relative z-10"
                            style={{
                              filter: createHSLFilter(creatureColor, {
                                includeGlow: true,
                              }),
                            }}
                          />
                        </motion.div>
                      </div>

                      {/* Color Picker */}
                      <div>
                        <h3 className="text-sm font-pixel text-slate-400 mb-4 tracking-wider">
                          Customize colors
                        </h3>
                        <CreatureColorPicker
                          onColorChange={handleColorChange}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Lessons Grid - Simplified */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="space-y-4"
                >
                  <h3 className="text-sm font-pixel text-slate-400 mb-6 tracking-wider text-center">
                    Lessons
                  </h3>

                  {chapters.map((chapter, index) => {
                    const isLocked =
                      chapter.id > 1 && !chapters[index - 1]?.completed;
                    const isCompleted = chapter.completed;
                    const isCurrent = chapter.id === nextLesson?.id;

                    return (
                      <motion.div
                        key={chapter.id}
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
                                Lesson {chapter.id}
                              </p>
                              <p className="text-slate-400">{chapter.title}</p>
                            </div>
                          </div>
                        ) : (
                          <Link href={`/lesson/${chapter.id}/1/1`}>
                            <div
                              className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                                isCurrent ? 'ring-2 ring-[#4FFFB0]/50' : ''
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
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                                style={{
                                  background: isCompleted
                                    ? 'rgba(46, 204, 113, 0.2)'
                                    : 'rgba(79, 255, 176, 0.1)',
                                }}
                              >
                                {isCompleted ? '✓' : chapter.id}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-slate-500 mb-1">
                                  Lesson {chapter.id} · {chapter.duration}
                                </p>
                                <p className="text-white font-medium">
                                  {chapter.title}
                                </p>
                              </div>
                              {isCurrent && !isCompleted && (
                                <span
                                  className="px-3 py-1 text-xs font-pixel rounded-full"
                                  style={{
                                    background: 'rgba(79, 255, 176, 0.15)',
                                    color: '#4FFFB0',
                                  }}
                                >
                                  Continue
                                </span>
                              )}
                              {isCompleted && (
                                <span className="text-xs text-[#2ECC71]">
                                  Completed
                                </span>
                              )}
                            </div>
                          </Link>
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
                  <Link
                    href={`/lesson/${nextLesson?.id || 1}/1/1`}
                    className="inline-block px-8 py-4 rounded-xl font-pixel text-sm tracking-wider transition-all duration-300 hover:scale-105"
                    style={{
                      background: '#1E4CDD',
                      color: 'white',
                      boxShadow: '0 0 30px rgba(30, 76, 221, 0.3)',
                    }}
                  >
                    {nextLesson?.completed
                      ? 'Review lessons'
                      : 'Continue learning'}
                  </Link>
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
