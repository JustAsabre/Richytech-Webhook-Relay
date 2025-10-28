import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Endpoint {
  _id: string;
  name: string;
  destinationUrl: string;
  webhookUrl: string;
  isActive: boolean;
  requiresSignature: boolean;
  customHeaders?: Record<string, string>;
  retryConfig?: {
    maxRetries: number;
    retryIntervals?: number[];
  };
  createdAt: string;
  updatedAt: string;
}

export default function Endpoints() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEndpoint, setDeletingEndpoint] = useState<Endpoint | null>(null);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    destinationUrl: '',
    isActive: true,
    requiresSignature: false,
    retryAttempts: 3,
    retryDelay: 60,
    customHeaders: {} as Record<string, string>,
  });

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/endpoints');
      setEndpoints(response.data.data.endpoints || []);
    } catch (error) {
      console.error('Failed to fetch endpoints:', error);
      toast.error('Failed to load endpoints');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (endpoint?: Endpoint) => {
    if (endpoint) {
      setEditingEndpoint(endpoint);
      setFormData({
        name: endpoint.name,
        destinationUrl: endpoint.destinationUrl,
        isActive: endpoint.isActive,
        requiresSignature: endpoint.requiresSignature,
        retryAttempts: endpoint.retryConfig?.maxRetries || 3,
        retryDelay: endpoint.retryConfig?.retryIntervals?.[0] || 60,
        customHeaders: endpoint.customHeaders || {},
      });
    } else {
      setEditingEndpoint(null);
      setFormData({
        name: '',
        destinationUrl: '',
        isActive: true,
        requiresSignature: false,
        retryAttempts: 3,
        retryDelay: 60,
        customHeaders: {},
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEndpoint(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format data for backend
    const payload = {
      name: formData.name,
      destinationUrl: formData.destinationUrl,
      isActive: formData.isActive,
      customHeaders: formData.customHeaders,
      retryConfig: {
        maxRetries: formData.retryAttempts,
        retryIntervals: [formData.retryDelay],
      },
    };
    
    try {
      if (editingEndpoint) {
        await api.put(`/api/endpoints/${editingEndpoint._id}`, payload);
        toast.success('Endpoint updated successfully');
      } else {
        await api.post('/api/endpoints', payload);
        toast.success('Endpoint created successfully');
      }
      
      handleCloseModal();
      fetchEndpoints();
    } catch (error: unknown) {
      console.error('Failed to save endpoint:', error);
      const message = error instanceof Error ? error.message : 'Failed to save endpoint';
      toast.error(message);
    }
  };

  const handleDelete = async (endpoint: Endpoint) => {
    setDeletingEndpoint(endpoint);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingEndpoint) return;
    
    try {
      await api.delete(`/api/endpoints/${deletingEndpoint._id}`);
      toast.success('Endpoint deleted successfully');
      setShowDeleteModal(false);
      setDeletingEndpoint(null);
      fetchEndpoints();
    } catch (error: unknown) {
      console.error('Failed to delete endpoint:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete endpoint';
      toast.error(message);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingEndpoint(null);
  };

  const handleToggleActive = async (endpoint: Endpoint) => {
    try {
      await api.put(`/api/endpoints/${endpoint._id}`, {
        ...endpoint,
        isActive: !endpoint.isActive,
      });
      toast.success(`Endpoint ${!endpoint.isActive ? 'activated' : 'deactivated'}`);
      fetchEndpoints();
    } catch (error: unknown) {
      console.error('Failed to toggle endpoint:', error);
      const message = error instanceof Error ? error.message : 'Failed to update endpoint';
      toast.error(message);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Webhook URL copied to clipboard');
  };

  const handleTest = async (endpoint: Endpoint) => {
    try {
      const response = await api.post(`/api/endpoints/${endpoint._id}/test`, {
        payload: { test: true, timestamp: new Date().toISOString() },
      });
      toast.success('Test webhook sent successfully');
      console.log('Test response:', response.data);
    } catch (error: unknown) {
      console.error('Failed to test endpoint:', error);
      const message = error instanceof Error ? error.message : 'Failed to test endpoint';
      toast.error(message);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Endpoints</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your webhook endpoints and destinations
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Endpoint
          </button>
        </div>

        {/* Endpoints Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ) : endpoints.length === 0 ? (
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No endpoints</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first webhook endpoint.
            </p>
            <div className="mt-6">
              <button onClick={() => handleOpenModal()} className="btn-primary">
                Create Endpoint
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Destination URL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Webhook URL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {endpoints.map((endpoint) => (
                      <tr key={endpoint._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {endpoint.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {endpoint.requiresSignature && (
                                  <span className="inline-flex items-center text-xs">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path
                                        fillRule="evenodd"
                                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    Signature Required
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {endpoint.destinationUrl}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded max-w-xs truncate">
                              {endpoint.webhookUrl}
                            </code>
                            <button
                              onClick={() => handleCopyUrl(endpoint.webhookUrl)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Copy URL"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(endpoint)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              endpoint.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {endpoint.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleTest(endpoint)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Test Endpoint"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleOpenModal(endpoint)}
                              className="text-primary-600 hover:text-primary-900"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(endpoint)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {endpoints.map((endpoint) => (
                <div key={endpoint._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{endpoint.name}</h3>
                      {endpoint.requiresSignature && (
                        <span className="inline-flex items-center text-xs text-gray-500 mt-1">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Signature Required
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleActive(endpoint)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                        endpoint.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {endpoint.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Destination URL</p>
                      <p className="text-gray-900 break-all">{endpoint.destinationUrl}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Webhook URL</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all flex-1">
                          {endpoint.webhookUrl}
                        </code>
                        <button
                          onClick={() => handleCopyUrl(endpoint.webhookUrl)}
                          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                          title="Copy URL"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleTest(endpoint)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                      title="Test"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Test
                    </button>
                    <button
                      onClick={() => handleOpenModal(endpoint)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg border border-primary-200"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(endpoint)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingEndpoint ? 'Edit Endpoint' : 'Create Endpoint'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endpoint Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder="My Webhook Endpoint"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination URL
                    </label>
                    <input
                      type="url"
                      value={formData.destinationUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, destinationUrl: e.target.value })
                      }
                      className="input"
                      placeholder="https://your-app.com/webhook"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Where webhooks will be forwarded to
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Retry Attempts
                      </label>
                      <input
                        type="number"
                        value={formData.retryAttempts}
                        onChange={(e) =>
                          setFormData({ ...formData, retryAttempts: parseInt(e.target.value) })
                        }
                        className="input"
                        min="0"
                        max="5"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Retry Delay (seconds)
                      </label>
                      <input
                        type="number"
                        value={formData.retryDelay}
                        onChange={(e) =>
                          setFormData({ ...formData, retryDelay: parseInt(e.target.value) })
                        }
                        className="input"
                        min="30"
                        max="3600"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.requiresSignature}
                        onChange={(e) =>
                          setFormData({ ...formData, requiresSignature: e.target.checked })
                        }
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require HMAC Signature</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      {editingEndpoint ? 'Update Endpoint' : 'Create Endpoint'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingEndpoint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Delete Endpoint</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Are you sure you want to delete "{deletingEndpoint.name}"?
                    </p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This action cannot be undone. All webhook logs associated with this endpoint will remain, but you won't be able to receive new webhooks at this URL.
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={cancelDelete}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="btn-danger"
                  >
                    Delete Endpoint
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
