import { useState, useEffect, useCallback, useRef } from 'react';
import { useMonsterGeneration } from './useMonsterGeneration';
import { GenerationJobData } from '@/stores/monster-generation';
import { MonsterStage } from '@/lib/generation-job';
import { generateRandomMonsterRequest } from '@/lib/monster-prompts';

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

  // Actions
  triggerGeneration: (chapterId: number, stepId: number, stage?: 'young' | 'adult', force?: boolean) => Promise<void>;
  refreshAssets: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

export function useMonsterAsset(userId: string | undefined, lessonId: number, currentStage?: MonsterStage): UseMonsterAssetReturn {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isLoadingInitialState, setIsLoadingInitialState] = useState(true);
  
  // Refs for throttling and locking
  const localTriggerPending = useRef<Set<string>>(new Set());
  const lastRefreshRef = useRef<number>(0);
  const resumeCheckedRef = useRef<string | null>(null);

  const { 
    jobs, 
    fetchJobStatus, 
    startPolling, 
    stopPolling 
  } = useMonsterGeneration();

  const job = jobId ? jobs[jobId] : null;

  // Resume on Mount: Check if generation was already triggered for this lesson
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

  const refreshAssets = useCallback(async () => {
    if (!jobId) return;
    
    const job = await fetchJobStatus(jobId);
    if (!job) return;

    // Check URL expiry (approx 2 hours)
    const updatedAt = new Date(job.updatedAt);
    const ageMinutes = (Date.now() - updatedAt.getTime()) / 60000;
    
    if (ageMinutes > 110) {
      // Force refresh logic here
      await fetchJobStatus(jobId);
    }
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
      const isProcessing = ['pending', 'generating_image', 'converting_3d'].includes(job.status);
      if (isProcessing) {
        startPolling(jobId);
      } else {
        stopPolling(jobId);
      }
    }
    return () => {
      if (jobId) stopPolling(jobId);
    };
  }, [jobId, job?.status, startPolling, stopPolling]);

  const triggerGeneration = useCallback(async (chapterId: number, stepId: number, stage: 'young' | 'adult' = 'young', force: boolean = false) => {
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
          stepId
        })
      });
      
      const generateData = await generateRes.json();
      
      if (!generateRes.ok) {
        console.error('[useMonsterAsset] Generation failed:', generateData.error);
        throw new Error(generateData.error || 'Generation failed');
      }

      const newJobId = generateData.jobId;
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

  return {
    jobId,
    status: job?.status || null,
    progress: job?.progress || 0,
    error: job?.errorMessage || null,
    
    imageUrl: job?.imageUrl || null,
    modelUrl: job?.glbUrl || null,
    
    isGenerating: job ? ['pending', 'generating_image', 'converting_3d'].includes(job.status) : false,
    isImageReady: !!job?.imageUrl,
    isModelReady: !!job?.glbUrl,
    isLoadingInitialState,
    
    triggerGeneration,
    refreshAssets,
    forceRefresh
  };
}
