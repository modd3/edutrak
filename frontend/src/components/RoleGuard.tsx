import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/store/auth-store';

interface RoleGuardProps {
  children: ReactNode;
  roles: UserRole[];
  fallbackRoute?: string;
  fallbackComponent?: ReactNode;
}

/**
 * RoleGuard Component
 * 
 * Protects routes by checking if user has required role.
 * If unauthorized, redirects or shows fallback component.
 * 
 * Usage:
 * <RoleGuard roles={['ADMIN', 'SUPER_ADMIN']}>
 *   <StudentsList />
 * </RoleGuard>
 */
export function RoleGuard({
  children,
  roles,
  fallbackRoute = '/dashboard',
  fallbackComponent,
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    navigate('/login', { replace: true });
    return null;
  }

  // Check if user has required role
  console.log('RoleGuard - User Role:', user.role);
  console.log('RoleGuard - Allowed Roles:', roles);
  const hasAccess = roles.includes(user.role);

  if (!hasAccess) {
    // If fallback component provided, show it
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    // Otherwise redirect to fallback route
    navigate(fallbackRoute, { replace: true });
    return null;
  }

  // User has access, render children
  return <>{children}</>;
}
