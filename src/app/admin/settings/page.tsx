'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';

interface SystemSettings {
  maxActiveJobsPerUser: number;
  jobTimeoutMinutes: number;
  maxRetryAttempts: number;
  enableAutoCleanup: boolean;
  cleanupOlderThanDays: number;
  enableRateLimiting: boolean;
  maxRequestsPerHour: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    maxActiveJobsPerUser: 2,
    jobTimeoutMinutes: 15,
    maxRetryAttempts: 3,
    enableAutoCleanup: false,
    cleanupOlderThanDays: 30,
    enableRateLimiting: true,
    maxRequestsPerHour: 10,
    maintenanceMode: false,
    maintenanceMessage: 'The system is temporarily under maintenance. Please check back in a few minutes.'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // In a real implementation, you'd fetch these from an API
      // For now, we'll use default values
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // In a real implementation, you'd save these to an API
      // For now, we'll simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900/20 to-blue-900/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-16 h-16 border-4 border-gray-400 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <h2 className="text-xl font-bold text-white">Loading settings...</h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900/20 to-blue-900/20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <Link href="/admin" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">⚙️ Admin Settings</h1>
            <p className="text-slate-400">Configure system parameters and admin settings</p>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-3 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-emerald-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-emerald-500/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'SAVING...' : 'SAVE SETTINGS'}
          </button>
        </motion.div>

        {/* Success/Error Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center">
              <span className="text-xl mr-3">✅</span>
              <span className="text-green-200">{successMessage}</span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center">
              <span className="text-xl mr-3">⚠️</span>
              <span className="text-red-200">{error}</span>
            </div>
          </motion.div>
        )}

        <div className="space-y-8">
          {/* Job Management Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-6">🎨 Job Management</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Active Jobs Per User
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxActiveJobsPerUser}
                  onChange={(e) => handleInputChange('maxActiveJobsPerUser', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Maximum number of concurrent generation jobs allowed per user
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Job Timeout (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={settings.jobTimeoutMinutes}
                  onChange={(e) => handleInputChange('jobTimeoutMinutes', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Maximum time before a job is considered stuck and fails
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Retry Attempts
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxRetryAttempts}
                  onChange={(e) => handleInputChange('maxRetryAttempts', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Number of times to retry failed operations
                </p>
              </div>
            </div>
          </motion.div>

          {/* System Cleanup Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-6">🧹 System Cleanup</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Enable Auto Cleanup</div>
                  <div className="text-sm text-slate-400">
                    Automatically remove old failed jobs and associated files
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableAutoCleanup}
                    onChange={(e) => handleInputChange('enableAutoCleanup', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {settings.enableAutoCleanup && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cleanup Jobs Older Than (Days)
                  </label>
                  <input
                    type="number"
                    min="7"
                    max="365"
                    value={settings.cleanupOlderThanDays}
                    onChange={(e) => handleInputChange('cleanupOlderThanDays', parseInt(e.target.value))}
                    className="w-full max-w-xs px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Jobs older than this will be automatically deleted
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Rate Limiting Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-6">🚦 Rate Limiting</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Enable Rate Limiting</div>
                  <div className="text-sm text-slate-400">
                    Limit the number of requests per user per hour
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableRateLimiting}
                    onChange={(e) => handleInputChange('enableRateLimiting', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {settings.enableRateLimiting && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Requests Per Hour
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.maxRequestsPerHour}
                    onChange={(e) => handleInputChange('maxRequestsPerHour', parseInt(e.target.value))}
                    className="w-full max-w-xs px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Maximum generation requests per user per hour
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Maintenance Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-6">🚧 Maintenance Mode</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Maintenance Mode</div>
                  <div className="text-sm text-slate-400">
                    Temporarily disable new job creation
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Maintenance Message
                </label>
                <textarea
                  value={settings.maintenanceMessage}
                  onChange={(e) => handleInputChange('maintenanceMessage', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter message to display to users during maintenance..."
                />
                <p className="text-xs text-slate-400 mt-1">
                  This message will be shown to users when trying to create new jobs
                </p>
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-end"
          >
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-8 py-3 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-emerald-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-emerald-500/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'SAVING...' : 'SAVE ALL SETTINGS'}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}