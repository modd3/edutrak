import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService, LoginCredentials, RegisterData } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

export function useLogin() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (response) => {
      const { user, token, refreshToken } = response.data;
      setAuth(user, token, refreshToken);
      toast.success('Login successful');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (response) => {
      const { user, token, refreshToken } = response.data;
      setAuth(user, token, refreshToken);
      toast.success('Registration successful');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Registration failed');
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    },
    onError: () => {
      // Even if API call fails, clear local state
      logout();
      navigate('/login');
    },
  });
}

export function useVerifySession() {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['session', user?.id],
    queryFn: () => authService.verifySession(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });
}