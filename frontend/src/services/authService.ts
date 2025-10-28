import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

export interface User {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  webhookQuota: number;
  webhookUsage: number;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  quotaPercentage: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  data: {
    user: User;
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', data);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async me(): Promise<User> {
    const response = await api.get<{ success: boolean; data: { user: User } }>('/api/auth/me');
    const user = response.data.data.user;
    
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<{ success: boolean; data: { user: User } }>('/api/auth/profile', data);
    const user = response.data.data.user;
    
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/api/auth/password', { currentPassword, newPassword });
  }
}

export default new AuthService();
