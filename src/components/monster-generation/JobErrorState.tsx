import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useJob } from '@/hooks/useMonsterGeneration';

interface JobErrorStateProps {
  jobId: string;
  className?: string;
  showActions?: boolean;
}

export function JobErrorState({ jobId, className = "", showActions = true }: JobErrorStateProps) {
  const router = useRouter();
  const job = useJob(jobId);

  if (!job || job.status !== 'failed') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className={`bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center ${className}`}
    >
      <div className="text-6xl mb-4">💥</div>
      <h3 className="text-2xl font-bold text-white mb-4">Generation Failed</h3>
      <p className="text-red-200 mb-6">
        {job.errorMessage || 'Something went wrong during the creation process.'}
      </p>
      
      {job.prompt && (
        <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
          <p className="text-sm text-slate-400 mb-1">Attempted to create:</p>
          <p className="text-slate-300 italic">"{job.prompt}"</p>
        </div>
      )}

      {showActions && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/generate')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-xl text-white font-semibold transition-all duration-200"
          >
            🔄 Try Again
          </button>
          <button
            onClick={() => router.push('/lab')}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold transition-all duration-200"
          >
            🏠 Back to Lab
          </button>
        </div>
      )}
    </motion.div>
  );
}