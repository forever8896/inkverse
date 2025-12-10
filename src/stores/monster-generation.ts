import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import {
  isFailed as isFailedStatus,
  isProcessing as isProcessingStatus,
  isTerminal,
  STATUS_MESSAGES,
  STATUS_EMOJIS,
  PROGRESS_STEPS,
  type GenerationStatus
} from '@/lib/status-constants';

// Re-export types from the existing page for consistency
export interface GenerationJobData {
  id: string;
  userId: string;
  prompt: string;
  style: 'cute' | 'fierce' | 'mysterious' | 'playful' | 'cosmic';
  stage: 'egg' | 'young' | 'adult';
  generationType: 'full' | 'image_only';
  status: 
    | 'pending' 
    | 'generating_image' 
    | 'image_generation_failed'
    | 'image_generation_retrying'
    | 'converting_3d' 
    | 'conversion_failed'
    | 'conversion_retrying'
    | 'completed' 
    | 'failed_permanent'
    | 'failed' // Legacy/General
    | 'waiting_on_storage';

  progress: number;
  errorMessage?: string;
  imageS3Key?: string;
  imageUrl?: string;
  glbS3Key?: string;
  glbUrl?: string;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface MonsterStatusResponse {
  success: boolean;
  job?: GenerationJobData;
  error?: string;
}

// Re-export status constants with emoji-prefixed messages for backward compatibility
export const statusMessages: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_MESSAGES).map(([key, msg]) => [key, `${STATUS_EMOJIS[key as GenerationStatus]} ${msg}`])
);

export const statusEmojis = STATUS_EMOJIS;

export const progressSteps = PROGRESS_STEPS;

const POLLING_CONFIG = {
  initialInterval: 2000,      // 2 seconds
  maxInterval: 30000,         // 30 seconds max
  backoffMultiplier: 1.5,     // Increase by 50% each failure
  jitterPercent: 0.2,         // +/- 20% randomness
  maxConsecutiveFailures: 10, // Stop after 10 failures
};

interface PollingState {
  interval: number;
  consecutiveFailures: number;
  paused: boolean;
  timeoutId: NodeJS.Timeout | null;
}

// Store state interface
interface MonsterGenerationState {
  // Current jobs being tracked
  jobs: Record<string, GenerationJobData>;
  
  // Active job being viewed/monitored
  activeJobId: string | null;
  
  // Global loading states
  loading: boolean;
  error: string | null;
  
  // Polling state
  pollingStates: Record<string, PollingState>;
  pollCounts: Record<string, number>;
  
  // Actions
  setActiveJob: (jobId: string | null) => void;
  setJob: (job: GenerationJobData) => void;
  updateJob: (jobId: string, updates: Partial<GenerationJobData>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Job operations
  fetchJobStatus: (jobId: string) => Promise<GenerationJobData | null>;
  refreshUrls: (jobId: string) => Promise<void>;
  startPolling: (jobId: string) => void;
  stopPolling: (jobId: string) => void;
  pausePolling: (jobId: string) => void;
  resumePolling: (jobId: string) => void;
  stopAllPolling: () => void;
  
  // Computed getters
  getJob: (jobId: string) => GenerationJobData | null;
  getActiveJob: () => GenerationJobData | null;
  isJobCompleted: (jobId: string) => boolean;
  isJobFailed: (jobId: string) => boolean;
  isJobProcessing: (jobId: string) => boolean;
  
  // Cleanup
  cleanup: () => void;
}

export const useMonsterGenerationStore = create<MonsterGenerationState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      jobs: {},
      activeJobId: null,
      loading: false,
      error: null,
      pollingStates: {},
      pollCounts: {},

      // Basic setters
      setActiveJob: (jobId) => set({ activeJobId: jobId }, false, 'setActiveJob'),
      
      setJob: (job) => set(
        (state) => ({
          jobs: { ...state.jobs, [job.id]: job },
        }),
        false,
        'setJob'
      ),

      updateJob: (jobId, updates) => set(
        (state) => ({
          jobs: {
            ...state.jobs,
            [jobId]: { ...state.jobs[jobId], ...updates },
          },
        }),
        false,
        'updateJob'
      ),

      setLoading: (loading) => set({ loading }, false, 'setLoading'),
      
      setError: (error) => set({ error }, false, 'setError'),
      
      clearError: () => set({ error: null }, false, 'clearError'),

      // Job operations
      fetchJobStatus: async (jobId: string): Promise<GenerationJobData | null> => {
        const state = get();
        
        try {
          state.clearError();
          
          const response = await fetch(`/api/monster-status/${jobId}`);
          const data = await response.json() as MonsterStatusResponse & { urlFreshness?: { imageUrl?: { fresh: boolean }, glbUrl?: { fresh: boolean } } };

          if (!response.ok) {
            if (response.status === 401) {
              // Handle auth redirect - could emit an event or set a flag
              throw new Error('Authentication required');
            }
            throw new Error(data.error || 'Failed to fetch job status');
          }

          if (!data.success || !data.job) {
            throw new Error('Invalid response from server');
          }

          // Update the job in store
          state.setJob(data.job);
          
          // Check freshness and trigger explicit refresh if needed
          if (data.urlFreshness && 
             (data.urlFreshness.imageUrl?.fresh === false || data.urlFreshness.glbUrl?.fresh === false)) {
             console.log(`[Store] Detected stale URLs for job ${jobId}, triggering refresh...`);
             get().refreshUrls(jobId);
          }
          
          // Update poll count (use fresh state inside setter to avoid stale reference)
          set((freshState) => ({
            pollCounts: { ...freshState.pollCounts, [jobId]: (freshState.pollCounts[jobId] || 0) + 1 }
          }), false, 'incrementPollCount');

          return data.job;
        } catch (error: any) {
          console.error('Failed to fetch job status:', error);
          // Don't set global error on poll failure to avoid UI flicker, unless it's persistent
          // state.setError(error.message); 
          return null;
        }
      },

      refreshUrls: async (jobId: string) => {
        const state = get();
        try {
          const response = await fetch(`/api/jobs/${jobId}/refresh-urls`, { method: 'POST' });
          const data = await response.json();
          
          if (data.success) {
            state.updateJob(jobId, {
              imageUrl: data.imageUrl,
              glbUrl: data.glbUrl,
              updatedAt: new Date().toISOString()
            });
            console.log(`[Store] URLs refreshed for job ${jobId}`);
          }
        } catch (error) {
          console.error('[Store] Failed to refresh URLs:', error);
        }
      },

      startPolling: (jobId: string) => {
        const state = get();
        
        // Stop existing polling
        state.stopPolling(jobId);

        // Initialize polling state
        const initialPollingState: PollingState = {
          interval: POLLING_CONFIG.initialInterval,
          consecutiveFailures: 0,
          paused: false,
          timeoutId: null
        };

        // Set initial state immediately
        set(s => ({
          pollingStates: { ...s.pollingStates, [jobId]: initialPollingState }
        }), false, 'initPolling');

        const poll = async () => {
          const currentState = get().pollingStates[jobId];
          
          if (!currentState) return; // Polling stopped
          if (currentState.paused) return; // Polling paused

          const job = await get().fetchJobStatus(jobId);
          
          // Get fresh state after async op
          const freshState = get().pollingStates[jobId];
          if (!freshState) return; 

          let nextInterval = freshState.interval;
          let failures = freshState.consecutiveFailures;

          if (job) {
            // Success - reset backoff
            failures = 0;
            nextInterval = POLLING_CONFIG.initialInterval;

            // Check for terminal states using shared type guard
            if (isTerminal(job.status)) {
              get().stopPolling(jobId);
              return;
            }
          } else {
            // Failure - apply backoff
            failures++;
            nextInterval = Math.min(
              nextInterval * POLLING_CONFIG.backoffMultiplier,
              POLLING_CONFIG.maxInterval
            );

            if (failures >= POLLING_CONFIG.maxConsecutiveFailures) {
              get().setError('Connection lost - stopped polling. Please refresh.');
              get().stopPolling(jobId);
              return;
            }
          }

          // Calculate jitter
          const jitter = nextInterval * POLLING_CONFIG.jitterPercent * (Math.random() - 0.5);
          const finalInterval = Math.max(1000, nextInterval + jitter); // Min 1s

          // Schedule next poll
          const timeoutId = setTimeout(poll, finalInterval);
          
          // Update state
          set(s => ({
            pollingStates: {
              ...s.pollingStates,
              [jobId]: {
                ...freshState,
                interval: nextInterval,
                consecutiveFailures: failures,
                timeoutId
              }
            }
          }), false, 'scheduleNextPoll');
        };

        // Start first poll immediately
        poll();
      },

      stopPolling: (jobId: string) => {
        const state = get();
        const pollingState = state.pollingStates[jobId];
        
        if (pollingState?.timeoutId) {
          clearTimeout(pollingState.timeoutId);
        }
        
        if (pollingState) {
          set((state) => {
            const { [jobId]: removed, ...rest } = state.pollingStates;
            return { pollingStates: rest };
          }, false, 'stopPolling');
        }
      },

      pausePolling: (jobId: string) => {
        const state = get();
        const pollingState = state.pollingStates[jobId];
        
        if (pollingState) {
          if (pollingState.timeoutId) clearTimeout(pollingState.timeoutId);
          
          set(s => ({
            pollingStates: {
              ...s.pollingStates,
              [jobId]: { ...pollingState, paused: true, timeoutId: null }
            }
          }), false, 'pausePolling');
        }
      },

      resumePolling: (jobId: string) => {
        const state = get();
        const pollingState = state.pollingStates[jobId];
        
        if (pollingState && pollingState.paused) {
          set(s => ({
            pollingStates: {
              ...s.pollingStates,
              [jobId]: { ...pollingState, paused: false }
            }
          }), false, 'resumePolling');
          
          // Restart loop
          get().startPolling(jobId); 
          // Note: calling startPolling resets backoff, which is usually fine for resume
          // Or we could extract the 'poll' function to be reusable without reset
          // But reset is safer for "I'm back" scenario
        }
      },

      stopAllPolling: () => {
        const state = get();
        
        Object.values(state.pollingStates).forEach(ps => {
          if (ps.timeoutId) clearTimeout(ps.timeoutId);
        });
        
        set({ pollingStates: {} }, false, 'stopAllPolling');
      },

      // Computed getters
      getJob: (jobId: string) => {
        return get().jobs[jobId] || null;
      },

      getActiveJob: () => {
        const state = get();
        return state.activeJobId ? state.jobs[state.activeJobId] || null : null;
      },

      isJobCompleted: (jobId: string) => {
        const job = get().jobs[jobId];
        return job?.status === 'completed';
      },

      isJobFailed: (jobId: string) => {
        const job = get().jobs[jobId];
        return isFailedStatus(job?.status);
      },

      isJobProcessing: (jobId: string) => {
        const job = get().jobs[jobId];
        return isProcessingStatus(job?.status);
      },

      // Cleanup
      cleanup: () => {
        get().stopAllPolling();
        set({
          jobs: {},
          activeJobId: null,
          loading: false,
          error: null,
          pollCounts: {},
        }, false, 'cleanup');
      },
    })),
    { name: 'monster-generation-store' }
  )
);

// Selector hooks for performance optimization
export const useActiveJob = () => useMonsterGenerationStore((state) => state.getActiveJob());
export const useJob = (jobId: string) => useMonsterGenerationStore((state) => state.getJob(jobId));
export const useJobStatus = (jobId: string) => useMonsterGenerationStore((state) => state.jobs[jobId]?.status);
export const useJobProgress = (jobId: string) => useMonsterGenerationStore((state) => state.jobs[jobId]?.progress || 0);
export const useGenerationError = () => useMonsterGenerationStore((state) => state.error);
export const useGenerationLoading = () => useMonsterGenerationStore((state) => state.loading);
export const usePollCount = (jobId: string) => useMonsterGenerationStore((state) => state.pollCounts[jobId] || 0);
