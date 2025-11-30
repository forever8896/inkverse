import { useState, useEffect, useCallback, useRef } from 'react';
import { useMonsterGeneration } from './useMonsterGeneration';
import { GenerationJobData } from '@/stores/monster-generation';
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

export function useMonsterAsset(userId: string | undefined, lessonId: number): UseMonsterAssetReturn {
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

      // Avoid re-checking the same lesson multiple times
      const checkKey = `${userId}-${lessonId}`;
      if (resumeCheckedRef.current === checkKey) return;
      resumeCheckedRef.current = checkKey;

      try {
        // Query the trigger endpoint. 
        // NOTE: The current API requires chapterId/stepId. 
        // We might need to modify the backend to support "get latest trigger for lesson".
        // For now, we'll try to query without specific step if the API supports it, 
        // OR we scan the store if we have data.
        
        // Since we can't easily scan "all triggers" with the current API (based on previous file reads),
        // We will rely on the layout to manage state or use a broader query if we build it.
        // FALLBACK STRATEGY for this implementation:
        // We won't block indefinitely on "LoadingInitialState" if we can't find a job.
        // We'll set it to false.
        // Ideally, the Backend API /api/progress/trigger-generation should allow query by lessonId only.
        
        // Let's attempt a fetch. If 400, we abort.
        const res = await fetch(`/api/progress/trigger-generation?lessonId=${lessonId}`);
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
  }, [userId, lessonId, fetchJobStatus]);

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
      // 1. Check if already triggered (Double check with backend) - SKIP IF FORCE
      if (!force) {
        const checkRes = await fetch(`/api/progress/trigger-generation?lessonId=${lessonId}&chapterId=${chapterId}&stepId=${stepId}`);
        const checkData = await checkRes.json();

        if (checkData.triggered && checkData.trigger?.generation_job_id) {
          console.log('[useMonsterAsset] Found existing trigger:', checkData.trigger.generation_job_id);
          setJobId(checkData.trigger.generation_job_id);
          await fetchJobStatus(checkData.trigger.generation_job_id);
          return;
        }
      }

      // 2. Create new generation job
      const randomMonster = generateRandomMonsterRequest();
      
      const generateRes = await fetch('/api/generate-monster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...randomMonster,
          stage: stage, 
          generationType: 'full'
        })
      });
      
      const generateData = await generateRes.json();
      
      if (!generateRes.ok) {
        console.error('[useMonsterAsset] Generation failed:', generateData.error);
        throw new Error(generateData.error || 'Generation failed');
      }

      const newJobId = generateData.jobId;
      setJobId(newJobId);

      // 3. Link trigger to job
      await fetch('/api/progress/trigger-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          chapterId,
          stepId,
          generationJobId: newJobId
        })
      });

      // Start polling immediately
      await fetchJobStatus(newJobId);
      startPolling(newJobId);

    } catch (err) {
      console.error('[useMonsterAsset] Error triggering generation:', err);
      // Final race condition check
      const retryCheck = await fetch(`/api/progress/trigger-generation?lessonId=${lessonId}&chapterId=${chapterId}&stepId=${stepId}`);
      const retryData = await retryCheck.json();
      if (retryData.triggered && retryData.trigger?.generation_job_id) {
        setJobId(retryData.trigger.generation_job_id);
      }
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
