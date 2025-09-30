'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalCost: number;
  totalOpenAICost: number;
  totalFalCost: number;
  totalTokensUsed: number;
  avgJobTime: number;
  recentActivity: Array<{
    type: 'user_registered' | 'job_created' | 'job_completed' | 'job_failed';
    timestamp: string;
    details: string;
  }>;
}

const adminMenuItems = [
  {
    title: 'Users',
    description: 'Manage users and view user activity',
    href: '/admin/users',
    icon: '👥',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Generation Jobs',
    description: 'Monitor monster generation pipeline and job statuses',
    href: '/admin/jobs',
    icon: '🎨',
    color: 'from-purple-500 to-pink-500'
  },
  {
    title: 'API Costs',
    description: 'Manage temporal API pricing for OpenAI and fal.ai',
    href: '/admin/api-costs',
    icon: '💰',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    title: 'System Health',
    description: 'View system metrics, performance, and service status',
    href: '/admin/system',
    icon: '📊',
    color: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Settings',
    description: 'Configure admin settings and system parameters',
    href: '/admin/settings',
    icon: '⚙️',
    color: 'from-gray-500 to-slate-500'
  }
];

export default function AdminDashboardClient() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch admin stats');
      }

      setStats(data.stats);
    } catch (err: any) {
      console.error('Failed to fetch admin stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-pixel text-[24px] uppercase mb-4 text-purple-300 tracking-wider">
            🏛️ Admin Dashboard
          </h1>
          <p className="text-lg text-slate-400">
            MonstersInk! Administration Panel
          </p>
        </motion.div>

        {/* Stats Overview - Fixed Grid Layout */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {/* Total Users */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="text-4xl leading-none">👥</div>
                <div className="text-right flex-1">
                  <div className="text-3xl font-bold text-white mb-1">{stats.totalUsers}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Total Users</div>
                </div>
              </div>
            </div>

            {/* Total Jobs */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="text-4xl leading-none">🎨</div>
                <div className="text-right flex-1">
                  <div className="text-3xl font-bold text-white mb-1">{stats.totalJobs}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Total Jobs</div>
                </div>
              </div>
            </div>

            {/* Active Jobs */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-700/50 rounded-lg p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="text-4xl leading-none">⚡</div>
                <div className="text-right flex-1">
                  <div className="text-3xl font-bold text-emerald-400 mb-1">{stats.activeJobs}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Active Jobs</div>
                </div>
              </div>
            </div>

            {/* Total Cost (Legacy) */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="text-4xl leading-none">💰</div>
                <div className="text-right flex-1">
                  <div className="text-3xl font-bold text-white mb-1">${stats.totalCost.toFixed(2)}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Total Cost</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">(Legacy)</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* OpenAI & fal.ai Stats Row */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12"
          >
            {/* OpenAI Cost */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="text-4xl leading-none">🤖</div>
                <div className="text-right flex-1">
                  <div className="text-3xl font-bold text-cyan-400 mb-1">${stats.totalOpenAICost.toFixed(4)}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">OpenAI Cost</div>
                  <div className="text-[10px] text-slate-500">{stats.totalTokensUsed.toLocaleString()} tokens</div>
                </div>
              </div>
            </div>

            {/* fal.ai Cost */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="text-4xl leading-none">🎯</div>
                <div className="text-right flex-1">
                  <div className="text-3xl font-bold text-purple-400 mb-1">${stats.totalFalCost.toFixed(4)}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">fal.ai Cost</div>
                  <div className="text-[10px] text-slate-500">3D model conversion</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cost Breakdown */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-8 mb-12"
          >
            <h3 className="font-pixel text-[12px] uppercase text-purple-300 mb-6 tracking-wider">💎 Cost Breakdown & Token Usage</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400">${(stats.totalOpenAICost + stats.totalFalCost).toFixed(4)}</div>
                <div className="text-xs text-slate-400 mt-2 uppercase tracking-wide">Total AI Costs</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Token-based calculation
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-400">{stats.totalTokensUsed.toLocaleString()}</div>
                <div className="text-xs text-slate-400 mt-2 uppercase tracking-wide">Total Tokens</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  OpenAI API calls
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400">
                  {stats.totalJobs > 0 ? ((stats.totalOpenAICost + stats.totalFalCost) / stats.totalJobs).toFixed(4) : '0.0000'}
                </div>
                <div className="text-xs text-slate-400 mt-2 uppercase tracking-wide">Avg Cost/Job</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Per generation
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">OpenAI API Costs</span>
                  <span className="text-cyan-400 font-mono text-sm">${stats.totalOpenAICost.toFixed(6)}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Image generation + text processing
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">fal.ai API Costs</span>
                  <span className="text-purple-400 font-mono text-sm">${stats.totalFalCost.toFixed(6)}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  3D model conversion
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Admin Menu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          {adminMenuItems.map((item, index) => (
            <Link key={item.href} href={item.href}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center mb-3">
                  <div className="text-4xl mr-4">{item.icon}</div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent group-hover:text-white transition-all duration-200`}>
                      {item.title}
                    </h3>
                  </div>
                  <div className="text-slate-400 group-hover:text-purple-400 transition-colors duration-200 text-xl">
                    →
                  </div>
                </div>
                <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
                  {item.description}
                </p>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* Recent Activity */}
        {stats?.recentActivity && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-8"
          >
            <h3 className="font-pixel text-[12px] uppercase text-purple-300 mb-6 tracking-wider">📈 Recent Activity</h3>
            <div className="space-y-4">
              {stats.recentActivity.length === 0 ? (
                <p className="text-slate-400 text-center py-8 text-sm">No recent activity</p>
              ) : (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                    <div className="text-2xl mr-4">
                      {activity.type === 'user_registered' && '👤'}
                      {activity.type === 'job_created' && '🎨'}
                      {activity.type === 'job_completed' && '✅'}
                      {activity.type === 'job_failed' && '❌'}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm">{activity.details}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center"
          >
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="font-pixel text-[10px] uppercase text-red-300 mb-2 tracking-wider">Failed to Load</h3>
            <p className="text-red-200 mb-4 text-sm">{error}</p>
            <button
              onClick={fetchAdminStats}
              className="px-6 py-3 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 hover:border-red-400 rounded-lg text-red-300 hover:text-red-100 font-pixel text-[8px] uppercase transition-all"
            >
              Retry
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}