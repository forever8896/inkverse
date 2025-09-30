'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  createdAt: string;
  emailVerified?: string;
  jobCount: number;
  totalSpent: number;
  lastActive?: string;
}

interface UsersResponse {
  success: boolean;
  users?: User[];
  total?: number;
  error?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [sortBy, setSortBy] = useState<'createdAt' | 'jobCount' | 'totalSpent' | 'lastActive'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const usersPerPage = 20;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, sortBy, sortOrder, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString(),
        sortBy,
        sortOrder,
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data: UsersResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
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
    fetchUsers();
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20">
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
            <h1 className="text-4xl font-bold text-white mb-2">👥 User Management</h1>
            <p className="text-slate-400">Manage users and view user activity</p>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-8"
        >
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Search Users
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or ID..."
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
            >
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                  fetchUsers();
                }}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg text-white font-medium transition-colors"
              >
                Clear
              </button>
            )}
          </form>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden"
        >
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                Users ({totalUsers} total)
              </h3>
              <div className="text-sm text-slate-400">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <motion.div
                className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-slate-400">Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-red-300 mb-4">{error}</p>
              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-slate-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="text-left p-4 text-slate-300 font-medium">User</th>
                    <th 
                      className="text-left p-4 text-slate-300 font-medium cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('createdAt')}
                    >
                      Joined {getSortIcon('createdAt')}
                    </th>
                    <th 
                      className="text-left p-4 text-slate-300 font-medium cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('jobCount')}
                    >
                      Jobs {getSortIcon('jobCount')}
                    </th>
                    <th 
                      className="text-left p-4 text-slate-300 font-medium cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('totalSpent')}
                    >
                      Total Spent {getSortIcon('totalSpent')}
                    </th>
                    <th 
                      className="text-left p-4 text-slate-300 font-medium cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('lastActive')}
                    >
                      Last Active {getSortIcon('lastActive')}
                    </th>
                    <th className="text-left p-4 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {users.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center">
                            {user.image ? (
                              <img 
                                src={user.image} 
                                alt={user.name || 'User'} 
                                className="w-10 h-10 rounded-full mr-3"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-slate-600 rounded-full mr-3 flex items-center justify-center text-lg">
                                👤
                              </div>
                            )}
                            <div>
                              <div className="text-white font-medium">
                                {user.name || 'Anonymous'}
                              </div>
                              {user.email && (
                                <div className="text-sm text-slate-400">{user.email}</div>
                              )}
                              <div className="text-xs text-slate-500">{user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-300">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.jobCount > 0 
                              ? 'bg-blue-500/20 text-blue-300' 
                              : 'bg-slate-600/20 text-slate-400'
                          }`}>
                            {user.jobCount} jobs
                          </span>
                        </td>
                        <td className="p-4 text-slate-300">
                          ${user.totalSpent.toFixed(2)}
                        </td>
                        <td className="p-4 text-slate-300">
                          {user.lastActive ? formatDate(user.lastActive) : 'Never'}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition-colors"
                            >
                              View
                            </Link>
                            <Link
                              href={`/admin/jobs?userId=${user.id}`}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm font-medium transition-colors"
                            >
                              Jobs
                            </Link>
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
                            ? 'bg-blue-600 text-white'
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