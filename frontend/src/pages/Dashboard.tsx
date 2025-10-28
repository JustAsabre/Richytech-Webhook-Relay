import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { formatRelativeTime, getStatusColor } from '../utils/helpers';
import toast from 'react-hot-toast';

interface Stats {
  totalWebhooks: number;
  webhooksToday: number;
  webhooksThisMonth: number;
  successRate: number;
  activeEndpoints: number;
  totalEndpoints: number;
  quotaUsed: number;
  quotaLimit: number;
}

interface RecentWebhook {
  _id: string;
  endpointId: {
    _id: string;
    name: string;
  };
  status: 'pending' | 'success' | 'failed';
  payload: unknown;
  attempts: number;
  createdAt: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentWebhooks, setRecentWebhooks] = useState<RecentWebhook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch both in parallel for faster loading
      const [statsResponse, webhooksResponse] = await Promise.all([
        api.get('/api/analytics/stats'),
        api.get('/api/webhooks?limit=5&sort=-createdAt')
      ]);
      
      setStats(statsResponse.data.data);
      setRecentWebhooks(webhooksResponse.data.data.webhooks || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusBadge = (status: string) => {
    const colors = getStatusColor(status);
    return (
      <span className={`badge badge-${colors}`}>
        {status}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your webhook relay service
          </p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Webhooks Today */}
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Webhooks Today</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    {stats?.webhooksToday || 0}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {stats?.totalWebhooks || 0} all time
                  </p>
                </div>
                <div className="text-4xl">📨</div>
              </div>
            </div>

            {/* Success Rate */}
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Success Rate</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    {stats?.successRate || 100}%
                  </p>
                  <p className="text-xs text-green-700 mt-1">Last 30 days</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>

            {/* Active Endpoints */}
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Active Endpoints</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">
                    {stats?.activeEndpoints || 0}
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    {stats?.totalEndpoints || 0} total
                  </p>
                </div>
                <div className="text-4xl">🎯</div>
              </div>
            </div>

            {/* Quota Usage */}
            <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Quota Usage</p>
                  <p className="text-3xl font-bold text-orange-900 mt-2">
                    {stats?.quotaUsed || 0}
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    of {stats?.quotaLimit || 1000} this month
                  </p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
              <div className="mt-3 bg-orange-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      ((stats?.quotaUsed || 0) / (stats?.quotaLimit || 1000)) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/endpoints" className="btn-primary text-center">
              ➕ Create Endpoint
            </Link>
            <Link to="/logs" className="btn-secondary text-center">
              📝 View Logs
            </Link>
            <Link to="/api-keys" className="btn-secondary text-center">
              🔑 API Keys
            </Link>
            <Link to="/analytics" className="btn-secondary text-center">
              📈 Analytics
            </Link>
          </div>
        </div>

        {/* Recent Webhooks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Webhooks</h2>
            <Link to="/logs" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 py-3">
                  <div className="h-10 w-10 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentWebhooks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No webhooks yet</h3>
              <p className="text-gray-500 mb-6">
                Create an endpoint and start receiving webhooks
              </p>
              <Link to="/endpoints" className="btn-primary inline-block">
                Create Your First Endpoint
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Endpoint
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attempts
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentWebhooks.map((webhook) => (
                    <tr key={webhook._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {webhook.endpointId?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(webhook.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {webhook.attempts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatRelativeTime(webhook.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/logs/${webhook._id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
