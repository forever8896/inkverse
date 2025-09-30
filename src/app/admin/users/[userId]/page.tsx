'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface UserDetail {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  createdAt: string;
  emailVerified?: string;
  jobCount: number;
  totalSpent: number;
  lastActive?: string;
  recentJobs: Array<{
    id: string;
    prompt: string;
    status: string;
    totalCost: number;
    createdAt: string;
    completedAt?: string;
  }>;
}

interface UserDetailResponse {
  success: boolean;
  user?: UserDetail;
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

export default function AdminUserDetail() {
  const params = useParams();
  const userId = params.userId as string;
  
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data: UserDetailResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user details');
      }

      setUser(data.user || null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch user details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getStatusEmoji = (status: string) => {
    return statusEmojis[status as keyof typeof statusEmojis] || '❓';
  };

  const calculateJobDuration = (createdAt: string, completedAt?: string) => {
    const start = new Date(createdAt);
    const end = completedAt ? new Date(completedAt) : new Date();
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <h2 className="text-xl font-bold text-white">Loading user details...</h2>
        </motion.div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg mx-auto px-6"
        >
          <div className="text-6xl mb-6">😔</div>
          <h2 className="text-2xl font-bold text-white mb-4">User Not Found</h2>
          <p className="text-slate-300 mb-8">{error || 'The requested user could not be found.'}</p>
          <Link
            href="/admin/users"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            ← Back to Users
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <Link href="/admin/users" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
              ← Back to Users
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">👤 User Profile</h1>
            <p className="text-slate-400">Detailed view of user {user.id}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">📋 User Information</h3>
              
              <div className="text-center mb-6">
                {user.image ? (
                  <img 
                    src={user.image} 
                    alt={user.name || 'User'} 
                    className="w-24 h-24 rounded-full mx-auto mb-4"
                  />
                ) : (
                  <div className="w-24 h-24 bg-slate-600 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                    👤
                  </div>
                )}
                <h4 className="text-xl font-bold text-white">
                  {user.name || 'Anonymous User'}
                </h4>
                {user.email && (
                  <p className="text-slate-400 mt-1">{user.email}</p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-slate-300 mb-1">User ID</div>
                  <div className="text-white font-mono text-sm break-all bg-slate-900/50 rounded p-2">
                    {user.id}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-300 mb-1">Joined</div>
                  <div className="text-white">{formatDate(user.createdAt)}</div>
                </div>

                {user.emailVerified && (
                  <div>
                    <div className="text-sm font-medium text-slate-300 mb-1">Email Verified</div>
                    <div className="text-green-300">✅ {formatDate(user.emailVerified)}</div>
                  </div>
                )}

                {user.lastActive && (
                  <div>
                    <div className="text-sm font-medium text-slate-300 mb-1">Last Active</div>
                    <div className="text-white">{formatDate(user.lastActive)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mt-6">
              <h3 className="text-xl font-bold text-white mb-6">📊 Usage Statistics</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total Jobs:</span>
                  <span className="text-white font-bold text-xl">{user.jobCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total Spent:</span>
                  <span className="text-white font-bold text-xl">${user.totalSpent.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Avg Cost per Job:</span>
                  <span className="text-white font-bold">
                    ${user.jobCount > 0 ? (user.totalSpent / user.jobCount).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <Link
                  href={`/admin/jobs?userId=${user.id}`}
                  className="block w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-center font-medium transition-colors"
                >
                  View All Jobs
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Recent Jobs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">🎨 Recent Jobs</h3>
                <span className="text-slate-400 text-sm">Last {user.recentJobs.length} jobs</span>
              </div>

              {user.recentJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🎭</div>
                  <p className="text-slate-400">No jobs found for this user</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {user.recentJobs.map((job, index) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-slate-900/50 rounded-lg p-4 hover:bg-slate-900/70 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 mr-4">
                            <div className="text-white font-medium text-sm mb-1">
                              {job.id.slice(0, 8)}...
                            </div>
                            <div className="text-slate-300 text-sm">
                              {job.prompt.length > 80 ? `${job.prompt.slice(0, 80)}...` : job.prompt}
                            </div>
                          </div>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(job.status)}`}>
                            <span className="mr-1">{getStatusEmoji(job.status)}</span>
                            {job.status.replace(/_/g, ' ')}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4 text-slate-400">
                            <span>💰 ${job.totalCost.toFixed(2)}</span>
                            <span>⏱️ {calculateJobDuration(job.createdAt, job.completedAt)}</span>
                            <span>{formatDate(job.createdAt)}</span>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/jobs/${job.id}`}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-medium transition-colors"
                            >
                              View
                            </Link>
                            <Link
                              href={`/generate/${job.id}`}
                              target="_blank"
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs font-medium transition-colors"
                            >
                              Live
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {user.jobCount > user.recentJobs.length && (
                <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                  <Link
                    href={`/admin/jobs?userId=${user.id}`}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
                  >
                    View All {user.jobCount} Jobs →
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}