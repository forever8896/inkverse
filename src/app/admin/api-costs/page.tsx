'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import Link from 'next/link';

interface ApiCost {
  id: string;
  provider: string;
  service: string;
  cost_per_unit: number;
  unit_type: string;
  valid_from: string;
  valid_to: string | null;
  notes: string | null;
  created_at: string;
}

interface NewCost {
  provider: string;
  service: string;
  cost_per_unit: string;
  unit_type: string;
  valid_from: string;
  notes: string;
}

export default function ApiCostsPage() {
  const [costs, setCosts] = useState<ApiCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCost, setNewCost] = useState<NewCost>({
    provider: 'openai',
    service: 'gpt-image-1',
    cost_per_unit: '',
    unit_type: 'image',
    valid_from: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const router = useRouter();

  useEffect(() => {
    fetchCosts();
  }, []);

  const fetchCosts = async () => {
    try {
      const response = await fetch('/api/admin/api-costs');
      if (!response.ok) {
        throw new Error('Failed to fetch API costs');
      }
      const data = await response.json();
      setCosts(data.costs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API costs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/admin/api-costs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newCost,
          cost_per_unit: parseFloat(newCost.cost_per_unit),
          valid_from: new Date(newCost.valid_from).toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save cost configuration');
      }

      // Reset form and reload
      setNewCost({
        provider: 'openai',
        service: 'gpt-image-1',
        cost_per_unit: '',
        unit_type: 'image',
        valid_from: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setShowAddForm(false);
      await fetchCosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    }
  };

  const endCostPeriod = async (costId: string) => {
    if (!confirm('End this cost period? This will mark it as no longer active.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/api-costs/${costId}/end`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to end cost period');
      }

      await fetchCosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end cost period');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900/20 to-purple-900/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <h2 className="text-xl font-bold text-white">Loading API costs...</h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900/20 to-purple-900/20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <Link href="/admin" className="text-cyan-400 hover:text-cyan-300 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">💰 API Cost Management</h1>
            <p className="text-slate-400">Configure pricing for AI services</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 hover:border-purple-400 text-purple-300 hover:text-purple-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-purple-500/20 rounded"
          >
            {showAddForm ? 'CANCEL' : 'ADD NEW COST'}
          </button>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4"
          >
            <div className="flex items-center">
              <span className="text-xl mr-3">❌</span>
              <span className="text-red-200">{error}</span>
            </div>
          </motion.div>
        )}

        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-6">Add New Cost Configuration</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Provider</label>
                  <select
                    value={newCost.provider}
                    onChange={(e) => setNewCost({ ...newCost, provider: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                  >
                    <option value="openai">OpenAI</option>
                    <option value="fal">fal.ai</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Service</label>
                  <input
                    type="text"
                    value={newCost.service}
                    onChange={(e) => setNewCost({ ...newCost, service: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                    placeholder="e.g., gpt-image-1, tripo3d-v2.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Cost per Unit (USD)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={newCost.cost_per_unit}
                    onChange={(e) => setNewCost({ ...newCost, cost_per_unit: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                    placeholder="0.040"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Unit Type</label>
                  <select
                    value={newCost.unit_type}
                    onChange={(e) => setNewCost({ ...newCost, unit_type: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                  >
                    <option value="image">Image</option>
                    <option value="conversion">3D Conversion</option>
                    <option value="token">Token</option>
                    <option value="request">Request</option>
                    <option value="minute">Minute</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Valid From</label>
                  <input
                    type="date"
                    value={newCost.valid_from}
                    onChange={(e) => setNewCost({ ...newCost, valid_from: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Notes (Optional)</label>
                  <input
                    type="text"
                    value={newCost.notes}
                    onChange={(e) => setNewCost({ ...newCost, notes: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                    placeholder="e.g., Price increase announcement"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-emerald-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-emerald-500/20 rounded"
                >
                  SAVE CONFIG
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-600/20 hover:bg-slate-600/40 border border-slate-500/50 hover:border-slate-400 text-slate-300 hover:text-slate-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-slate-500/20 rounded"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Cost/Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Unit Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Valid From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Valid To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {costs.map((cost) => (
                  <tr key={cost.id} className={`hover:bg-slate-700/30 transition-colors ${cost.valid_to ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {cost.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {cost.service}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300 font-mono">
                      ${cost.cost_per_unit.toFixed(6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {cost.unit_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {formatDate(cost.valid_from)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {cost.valid_to ? formatDate(cost.valid_to) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cost.valid_to ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-300 border border-slate-500/30">
                          📜 Historical
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ✅ Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!cost.valid_to && (
                        <button
                          onClick={() => endCostPeriod(cost.id)}
                          className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 hover:border-red-400 text-red-300 hover:text-red-100 font-pixel text-[8px] uppercase transition-all hover:shadow-lg hover:shadow-red-500/20 rounded"
                        >
                          END PERIOD
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {costs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      <div className="text-4xl mb-4">💰</div>
                      <p>No cost configurations found. Add one to get started.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6"
        >
          <h3 className="font-bold text-cyan-300 mb-3">💡 How Temporal Cost Tracking Works:</h3>
          <ul className="text-sm text-cyan-200 space-y-2 list-disc list-inside">
            <li>Each cost configuration has a &quot;Valid From&quot; date and optionally a &quot;Valid To&quot; date</li>
            <li>The system automatically uses the correct cost based on when a generation was created</li>
            <li>When you add a new cost, it automatically ends the previous active period for that service</li>
            <li>Historical costs are preserved for accurate reporting of past generations</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}