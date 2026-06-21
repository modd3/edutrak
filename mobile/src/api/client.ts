import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth-store'
import * as SecureStore from 'expo-secure-store'

const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api/v2'
  : 'https://api.edutrak.co.ke/api/v2'

const REFRESH_URL = `${API_BASE_URL}/auth/refresh`

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor: attach access token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken')
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`
      }
    } catch {
      // SecureStore not available (e.g., during testing)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 (token expired) with auto-refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken')

        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const refreshResponse = await axios.post(REFRESH_URL, {
          refreshToken,
        })

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          refreshResponse.data

        // Store new tokens
        await SecureStore.setItemAsync('accessToken', newAccessToken)
        await SecureStore.setItemAsync('refreshToken', newRefreshToken)

        // Update store
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken)

        processQueue(null, newAccessToken)

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// Auth API calls
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((res) => res.data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then((res) => res.data),

  logout: () => api.post('/auth/logout').then((res) => res.data),
}

// Students API
export const studentsApi = {
  list: (params?: { since?: string }) =>
    api.get('/students', { params }).then((res) => res.data),

  getById: (id: string) =>
    api.get(`/students/${id}`).then((res) => res.data),

  create: (data: Record<string, unknown>) =>
    api.post('/students', data).then((res) => res.data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/students/${id}`, data).then((res) => res.data),

  delete: (id: string) =>
    api.delete(`/students/${id}`).then((res) => res.data),
}

// Sync API
export const syncApi = {
  push: (changes: Record<string, unknown>) =>
    api.post('/sync/push', changes).then((res) => res.data),

  pull: (since?: number) =>
    api.get('/sync/pull', { params: { since } }).then((res) => res.data),

  resolve: (conflicts: Record<string, unknown>) =>
    api.post('/sync/resolve', conflicts).then((res) => res.data),

  status: () =>
    api.get('/sync/status').then((res) => res.data),
}