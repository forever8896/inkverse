'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { getErrorMessage } from '@/types/errors';

interface RiggableJob {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  prompt: string;
  style: string;
  stage: string;
  glbS3Key: string;
  glbUrl?: string;
  tripoImportTaskId?: string;
  tripoImportStatus?: string;
  riggingStatus?: string;
  riggingTaskId?: string;
  rigCheckTaskId?: string;
  rigType?: string;
  riggedGlbS3Key?: string;
  riggedGlbUrl?: string;
  animationTaskId?: string;
  animationPreset?: string;
  animatedGlbS3Key?: string;
  animatedGlbUrl?: string;
  tripoEstimatedCost: number;
  riggingStartedAt?: string;
  riggingCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface RiggingJobsResponse {
  success: boolean;
  jobs?: RiggableJob[];
  total?: number;
  error?: string;
}

// Animation presets by rig type
const ANIMATION_PRESETS: Record<string, string[]> = {
  biped: [
    'preset:idle',
    'preset:walk',
    'preset:run',
    'preset:dive',
    'preset:climb',
    'preset:jump',
    'preset:slash',
    'preset:shoot',
    'preset:hurt',
    'preset:fall',
    'preset:turn',
  ],
  quadruped: ['preset:quadruped:walk'],
  hexapod: ['preset:hexapod:walk'],
  octopod: ['preset:octopod:walk'],
  serpentine: ['preset:serpentine:march'],
  aquatic: ['preset:aquatic:march'],
  avian: [],
};

// Status badge colors and labels
const getStatusDisplay = (job: RiggableJob): { label: string; emoji: string; colorClass: string } => {
  // Check rigging status first
  if (job.riggingStatus) {
    switch (job.riggingStatus) {
      case 'checking':
        return { label: 'Checking...', emoji: '🔍', colorClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'riggable':
        return { label: `Riggable: ${job.rigType || 'unknown'}`, emoji: '✓', colorClass: 'bg-green-500/20 text-green-300 border-green-500/30' };
      case 'not_riggable':
        return { label: 'Not Riggable', emoji: '✗', colorClass: 'bg-red-500/20 text-red-300 border-red-500/30' };
      case 'rigging':
        return { label: 'Rigging...', emoji: '🦴', colorClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'rigged':
        return { label: 'Rigged', emoji: '🦴', colorClass: 'bg-green-500/20 text-green-300 border-green-500/30' };
      case 'rig_failed':
        return { label: 'Rig Failed', emoji: '❌', colorClass: 'bg-red-500/20 text-red-300 border-red-500/30' };
      case 'animating':
        return { label: 'Animating...', emoji: '🎬', colorClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      case 'animated':
        return { label: 'Animated', emoji: '🎬', colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'animation_failed':
        return { label: 'Animation Failed', emoji: '❌', colorClass: 'bg-red-500/20 text-red-300 border-red-500/30' };
    }
  }

  // Check import status
  if (job.tripoImportStatus) {
    switch (job.tripoImportStatus) {
      case 'importing':
        return { label: 'Importing...', emoji: '📤', colorClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
      case 'imported':
        return { label: 'Imported', emoji: '📦', colorClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'import_failed':
        return { label: 'Import Failed', emoji: '❌', colorClass: 'bg-red-500/20 text-red-300 border-red-500/30' };
    }
  }

  // Not started
  return { label: 'Not Imported', emoji: '--', colorClass: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };
};

// Get available actions based on job state
const getAvailableActions = (job: RiggableJob): {
  canImport: boolean;
  canCheck: boolean;
  canRig: boolean;
  canAnimate: boolean;
  isProcessing: boolean;
} => {
  const importStatus = job.tripoImportStatus;
  const riggingStatus = job.riggingStatus;

  const isProcessing =
    importStatus === 'importing' ||
    riggingStatus === 'checking' ||
    riggingStatus === 'rigging' ||
    riggingStatus === 'animating';

  return {
    canImport: !importStatus || importStatus === 'import_failed',
    canCheck: importStatus === 'imported' && !riggingStatus,
    canRig: riggingStatus === 'riggable',
    canAnimate: riggingStatus === 'rigged' || riggingStatus === 'animated',
    isProcessing,
  };
};

export default function AdminRigging() {
  const [jobs, setJobs] = useState<RiggableJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rigTypeFilter, setRigTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [selectedAnimation, setSelectedAnimation] = useState<Record<string, string>>({});

  const jobsPerPage = 25;

  const fetchJobs = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: jobsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { riggingStatus: statusFilter }),
        ...(rigTypeFilter !== 'all' && { rigType: rigTypeFilter }),
      });

      const response = await fetch(`/api/admin/rigging?${params}`);
      const data: RiggingJobsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }

      setJobs(data.jobs || []);
      setTotalJobs(data.total || 0);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError(getErrorMessage(err, 'Failed to fetch jobs'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, rigTypeFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchJobs();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchJobs]);

  const handleImport = async (jobId: string) => {
    try {
      setProcessingJobId(jobId);
      const response = await fetch(`/api/admin/rigging/${jobId}/import`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import model');
      }

      fetchJobs();
    } catch (err) {
      console.error('Failed to import:', err);
      alert(`Failed to import: ${getErrorMessage(err)}`);
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleCheck = async (jobId: string) => {
    try {
      setProcessingJobId(jobId);
      const response = await fetch(`/api/admin/rigging/${jobId}/check`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check model');
      }

      fetchJobs();
    } catch (err) {
      console.error('Failed to check:', err);
      alert(`Failed to check: ${getErrorMessage(err)}`);
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleRig = async (jobId: string) => {
    try {
      setProcessingJobId(jobId);
      const response = await fetch(`/api/admin/rigging/${jobId}/rig`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outFormat: 'glb',
          modelVersion: 'v2.0-20250506',
          spec: 'tripo',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to rig model');
      }

      fetchJobs();
    } catch (err) {
      console.error('Failed to rig:', err);
      alert(`Failed to rig: ${getErrorMessage(err)}`);
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleAnimate = async (jobId: string) => {
    const animation = selectedAnimation[jobId];
    if (!animation) {
      alert('Please select an animation preset');
      return;
    }

    try {
      setProcessingJobId(jobId);
      const response = await fetch(`/api/admin/rigging/${jobId}/animate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animation,
          bakeAnimation: true,
          animateInPlace: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to animate model');
      }

      fetchJobs();
    } catch (err) {
      console.error('Failed to animate:', err);
      alert(`Failed to animate: ${getErrorMessage(err)}`);
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchJobs();
  };

  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <Link href="/admin" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">🦴 Model Rigging</h1>
            <p className="text-slate-400">Apply auto-rigging and animations to completed 3D models</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center text-slate-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto-refresh (5s)
            </label>
            <button
              onClick={fetchJobs}
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 border-2 border-purple-500/50 hover:border-purple-400 rounded-lg text-purple-300 hover:text-purple-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-purple-500/20"
            >
              🔄 Refresh
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-8"
        >
          <form onSubmit={handleSearch} className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Search Jobs
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by prompt, user, or job ID..."
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="null">Not Imported</option>
                <option value="importing">Importing</option>
                <option value="imported">Imported</option>
                <option value="import_failed">Import Failed</option>
                <option value="checking">Checking</option>
                <option value="riggable">Riggable</option>
                <option value="not_riggable">Not Riggable</option>
                <option value="rigging">Rigging</option>
                <option value="rigged">Rigged</option>
                <option value="rig_failed">Rig Failed</option>
                <option value="animating">Animating</option>
                <option value="animated">Animated</option>
                <option value="animation_failed">Animation Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Rig Type
              </label>
              <select
                value={rigTypeFilter}
                onChange={(e) => {
                  setRigTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="biped">Biped</option>
                <option value="quadruped">Quadruped</option>
                <option value="hexapod">Hexapod</option>
                <option value="octopod">Octopod</option>
                <option value="avian">Avian</option>
                <option value="serpentine">Serpentine</option>
                <option value="aquatic">Aquatic</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600/20 hover:bg-purple-600/40 border-2 border-purple-500/50 hover:border-purple-400 rounded-lg text-purple-300 hover:text-purple-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-purple-500/20"
            >
              🔍 Search
            </button>
            {(searchQuery || statusFilter !== 'all' || rigTypeFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setRigTypeFilter('all');
                  setCurrentPage(1);
                  fetchJobs();
                }}
                className="px-4 py-2 bg-slate-600/20 hover:bg-slate-600/40 border-2 border-slate-500/50 hover:border-slate-400 rounded-lg text-slate-300 hover:text-slate-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-slate-500/20"
              >
                Clear
              </button>
            )}
          </form>
        </motion.div>

        {/* Jobs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden"
        >
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                Riggable Jobs ({totalJobs} total)
              </h3>
              <div className="text-sm text-slate-400">
                Page {currentPage} of {Math.max(1, totalPages)}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <motion.div
                className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-slate-400">Loading jobs...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-red-300 mb-4">{error}</p>
              <button
                onClick={fetchJobs}
                className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/40 border-2 border-orange-500/50 hover:border-orange-400 rounded-lg text-orange-300 hover:text-orange-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-orange-500/20"
              >
                Retry
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-slate-400">No riggable jobs found</p>
              <p className="text-slate-500 text-sm mt-2">
                Only completed jobs with 3D models appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="text-left p-4 text-slate-300 font-medium">Model</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Status</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Rig Type</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Cost</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Updated</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {jobs.map((job, index) => {
                      const statusDisplay = getStatusDisplay(job);
                      const actions = getAvailableActions(job);
                      const availableAnimations = job.rigType ? (ANIMATION_PRESETS[job.rigType] || []) : [];
                      const isCurrentlyProcessing = processingJobId === job.id;

                      return (
                        <motion.tr
                          key={job.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="p-4">
                            <div>
                              <div className="text-white font-medium text-sm">{job.id.slice(0, 8)}...</div>
                              <div className="text-slate-400 text-sm mt-1">
                                {job.prompt.length > 40 ? `${job.prompt.slice(0, 40)}...` : job.prompt}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {job.style} • {job.stage}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div
                              className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-medium ${statusDisplay.colorClass}`}
                            >
                              <span className="mr-1">{statusDisplay.emoji}</span>
                              {statusDisplay.label}
                            </div>
                            {job.animationPreset && (
                              <div className="text-xs text-slate-400 mt-1">
                                🎬 {job.animationPreset}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="text-slate-300">
                              {job.rigType ? (
                                <span className="capitalize">{job.rigType}</span>
                              ) : (
                                <span className="text-slate-500">--</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-slate-300 font-mono text-sm">
                              ${job.tripoEstimatedCost.toFixed(4)}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-slate-300">{getTimeSince(job.updatedAt)}</div>
                            <div className="text-xs text-slate-500">{formatDate(job.updatedAt)}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-2 items-center">
                              {/* Import Button */}
                              {actions.canImport && (
                                <button
                                  onClick={() => handleImport(job.id)}
                                  disabled={isCurrentlyProcessing || actions.isProcessing}
                                  className="px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500/50 hover:border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed rounded text-yellow-300 hover:text-yellow-100 font-pixel text-[8px] uppercase transition-all hover:shadow-lg hover:shadow-yellow-500/20"
                                >
                                  {isCurrentlyProcessing ? '...' : 'Import'}
                                </button>
                              )}

                              {/* Check Button */}
                              {actions.canCheck && (
                                <button
                                  onClick={() => handleCheck(job.id)}
                                  disabled={isCurrentlyProcessing || actions.isProcessing}
                                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded text-blue-300 hover:text-blue-100 font-pixel text-[8px] uppercase transition-all hover:shadow-lg hover:shadow-blue-500/20"
                                >
                                  {isCurrentlyProcessing ? '...' : 'Check'}
                                </button>
                              )}

                              {/* Rig Button */}
                              {actions.canRig && (
                                <button
                                  onClick={() => handleRig(job.id)}
                                  disabled={isCurrentlyProcessing || actions.isProcessing}
                                  className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed rounded text-purple-300 hover:text-purple-100 font-pixel text-[8px] uppercase transition-all hover:shadow-lg hover:shadow-purple-500/20"
                                >
                                  {isCurrentlyProcessing ? '...' : 'Rig'}
                                </button>
                              )}

                              {/* Animate Controls */}
                              {actions.canAnimate && availableAnimations.length > 0 && (
                                <div className="flex gap-2 items-center">
                                  <select
                                    value={selectedAnimation[job.id] || ''}
                                    onChange={(e) =>
                                      setSelectedAnimation((prev) => ({
                                        ...prev,
                                        [job.id]: e.target.value,
                                      }))
                                    }
                                    className="px-2 py-1 bg-slate-900/50 border border-slate-600 rounded text-white text-xs focus:outline-none focus:border-cyan-500"
                                  >
                                    <option value="">Select Animation</option>
                                    {availableAnimations.map((anim) => (
                                      <option key={anim} value={anim}>
                                        {anim.replace('preset:', '').replace(':', ' ')}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleAnimate(job.id)}
                                    disabled={isCurrentlyProcessing || actions.isProcessing || !selectedAnimation[job.id]}
                                    className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 hover:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed rounded text-cyan-300 hover:text-cyan-100 font-pixel text-[8px] uppercase transition-all hover:shadow-lg hover:shadow-cyan-500/20"
                                  >
                                    {isCurrentlyProcessing ? '...' : 'Animate'}
                                  </button>
                                </div>
                              )}

                              {/* Download Links */}
                              {job.riggedGlbUrl && (
                                <a
                                  href={job.riggedGlbUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 border border-green-500/50 hover:border-green-400 rounded text-green-300 hover:text-green-100 font-pixel text-[8px] uppercase transition-all hover:shadow-lg hover:shadow-green-500/20"
                                >
                                  ⬇ Rigged
                                </a>
                              )}

                              {job.animatedGlbUrl && (
                                <a
                                  href={job.animatedGlbUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 hover:border-emerald-400 rounded text-emerald-300 hover:text-emerald-100 font-pixel text-[8px] uppercase transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                                >
                                  ⬇ Animated
                                </a>
                              )}

                              {/* View Original */}
                              <Link
                                href={`/admin/jobs/${job.id}`}
                                className="px-3 py-1.5 bg-slate-600/20 hover:bg-slate-600/40 border border-slate-500/50 hover:border-slate-400 rounded text-slate-300 hover:text-slate-100 font-pixel text-[8px] uppercase transition-all hover:shadow-lg hover:shadow-slate-500/20"
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg text-white font-medium transition-colors"
                >
                  Previous
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-600 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg text-white font-medium transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
