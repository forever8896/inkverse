import { useState, useEffect, useCallback, useRef } from 'react';
import { useMonsterGenerationStore, GenerationJobData } from '@/stores/monster-generation';
import { MonsterStage } from '@/lib/generation-job';
import { generateRandomMonsterRequest } from '@/lib/monster-prompts';
import { isProcessing } from '@/lib/status-constants';

/**
 * Evolution stage types
 */
export type EvolutionStage = 'young' | 'young_3d' | 'adult';

/**
 * Evolution history entry from the API
 */
export interface EvolutionHistoryEntry {
  id: string;
  stage: EvolutionStage;
  milestoneLabel?: string;
  evolvedAt: string;
  assetsCid?: {
    image_cid?: string;
    model_cid?: string;
  };
  txHash?: string;
}

/**
 * User's monster data from the API
 */
export interface UserMonsterData {
  id: string;
  currentStage: EvolutionStage;
  nftItemId?: number;
  nftCollectionId?: number;
  nftOwnerAddress?: string;
  currentMetadataCid?: string;

  // Current asset URLs (presigned S3)
  currentImageUrl?: string;
  currentModelUrl?: string;

  // IPFS CIDs for on-chain metadata
  youngImageCid?: string;
  youngModelCid?: string;
  adultModelCid?: string;

  // Monster attributes
  attributes?: Record<string, string | number>;

  // Evolution history
  evolutionHistory: EvolutionHistoryEntry[];

  // Next evolution info (if available)
  nextEvolution?: {
    stage: EvolutionStage;
    requiresGeneration: boolean;
    canEvolve: boolean;
  };
}

interface UseMonsterAssetReturn {
  // State
  jobId: string | null;
  status: GenerationJobData['status'] | null;
  progress: number;
  error: string | null;
  userMessage: string | null;

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

  // Evolution System
  monster: UserMonsterData | null;
  isLoadingMonster: boolean;
  isEvolving: boolean;
  evolutionError: string | null;
  canEvolve: boolean;
  nextEvolutionStage: EvolutionStage | null;

  // Actions
  triggerGeneration: (chapterId: number, stepId: number, stage?: 'young' | 'adult', force?: boolean, walletAddress?: string, evolutionMilestone?: string) => Promise<void>;
  triggerEvolution: (targetStage: 'young_3d' | 'adult', walletAddress: string, evolutionMilestone?: string) => Promise<{ success: boolean; error?: string }>;
  refreshAssets: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  fetchMonster: () => Promise<void>;
  clearWalletRequired: () => void; // Clear the walletRequired flag
  clearEvolutionError: () => void; // Clear evolution error
}

export function useMonsterAsset(userId: string | undefined, lessonId: number, currentStage?: MonsterStage): UseMonsterAssetReturn {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isLoadingInitialState, setIsLoadingInitialState] = useState(true);
  const [wasResumed, setWasResumed] = useState(false);
  const [walletRequired, setWalletRequired] = useState(false);

  // Evolution state
  const [monster, setMonster] = useState<UserMonsterData | null>(null);
  const [isLoadingMonster, setIsLoadingMonster] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolutionError, setEvolutionError] = useState<string | null>(null);

  // Refs for throttling and locking
  const localTriggerPending = useRef<Set<string>>(new Set());
  const lastRefreshRef = useRef<number>(0);
  const resumeCheckedRef = useRef<string | null>(null);
  const monsterFetchedRef = useRef<boolean>(false);
  // Tracks whether triggerGeneration explicitly set the jobId.
  // Prevents checkResume from overriding an active in-flight generation
  // when the effect re-fires due to currentStage changes.
  const generationActiveRef = useRef<boolean>(false);

  const {
    jobs,
    fetchJobStatus,
    startPolling,
    stopPolling
  } = useMonsterGenerationStore();

  const job = jobId ? jobs[jobId] : null;

  // ============================================================================
  // FETCH USER'S MONSTER
  // ============================================================================
  const fetchMonster = useCallback(async () => {
    if (!userId) return;

    setIsLoadingMonster(true);
    try {
      const response = await fetch('/api/user/monster');

      if (response.ok) {
        const data = await response.json();
        if (data.monster) {
          setMonster(data.monster);
        }
      } else if (response.status !== 404) {
        // 404 means no monster yet, which is expected for new users
        console.warn('[useMonsterAsset] Failed to fetch monster:', response.status);
      }
    } catch (err) {
      console.warn('[useMonsterAsset] Error fetching monster:', err);
    } finally {
      setIsLoadingMonster(false);
    }
  }, [userId]);

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

      // Don't override a jobId that was explicitly set by triggerGeneration.
      // When triggerGeneration sets the active job (e.g. a retrying conversion),
      // subsequent checkResume calls (triggered by currentStage changes) could
      // fetch an older completed job from trigger-generation and clobber it.
      if (generationActiveRef.current) {
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

  // ============================================================================
  // FETCH MONSTER ON MOUNT
  // ============================================================================
  useEffect(() => {
    if (userId && !monsterFetchedRef.current) {
      monsterFetchedRef.current = true;
      fetchMonster();
    }
  }, [userId, fetchMonster]);

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
        // Job reached terminal state — allow checkResume to work again
        generationActiveRef.current = false;

        // Refresh monster data when job completes
        if (job.status === 'completed') {
          fetchMonster();
        }
      }
    }
    return () => {
      if (jobId) stopPolling(jobId);
    };
  }, [jobId, job?.status, startPolling, stopPolling, fetchMonster]);

  const triggerGeneration = useCallback(async (
    chapterId: number,
    stepId: number,
    stage: 'young' | 'adult' = 'young',
    force: boolean = false,
    walletAddress?: string,
    evolutionMilestone?: string
  ) => {
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
          evolutionMilestone, // Pass milestone for evolution tracking
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
      // Mark generation as explicitly active so checkResume won't override
      generationActiveRef.current = true;

      // Start polling immediately
      await fetchJobStatus(newJobId);
      startPolling(newJobId);

    } catch (err) {
      console.error('[useMonsterAsset] Error triggering generation:', err);
    } finally {
      localTriggerPending.current.delete(triggerKey);
    }
  }, [userId, lessonId, fetchJobStatus, startPolling]);

  // ============================================================================
  // TRIGGER EVOLUTION
  // ============================================================================
  const triggerEvolution = useCallback(async (
    targetStage: 'young_3d' | 'adult',
    walletAddress: string,
    evolutionMilestone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId || !monster) {
      return { success: false, error: 'No monster to evolve' };
    }

    setIsEvolving(true);
    setEvolutionError(null);

    try {
      const response = await fetch('/api/evolve-monster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: targetStage,
          walletAddress,
          evolutionMilestone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Evolution failed';
        setEvolutionError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // For young_3d (reveal), the response is immediate
      // For adult, we may get a job ID to track
      if (data.jobId) {
        // Adult evolution - track the job
        setJobId(data.jobId);
        generationActiveRef.current = true;
        await fetchJobStatus(data.jobId);
        startPolling(data.jobId);
      } else {
        // young_3d reveal - refresh monster data immediately
        await fetchMonster();
      }

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Evolution failed';
      setEvolutionError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsEvolving(false);
    }
  }, [userId, monster, fetchJobStatus, startPolling, fetchMonster]);

  const clearWalletRequired = useCallback(() => {
    setWalletRequired(false);
  }, []);

  const clearEvolutionError = useCallback(() => {
    setEvolutionError(null);
  }, []);

  // Compute evolution availability
  const canEvolve = monster?.nextEvolution?.canEvolve ?? false;
  const nextEvolutionStage = monster?.nextEvolution?.stage ?? null;

  // Determine current asset URLs - prefer monster data if available
  const currentImageUrl = monster?.currentImageUrl || job?.imageUrl || null;
  const currentModelUrl = monster?.currentModelUrl || job?.glbUrl || null;

  return {
    jobId,
    status: job?.status || null,
    progress: job?.progress || 0,
    error: job?.errorMessage || null,
    userMessage: job?.userMessage || null,

    imageUrl: currentImageUrl,
    modelUrl: currentModelUrl,

    isGenerating: job ? isProcessing(job.status) : false,
    isImageReady: !!currentImageUrl,
    isModelReady: !!currentModelUrl,
    isLoadingInitialState,
    wasResumed,
    walletRequired,

    // Evolution system
    monster,
    isLoadingMonster,
    isEvolving,
    evolutionError,
    canEvolve,
    nextEvolutionStage,

    triggerGeneration,
    triggerEvolution,
    refreshAssets,
    forceRefresh,
    fetchMonster,
    clearWalletRequired,
    clearEvolutionError,
  };
}
