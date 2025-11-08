import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import apiClient from '@/lib/api-client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await apiClient.post('/users/login', {
            email,
            password,
          });

          // Accept common response shapes:
          // 1) { success, data: { user, token } }
          // 2) { success, data: user, token }
          // 3) { token, user }
          // 4) { data: { ... } } etc.
          const payload = response.data ?? {};
          // token may be at payload.token, payload.data.token, payload.data?.token, payload.data?.user?.token
          const token =
            (payload && (payload.token || payload.data?.token || payload.data?.user?.token)) ??
            null;

          // user may be at payload.data (object) or payload.user or payload.data.user
          const user =
            (payload && (payload.data?.user || payload.user || payload.data)) ?? null;

          if (!token) {
            // If no token, try to use jwt from headers or other fields (optional)
            // Throw an error so caller shows an informative toast
            throw new Error(payload.message || 'Login failed: missing token in response');
          }

          // persist token in localStorage and configure apiClient for future requests
          localStorage.setItem('auth_token', token);
          apiClient.defaults.headers.Authorization = `Bearer ${token}`;

          set({
            user,
            token,
            isAuthenticated: true,
          });
        } catch (error: any) {
          // Normalize axios errors to throw a friendly Error
          if (error?.response?.data?.message) {
            throw new Error(error.response.data.message);
          }
          throw new Error(error?.message || 'Login failed');
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        // remove header if set
        try {
          delete apiClient.defaults.headers.Authorization;
        } catch {
          /* ignore */
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);