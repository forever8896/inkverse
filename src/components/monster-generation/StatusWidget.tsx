import { motion } from 'motion/react';
import { useJobStatusDisplay, usePollCount } from '@/hooks/useMonsterGeneration';

interface StatusWidgetProps {
  jobId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
  onClick?: () => void;
}

export function StatusWidget({ 
  jobId, 
  className = "", 
  size = 'md', 
  clickable = false,
  onClick 
}: StatusWidgetProps) {
  const { job, status, message, emoji, progress, isLoading } = useJobStatusDisplay(jobId);
  const pollCount = usePollCount(jobId);

  if (!job) {
    return null;
  }

  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-base',
    lg: 'p-6 text-lg'
  };

  const emojiSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const Component = clickable ? motion.button : motion.div;

  return (
    <Component
      onClick={clickable ? onClick : undefined}
      whileHover={clickable ? { scale: 1.02 } : undefined}
      whileTap={clickable ? { scale: 0.98 } : undefined}
      className={`
        bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-600 
        ${sizeClasses[size]} ${className}
        ${clickable ? 'cursor-pointer hover:bg-slate-700/50 transition-colors' : ''}
        ${isLoading ? 'animate-pulse' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Status Emoji */}
        <motion.div
          animate={isLoading ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={emojiSizes[size]}
        >
          {emoji}
        </motion.div>

        {/* Status Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white truncate">
            {message}
          </div>
          
          {isLoading && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-xs text-slate-400 min-w-0">
                {progress}%
              </span>
            </div>
          )}

          {size !== 'sm' && job.prompt && (
            <div className="text-xs text-slate-400 mt-1 truncate">
              "{job.prompt}"
            </div>
          )}
        </div>

        {/* Poll indicator for debugging */}
        {size === 'lg' && pollCount > 0 && (
          <div className="text-xs text-slate-500">
            #{pollCount}
          </div>
        )}
      </div>
    </Component>
  );
}