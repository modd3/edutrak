import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {User, Role} from '@/types'

interface OverrideSchool {
  id: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  overrideSchool: OverrideSchool | null;

  // Actions
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setOverrideSchool: (school: OverrideSchool) => void;
  clearOverrideSchool: () => void;
  hasRole: (roles: Role | Role[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      overrideSchool: null,

      setAuth: (user, token, refreshToken) => {
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          overrideSchool: null,
        });
      },
      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      setOverrideSchool: (school) => {
        set({ overrideSchool: school });
      },

      clearOverrideSchool: () => {
        set({ overrideSchool: null });
      },

      hasRole: (roles) => {
        const user = get().user;
        if (!user) return false;

        if (Array.isArray(roles)) {
          return roles.includes(user.role);
        }
        return user.role === roles;
      },

      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;

        // Define permissions based on roles
        const permissions: Record<Role, string[]> = {
          SUPER_ADMIN: ['*'], // All permissions
          ADMIN: [
            'manage_users',
            'manage_students',
            'manage_teachers',
            'manage_classes',
            'view_reports',
            'manage_assessments',
          ],
          TEACHER: [
            'view_students',
            'manage_assessments',
            'view_classes',
            'grade_students',
          ],
          STUDENT: [
            'view_own_grades',
            'view_own_schedule',
            'view_own_profile',
          ],
          PARENT: [
            'view_child_grades',
            'view_child_schedule',
            'view_child_profile',
          ],
          SUPPORT_STAFF: [
            'view_students',
            'view_teachers',
          ],
        };

        const userPermissions = permissions[user.role] || [];
        return userPermissions.includes('*') || userPermissions.includes(permission);
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
