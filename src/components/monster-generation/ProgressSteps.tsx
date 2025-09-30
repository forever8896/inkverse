import { motion } from 'motion/react';
import { useJobProgressDisplay } from '@/hooks/useMonsterGeneration';

interface ProgressStepsProps {
  jobId: string;
  className?: string;
}

export function ProgressSteps({ jobId, className = "" }: ProgressStepsProps) {
  const { steps } = useJobProgressDisplay(jobId);

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      <div className="space-y-4">
        {steps.map((step: any, index: number) => {
          const { isCompleted, isCurrent } = step;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center p-4 rounded-xl border transition-all duration-500 ${
                isCompleted
                  ? 'border-green-500/50 bg-green-500/10 text-green-200'
                  : isCurrent
                  ? 'border-purple-400/50 bg-purple-500/10 text-purple-200'
                  : 'border-slate-600 bg-slate-800/30 text-slate-400'
              }`}
            >
              <motion.div
                className={`text-2xl mr-4 ${isCurrent ? 'animate-pulse' : ''}`}
                animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {isCompleted ? '✅' : step.emoji}
              </motion.div>
              
              <div className="flex-1">
                <span className="font-medium">{step.label}</span>
                {isCurrent && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    className="h-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full mt-2"
                  />
                )}
              </div>
              
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-400 font-semibold"
                >
                  Complete
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}