import { motion } from 'motion/react';
import { useJobStatusDisplay } from '@/hooks/useMonsterGeneration';

interface JobStatusCardProps {
  jobId: string;
  className?: string;
}

export function JobStatusCard({ jobId, className = "" }: JobStatusCardProps) {
  const { job, status, message, emoji, progress, containerClass, textClass, isLoading } = useJobStatusDisplay(jobId);

  if (!job) {
    return (
      <div className={`p-8 bg-slate-800/50 rounded-2xl border border-slate-700 text-center ${className}`}>
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-white mb-2">Job Not Found</h3>
        <p className="text-slate-400">Could not find job with ID: {jobId}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-8 backdrop-blur-sm rounded-2xl ${containerClass} ${className}`}
    >
      <div className="text-center">
        {/* Status Emoji */}
        <motion.div
          className="flex justify-center mb-6"
          animate={isLoading ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-2 border-purple-400/30 flex items-center justify-center text-4xl">
            {emoji}
          </div>
        </motion.div>

        {/* Status Message */}
        <motion.h3
          key={status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-2xl font-bold mb-4 ${textClass}`}
        >
          {message}
        </motion.h3>

        {/* Job Prompt */}
        {job.prompt && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-slate-300 max-w-2xl mx-auto italic"
          >
            "{job.prompt}"
          </motion.p>
        )}

        {/* Progress for active jobs */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <div className="text-xl font-semibold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              {progress}% Complete
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}