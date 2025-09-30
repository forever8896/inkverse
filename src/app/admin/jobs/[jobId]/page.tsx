'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import MonsterViewer from '@/components/MonsterViewer';

interface JobDetail {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  prompt: string;
  style: string;
  stage: string;
  status: string;
  progress: number;
  errorMessage?: string;
  userMessage?: string;
  imageS3Key?: string;
  imageUrl?: string;
  glbS3Key?: string;
  glbUrl?: string;
  totalCost: number;
  retryCount: number;
  lastError?: {
    type: string;
    userMessage: string;
    technicalMessage: string;
    retryable: boolean;
    maxRetries: number;
    currentRetries: number;
    lastRetryAt: string;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface JobDetailResponse {
  success: boolean;
  job?: JobDetail;
  error?: string;
}

const statusColors = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
  generating_image: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
  image_generation_failed: 'bg-red-500/20 text-red-300 border-red-500/50',
  image_generation_retrying: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
  converting_3d: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
  conversion_failed: 'bg-red-500/20 text-red-300 border-red-500/50',
  conversion_retrying: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
  completed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
  failed_permanent: 'bg-slate-500/20 text-slate-300 border-slate-500/50'
};

const statusEmojis = {
  pending: '🥚',
  generating_image: '🎨',
  image_generation_failed: '❌',
  image_generation_retrying: '🔄',
  converting_3d: '🏗️',
  conversion_failed: '❌',
  conversion_retrying: '🔄',
  completed: '✅',
  failed_permanent: '💀'
};

export default function AdminJobDetail() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchJobDetail();
  }, [jobId]);

  useEffect(() => {
    if (!autoRefresh || !job || job.status === 'completed' || job.status === 'failed_permanent') return;

    const interval = setInterval(() => {
      fetchJobDetail();
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, autoRefresh, job?.status]);

  const fetchJobDetail = async () => {
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`);
      const data: JobDetailResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch job details');
      }

      setJob(data.job || null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch job details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!job) return;

    if (!confirm(`Are you sure you want to delete job ${job.id}? This action cannot be undone and will delete all associated files.`)) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete job');
      }

      router.push('/admin/jobs');
    } catch (err: any) {
      console.error('Failed to delete job:', err);
      alert(`Failed to delete job: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || 'bg-slate-500/20 text-slate-300 border-slate-500/50';
  };

  const getStatusEmoji = (status: string) => {
    return statusEmojis[status as keyof typeof statusEmojis] || '❓';
  };

  const calculateJobDuration = () => {
    if (!job) return null;

    const start = new Date(job.createdAt);
    const end = job.completedAt ? new Date(job.completedAt) : new Date();
    const durationMs = end.getTime() - start.getTime();

    const minutes = Math.floor(durationMs / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-16 h-16 border-4 border-purple-500/50 border-t-purple-400 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <h2 className="text-xl font-bold text-white font-pixel uppercase text-[10px] tracking-wider">Loading...</h2>
        </motion.div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg mx-auto px-6"
        >
          <div className="text-6xl mb-6">😔</div>
          <h2 className="text-2xl font-bold text-white mb-4">Job Not Found</h2>
          <p className="text-slate-300 mb-8">{error || 'The requested job could not be found.'}</p>
          <Link
            href="/admin/jobs"
            className="inline-block px-6 py-3 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 hover:border-purple-400 rounded-lg text-purple-300 hover:text-purple-100 font-pixel text-[8px] uppercase transition-all"
          >
            ← Back to Jobs
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-8 flex-wrap gap-4"
        >
          <div>
            <Link
              href="/admin/jobs"
              className="text-purple-400 hover:text-purple-300 mb-4 inline-block font-pixel text-[8px] uppercase tracking-wider transition-colors"
            >
              ← Back
            </Link>
            <h1 className="font-pixel text-[18px] uppercase text-purple-300 tracking-wider mb-2">🔍 Job Details</h1>
            <p className="text-slate-400 text-sm font-mono">{jobId}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center text-slate-300 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto-refresh
            </label>
            <button
              onClick={fetchJobDetail}
              className="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 hover:border-cyan-400 rounded-lg text-cyan-300 hover:text-cyan-100 font-pixel text-[8px] uppercase transition-all"
            >
              🔄 Refresh
            </button>
            <button
              onClick={handleDeleteJob}
              disabled={deleting}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 hover:border-red-400 disabled:opacity-50 rounded-lg text-red-300 hover:text-red-100 font-pixel text-[8px] uppercase transition-all"
            >
              {deleting ? 'Deleting...' : '🗑️ Delete'}
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="xl:col-span-2 space-y-6"
          >
            {/* Status */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="font-pixel text-[10px] uppercase text-purple-300 mb-4 tracking-wider">📊 Status</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Current:</span>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(job.status)}`}>
                    <span className="mr-2">{getStatusEmoji(job.status)}</span>
                    {job.status.replace(/_/g, ' ')}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 text-sm">Progress:</span>
                    <span className="text-white font-bold">{job.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-cyan-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>

                {job.userMessage && (
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                    <div className="text-xs font-medium text-slate-300 mb-1 uppercase tracking-wide">Message:</div>
                    <div className="text-white text-sm">{job.userMessage}</div>
                  </div>
                )}

                {job.retryCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Retries:</span>
                    <span className="text-orange-300 font-bold">{job.retryCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Generated Content */}
            {(job.imageUrl || job.glbUrl) && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="font-pixel text-[10px] uppercase text-purple-300 mb-4 tracking-wider">🎨 Generated Content</h3>

                <div className="space-y-6">
                  {job.imageUrl && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Image</h4>
                        <a
                          href={job.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 hover:border-cyan-400 rounded text-cyan-300 hover:text-cyan-100 font-pixel text-[7px] uppercase transition-all"
                        >
                          View Full
                        </a>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                        <img
                          src={job.imageUrl}
                          alt="Generated monster"
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                      {job.imageS3Key && (
                        <div className="text-[10px] text-slate-500 mt-2 font-mono">
                          {job.imageS3Key}
                        </div>
                      )}
                    </div>
                  )}

                  {job.glbUrl && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wide">3D Model</h4>
                        <a
                          href={job.glbUrl}
                          download
                          className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 hover:border-purple-400 rounded text-purple-300 hover:text-purple-100 font-pixel text-[7px] uppercase transition-all"
                        >
                          Download
                        </a>
                      </div>
                      <MonsterViewer
                        modelUrl={job.glbUrl}
                        height="h-96"
                        showControls={true}
                        autoRotate={true}
                        className="w-full"
                      />
                      <p className="text-slate-400 text-[10px] text-center mt-2">
                        ✨ Drag to rotate • Scroll to zoom
                      </p>
                      {job.glbS3Key && (
                        <div className="text-[10px] text-slate-500 mt-2 font-mono">
                          {job.glbS3Key}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Job Details */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="font-pixel text-[10px] uppercase text-purple-300 mb-4 tracking-wider">📝 Details</h3>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-medium text-slate-300 mb-1 uppercase tracking-wide">Prompt:</div>
                  <div className="text-white bg-slate-900/50 rounded-lg p-3 text-sm border border-slate-700/30">
                    {job.prompt}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-slate-300 mb-1 uppercase tracking-wide">Style:</div>
                    <div className="text-white capitalize">{job.style}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-300 mb-1 uppercase tracking-wide">Stage:</div>
                    <div className="text-white capitalize">{job.stage}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-slate-300 mb-1 uppercase tracking-wide">Cost:</div>
                    <div className="text-white font-bold">${job.totalCost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-300 mb-1 uppercase tracking-wide">Duration:</div>
                    <div className="text-white font-bold">{calculateJobDuration()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Details */}
            {(job.lastError || job.errorMessage) && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                <h3 className="font-pixel text-[10px] uppercase text-red-300 mb-4 tracking-wider">⚠️ Error Info</h3>

                {job.lastError && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-medium text-red-200 mb-1 uppercase">Type:</div>
                        <div className="text-red-100 text-sm">{job.lastError.type}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-red-200 mb-1 uppercase">Retryable:</div>
                        <div className="text-red-100 text-sm">{job.lastError.retryable ? 'Yes' : 'No'}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-red-200 mb-1 uppercase">Message:</div>
                      <div className="text-red-100 bg-red-900/20 rounded-lg p-3 text-sm border border-red-500/20">
                        {job.lastError.userMessage}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-red-200 mb-1 uppercase">Technical:</div>
                      <div className="text-red-100 bg-red-900/20 rounded-lg p-3 font-mono text-xs border border-red-500/20">
                        {job.lastError.technicalMessage}
                      </div>
                    </div>
                  </div>
                )}

                {job.errorMessage && !job.lastError && (
                  <div>
                    <div className="text-xs font-medium text-red-200 mb-1 uppercase">Error:</div>
                    <div className="text-red-100 bg-red-900/20 rounded-lg p-3 font-mono text-sm border border-red-500/20">
                      {job.errorMessage}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* User Info */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="font-pixel text-[10px] uppercase text-purple-300 mb-4 tracking-wider">👤 User</h3>

              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-slate-300 mb-1 uppercase">Name:</div>
                  <div className="text-white text-sm">{job.userName || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-300 mb-1 uppercase">Email:</div>
                  <div className="text-white break-all text-sm">{job.userEmail || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-300 mb-1 uppercase">ID:</div>
                  <div className="text-slate-400 font-mono text-[10px] break-all">{job.userId}</div>
                </div>
                <Link
                  href={`/admin/users/${job.userId}`}
                  className="block w-full px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 hover:border-cyan-400 rounded-lg text-cyan-300 hover:text-cyan-100 text-center font-pixel text-[8px] uppercase transition-all"
                >
                  View Profile
                </Link>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="font-pixel text-[10px] uppercase text-purple-300 mb-4 tracking-wider">⏰ Times</h3>

              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-slate-300 mb-1 uppercase">Created:</div>
                  <div className="text-white text-xs">{formatDate(job.createdAt)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-300 mb-1 uppercase">Updated:</div>
                  <div className="text-white text-xs">{formatDate(job.updatedAt)}</div>
                </div>
                {job.completedAt && (
                  <div>
                    <div className="text-xs font-medium text-slate-300 mb-1 uppercase">Completed:</div>
                    <div className="text-white text-xs">{formatDate(job.completedAt)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="font-pixel text-[10px] uppercase text-purple-300 mb-4 tracking-wider">⚡ Actions</h3>

              <div className="space-y-3">
                <Link
                  href={`/generate/${job.id}`}
                  target="_blank"
                  className="block w-full px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 hover:border-emerald-400 rounded-lg text-emerald-300 hover:text-emerald-100 text-center font-pixel text-[8px] uppercase transition-all"
                >
                  Live Status
                </Link>
                <Link
                  href={`/admin/jobs?userId=${job.userId}`}
                  className="block w-full px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 hover:border-purple-400 rounded-lg text-purple-300 hover:text-purple-100 text-center font-pixel text-[8px] uppercase transition-all"
                >
                  User Jobs
                </Link>
                <Link
                  href={`/admin/jobs?status=${job.status}`}
                  className="block w-full px-4 py-2 bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/50 hover:border-orange-400 rounded-lg text-orange-300 hover:text-orange-100 text-center font-pixel text-[8px] uppercase transition-all"
                >
                  Same Status
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}