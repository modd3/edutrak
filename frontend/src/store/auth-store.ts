import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'SUPPORT_STAFF';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: UserRole;
  schoolId?: string;
  school?: {
    id: string;
    name: string;
    type: string;
  };
  student?: {
    id: string;
    admissionNo: string;
  };
  teacher?: {
    id: string;
    tscNumber: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

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
        const permissions: Record<UserRole, string[]> = {
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