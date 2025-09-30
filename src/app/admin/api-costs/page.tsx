'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
      <div className="p-8">
        <div className="text-center">Loading API costs...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">API Cost Management</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showAddForm ? 'Cancel' : 'Add New Cost Configuration'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Add New Cost Configuration</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Provider</label>
                <select
                  value={newCost.provider}
                  onChange={(e) => setNewCost({ ...newCost, provider: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="openai">OpenAI</option>
                  <option value="fal">fal.ai</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Service</label>
                <input
                  type="text"
                  value={newCost.service}
                  onChange={(e) => setNewCost({ ...newCost, service: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., gpt-image-1, tripo3d-v2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cost per Unit (USD)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={newCost.cost_per_unit}
                  onChange={(e) => setNewCost({ ...newCost, cost_per_unit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="0.040"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Unit Type</label>
                <select
                  value={newCost.unit_type}
                  onChange={(e) => setNewCost({ ...newCost, unit_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
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
                <label className="block text-sm font-medium mb-1">Valid From</label>
                <input
                  type="date"
                  value={newCost.valid_from}
                  onChange={(e) => setNewCost({ ...newCost, valid_from: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={newCost.notes}
                  onChange={(e) => setNewCost({ ...newCost, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Price increase announcement"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save Cost Configuration
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost/Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valid From
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valid To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {costs.map((cost) => (
              <tr key={cost.id} className={cost.valid_to ? 'opacity-60' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {cost.provider}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {cost.service}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${cost.cost_per_unit.toFixed(6)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {cost.unit_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(cost.valid_from)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {cost.valid_to ? formatDate(cost.valid_to) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cost.valid_to ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      Historical
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {!cost.valid_to && (
                    <button
                      onClick={() => endCostPeriod(cost.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      End Period
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {costs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No cost configurations found. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">How Temporal Cost Tracking Works:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Each cost configuration has a &quot;Valid From&quot; date and optionally a &quot;Valid To&quot; date</li>
          <li>The system automatically uses the correct cost based on when a generation was created</li>
          <li>When you add a new cost, it automatically ends the previous active period for that service</li>
          <li>Historical costs are preserved for accurate reporting of past generations</li>
        </ul>
      </div>
    </div>
  );
}