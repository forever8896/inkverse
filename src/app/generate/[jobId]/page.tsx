'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import MonsterViewer from '@/components/MonsterViewer';

// Accordion component for prompt
function PromptAccordion({ prompt }: { prompt: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4 max-w-2xl mx-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 text-sm transition-all flex items-center justify-between"
      >
        <span>View Image Prompt</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-4 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-400 text-xs italic max-h-40 overflow-y-auto">
              {prompt}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type GenerationType = 'full' | 'image_only';

interface GenerationJobData {
  id: string;
  userId: string;
  prompt: string;
  style: 'cute' | 'fierce' | 'mysterious' | 'playful' | 'cosmic';
  stage: 'egg' | 'young' | 'adult';
  generationType: GenerationType;
  status: 'pending' | 'generating_image' | 'image_generation_failed' | 'image_generation_retrying' | 'converting_3d' | 'conversion_failed' | 'conversion_retrying' | 'completed' | 'failed' | 'failed_permanent' | 'waiting_on_storage';
  progress: number;
  errorMessage?: string;
  userMessage?: string;
  retryCount?: number;
  lastError?: {
    type: string;
    retryable: boolean;
    maxRetries: number;
    lastRetryAt: string;
    userMessage: string;
    currentRetries: number;
    technicalMessage: string;
    suggestedRetryDelay: number;
  };
  imageS3Key?: string;
  imageUrl?: string;
  glbS3Key?: string;
  glbUrl?: string;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface MonsterStatusResponse {
  success: boolean;
  job?: GenerationJobData;
  processing?: boolean;
  retryInSeconds?: number;
  error?: string;
}

const statusMessages = {
  pending: '🥚 Initializing your monster...',
  generating_image: '🎨 AI is painting your creature...',
  image_generation_failed: '🎨 Image generation failed...',
  image_generation_retrying: '🔄 Retrying image generation...',
  converting_3d: '🏗️ Building your monster in 3D...',
  conversion_failed: '🏗️ 3D conversion failed...',
  conversion_retrying: '🔄 Retrying 3D conversion...',
  completed: '✨ Your monster is ready!',
  failed: '💥 Something went wrong...',
  failed_permanent: '💥 Generation failed permanently...',
  waiting_on_storage: '🧰 Waiting for storage to come online...',
};

const statusEmojis = {
  pending: '🥚',
  generating_image: '🎨',
  image_generation_failed: '❌',
  image_generation_retrying: '🔄',
  converting_3d: '🏗️',
  conversion_failed: '❌',
  conversion_retrying: '🔄',
  completed: '✨',
  failed: '💥',
  failed_permanent: '💥',
  waiting_on_storage: '🧰',
};

const progressSteps = [
  { threshold: 0, label: 'Queuing creation request', emoji: '📋' },
  { threshold: 5, label: 'Starting AI image generation', emoji: '🎨' },
  { threshold: 40, label: 'Image generation complete', emoji: '🖼️' },
  { threshold: 50, label: 'Beginning 3D conversion', emoji: '🔄', requires3D: true },
  { threshold: 90, label: '3D model created', emoji: '🏗️', requires3D: true },
  { threshold: 100, label: 'Monster ready!', emoji: '🎉' },
];

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 opacity-20">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-px h-full bg-gradient-to-b from-transparent via-purple-400/30 to-transparent"
          style={{ left: `${i * 5}%` }}
          animate={{ opacity: [0.1, 0.5, 0.1], scaleY: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}

function FloatingCreationElements() {
  const creationEmojis = ['🧪', '⚗️', '🔬', '🧬', '✨', '🌟', '💫', '🔮', '🎨', '🏗️'];
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Fixed positions to avoid hydration mismatch
  const fixedPositions = [
    { left: 10, top: 15, duration: 12, delay: 0 },
    { left: 85, top: 25, duration: 15, delay: 0.5 },
    { left: 20, top: 75, duration: 11, delay: 1 },
    { left: 70, top: 80, duration: 13, delay: 1.5 },
    { left: 45, top: 30, duration: 14, delay: 2 },
    { left: 15, top: 55, duration: 10, delay: 2.5 },
    { left: 80, top: 60, duration: 16, delay: 3 },
    { left: 35, top: 85, duration: 12, delay: 0.8 },
    { left: 60, top: 20, duration: 11, delay: 1.2 },
    { left: 25, top: 40, duration: 13, delay: 1.8 },
  ];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {isClient && creationEmojis.map((emoji, index) => {
        const position = fixedPositions[index];
        return (
          <motion.div
            key={index}
            className="absolute text-3xl"
            initial={{
              left: `${position.left}%`,
              top: `${position.top}%`,
              opacity: 0.2,
            }}
            animate={{
              left: `${position.left + (index % 2 === 0 ? 15 : -15)}%`,
              top: `${position.top + (index % 3 === 0 ? 20 : -20)}%`,
              opacity: [0.2, 0.6, 0.2],
              scale: [0.7, 1.3, 0.7],
              rotate: [0, 360, 0],
            }}
            transition={{
              duration: position.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: position.delay,
            }}
            style={{
              filter: 'drop-shadow(0 0 15px rgba(147, 51, 234, 0.6))',
            }}
          >
            {emoji}
          </motion.div>
        );
      })}
    </div>
  );
}

function ProgressBar({ progress, status }: { progress: number; status: string }) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20" />
        
        {/* Progress fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            boxShadow: '0 0 20px rgba(147, 51, 234, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2)',
          }}
        />
        
        {/* Animated shimmer effect */}
        {progress > 0 && progress < 100 && (
          <motion.div
            className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: [-64, progress * 8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
      
      {/* Progress percentage */}
      <div className="flex justify-between items-center mt-3">
        <motion.span
          key={progress}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"
        >
          {progress}%
        </motion.span>
        <span className="text-slate-400 text-sm">
          {status === 'completed' ? 'Generation Complete!' : 'In Progress...'}
        </span>
      </div>
    </div>
  );
}

function ProgressSteps({ progress, generationType }: { progress: number; generationType?: GenerationType }) {
  const isImageOnly = generationType === 'image_only';

  const activeSteps = isImageOnly
    ? progressSteps.filter(step => !step.requires3D)
    : progressSteps;

  const activeCurrent = activeSteps.find((step, index) => {
    const nextStep = activeSteps[index + 1];
    return progress >= step.threshold && (!nextStep || progress < nextStep.threshold);
  });

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="space-y-4">
        {progressSteps.map((step, index) => {
          const isSkipped = Boolean(step.requires3D) && isImageOnly;
          const isCompleted = !isSkipped && progress >= step.threshold;
          const isCurrent = !isSkipped && activeCurrent === step;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center p-4 rounded-xl border transition-all duration-500 ${
                isSkipped
                  ? 'border-slate-700 bg-slate-900/40 text-slate-500'
                  : isCompleted
                  ? 'border-green-500/50 bg-green-500/10 text-green-200'
                  : isCurrent
                  ? 'border-purple-400/50 bg-purple-500/10 text-purple-200'
                  : 'border-slate-600 bg-slate-800/30 text-slate-400'
              }`}
            >
              <motion.div
                className={`text-2xl mr-4 ${isCurrent ? 'animate-pulse' : ''}`}
                animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {isSkipped ? '⏭️' : isCompleted ? '✅' : step.emoji}
              </motion.div>
              
              <div className="flex-1">
                <span className="font-medium">{step.label}</span>
                {isSkipped && (
                  <span className="ml-2 text-xs uppercase tracking-wide text-slate-400">Skipped</span>
                )}
                {isCurrent && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    className="h-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full mt-2"
                  />
                )}
              </div>
              
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-400 font-semibold"
                >
                  Complete
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function GenerationProgressPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;
  
  const [job, setJob] = useState<GenerationJobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [retrySeconds, setRetrySeconds] = useState<number | null>(null);

  const fetchJobStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/monster-status/${jobId}`);
      const data: MonsterStatusResponse = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login'); // Redirect to login page when session expired
          return;
        }
        throw new Error(data.error || 'Failed to fetch job status');
      }

      if (!data.success || !data.job) {
        throw new Error('Invalid response from server');
      }

      setJob(data.job);
      setError(null);
      setPollCount(prev => prev + 1);
      if (typeof data.retryInSeconds === 'number') {
        setRetrySeconds(Math.max(data.retryInSeconds, 0));
      } else {
        setRetrySeconds(null);
      }

      // Stop polling if job is completed or failed
      if (data.job.status === 'completed' || data.job.status === 'failed') {
        return false; // Signal to stop polling
      }
      
      return true; // Continue polling
    } catch (err: any) {
      console.error('Failed to fetch job status:', err);
      setError(err.message);
      return false; // Stop polling on error
    } finally {
      setLoading(false);
    }
  }, [jobId, router]);

  useEffect(() => {
    if (retrySeconds === null || retrySeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setRetrySeconds(prev => (prev !== null ? Math.max(prev - 1, 0) : prev));
    }, 1000);

    return () => clearTimeout(timer);
  }, [retrySeconds]);

  // Initial fetch and polling setup
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let shouldContinue = true;

    const startPolling = async () => {
      // Initial fetch
      const continuePolling = await fetchJobStatus();
      
      if (continuePolling && shouldContinue) {
        // Set up polling every 3 seconds
        intervalId = setInterval(async () => {
          const shouldContinue = await fetchJobStatus();
          if (!shouldContinue && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }, 3000);
      }
    };

    startPolling();

    // Cleanup
    return () => {
      shouldContinue = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchJobStatus]);

  // Redirect handling for completed jobs
  useEffect(() => {
    if (job?.status === 'completed' && job.imageUrl && job.glbUrl) {
      // Show completed state for a moment before offering next actions
      // User can stay on this page to view their creation
    }
  }, [job]);

  if (loading && !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-cyan-900/20 relative overflow-hidden flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-32 h-32 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <h2 className="text-2xl font-bold text-white">Loading your creation...</h2>
        </motion.div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-cyan-900/20 relative overflow-hidden flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg mx-auto px-6"
        >
          <div className="text-6xl mb-6">😔</div>
          <h2 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h2>
          <p className="text-slate-300 mb-8">{error}</p>
          <button
            onClick={() => router.push('/generate')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl text-white font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all duration-200"
          >
            ← Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  const currentStatus = job?.status || 'pending';
  const currentProgress = job?.progress || 0;
  const isImageOnly = job?.generationType === 'image_only';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-cyan-900/20 relative overflow-hidden">
      <AnimatedBackground />
      <FloatingCreationElements />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            className="flex justify-center mb-8"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Link
              href="/generate"
              className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-2 border-purple-400/30 hover:border-purple-400/50 flex items-center justify-center text-6xl transition-all hover:scale-105 cursor-pointer"
              title="Back to Generate"
            >
              {statusEmojis[currentStatus]}
            </Link>
          </motion.div>
          
          <motion.h1
            key={currentStatus}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"
          >
            {statusMessages[currentStatus]}
          </motion.h1>
          
          {job && (
            <PromptAccordion prompt={job.prompt} />
          )}
        </motion.div>

        {/* Progress Section - show for all processing states including retries */}
        {(currentStatus !== 'completed' && 
          currentStatus !== 'failed' && 
          currentStatus !== 'failed_permanent' &&
          currentStatus !== 'image_generation_failed' &&
          currentStatus !== 'conversion_failed') && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-12"
          >
          {/* Main Progress Bar */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Generation Progress
            </h3>
            <ProgressBar progress={currentProgress} status={currentStatus} />
          </div>

          {/* Detailed Steps */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Creation Steps
            </h3>
            <ProgressSteps progress={currentProgress} generationType={job?.generationType} />
          </div>

          {/* Monster Details */}
          {job && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                Your Monster Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">🎨</div>
                  <div className="font-semibold text-purple-300 capitalize">{job.style}</div>
                  <div className="text-sm text-slate-400">Style</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🌱</div>
                  <div className="font-semibold text-cyan-300 capitalize">{job.stage}</div>
                  <div className="text-sm text-slate-400">Stage</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">⏱️</div>
                  <div className="font-semibold text-green-300">
                    Poll #{pollCount}
                  </div>
                  <div className="text-sm text-slate-400">Updates</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🧪</div>
                  <div className="font-semibold text-amber-300 capitalize">
                    {job.generationType === 'image_only' ? 'Image Only' : 'Full Pipeline'}
                  </div>
                  <div className="text-sm text-slate-400">Generation Mode</div>
                </div>
              </div>
            </div>
          )}

          {/* Error Information for Retrying States */}
          {(currentStatus === 'image_generation_retrying' || 
            currentStatus === 'conversion_retrying') && 
           (job?.userMessage || job?.errorMessage || job?.lastError) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">⚠️</div>
                <h3 className="text-lg font-semibold text-yellow-200">
                  Previous Attempt Failed - Retrying
                </h3>
              </div>
              <p className="text-yellow-100 mb-3">
                {job?.userMessage || job?.errorMessage || 'An error occurred during generation.'}
              </p>
              {job?.lastError && (
                <div className="text-sm text-yellow-300">
                  <p>Retry attempt: {job.retryCount || 0} of {job.lastError.maxRetries || 2}</p>
                  {job.lastError.technicalMessage && (
                    <p className="text-yellow-400 mt-1">
                      Technical details: {job.lastError.technicalMessage}
                    </p>
                  )}
                </div>
              )}
              {retrySeconds !== null && (
                <p className="text-sm text-yellow-200 mt-3">
                  {retrySeconds > 0
                    ? `Next retry in ${retrySeconds}s`
                    : 'Retrying now...'}
                </p>
              )}
            </motion.div>
          )}

          {currentStatus === 'waiting_on_storage' && job && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">🧰</div>
                <h3 className="text-lg font-semibold text-orange-200">
                  Storage Unreachable
                </h3>
              </div>
              <p className="text-orange-100">
                {job.userMessage ||
                  'We cannot reach the storage bucket right now. Start MinIO locally (npm run storage:start) or verify your S3 connectivity, then retry.'}
              </p>
            </motion.div>
          )}
          </motion.div>
        )}

          {/* Results Section - Show image as soon as available */}
          {job?.imageUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className={`rounded-2xl p-8 ${
                currentStatus === 'completed'
                  ? 'bg-gradient-to-br from-green-500/10 to-purple-500/10 border border-green-500/30'
                  : 'bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30'
              }`}
            >
              <h3 className="text-3xl font-bold text-white mb-6 text-center">
                {currentStatus === 'completed' ? '🎉 Your Monster is Ready!' : '✨ Image Generated!'}
              </h3>

              <div className="space-y-8">
                {/* Image Preview */}
                <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-white">🖼️ Generated Image</h4>
                  <div className="relative bg-slate-900/50 rounded-xl p-4 border border-slate-600">
                    <img
                      src={job.imageUrl}
                      alt="Your generated monster"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                  <a
                    href={job.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
                  >
                    📥 Download Image
                  </a>
                  {isImageOnly && (
                    <p className="text-sm text-slate-300">
                      You selected image-only mode. No 3D model was generated for this monster.
                    </p>
                  )}
                  {!isImageOnly && currentStatus !== 'completed' && (
                    <p className="text-sm text-cyan-300 flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        🏗️
                      </motion.span>
                      3D model is being generated...
                    </p>
                  )}
                </div>

                {/* Interactive 3D Model - Only show when completed */}
                {!isImageOnly && currentStatus === 'completed' && job.glbUrl && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-semibold text-white">🏗️ Interactive 3D Model</h4>
                      <a
                        href={job.glbUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white font-medium transition-colors"
                      >
                        📥 Download GLB
                      </a>
                    </div>

                    <MonsterViewer
                      modelUrl={job.glbUrl}
                      height="h-96"
                      showControls={true}
                      autoRotate={true}
                      className="w-full"
                    />

                    <p className="text-slate-400 text-sm text-center">
                      ✨ Drag to rotate • Scroll to zoom • Click controls to customize
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons - Only show when fully completed */}
              {currentStatus === 'completed' && (
                <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
                  <button
                    onClick={() => router.push('/generate')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-xl text-white font-semibold transition-all duration-200"
                  >
                    🎭 Create Another Monster
                  </button>
                  <button
                    onClick={() => router.push('/lab')}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold transition-all duration-200"
                  >
                    🏠 Back to Lab
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Failed State */}
          {(currentStatus === 'failed' || 
            currentStatus === 'failed_permanent' ||
            currentStatus === 'image_generation_failed' ||
            currentStatus === 'conversion_failed') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center"
            >
              <div className="text-6xl mb-4">💥</div>
              <h3 className="text-2xl font-bold text-white mb-4">Generation Failed</h3>
              <p className="text-red-200 mb-6">
                {job?.userMessage || job?.errorMessage || 'Something went wrong during the creation process.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/generate')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-xl text-white font-semibold transition-all duration-200"
                >
                  🔄 Try Again
                </button>
                <button
                  onClick={() => router.push('/lab')}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold transition-all duration-200"
                >
                  🏠 Back to Lab
                </button>
              </div>
            </motion.div>
          )}
      </div>
    </div>
  );
}
