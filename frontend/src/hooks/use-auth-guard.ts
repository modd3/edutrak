import { useAuthStore, UserRole, User } from '@/store/auth-store';

interface UseAuthGuardOptions {
  requiredRoles: UserRole[];
  redirectPath?: string;
}

interface UseAuthGuardResult {
  hasAccess: boolean;
  isLoading: boolean;
  user: User | null;
  userRole?: UserRole;
}

/**
 * useAuthGuard Hook
 * 
 * Defensive check inside components to verify user has required role.
 * Used as a fallback even if RoleGuard is on the route.
 * 
 * Usage:
 * const { hasAccess, isLoading } = useAuthGuard({
 *   requiredRoles: ['ADMIN', 'SUPER_ADMIN']
 * });
 * 
 * if (!hasAccess) {
 *   return <UnauthorizedAccess />;
 * }
 */
export function useAuthGuard({
  requiredRoles,
  redirectPath,
}: UseAuthGuardOptions): UseAuthGuardResult {
  const { user, isAuthenticated } = useAuthStore();

  const hasAccess =
    isAuthenticated &&
    (user !== null && user !== undefined) &&
    requiredRoles.includes(user.role);

  if (!hasAccess && redirectPath && user) {
    // Optionally handle redirect here if needed
    console.warn(`User ${user.email} lacks required role for access`, {
      userRole: user.role,
      requiredRoles,
      attemptedPath: redirectPath,
    });
  }

  return {
    hasAccess,
    isLoading: false,
    user,
    userRole: user?.role,
  };
}
