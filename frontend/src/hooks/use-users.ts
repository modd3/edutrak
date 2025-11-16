import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api  from '@/services/api.service';
import { User } from '@/types';
import { toast } from 'sonner';

interface UsersFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  schoolId?: string;
  isActive?: boolean;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface BulkCreateResult {
  successful: any[];
  failed: Array<{ data: any; error: string }>;
}

// Fetch users with filters
export function useUsers(filters?: UsersFilters) {
  return useQuery<UsersResponse>({
    queryKey: ['users', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.schoolId) params.append('schoolId', filters.schoolId);
      if (filters?.isActive !== undefined)
        params.append('isActive', filters.isActive.toString());

      const response = await api.get('/users', { 
        params: filters  // Let axios handle the URL encoding
      });
      return response.data;
    },
  });
}

// Fetch single user by ID
export function useUser(id: string, options?: { enabled?: boolean }) {
  return useQuery<User>({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}`);
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
  });
}

// Create user
export function useCreateUserWithProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { user: Partial<User>; profile?: any }) => {
      const response = await api.post('/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User and profile created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create user';
      toast.error(message);
      console.error('User creation error:', error);
    },
  });
}
  
  // Update user
  export function useUpdateUserWithProfile() {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: async ({ 
        id, 
        data 
      }: { 
        id: string; 
        data: { user: Partial<User>; profile?: any } 
      }) => {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
        toast.success('User and profile updated successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update user');
      },
    });
  }

  // Delete user
  export function useDeleteUser() {
    const queryClient = useQueryClient();
  
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/users/${id}`);
            return response.data;
          },
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User deleted successfully');
          },
          onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete user');
          },
        });
      }
      
      // Deactivate user
      export function useDeactivateUser() {
        const queryClient = useQueryClient();
      
        return useMutation({
          mutationFn: async (id: string) => {
            const response = await api.post(`/users/${id}/deactivate`);
            return response.data;
          },
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User deactivated successfully');
          },
          onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to deactivate user');
          },
        });
      }
      
      // Activate user
      export function useActivateUser() {
        const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/users/${id}/activate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User activated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to activate user');
    },
  });
}

// Change password
export function useChangePassword() {
  return useMutation({
    mutationFn: async ({
      userId,
      currentPassword,
      newPassword,
    }: {
      userId: string;
      currentPassword: string;
      newPassword: string;
    }) => {
      const response = await api.post(`/users/${userId}/change-password`, {
        currentPassword,
        newPassword,
      });
      return response.data;
    },
    onSuccess: () => {
        toast.success('Password changed successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to change password');
      },
    });
  }
  
  // Reset password (admin)
  export function useResetUserPassword() {
    return useMutation({
      mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
        const response = await api.post(`/users/${userId}/reset-password`, {
          newPassword,
        });
        return response.data;
      },
      onSuccess: () => {
        toast.success('Password reset successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to reset password');
      },
    });
  }
  
  // Bulk create users
// Add this to hooks/use-users.ts

// Bulk create users with profiles
export function useBulkCreateUsersWithProfiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (users: Array<{ user: any; profile?: any }>) => {
      const response = await api.post('/users/bulk', { users });
      return response.data as BulkCreateResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (data.successful.length > 0) {
        toast.success(`Successfully created ${data.successful.length} user(s) with profiles`);
      }
      if (data.failed.length > 0) {
        toast.error(`Failed to create ${data.failed.length} user(s)`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to bulk create users');
    },
  });
}
// Get user profile (current user)
export function useUserProfile() {
  return useQuery<User>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get('/auth/profile');
      return response.data;
    },
  });
}

// Get users by school
export function useUsersBySchool(schoolId: string, role?: string) {
  return useQuery<User[]>({
    queryKey: ['users', 'school', schoolId, role],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      const response = await api.get(`/schools/${schoolId}/users?${params.toString()}`);
      return response.data;
    },
    enabled: !!schoolId,
  });
}

// Get user statistics
export function useUserStatistics(schoolId?: string) {
  return useQuery({
    queryKey: ['user-statistics', schoolId],
    queryFn: async () => {
      const url = schoolId
        ? `/users/statistics?schoolId=${schoolId}`
        : '/users/statistics';
      const response = await api.get(url);
      return response.data;
    },
  });
}

// Check if email exists
export function useCheckEmailExists() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post('/users/check-email', { email });
      return response.data.exists;
    },
  });
}

// Check if ID number exists
export function useCheckIdNumberExists() {
  return useMutation({
    mutationFn: async (idNumber: string) => {
      const response = await api.post('/users/check-id-number', { idNumber });
      return response.data.exists;
    },
  });
}

