import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface ApiKey {
  _id: string;
  name: string;
  prefix: string;
  key?: string; // Only returned on creation
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState<ApiKey | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokingKey, setRevokingKey] = useState<ApiKey | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingKey, setDeletingKey] = useState<ApiKey | null>(null);
  const [keyName, setKeyName] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/keys');
      setApiKeys(response.data.data.apiKeys || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!keyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }

    try {
      const response = await api.post('/api/keys', { name: keyName });
      const createdKey = response.data.data.apiKey;
      
      setNewKeyData(createdKey);
      setShowCreateModal(false);
      setShowKeyModal(true);
      setKeyName('');
      
      fetchApiKeys();
      toast.success('API key created successfully');
    } catch (error: unknown) {
      console.error('Failed to create API key:', error);
      const message = error instanceof Error ? error.message : 'Failed to create API key';
      toast.error(message);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    toast.success('API key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevokeKey = (key: ApiKey) => {
    setRevokingKey(key);
    setShowRevokeModal(true);
  };

  const confirmRevoke = async () => {
    if (!revokingKey) return;

    try {
      await api.put(`/api/keys/${revokingKey._id}`, { isActive: false });
      toast.success('API key revoked successfully');
      setShowRevokeModal(false);
      setRevokingKey(null);
      fetchApiKeys();
    } catch (error: unknown) {
      console.error('Failed to revoke API key:', error);
      const message = error instanceof Error ? error.message : 'Failed to revoke API key';
      toast.error(message);
    }
  };

  const handleDeleteKey = (key: ApiKey) => {
    setDeletingKey(key);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingKey) return;

    try {
      await api.delete(`/api/keys/${deletingKey._id}`);
      toast.success('API key deleted successfully');
      setShowDeleteModal(false);
      setDeletingKey(null);
      fetchApiKeys();
    } catch (error: unknown) {
      console.error('Failed to delete API key:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete API key';
      toast.error(message);
    }
  };

  const maskKey = (prefix: string) => {
    return `${prefix}****************************`;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Keys</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage API keys for programmatic access
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate API Key
          </button>
        </div>

        {/* API Keys Table */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No API keys</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first API key for programmatic access.
            </p>
            <div className="mt-6">
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                Generate API Key
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {apiKeys.map((apiKey) => (
                  <tr key={apiKey._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{apiKey.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Created {formatDistanceToNow(new Date(apiKey.createdAt), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded font-mono">
                        {maskKey(apiKey.prefix)}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {apiKey.lastUsedAt
                        ? formatDistanceToNow(new Date(apiKey.lastUsedAt), { addSuffix: true })
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          apiKey.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {apiKey.isActive ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {apiKey.isActive && (
                          <button
                            onClick={() => handleRevokeKey(apiKey)}
                            className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-500 dark:hover:text-yellow-400"
                            title="Revoke"
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
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteKey(apiKey)}
                          className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400"
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
        )}

        {/* Create API Key Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generate API Key</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setKeyName('');
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Key Name
                    </label>
                    <input
                      type="text"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      className="input"
                      placeholder="Production API Key"
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateKey()}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      A friendly name to identify this key
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      💡 The API key will only be shown once. Make sure to copy it and store it securely.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setKeyName('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button onClick={handleCreateKey} className="btn-primary">
                    Generate Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show New API Key Modal */}
        {showKeyModal && newKeyData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">API Key Generated</h2>
                  <button
                    onClick={() => {
                      setShowKeyModal(false);
                      setNewKeyData(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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

                <div className="space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                          Save this key now!
                        </h3>
                        <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-500">
                          This is the only time you'll see the full API key. Copy it and store it securely.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your API Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newKeyData.key || ''}
                        readOnly
                        className="input flex-1 font-mono text-sm"
                      />
                      <button
                        onClick={() => newKeyData.key && handleCopyKey(newKeyData.key)}
                        className="btn-primary whitespace-nowrap flex items-center gap-2"
                      >
                        {copied ? (
                          <>
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
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
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Usage Example</h4>
                    <pre className="text-xs bg-gray-900 dark:bg-black text-gray-100 p-3 rounded overflow-x-auto">
{`curl -H "X-API-Key: ${newKeyData.key}" \\
     https://api.yourdomain.com/endpoint`}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowKeyModal(false);
                      setNewKeyData(null);
                    }}
                    className="btn-primary"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revoke Confirmation Modal */}
        {showRevokeModal && revokingKey && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-yellow-600 dark:text-yellow-500"
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revoke API Key</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Are you sure you want to revoke "{revokingKey.name}"?
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    ⚠️ This will immediately stop all API requests using this key. This action can be
                    undone later by updating the key status.
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowRevokeModal(false);
                      setRevokingKey(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button onClick={confirmRevoke} className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                    Revoke Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingKey && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-red-600 dark:text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete API Key</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Are you sure you want to permanently delete "{deletingKey.name}"?
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800 dark:text-red-400">
                    ⚠️ This action cannot be undone. The API key will be permanently deleted and all
                    requests using this key will fail immediately.
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletingKey(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete} 
                    className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Delete Permanently
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
