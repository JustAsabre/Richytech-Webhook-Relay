import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import SpotlightCard from '../components/SpotlightCard';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface VolumeData {
  _id: string;
  count: number;
  successful: number;
  failed: number;
}

interface EndpointPerformance {
  _id: string;
  name: string;
  totalWebhooks: number;
  successful: number;
  failed: number;
  successRate: number;
  avgAttempts: number;
}

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

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [endpointPerformance, setEndpointPerformance] = useState<EndpointPerformance[]>([]);
  const [timeRange, setTimeRange] = useState<number>(7);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [statsRes, volumeRes, performanceRes] = await Promise.all([
        api.get('/api/analytics/stats'),
        api.get(`/api/analytics/volume?days=${timeRange}`),
        api.get('/api/analytics/endpoints?days=30'),
      ]);

      setStats(statsRes.data.data);
      setVolumeData(volumeRes.data.data);
      setEndpointPerformance(performanceRes.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // Transform volume data for charts
  const volumeChartData = volumeData.map((item) => ({
    date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    total: item.count,
    successful: item.successful,
    failed: item.failed,
  }));

  // Status distribution for pie chart
  const statusData = stats
    ? [
        { name: 'Successful', value: Math.round((stats.successRate / 100) * stats.totalWebhooks) },
        { name: 'Failed', value: Math.round(((100 - stats.successRate) / 100) * stats.totalWebhooks) },
      ]
    : [];

  // Top endpoints for bar chart (top 5)
  const topEndpoints = endpointPerformance.slice(0, 5).map((ep) => ({
    name: ep.name.length > 20 ? ep.name.substring(0, 20) + '...' : ep.name,
    webhooks: ep.totalWebhooks,
    successRate: ep.successRate,
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6">
        {/* Header - Mobile Optimized */}
        <div className="mb-6 animate-fade-in-down">
          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Comprehensive insights into your webhook activity
            </p>
          </div>
          {/* Time Range Buttons - Responsive */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => setTimeRange(7)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                timeRange === 7
                  ? 'bg-indigo-600 dark:bg-indigo-700 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange(30)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                timeRange === 30
                  ? 'bg-indigo-600 dark:bg-indigo-700 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange(90)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                timeRange === 90
                  ? 'bg-indigo-600 dark:bg-indigo-700 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              90 Days
            </button>
          </div>
        </div>

        {/* Stats Cards - Mobile Optimized */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <SpotlightCard 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-fade-in-left animate-delay-100 hover-lift"
              spotlightColor="rgba(99, 102, 241, 0.3)"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Webhooks</p>
                  <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.totalWebhooks}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </SpotlightCard>

            <SpotlightCard 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-fade-in-left animate-delay-200 hover-lift"
              spotlightColor="rgba(34, 197, 94, 0.3)"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Success Rate</p>
                  <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{stats.successRate}%</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </SpotlightCard>

            <SpotlightCard 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-fade-in-left animate-delay-300 hover-lift"
              spotlightColor="rgba(59, 130, 246, 0.3)"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Active Endpoints</p>
                  <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.activeEndpoints}/{stats.totalEndpoints}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
              </div>
            </SpotlightCard>

            <SpotlightCard 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-fade-in-left animate-delay-400 hover-lift"
              spotlightColor="rgba(168, 85, 247, 0.3)"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Quota Usage</p>
                  <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.quotaUsed}/{stats.quotaLimit}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </SpotlightCard>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Webhook Volume Over Time - Line Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-fade-in-up animate-delay-100">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Webhook Volume Over Time</h3>
            {volumeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={volumeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} name="Total" />
                  <Line type="monotone" dataKey="successful" stroke="#10b981" strokeWidth={2} name="Successful" />
                  <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} name="Failed" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No data available for the selected time range
              </div>
            )}
          </div>

          {/* Success Rate Trend - Area Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-fade-in-up animate-delay-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Success vs Failed Webhooks</h3>
            {volumeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={volumeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="successful" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Successful" />
                  <Area type="monotone" dataKey="failed" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Failed" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No data available for the selected time range
              </div>
            )}
          </div>

          {/* Top Endpoints Performance - Bar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-fade-in-up animate-delay-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Endpoints by Volume</h3>
            {topEndpoints.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topEndpoints}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="webhooks" fill="#3b82f6" name="Total Webhooks" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No endpoint data available
              </div>
            )}
          </div>

          {/* Status Distribution - Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-fade-in-up animate-delay-400">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Webhook Status Distribution</h3>
            {statusData.length > 0 && statusData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={(props: any) => `${props.name}: ${(props.percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No webhook data available
              </div>
            )}
          </div>
        </div>

        {/* Endpoint Performance Table */}
        {endpointPerformance.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Endpoint Performance Details</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Last 30 days performance metrics</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Endpoint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Webhooks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Successful
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Failed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Success Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Avg Attempts
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {endpointPerformance.map((endpoint) => (
                    <tr key={endpoint._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{endpoint.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">{endpoint.totalWebhooks}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">{endpoint.successful}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-600 dark:text-red-400 font-medium">{endpoint.failed}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            endpoint.successRate >= 90
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : endpoint.successRate >= 70
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                          }`}
                        >
                          {endpoint.successRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">{endpoint.avgAttempts}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
