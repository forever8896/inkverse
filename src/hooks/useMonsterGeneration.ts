import { useEffect, useCallback } from 'react';
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
  statusMessages,
  statusEmojis,
  progressSteps,
  type GenerationJobData
} from '@/stores/monster-generation';

// Re-export commonly used store hooks
export { useActiveJob, useJob, useJobStatus, useJobProgress, useGenerationError, useGenerationLoading, usePollCount };

/**
 * Main hook for monster generation operations
 * Provides all the functionality needed to manage monster generation
 */
export function useMonsterGeneration() {
  const store = useMonsterGenerationStore();
  const router = useRouter();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      store.cleanup();
    };
  }, [store]);

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
    
    // Computed properties
    isCompleted: status === 'completed',
    isFailed: status === 'failed',
    isProcessing: status && ['pending', 'generating_image', 'converting_3d'].includes(status),
    statusMessage: status ? statusMessages[status] : '',
    statusEmoji: status ? statusEmojis[status] : '',
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
  const currentStep = progressSteps.findIndex((step, index) => {
    const nextStep = progressSteps[index + 1];
    return progress >= step.threshold && (!nextStep || progress < nextStep.threshold);
  });

  // Map steps to completion status
  const steps = progressSteps.map((step, index) => ({
    ...step,
    isCompleted: progress >= step.threshold,
    isCurrent: index === currentStep,
  }));

  return {
    progress,
    status,
    currentStep: currentStep >= 0 ? currentStep : 0,
    steps,
    isCompleted: status === 'completed',
    isFailed: status === 'failed',
    isProcessing: status && ['pending', 'generating_image', 'converting_3d'].includes(status),
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
    message: status ? statusMessages[status] : '',
    emoji: status ? statusEmojis[status] : '',
    progress,
    
    // CSS classes for different states
    containerClass: status === 'completed' 
      ? 'bg-gradient-to-br from-green-500/10 to-purple-500/10 border border-green-500/30'
      : status === 'failed'
      ? 'bg-red-500/10 border border-red-500/30'
      : 'bg-slate-800/50 border border-slate-700',
      
    textClass: status === 'completed'
      ? 'text-green-200'
      : status === 'failed'
      ? 'text-red-200'
      : 'text-white',
      
    isLoading: status && ['pending', 'generating_image', 'converting_3d'].includes(status),
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
    return collectionJobs.filter(job => job.status === 'completed');
  }, [collectionJobs]);

  const getProcessingJobs = useCallback(() => {
    return collectionJobs.filter(job => 
      ['pending', 'generating_image', 'converting_3d'].includes(job.status)
    );
  }, [collectionJobs]);

  const getFailedJobs = useCallback(() => {
    return collectionJobs.filter(job => job.status === 'failed');
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
