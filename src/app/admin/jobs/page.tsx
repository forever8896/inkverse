'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

interface GenerationJob {
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
  totalCost: number;
  openaiTextTokens: number;
  openaiImageTokens: number;
  openaiTotalTokens: number;
  openaiEstimatedCost: number;
  falEstimatedCost: number;
  costCalculationMethod: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  lastError?: {
    type: string;
    userMessage: string;
    retryable: boolean;
    maxRetries: number;
    currentRetries: number;
  };
}

interface JobsResponse {
  success: boolean;
  jobs?: GenerationJob[];
  total?: number;
  error?: string;
}

const statusColors = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  generating_image: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  image_generation_failed: 'bg-red-500/20 text-red-300 border-red-500/30',
  image_generation_retrying: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  converting_3d: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  conversion_failed: 'bg-red-500/20 text-red-300 border-red-500/30',
  conversion_retrying: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  completed: 'bg-green-500/20 text-green-300 border-green-500/30',
  failed_permanent: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
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

export default function AdminJobs() {
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'status' | 'progress' | 'totalCost'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  const jobsPerPage = 25;

  useEffect(() => {
    fetchJobs();
  }, [currentPage, sortBy, sortOrder, searchQuery, statusFilter]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchJobs();
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, [currentPage, sortBy, sortOrder, searchQuery, statusFilter, autoRefresh]);

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: jobsPerPage.toString(),
        sortBy,
        sortOrder,
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/jobs?${params}`);
      const data: JobsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }

      setJobs(data.jobs || []);
      setTotalJobs(data.total || 0);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchJobs();
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingJobId(jobId);
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete job');
      }

      // Refresh jobs list
      fetchJobs();
    } catch (err: any) {
      console.error('Failed to delete job:', err);
      alert(`Failed to delete job: ${err.message}`);
    } finally {
      setDeletingJobId(null);
    }
  };

  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getStatusEmoji = (status: string) => {
    return statusEmojis[status as keyof typeof statusEmojis] || '❓';
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
            <h1 className="text-4xl font-bold text-white mb-2">🎨 Generation Jobs</h1>
            <p className="text-slate-400">Monitor monster generation pipeline and job statuses</p>
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
                <option value="pending">Pending</option>
                <option value="generating_image">Generating Image</option>
                <option value="converting_3d">Converting 3D</option>
                <option value="completed">Completed</option>
                <option value="image_generation_failed">Image Failed</option>
                <option value="conversion_failed">3D Failed</option>
                <option value="image_generation_retrying">Image Retrying</option>
                <option value="conversion_retrying">3D Retrying</option>
                <option value="failed_permanent">Failed Permanent</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600/20 hover:bg-purple-600/40 border-2 border-purple-500/50 hover:border-purple-400 rounded-lg text-purple-300 hover:text-purple-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-purple-500/20"
            >
              🔍 Search
            </button>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
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
                Jobs ({totalJobs} total)
              </h3>
              <div className="text-sm text-slate-400">
                Page {currentPage} of {totalPages}
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
              <p className="text-slate-400">No jobs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="text-left p-4 text-slate-300 font-medium">Job</th>
                    <th className="text-left p-4 text-slate-300 font-medium">User</th>
                    <th 
                      className="text-left p-4 text-slate-300 font-medium cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      Status {getSortIcon('status')}
                    </th>
                    <th 
                      className="text-left p-4 text-slate-300 font-medium cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('progress')}
                    >
                      Progress {getSortIcon('progress')}
                    </th>
                    <th 
                      className="text-left p-4 text-slate-300 font-medium cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('totalCost')}
                    >
                      Cost {getSortIcon('totalCost')}
                    </th>
                    <th 
                      className="text-left p-4 text-slate-300 font-medium cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('updatedAt')}
                    >
                      Updated {getSortIcon('updatedAt')}
                    </th>
                    <th className="text-left p-4 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {jobs.map((job, index) => (
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
                              {job.prompt.length > 50 ? `${job.prompt.slice(0, 50)}...` : job.prompt}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {job.style} • {job.stage}
                              {job.retryCount > 0 && (
                                <span className="ml-2 text-orange-400">• {job.retryCount} retries</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-300">
                            {job.userName || job.userEmail || 'Unknown'}
                          </div>
                          <div className="text-xs text-slate-500">{job.userId.slice(0, 8)}...</div>
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(job.status)}`}>
                            <span className="mr-1">{getStatusEmoji(job.status)}</span>
                            {job.status.replace(/_/g, ' ')}
                          </div>
                          {job.userMessage && (
                            <div className="text-xs text-slate-400 mt-1 max-w-xs">
                              {job.userMessage}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="w-16 bg-slate-700 rounded-full h-2 mr-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                            <span className="text-slate-300 text-sm">{job.progress}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-300">
                            <div className="font-mono text-sm">
                              ${(job.openaiEstimatedCost + job.falEstimatedCost).toFixed(4)}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {job.costCalculationMethod === 'token_based' ? (
                                <>
                                  <div>🤖 ${job.openaiEstimatedCost.toFixed(4)} • 🎯 ${job.falEstimatedCost.toFixed(4)}</div>
                                  <div>{job.openaiTotalTokens.toLocaleString()} tokens</div>
                                </>
                              ) : (
                                <div>Legacy: ${job.totalCost.toFixed(2)}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-300">{getTimeSince(job.updatedAt)}</div>
                          <div className="text-xs text-slate-500">{formatDate(job.updatedAt)}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/jobs/${job.id}`}
                              className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 hover:border-cyan-400 rounded text-cyan-300 hover:text-cyan-100 font-pixel text-[8px] uppercase transition-all hover:shadow-lg hover:shadow-cyan-500/20"
                            >
                              View
                            </Link>
                            <Link
                              href={`/generate/${job.id}`}
                              target="_blank"
                              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 hover:border-emerald-400 rounded text-emerald-300 hover:text-emerald-100 font-pixel text-[8px] uppercase transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                            >
                              Live
                            </Link>
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              disabled={deletingJobId === job.id}
                              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed rounded text-red-300 hover:text-red-100 font-pixel text-[8px] uppercase transition-all hover:shadow-lg hover:shadow-red-500/20"
                            >
                              {deletingJobId === job.id ? '...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
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