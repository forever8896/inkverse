import { useState, useEffect, useCallback, useRef } from 'react';
import { useMonsterGenerationStore, GenerationJobData } from '@/stores/monster-generation';
import { MonsterStage } from '@/lib/generation-job';
import { generateRandomMonsterRequest } from '@/lib/monster-prompts';
import { isProcessing } from '@/lib/status-constants';

interface UseMonsterAssetReturn {
  // State
  jobId: string | null;
  status: GenerationJobData['status'] | null;
  progress: number;
  error: string | null;

  // Asset URLs (Ready to use)
  imageUrl: string | null;
  modelUrl: string | null;

  // Loading states
  isGenerating: boolean;
  isImageReady: boolean;
  isModelReady: boolean;
  isLoadingInitialState: boolean; // True while checking for existing jobs on mount

  // Resume indicator - true when reconnecting to an existing job
  wasResumed: boolean;

  // Wallet requirement state
  walletRequired: boolean; // True if generation was blocked due to missing wallet

  // Actions
  triggerGeneration: (chapterId: number, stepId: number, stage?: 'young' | 'adult', force?: boolean, walletAddress?: string) => Promise<void>;
  refreshAssets: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  clearWalletRequired: () => void; // Clear the walletRequired flag
}

export function useMonsterAsset(userId: string | undefined, lessonId: number, currentStage?: MonsterStage): UseMonsterAssetReturn {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isLoadingInitialState, setIsLoadingInitialState] = useState(true);
  const [wasResumed, setWasResumed] = useState(false);
  const [walletRequired, setWalletRequired] = useState(false);

  // Refs for throttling and locking
  const localTriggerPending = useRef<Set<string>>(new Set());
  const lastRefreshRef = useRef<number>(0);
  const resumeCheckedRef = useRef<string | null>(null);

  const {
    jobs,
    fetchJobStatus,
    startPolling,
    stopPolling
  } = useMonsterGenerationStore();

  const job = jobId ? jobs[jobId] : null;

  // ============================================================================
  // MOUNT RESUME: DO NOT REMOVE THIS EFFECT
  // ============================================================================
  // This GET reconnects users to their existing job on page load/reload.
  // Without it, users would see a blank state until clicking "Generate" again.
  //
  // Why this is NOT redundant:
  // - The POST to /api/generate-monster only fires when user clicks "Generate"
  // - This effect fires on mount, restoring state for users who refresh mid-generation
  // - resumeCheckedRef prevents duplicate fetches, not this entire effect
  //
  // Race protection is handled by the atomic POST to /api/generate-monster,
  // which uses createWithTrigger() with database row locks.
  // ============================================================================
  useEffect(() => {
    const checkResume = async () => {
      if (!userId || !lessonId) {
        setIsLoadingInitialState(false);
        return;
      }

      // Avoid re-checking the same lesson/stage multiple times
      const checkKey = `${userId}-${lessonId}-${currentStage || 'any'}`;
      if (resumeCheckedRef.current === checkKey) return;
      resumeCheckedRef.current = checkKey;

      try {
        // Query the trigger endpoint with stage filter if available
        let url = `/api/progress/trigger-generation?lessonId=${lessonId}`;
        if (currentStage) {
          url += `&stage=${currentStage}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          // Assuming the API might return a list or the latest if we relax params
          if (data.triggered && data.trigger?.generation_job_id) {
            console.log('[useMonsterAsset] Resuming job:', data.trigger.generation_job_id);
            setJobId(data.trigger.generation_job_id);
            setWasResumed(true);
            await fetchJobStatus(data.trigger.generation_job_id);
          }
        }
      } catch (err) {
        console.warn('[useMonsterAsset] Failed to resume job:', err);
      } finally {
        setIsLoadingInitialState(false);
      }
    };

    checkResume();
  }, [userId, lessonId, currentStage, fetchJobStatus]);

  // Refresh assets - delegates to fetchJobStatus which handles URL freshness
  // via urlFreshness metadata from the API (see monster-generation store)
  const refreshAssets = useCallback(async () => {
    if (!jobId) return;
    // fetchJobStatus checks urlFreshness and calls refreshUrls automatically if stale
    await fetchJobStatus(jobId);
  }, [jobId, fetchJobStatus]);

  const forceRefresh = useCallback(async () => {
    if (!jobId) return;

    const now = Date.now();
    if (now - lastRefreshRef.current < 1000) return; // Throttle 1s
    lastRefreshRef.current = now;

    await fetchJobStatus(jobId);
  }, [jobId, fetchJobStatus]);

  // Poll while processing
  useEffect(() => {
    if (jobId && job) {
      if (isProcessing(job.status)) {
        startPolling(jobId);
      } else {
        stopPolling(jobId);
      }
    }
    return () => {
      if (jobId) stopPolling(jobId);
    };
  }, [jobId, job?.status, startPolling, stopPolling]);

  const triggerGeneration = useCallback(async (chapterId: number, stepId: number, stage: 'young' | 'adult' = 'young', force: boolean = false, walletAddress?: string) => {
    if (!userId) return;

    const triggerKey = `${lessonId}-${chapterId}-${stepId}`;
    if (localTriggerPending.current.has(triggerKey) && !force) return;

    localTriggerPending.current.add(triggerKey);

    try {
      // Atomic creation/check handled by the API
      const randomMonster = generateRandomMonsterRequest();

      const generateRes = await fetch('/api/generate-monster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...randomMonster,
          stage: stage,
          generationType: 'full',
          lessonId,
          chapterId,
          stepId,
          walletAddress, // Pass wallet address for NFT minting
        })
      });

      const generateData = await generateRes.json();

      if (!generateRes.ok) {
        // 403 with "already have" message is expected behavior, not an error
        // User has already generated a monster at this stage - silently return
        if (generateRes.status === 403 && generateData.error?.includes('already have')) {
          return;
        }

        // Check if wallet is required but not provided
        if (generateData.code === 'WALLET_REQUIRED' || generateData.code === 'INVALID_WALLET_ADDRESS') {
          console.log('[useMonsterAsset] Wallet required for generation');
          setWalletRequired(true);
          return; // Don't throw - let UI handle wallet connection
        }

        console.error('[useMonsterAsset] Generation failed:', generateData.error);
        throw new Error(generateData.error || 'Generation failed');
      }

      // Clear wallet required flag on success
      setWalletRequired(false);

      const newJobId = generateData.jobId;

      // Log whether we resumed an existing job or created a new one
      if (generateData.resumed) {
        console.log('[useMonsterAsset] Resumed existing job:', newJobId);
        setWasResumed(true);
      } else {
        console.log('[useMonsterAsset] Created new job:', newJobId);
        setWasResumed(false);
      }

      setJobId(newJobId);

      // Start polling immediately
      await fetchJobStatus(newJobId);
      startPolling(newJobId);

    } catch (err) {
      console.error('[useMonsterAsset] Error triggering generation:', err);
    } finally {
      localTriggerPending.current.delete(triggerKey);
    }
  }, [userId, lessonId, fetchJobStatus, startPolling]);

  const clearWalletRequired = useCallback(() => {
    setWalletRequired(false);
  }, []);

  return {
    jobId,
    status: job?.status || null,
    progress: job?.progress || 0,
    error: job?.errorMessage || null,

    imageUrl: job?.imageUrl || null,
    modelUrl: job?.glbUrl || null,

    isGenerating: job ? isProcessing(job.status) : false,
    isImageReady: !!job?.imageUrl,
    isModelReady: !!job?.glbUrl,
    isLoadingInitialState,
    wasResumed,
    walletRequired,

    triggerGeneration,
    refreshAssets,
    forceRefresh,
    clearWalletRequired,
  };
}