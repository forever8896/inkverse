import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useJobResults } from '@/hooks/useMonsterGeneration';
import MonsterViewer from '@/components/MonsterViewer';

interface JobResultsProps {
  jobId: string;
  className?: string;
  showViewer?: boolean;
  showActions?: boolean;
}

export function JobResults({ jobId, className = "", showViewer = true, showActions = true }: JobResultsProps) {
  const router = useRouter();
  const { job, hasResults, imageUrl, glbUrl } = useJobResults(jobId);

  if (!hasResults) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className={`bg-gradient-to-br from-green-500/10 to-purple-500/10 border border-green-500/30 rounded-2xl p-8 ${className}`}
    >
      <h3 className="text-3xl font-bold text-white mb-6 text-center">
        🎉 Your Monster is Ready!
      </h3>
      
      <div className="space-y-8">
        {/* Image Preview */}
        <div className="space-y-4">
          <h4 className="text-xl font-semibold text-white">🖼️ Generated Image</h4>
          <div className="relative bg-slate-900/50 rounded-xl p-4 border border-slate-600">
            <img 
              src={imageUrl} 
              alt="Your generated monster"
              className="w-full h-auto rounded-lg"
            />
          </div>
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
          >
            📥 Download Image
          </a>
        </div>

        {/* Interactive 3D Model */}
        {showViewer && glbUrl && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-semibold text-white">🏗️ Interactive 3D Model</h4>
              <a
                href={glbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white font-medium transition-colors"
              >
                📥 Download GLB
              </a>
            </div>
            
            <MonsterViewer 
              modelUrl={glbUrl}
              height="h-96"
              showControls={true}
              autoRotate={true}
              className="w-full"
            />
            
            <p className="text-slate-400 text-sm text-center">
              ✨ Drag to rotate • Scroll to zoom • Click controls to customize
            </p>
          </div>
        )}

        {/* Monster Details */}
        {job && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4 text-center">
              Monster Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-2">🎨</div>
                <div className="font-semibold text-purple-300 capitalize">{job.style}</div>
                <div className="text-sm text-slate-400">Style</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🌱</div>
                <div className="font-semibold text-cyan-300 capitalize">{job.stage}</div>
                <div className="text-sm text-slate-400">Stage</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">💰</div>
                <div className="font-semibold text-green-300">
                  ${job.totalCost?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-slate-400">Cost</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/generate')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-xl text-white font-semibold transition-all duration-200"
            >
              🎭 Create Another Monster
            </button>
            <button
              onClick={() => router.push('/lab')}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold transition-all duration-200"
            >
              🏠 Back to Lab
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}