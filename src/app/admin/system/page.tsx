'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';

interface SystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'error';
    connectionCount: number;
    queryTime: number;
    lastError?: string;
  };
  storage: {
    status: 'healthy' | 'warning' | 'error';
    totalFiles: number;
    totalSize: string;
    lastError?: string;
  };
  ai_services: {
    openai: {
      status: 'healthy' | 'warning' | 'error';
      lastCheck: string;
      responseTime?: number;
      lastError?: string;
    };
    fal: {
      status: 'healthy' | 'warning' | 'error';
      lastCheck: string;
      responseTime?: number;
      lastError?: string;
    };
  };
  performance: {
    avgJobTime: number;
    successRate: number;
    activeJobs: number;
    errorRate: number;
    peakLoadTime?: string;
  };
  metrics: {
    totalGenerations: number;
    generationsToday: number;
    totalCost: number;
    costToday: number;
    uniqueUsersToday: number;
    avgRetryRate: number;
  };
}

interface SystemHealthResponse {
  success: boolean;
  health?: SystemHealth;
  error?: string;
}

export default function AdminSystem() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  useEffect(() => {
    fetchSystemHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchSystemHealth();
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/admin/system/health');
      const data: SystemHealthResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch system health');
      }

      setHealth(data.health || null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch system health:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusEmoji = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-blue-900/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <h2 className="text-xl font-bold text-white">Loading system health...</h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-blue-900/20">
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
            <h1 className="text-4xl font-bold text-white mb-2">📊 System Health</h1>
            <p className="text-slate-400">Monitor system metrics, performance, and service status</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm"
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
            <label className="flex items-center text-slate-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto-refresh
            </label>
            <button
              onClick={fetchSystemHealth}
              className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-emerald-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-emerald-500/20 rounded"
            >
              REFRESH
            </button>
          </div>
        </motion.div>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center mb-8"
          >
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-red-300 mb-2">Failed to Load System Health</h3>
            <p className="text-red-200 mb-4">{error}</p>
            <button
              onClick={fetchSystemHealth}
              className="px-6 py-3 bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/50 hover:border-orange-400 text-orange-300 hover:text-orange-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-orange-500/20 rounded"
            >
              RETRY
            </button>
          </motion.div>
        ) : health ? (
          <>
            {/* Overall Health Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Database</h3>
                  <div className={`px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(health.database.status)}`}>
                    {getStatusEmoji(health.database.status)} {health.database.status}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Connections:</span>
                    <span className="text-white">{health.database.connectionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Query Time:</span>
                    <span className="text-white">{health.database.queryTime}ms</span>
                  </div>
                </div>
                {health.database.lastError && (
                  <div className="mt-3 text-xs text-red-300 bg-red-900/20 rounded p-2">
                    {health.database.lastError}
                  </div>
                )}
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Storage (S3)</h3>
                  <div className={`px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(health.storage.status)}`}>
                    {getStatusEmoji(health.storage.status)} {health.storage.status}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Files:</span>
                    <span className="text-white">{health.storage.totalFiles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Size:</span>
                    <span className="text-white">{health.storage.totalSize}</span>
                  </div>
                </div>
                {health.storage.lastError && (
                  <div className="mt-3 text-xs text-red-300 bg-red-900/20 rounded p-2">
                    {health.storage.lastError}
                  </div>
                )}
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">OpenAI</h3>
                  <div className={`px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(health.ai_services.openai.status)}`}>
                    {getStatusEmoji(health.ai_services.openai.status)} {health.ai_services.openai.status}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Check:</span>
                    <span className="text-white">{formatDate(health.ai_services.openai.lastCheck)}</span>
                  </div>
                  {health.ai_services.openai.responseTime && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Response:</span>
                      <span className="text-white">{health.ai_services.openai.responseTime}ms</span>
                    </div>
                  )}
                </div>
                {health.ai_services.openai.lastError && (
                  <div className="mt-3 text-xs text-red-300 bg-red-900/20 rounded p-2">
                    {health.ai_services.openai.lastError}
                  </div>
                )}
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Fal.ai</h3>
                  <div className={`px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(health.ai_services.fal.status)}`}>
                    {getStatusEmoji(health.ai_services.fal.status)} {health.ai_services.fal.status}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Check:</span>
                    <span className="text-white">{formatDate(health.ai_services.fal.lastCheck)}</span>
                  </div>
                  {health.ai_services.fal.responseTime && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Response:</span>
                      <span className="text-white">{health.ai_services.fal.responseTime}ms</span>
                    </div>
                  )}
                </div>
                {health.ai_services.fal.lastError && (
                  <div className="mt-3 text-xs text-red-300 bg-red-900/20 rounded p-2">
                    {health.ai_services.fal.lastError}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Performance Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
            >
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">⚡ Performance Metrics</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Average Job Time:</span>
                    <span className="text-white font-bold">{health.performance.avgJobTime}m</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Success Rate:</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-slate-700 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${health.performance.successRate}%` }}
                        />
                      </div>
                      <span className="text-white font-bold">{health.performance.successRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Active Jobs:</span>
                    <span className="text-white font-bold">{health.performance.activeJobs}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Error Rate:</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-slate-700 rounded-full h-2 mr-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${health.performance.errorRate}%` }}
                        />
                      </div>
                      <span className="text-white font-bold">{health.performance.errorRate.toFixed(1)}%</span>
                    </div>
                  </div>

                  {health.performance.peakLoadTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Peak Load Time:</span>
                      <span className="text-white">{formatDate(health.performance.peakLoadTime)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">📈 Usage Metrics</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Total Generations:</span>
                    <span className="text-white font-bold">{health.metrics.totalGenerations.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Generations Today:</span>
                    <span className="text-white font-bold">{health.metrics.generationsToday}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Total Cost:</span>
                    <span className="text-white font-bold">${health.metrics.totalCost.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Cost Today:</span>
                    <span className="text-white font-bold">${health.metrics.costToday.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Unique Users Today:</span>
                    <span className="text-white font-bold">{health.metrics.uniqueUsersToday}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Average Retry Rate:</span>
                    <span className="text-white font-bold">{health.metrics.avgRetryRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6">🛠️ System Actions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/admin/jobs?status=pending"
                  className="flex items-center justify-center px-4 py-3 bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/50 hover:border-orange-400 text-orange-300 hover:text-orange-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-orange-500/20 rounded"
                >
                  VIEW PENDING
                </Link>
                <Link
                  href="/admin/jobs?status=image_generation_failed"
                  className="flex items-center justify-center px-4 py-3 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 hover:border-red-400 text-red-300 hover:text-red-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-red-500/20 rounded"
                >
                  VIEW FAILED
                </Link>
                <Link
                  href="/admin/users"
                  className="flex items-center justify-center px-4 py-3 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-cyan-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-cyan-500/20 rounded"
                >
                  MANAGE USERS
                </Link>
              </div>
            </motion.div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-slate-400">No system health data available</p>
          </div>
        )}
      </div>
    </div>
  );
}