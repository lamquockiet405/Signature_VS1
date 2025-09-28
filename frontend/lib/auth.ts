import Cookies from 'js-cookie';
import { authAPI } from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  mst?: string;
  full_name: string;
  phone?: string;
  organization?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export const auth = {
  // Login user
  login: async (username: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await authAPI.login({ username, password });
      const { data } = response.data;
      
      // Store token in cookie
      Cookies.set('auth_token', data.token, { 
        expires: 1, // 1 day
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Register user
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    mst?: string;
    full_name: string;
    phone?: string;
    organization?: string;
  }): Promise<any> => {
    try {
      const response = await authAPI.register(userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Remove token from cookie
      Cookies.remove('auth_token');
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = Cookies.get('auth_token');
      if (!token) return null;

      const response = await authAPI.getMe();
      return response.data.data;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!Cookies.get('auth_token');
  },

  // Get token
  getToken: (): string | undefined => {
    return Cookies.get('auth_token');
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<any> => {
    try {
      const response = await authAPI.changePassword({ currentPassword, newPassword });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password change failed');
    }
  }
};
