import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth-store';



const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds (increased from 30s to account for email sending)
});

// Request interceptor - Add auth token and override headers to requests
api.interceptors.request.use(
  (config) => {
    const { token, user, overrideSchool } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (user?.role === 'SUPER_ADMIN' && overrideSchool?.id) {
      config.headers['X-School-Override'] = overrideSchool.id;
    } else if (config.headers) {
      delete config.headers['X-School-Override'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If error is 402 (subscription inactive), redirect to the expired page
    if (error.response?.status === 402) {
      const data = error.response.data as { status?: string };
      if (data?.status) {
        sessionStorage.setItem('subscription_status', data.status);
      }
      if (window.location.pathname !== '/subscription-expired') {
        window.location.href = '/subscription-expired';
      }
      return Promise.reject(error);
    }

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
  
        try {
          const refreshToken = useAuthStore.getState().refreshToken;
  
          if (refreshToken) {
            // Try to refresh token
            const response = await axios.post(
              `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
              { refreshToken }
            );
  
            if (response.data.success) {
              const { token: newToken, refreshToken: newRefreshToken } = response.data.data;
  
              // Update tokens in store
              const currentUser = useAuthStore.getState().user;
              if (currentUser) {
                useAuthStore.getState().setAuth(currentUser, newToken, newRefreshToken);
              }
  
              // Retry original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return api(originalRequest);
            }
          }
        } catch (refreshError) {
          // Refresh failed - logout user
          useAuthStore.getState().logout();
         
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;