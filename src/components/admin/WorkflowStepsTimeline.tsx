import { motion } from 'motion/react';
import { Step } from '@workflow/world';

interface WorkflowStepsTimelineProps {
  steps: Step[];
  currentStepName?: string;
}

export function WorkflowStepsTimeline({ steps, currentStepName }: WorkflowStepsTimelineProps) {
  const stepIcons: Record<string, string> = {
    checkStorage: '🧰',
    generateImage: '🎨',
    convert3D: '🏗️',
    markComplete: '✅',
  };

  const stepNames: Record<string, string> = {
    checkStorage: 'Pre-flight Storage Check',
    generateImage: 'Image Generation (OpenAI)',
    convert3D: '3D Conversion (fal.ai)',
    markComplete: 'Mark Job Complete',
  };

  // Sort steps by createdAt to show chronological order
  const sortedSteps = [...steps].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
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
      <h3 className="font-pixel text-[10px] uppercase text-purple-300 mb-4 tracking-wider">
        🔄 Workflow Steps ({steps.length})
      </h3>

      <div className="space-y-3">
        {sortedSteps.map((step, index) => {
          const isActive = step.status === 'running';
          const isCompleted = step.status === 'completed';
          const isFailed = step.status === 'failed';
          
          // Calculate step duration
          const duration = step.completedAt && step.startedAt
            ? Math.floor((new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime()) / 1000)
            : null;

          return (
            <div
              key={step.stepId}
              className={`relative pl-8 pb-4 ${
                index < steps.length - 1 ? 'border-l-2 ml-3' : ''
              } ${
                isCompleted ? 'border-green-500/30' :
                isActive ? 'border-blue-500/50' :
                isFailed ? 'border-red-500/30' :
                'border-slate-600/30'
              }`}
            >
              {/* Step Icon/Status Circle */}
              <div
                className={`absolute left-0 top-0 -translate-x-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                  isCompleted ? 'bg-green-500/20 border-green-500 text-green-300' :
                  isActive ? 'bg-blue-500/20 border-blue-500 text-blue-300 animate-pulse' :
                  isFailed ? 'bg-red-500/20 border-red-500 text-red-300' :
                  'bg-slate-700/50 border-slate-600 text-slate-400'
                }`}
              >
                {isCompleted ? '✓' :
                 isActive ? '▶' :
                 isFailed ? '✗' :
                 index + 1}
              </div>

              {/* Step Content */}
              <div className={`${isActive ? 'bg-blue-500/5 rounded-lg p-3 -ml-3' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{stepIcons[step.stepName] || '⚙️'}</span>
                      <span className={`font-medium text-sm ${
                        isActive ? 'text-blue-300' :
                        isCompleted ? 'text-green-300' :
                        isFailed ? 'text-red-300' :
                        'text-slate-400'
                      }`}>
                        {stepNames[step.stepName] || step.stepName}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      ID: {step.stepId.split('/').pop()?.slice(0, 8)}...
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`px-2 py-1 rounded text-[10px] font-medium uppercase ${
                    isCompleted ? 'bg-green-500/20 text-green-300' :
                    isActive ? 'bg-blue-500/20 text-blue-300' :
                    isFailed ? 'bg-red-500/20 text-red-300' :
                    'bg-slate-600/20 text-slate-400'
                  }`}>
                    {step.status}
                  </div>
                </div>

                {/* Timing Information */}
                {step.startedAt && (
                  <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                    <div>
                      <div className="text-slate-500">Started:</div>
                      <div className="text-slate-300">
                        {formatTime(step.startedAt)}
                      </div>
                    </div>
                    {duration !== null && (
                      <div>
                        <div className="text-slate-500">Duration:</div>
                        <div className="text-slate-300 font-bold">
                          {formatDuration(duration)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Retry Information */}
                {step.attempt > 1 && (
                  <div className="mt-2 text-xs text-orange-300 flex items-center gap-1">
                    <span>🔄</span> Retry attempt {step.attempt}
                  </div>
                )}

                {/* Step Error */}
                {step.error && (
                  <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded p-2">
                    <div className="text-xs text-red-200 font-mono break-words">
                      {step.error}
                    </div>
                    {step.errorCode && (
                      <div className="text-[10px] text-red-300 mt-1">
                        Code: {step.errorCode}
                      </div>
                    )}
                  </div>
                )}

                {/* Active Step Indicator */}
                {isActive && (
                  <div className="mt-2 flex items-center text-blue-300 text-xs">
                    <motion.div
                      className="w-2 h-2 bg-blue-400 rounded-full mr-2"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    Executing now...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Progress */}
      <div className="mt-4 pt-4 border-t border-slate-700/30">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-300">Completed Steps:</span>
          <span className="text-white font-bold">
            {steps.filter(s => s.status === 'completed').length} / {steps.length}
          </span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-cyan-500 h-1.5 rounded-full transition-all duration-300"
            style={{
              width: `${steps.length > 0 ? (steps.filter(s => s.status === 'completed').length / steps.length) * 100 : 0}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}
