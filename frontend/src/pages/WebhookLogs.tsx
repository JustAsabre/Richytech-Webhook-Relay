import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface WebhookLog {
  _id: string;
  userId: string;
  endpointId: {
    _id: string;
    name: string;
    destinationUrl: string;
  };
  incomingPayload: Record<string, unknown>;
  status: 'pending' | 'success' | 'failed';
  retryCount: number;
  receivedAt: string;
  attempts: Array<{
    attemptNumber: number;
    attemptedAt: string;
    success: boolean;
    statusCode?: number;
    errorMessage?: string;
    responseBody?: Record<string, unknown>;
    _id: string;
  }>;
  createdAt: string;
  updatedAt: string;
  lastAttemptAt?: string;
  nextRetryAt?: string;
}

export default function WebhookLogs() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    endpointId: '',
    startDate: '',
    endDate: '',
  });
  const [endpoints, setEndpoints] = useState<Array<{ _id: string; name: string }>>([]);

  const fetchEndpoints = async () => {
    try {
      const response = await api.get('/api/endpoints');
      setEndpoints(response.data.data.endpoints || []);
    } catch (error) {
      console.error('Failed to fetch endpoints:', error);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sort: '-createdAt',
      });

      if (filters.status) params.append('status', filters.status);
      if (filters.endpointId) params.append('endpointId', filters.endpointId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/api/webhooks?${params.toString()}`);
      setLogs(response.data.data.webhooks || []);
      setTotalPages(response.data.data.pagination?.totalPages || 1);
      setTotalLogs(response.data.data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch webhook logs:', error);
      toast.error('Failed to load webhook logs');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleViewDetails = (log: WebhookLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedLog(null);
  };

  const handleRetry = async (log: WebhookLog) => {
    try {
      await api.post(`/api/webhooks/${log._id}/retry`);
      toast.success('Webhook retry initiated');
      fetchLogs();
    } catch (error: unknown) {
      console.error('Failed to retry webhook:', error);
      const message = error instanceof Error ? error.message : 'Failed to retry webhook';
      toast.error(message);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      endpointId: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Webhook Logs</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and manage webhook delivery logs
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endpoint
              </label>
              <select
                value={filters.endpointId}
                onChange={(e) => handleFilterChange('endpointId', e.target.value)}
                className="input"
              >
                <option value="">All Endpoints</option>
                {endpoints.map((endpoint) => (
                  <option key={endpoint._id} value={endpoint._id}>
                    {endpoint.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {logs.length} of {totalLogs} logs
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No webhook logs</h3>
            <p className="mt-1 text-sm text-gray-500">
              Webhook logs will appear here once you start receiving webhooks.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Endpoint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attempts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Received
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.endpointId?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {log.endpointId?.destinationUrl}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                            log.status
                          )}`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.retryCount + 1} / {log.attempts.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDistanceToNow(new Date(log.receivedAt), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(log)}
                            className="text-primary-600 hover:text-primary-900"
                            title="View Details"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          {log.status === 'failed' && (
                            <button
                              onClick={() => handleRetry(log)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Retry"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary ml-3"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Webhook Log Details</h2>
                  <button
                    onClick={handleCloseDetail}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Overview */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Endpoint:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedLog.endpointId?.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Status:</span>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                              selectedLog.status
                            )}`}
                          >
                            {selectedLog.status}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Received:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(selectedLog.receivedAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Retry Count:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedLog.retryCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Incoming Payload */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Incoming Payload</h3>
                    <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.incomingPayload, null, 2)}
                    </pre>
                  </div>

                  {/* Attempts */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Delivery Attempts ({selectedLog.attempts.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedLog.attempts.map((attempt) => (
                        <div
                          key={attempt._id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                Attempt #{attempt.attemptNumber}
                              </span>
                              <span
                                className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  attempt.success
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {attempt.success ? 'Success' : 'Failed'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(attempt.attemptedAt).toLocaleString()}
                            </span>
                          </div>
                          {attempt.statusCode && (
                            <p className="text-sm text-gray-600 mb-1">
                              Status Code: {attempt.statusCode}
                            </p>
                          )}
                          {attempt.errorMessage && (
                            <p className="text-sm text-red-600 mb-2">
                              Error: {attempt.errorMessage}
                            </p>
                          )}
                          {attempt.responseBody && (
                            <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto mt-2">
                              {JSON.stringify(attempt.responseBody, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                  {selectedLog.status === 'failed' && (
                    <button
                      onClick={() => {
                        handleRetry(selectedLog);
                        handleCloseDetail();
                      }}
                      className="btn-primary"
                    >
                      Retry Webhook
                    </button>
                  )}
                  <button onClick={handleCloseDetail} className="btn-secondary">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
