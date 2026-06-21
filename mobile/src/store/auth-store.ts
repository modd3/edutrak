import { create } from 'zustand'
import { User, School, LoginResponse } from '@/types'

interface AuthState {
  user: User | null
  school: School | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  setSession: (response: LoginResponse) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  restoreSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  school: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setSession: (response: LoginResponse) => {
    set({
      user: response.user,
      school: response.school,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    set({ accessToken, refreshToken })
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading })
  },

  logout: () => {
    set({
      user: null,
      school: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  restoreSession: async () => {
    try {
      // In a real app, load tokens from SecureStore
      // This will be implemented once expo-secure-store is installed
      set({ isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },
}))