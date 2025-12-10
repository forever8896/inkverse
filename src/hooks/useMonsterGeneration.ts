import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  useMonsterGenerationStore,
  useActiveJob,
  useJob,
  useJobStatus,
  useJobProgress,
  useGenerationError,
  useGenerationLoading,
  usePollCount,
  type GenerationJobData
} from '@/stores/monster-generation';
import {
  isFailed,
  isProcessing,
  isCompleted,
  STATUS_MESSAGES,
  STATUS_EMOJIS,
  PROGRESS_STEPS,
  type GenerationStatus
} from '@/lib/status-constants';

// Re-export commonly used store hooks
export { useActiveJob, useJob, useJobStatus, useJobProgress, useGenerationError, useGenerationLoading, usePollCount };

/**
 * Main hook for monster generation operations
 * Provides all the functionality needed to manage monster generation
 */
export function useMonsterGeneration() {
  const store = useMonsterGenerationStore();
  const router = useRouter();

  // Cleanup on unmount - use ref to avoid dependency issues
  const cleanupRef = useRef(store.cleanup);
  cleanupRef.current = store.cleanup;

  useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, []);

  // Handle visibility changes for polling optimization
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Access store directly to avoid stale closure
      const state = useMonsterGenerationStore.getState();
      
      if (document.hidden) {
        // Pause all active polling
        Object.keys(state.pollingStates).forEach(jobId => {
          state.pausePolling(jobId);
        });
      } else {
        // Resume paused polling
        Object.keys(state.pollingStates).forEach(jobId => {
          if (state.pollingStates[jobId]?.paused) {
            state.resumePolling(jobId);
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleAuthenticationError = useCallback(() => {
    router.push('/login');
  }, [router]);

  // Enhanced fetch with auth error handling
  const fetchJobWithAuth = useCallback(async (jobId: string): Promise<GenerationJobData | null> => {
    try {
      return await store.fetchJobStatus(jobId);
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        handleAuthenticationError();
        return null;
      }
      throw error;
    }
  }, [store, handleAuthenticationError]);

  return {
    // State
    jobs: store.jobs,
    activeJobId: store.activeJobId,
    loading: store.loading,
    error: store.error,
    pollCounts: store.pollCounts,

    // Actions
    setActiveJob: store.setActiveJob,
    setJob: store.setJob,
    updateJob: store.updateJob,
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,

    // Job operations with auth handling
    fetchJobStatus: fetchJobWithAuth,
    startPolling: store.startPolling,
    stopPolling: store.stopPolling,
    stopAllPolling: store.stopAllPolling,

    // Computed getters
    getJob: store.getJob,
    getActiveJob: store.getActiveJob,
    isJobCompleted: store.isJobCompleted,
    isJobFailed: store.isJobFailed,
    isJobProcessing: store.isJobProcessing,

    // Utilities
    cleanup: store.cleanup,
    handleAuthError: handleAuthenticationError,
  };
}

/**
 * Hook for monitoring a specific job with automatic polling
 */
export function useJobMonitor(jobId: string, autoStart = true) {
  const job = useJob(jobId);
  const status = useJobStatus(jobId);
  const progress = useJobProgress(jobId);
  const pollCount = usePollCount(jobId);
  const error = useGenerationError();
  const loading = useGenerationLoading();
  const { fetchJobStatus, startPolling, stopPolling } = useMonsterGeneration();

  // Auto-start polling when component mounts
  useEffect(() => {
    if (autoStart && jobId) {
      startPolling(jobId);
    }

    return () => {
      if (jobId) {
        stopPolling(jobId);
      }
    };
  }, [jobId, autoStart, startPolling, stopPolling]);

  const refresh = useCallback(() => {
    if (jobId) {
      fetchJobStatus(jobId);
    }
  }, [jobId, fetchJobStatus]);

  const startMonitoring = useCallback(() => {
    if (jobId) {
      startPolling(jobId);
    }
  }, [jobId, startPolling]);

  const stopMonitoring = useCallback(() => {
    if (jobId) {
      stopPolling(jobId);
    }
  }, [jobId, stopPolling]);

  return {
    job,
    status,
    progress,
    pollCount,
    error,
    loading,
    refresh,
    startMonitoring,
    stopMonitoring,

    // Computed properties using shared type guards
    isCompleted: isCompleted(status),
    isFailed: isFailed(status),
    isProcessing: isProcessing(status),
    statusMessage: status ? STATUS_MESSAGES[status as GenerationStatus] : '',
    statusEmoji: status ? STATUS_EMOJIS[status as GenerationStatus] : '',
  };
}

/**
 * Hook for displaying job progress information
 */
export function useJobProgressDisplay(jobId: string): {
  progress: number;
  status: string | null;
  currentStep: number;
  steps: Array<{
    threshold: number;
    label: string;
    emoji: string;
    isCompleted: boolean;
    isCurrent: boolean;
  }>;
  isCompleted: boolean;
  isFailed: boolean;
  isProcessing: boolean;
} {
  const job = useJob(jobId);
  const progress = useJobProgress(jobId);
  const status = useJobStatus(jobId);

  // Find current step based on progress
  const currentStep = PROGRESS_STEPS.findIndex((step, index) => {
    const nextStep = PROGRESS_STEPS[index + 1];
    return progress >= step.threshold && (!nextStep || progress < nextStep.threshold);
  });

  // Map steps to completion status
  const steps = PROGRESS_STEPS.map((step, index) => ({
    ...step,
    isCompleted: progress >= step.threshold,
    isCurrent: index === currentStep,
  }));

  return {
    progress,
    status,
    currentStep: currentStep >= 0 ? currentStep : 0,
    steps,
    isCompleted: isCompleted(status),
    isFailed: isFailed(status),
    isProcessing: isProcessing(status),
  };
}

/**
 * Hook for job status display with messages and styling
 */
export function useJobStatusDisplay(jobId: string) {
  const job = useJob(jobId);
  const status = useJobStatus(jobId);
  const progress = useJobProgress(jobId);

  const statusInfo = {
    status,
    message: status ? STATUS_MESSAGES[status as GenerationStatus] : '',
    emoji: status ? STATUS_EMOJIS[status as GenerationStatus] : '',
    progress,

    // CSS classes for different states
    containerClass: isCompleted(status)
      ? 'bg-gradient-to-br from-green-500/10 to-purple-500/10 border border-green-500/30'
      : isFailed(status)
      ? 'bg-red-500/10 border border-red-500/30'
      : 'bg-slate-800/50 border border-slate-700',

    textClass: isCompleted(status)
      ? 'text-green-200'
      : isFailed(status)
      ? 'text-red-200'
      : 'text-white',

    isLoading: isProcessing(status),
  };

  return {
    job,
    ...statusInfo,
  };
}

/**
 * Hook for accessing job results (images, models, etc.)
 */
export function useJobResults(jobId: string) {
  const job = useJob(jobId);
  const status = useJobStatus(jobId);

  return {
    job,
    status,
    hasResults: status === 'completed' && job?.imageUrl,
    imageUrl: job?.imageUrl,
    glbUrl: job?.glbUrl,
    imageS3Key: job?.imageS3Key,
    glbS3Key: job?.glbS3Key,
    totalCost: job?.totalCost || 0,
    prompt: job?.prompt,
    style: job?.style,
    stage: job?.stage,
    createdAt: job?.createdAt,
    completedAt: job?.completedAt,
  };
}

/**
 * Hook for managing multiple jobs (for job history, etc.)
 */
export function useJobCollection(jobIds: string[]) {
  const { jobs, fetchJobStatus } = useMonsterGeneration();

  const collectionJobs = jobIds.map(id => jobs[id]).filter(Boolean);

  const refreshAll = useCallback(async () => {
    await Promise.all(jobIds.map(id => fetchJobStatus(id)));
  }, [jobIds, fetchJobStatus]);

  const getCompletedJobs = useCallback(() => {
    return collectionJobs.filter(job => isCompleted(job.status));
  }, [collectionJobs]);

  const getProcessingJobs = useCallback(() => {
    return collectionJobs.filter(job => isProcessing(job.status));
  }, [collectionJobs]);

  const getFailedJobs = useCallback(() => {
    return collectionJobs.filter(job => isFailed(job.status));
  }, [collectionJobs]);

  return {
    jobs: collectionJobs,
    refreshAll,
    getCompletedJobs,
    getProcessingJobs,
    getFailedJobs,
    totalJobs: collectionJobs.length,
    completedCount: getCompletedJobs().length,
    processingCount: getProcessingJobs().length,
    failedCount: getFailedJobs().length,
  };
}
