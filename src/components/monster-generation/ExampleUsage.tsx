/**
 * Example Usage Component
 * 
 * This component demonstrates how the modular monster generation system
 * can be used throughout the application. It shows various ways to display
 * generation status and results using the hooks and components we created.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { StatusWidget, JobResults } from '@/components/monster-generation';
import { useJobMonitor, useJobCollection, useMonsterGeneration, useJobResults } from '@/hooks/useMonsterGeneration';

// Example: Header notification showing active generations
export function HeaderGenerationStatus() {
  const { jobs } = useMonsterGeneration();
  
  // Find any active jobs
  const activeJobs = Object.values(jobs).filter(job =>
    ['pending', 'generating_image', 'converting_3d'].includes(job.status)
  );

  if (activeJobs.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {activeJobs.map(job => (
        <StatusWidget
          key={job.id}
          jobId={job.id}
          size="sm"
          clickable
          onClick={() => window.open(`/generate/${job.id}`, '_blank')}
          className="bg-slate-900/90 border-purple-400/50"
        />
      ))}
    </div>
  );
}

// Example: Dashboard widget showing recent generations
export function RecentGenerationsWidget({ jobIds }: { jobIds: string[] }) {
  const { jobs, getCompletedJobs, getProcessingJobs, totalJobs } = useJobCollection(jobIds);

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Your Monsters</h3>
        <span className="text-sm text-slate-400">{totalJobs} total</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{getCompletedJobs().length}</div>
          <div className="text-xs text-slate-400">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{getProcessingJobs().length}</div>
          <div className="text-xs text-slate-400">In Progress</div>
        </div>
      </div>

      <div className="space-y-2">
        {jobs.slice(0, 3).map(job => (
          <StatusWidget
            key={job.id}
            jobId={job.id}
            size="sm"
            clickable
            onClick={() => window.location.href = `/generate/${job.id}`}
          />
        ))}
      </div>
    </div>
  );
}

// Example: Mini viewer for completed monsters
export function CompletedMonsterCard({ jobId }: { jobId: string }) {
  const { job, hasResults } = useJobResults(jobId);

  if (!hasResults) return null;

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-600">
      {job?.imageUrl && (
        <img
          src={job.imageUrl}
          alt="Generated monster"
          className="w-full h-32 object-cover"
        />
      )}
      <div className="p-3">
        <h4 className="font-medium text-white truncate">{job?.prompt}</h4>
        <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
          <span className="capitalize">{job?.style} • {job?.stage}</span>
          <span>${job?.totalCost?.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// Example: Inline job monitor for any page
export function InlineJobMonitor({ jobId, onComplete }: { 
  jobId: string; 
  onComplete?: () => void;
}) {
  const router = useRouter();
  const { 
    job, 
    status, 
    progress, 
    isCompleted, 
    isFailed,
    isProcessing 
  } = useJobMonitor(jobId, true); // Auto-start monitoring

  // Handle completion
  React.useEffect(() => {
    if (isCompleted && onComplete) {
      onComplete();
    }
  }, [isCompleted, onComplete]);

  if (!job) return null;

  return (
    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
      {isProcessing && (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-300">Creating your monster...</span>
            <span className="text-sm font-medium text-purple-400">{progress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}

      {isCompleted && (
        <div className="text-center">
          <div className="text-2xl mb-2">🎉</div>
          <p className="text-green-400 font-medium mb-3">Monster created successfully!</p>
          <button
            onClick={() => router.push(`/generate/${jobId}`)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm font-medium transition-colors"
          >
            View Results
          </button>
        </div>
      )}

      {isFailed && (
        <div className="text-center">
          <div className="text-2xl mb-2">💥</div>
          <p className="text-red-400 font-medium mb-3">Generation failed</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded text-white text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

// Example: Sidebar showing all user's active generations
export function ActiveGenerationsSidebar() {
  const { jobs } = useMonsterGeneration();
  
  const activeJobs = Object.values(jobs).filter(job =>
    ['pending', 'generating_image', 'converting_3d'].includes(job.status)
  );

  if (activeJobs.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400">
        <div className="text-4xl mb-2">🦖</div>
        <p className="text-sm">No active generations</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <h3 className="font-semibold text-white">Active Generations</h3>
      {activeJobs.map(job => (
        <StatusWidget
          key={job.id}
          jobId={job.id}
          size="md"
          clickable
          onClick={() => window.location.href = `/generate/${job.id}`}
        />
      ))}
    </div>
  );
}