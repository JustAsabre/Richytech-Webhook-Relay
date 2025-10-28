import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

interface UserProfile {
  email: string;
  fullName: string;
  company?: string;
  phone?: string;
  role: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionEndsAt?: string;
  createdAt: string;
}

interface QuotaInfo {
  monthlyLimit: number;
  used: number;
  remaining: number;
  resetsAt: string;
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'subscription'>('profile');
  const { updateUser } = useAuth();

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [userRes, statsRes] = await Promise.all([
        api.get('/api/auth/me'),
        api.get('/api/analytics/stats'),
      ]);

      const userData = userRes.data.data.user;
      setUser(userData);
      setFullName(userData.fullName || '');
      setCompany(userData.company || '');
      setPhone(userData.phone || '');

      // Set quota info from stats
      const stats = statsRes.data.data;
      setQuota({
        monthlyLimit: stats.quotaLimit,
        used: stats.quotaUsed,
        remaining: stats.quotaLimit - stats.quotaUsed,
        resetsAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    try {
      setProfileSaving(true);
      const response = await api.put('/api/auth/me', {
        fullName: fullName.trim(),
        company: company.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      const updatedUser = response.data.data.user;
      setUser(updatedUser);
      
      // Update the auth context so user name reflects everywhere
      updateUser(updatedUser);
      
      toast.success('Profile updated successfully');
    } catch (error: unknown) {
      console.error('Failed to update profile:', error);
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setPasswordSaving(true);
      await api.put('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });

      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      console.error('Failed to change password:', error);
      const message = error instanceof Error ? error.message : 'Failed to change password';
      toast.error(message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      case 'professional':
        return 'bg-blue-100 text-blue-800';
      case 'starter':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuotaPercentage = () => {
    if (!quota) return 0;
    return (quota.used / quota.monthlyLimit) * 100;
  };

  const getQuotaColor = () => {
    const percentage = getQuotaPercentage();
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 70) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex gap-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'security'
                  ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'subscription'
                  ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Subscription
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && user && (
          <div className="max-w-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Profile Information</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="input bg-gray-50 dark:bg-gray-700 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Email cannot be changed. Contact support if you need to update it.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="input"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                    placeholder="Optional"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn-primary"
                  >
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="max-w-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                    required
                    minLength={8}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="btn-primary"
                  >
                    {passwordSaving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* Two-Factor Authentication (Future) */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Add an extra layer of security to your account
              </p>
              <button className="btn-secondary" disabled>
                Coming Soon
              </button>
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && user && quota && (
          <div className="max-w-2xl space-y-6">
            {/* Current Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Current Plan</h2>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                      {user.subscriptionTier}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionBadgeColor(user.subscriptionTier)}`}>
                      {user.subscriptionStatus}
                    </span>
                  </div>
                  {user.subscriptionEndsAt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.subscriptionStatus === 'active' ? 'Renews' : 'Expires'}{' '}
                      {formatDistanceToNow(new Date(user.subscriptionEndsAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
                <button className="btn-primary">
                  Upgrade Plan
                </button>
              </div>

              {/* Quota Usage */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Webhook Quota</h4>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {quota.used.toLocaleString()} / {quota.monthlyLimit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getQuotaColor()}`}
                    style={{ width: `${Math.min(getQuotaPercentage(), 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {quota.remaining.toLocaleString()} webhooks remaining this month
                  {quota.resetsAt && ` • Resets ${formatDistanceToNow(new Date(quota.resetsAt), { addSuffix: true })}`}
                </p>
              </div>
            </div>

            {/* Plan Features */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plan Features</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {quota.monthlyLimit.toLocaleString()} webhooks per month
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Unlimited endpoints
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    30-day webhook history
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Automatic retry with exponential backoff
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Analytics and insights
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Email notifications
                  </span>
                </li>
              </ul>
            </div>

            {/* Billing History (Future) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Billing History</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                View and download your invoices
              </p>
              <button className="btn-secondary" disabled>
                Coming Soon
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
