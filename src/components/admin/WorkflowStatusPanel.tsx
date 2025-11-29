import { EnrichedWorkflowRun } from '@/lib/workflow-data';
import { getWorkflowInspectorUrl } from '@/lib/workflow-utils';

interface WorkflowStatusPanelProps {
  workflow: EnrichedWorkflowRun | null;
}

export function WorkflowStatusPanel({ workflow }: WorkflowStatusPanelProps) {
  if (!workflow) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
        <h3 className="font-pixel text-[10px] uppercase text-slate-400 mb-4 tracking-wider">
          ⚙️ Workflow Status
        </h3>
        <div className="text-slate-400 text-sm">
          No workflow run associated with this job.
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    running: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    completed: 'bg-green-500/20 text-green-300 border-green-500/50',
    failed: 'bg-red-500/20 text-red-300 border-red-500/50',
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    paused: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    cancelled: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
  };

  const statusEmojis: Record<string, string> = {
    running: '▶️',
    completed: '✅',
    failed: '❌',
    pending: '⏳',
    paused: '⏸️',
    cancelled: '🛑',
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-pixel text-[10px] uppercase text-cyan-300 tracking-wider">
          ⚙️ Workflow Run
        </h3>
        <a
          href={getWorkflowInspectorUrl(workflow.runId)}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 hover:border-cyan-400 rounded text-cyan-300 hover:text-cyan-100 font-pixel text-[7px] uppercase transition-all"
        >
          Inspector →
        </a>
      </div>

      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-slate-300 text-sm">Status:</span>
          <div className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${
            statusColors[workflow.status] || statusColors.pending
          }`}>
            <span className="mr-2">{statusEmojis[workflow.status] || '❓'}</span>
            {workflow.status}
          </div>
        </div>

        {/* Run ID */}
        <div>
          <div className="text-xs font-medium text-slate-300 mb-1 uppercase">Run ID:</div>
          <div className="text-white font-mono text-xs break-all bg-slate-900/50 rounded p-2 border border-slate-700/30">
            {workflow.runId}
          </div>
        </div>

        {/* Current Step */}
        {workflow.currentStep && (
          <div>
            <div className="text-xs font-medium text-slate-300 mb-1 uppercase">Currently Executing:</div>
            <div className="text-cyan-300 font-medium">
              {getStepDisplayName(workflow.currentStep.stepName)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Attempt {workflow.currentStep.attempt}
            </div>
          </div>
        )}

        {/* Timing */}
        <div className="grid grid-cols-2 gap-4">
          {workflow.startedAt && (
            <div>
              <div className="text-xs font-medium text-slate-300 mb-1 uppercase">Started:</div>
              <div className="text-white text-sm">
                {formatDate(workflow.startedAt)}
              </div>
            </div>
          )}
          {workflow.completedAt && (
            <div>
              <div className="text-xs font-medium text-slate-300 mb-1 uppercase">Completed:</div>
              <div className="text-white text-sm">
                {formatDate(workflow.completedAt)}
              </div>
            </div>
          )}
        </div>

        {/* Duration */}
        {workflow.duration && (
          <div>
            <div className="text-xs font-medium text-slate-300 mb-1 uppercase">Duration:</div>
            <div className="text-white font-bold text-lg">
              {formatDuration(Math.floor(workflow.duration / 1000))}
            </div>
          </div>
        )}

        {/* Workflow Error */}
        {workflow.error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="text-xs font-medium text-red-200 mb-1 uppercase">
              Workflow Error:
            </div>
            <div className="text-red-100 text-sm font-mono break-words">
              {workflow.error}
            </div>
            {workflow.errorCode && (
              <div className="text-xs text-red-300 mt-2">
                Code: {workflow.errorCode}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-700/30">
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">Steps</div>
            <div className="text-white font-bold text-lg">{workflow.steps.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">Events</div>
            <div className="text-white font-bold text-lg">{workflow.events.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">Retries</div>
            <div className="text-orange-300 font-bold text-lg">
              {workflow.steps.reduce((sum, s) => sum + (s.attempt > 0 ? s.attempt - 1 : 0), 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function
function getStepDisplayName(stepName: string): string {
  const names: Record<string, string> = {
    checkStorage: 'Pre-flight Storage Check',
    generateImage: 'Image Generation (OpenAI)',
    convert3D: '3D Conversion (fal.ai)',
    markComplete: 'Mark Job Complete',
  };
  return names[stepName] || stepName;
}
