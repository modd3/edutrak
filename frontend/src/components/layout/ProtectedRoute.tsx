import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { DashboardLayout } from './DashboardLayout';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}