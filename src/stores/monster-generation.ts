import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// Re-export types from the existing page for consistency
export interface GenerationJobData {
  id: string;
  userId: string;
  prompt: string;
  style: 'cute' | 'fierce' | 'mysterious' | 'playful' | 'cosmic';
  stage: 'egg' | 'young' | 'adult';
  status: 'pending' | 'generating_image' | 'converting_3d' | 'completed' | 'failed';
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

// Status messages and emojis
export const statusMessages = {
  pending: '🥚 Initializing your monster...',
  generating_image: '🎨 AI is painting your creature...',
  converting_3d: '🏗️ Building your monster in 3D...',
  completed: '✨ Your monster is ready!',
  failed: '💥 Something went wrong...',
};

export const statusEmojis = {
  pending: '🥚',
  generating_image: '🎨',
  converting_3d: '🏗️',
  completed: '✨',
  failed: '💥',
};

export const progressSteps = [
  { threshold: 0, label: 'Queuing creation request', emoji: '📋' },
  { threshold: 5, label: 'Starting AI image generation', emoji: '🎨' },
  { threshold: 40, label: 'Image generation complete', emoji: '🖼️' },
  { threshold: 50, label: 'Beginning 3D conversion', emoji: '🔄' },
  { threshold: 90, label: '3D model created', emoji: '🏗️' },
  { threshold: 100, label: 'Monster ready!', emoji: '🎉' },
];

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
  pollingIntervals: Record<string, NodeJS.Timeout>;
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
  startPolling: (jobId: string, interval?: number) => void;
  stopPolling: (jobId: string) => void;
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
      pollingIntervals: {},
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
          const data: MonsterStatusResponse = await response.json();

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
          
          // Update poll count
          const currentCount = state.pollCounts[jobId] || 0;
          set((state) => ({
            pollCounts: { ...state.pollCounts, [jobId]: currentCount + 1 }
          }), false, 'incrementPollCount');

          return data.job;
        } catch (error: any) {
          console.error('Failed to fetch job status:', error);
          state.setError(error.message);
          return null;
        }
      },

      startPolling: (jobId: string, interval = 3000) => {
        const state = get();
        
        // Clear existing polling for this job
        state.stopPolling(jobId);

        // Initial fetch
        state.fetchJobStatus(jobId);

        // Set up polling
        const intervalId = setInterval(async () => {
          const job = await state.fetchJobStatus(jobId);
          
          // Stop polling if job is completed or failed
          if (job && (job.status === 'completed' || job.status === 'failed')) {
            state.stopPolling(jobId);
          }
        }, interval);

        // Store the interval ID
        set((state) => ({
          pollingIntervals: { ...state.pollingIntervals, [jobId]: intervalId }
        }), false, 'startPolling');
      },

      stopPolling: (jobId: string) => {
        const state = get();
        const intervalId = state.pollingIntervals[jobId];
        
        if (intervalId) {
          clearInterval(intervalId);
          
          set((state) => {
            const { [jobId]: removed, ...rest } = state.pollingIntervals;
            return { pollingIntervals: rest };
          }, false, 'stopPolling');
        }
      },

      stopAllPolling: () => {
        const state = get();
        
        Object.values(state.pollingIntervals).forEach(intervalId => {
          clearInterval(intervalId);
        });
        
        set({ pollingIntervals: {} }, false, 'stopAllPolling');
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
        return job?.status === 'failed';
      },

      isJobProcessing: (jobId: string) => {
        const job = get().jobs[jobId];
        return job && ['pending', 'generating_image', 'converting_3d'].includes(job.status);
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