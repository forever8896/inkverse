import { motion } from 'motion/react';

interface ProgressBarProps {
  progress: number;
  status: string;
  className?: string;
}

export function ProgressBar({ progress, status, className = "" }: ProgressBarProps) {
  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20" />
        
        {/* Progress fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            boxShadow: '0 0 20px rgba(147, 51, 234, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2)',
          }}
        />
        
        {/* Animated shimmer effect */}
        {progress > 0 && progress < 100 && (
          <motion.div
            className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: [-64, progress * 8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
      
      {/* Progress percentage */}
      <div className="flex justify-between items-center mt-3">
        <motion.span
          key={progress}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"
        >
          {progress}%
        </motion.span>
        <span className="text-slate-400 text-sm">
          {status === 'completed' ? 'Generation Complete!' : 'In Progress...'}
        </span>
      </div>
    </div>
  );
}