import { useAuthStore, UserRole } from '@/store/auth-store';

type Permission = 
  | 'create_student'
  | 'edit_student'
  | 'delete_student'
  | 'enroll_student'
  | 'create_teacher'
  | 'edit_teacher'
  | 'delete_teacher'
  | 'create_class'
  | 'edit_class'
  | 'delete_class'
  | 'create_subject'
  | 'edit_subject'
  | 'delete_subject'
  | 'create_assessment'
  | 'edit_assessment'
  | 'delete_assessment'
  | 'grade_students'
  | 'view_grades'
  | 'create_school'
  | 'edit_school'
  | 'manage_users'
  | 'view_reports'
  | 'view_fees'
  | 'manage_fees'
  | 'record_payment';

/**
 * Permission Matrix: Maps roles to allowed permissions
 * This controls visibility of buttons, forms, and UI elements
 */
const permissionMatrix: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'create_student', 'edit_student', 'delete_student', 'enroll_student',
    'create_teacher', 'edit_teacher', 'delete_teacher',
    'create_class', 'edit_class', 'delete_class',
    'create_subject', 'edit_subject', 'delete_subject',
    'create_assessment', 'edit_assessment', 'delete_assessment',
    'grade_students', 'view_grades',
    'create_school', 'edit_school',
    'manage_users',
    'view_reports',
    'manage_fees',
    'view_fees',
    'record_payment',
  ],
  ADMIN: [
    'create_student', 'edit_student', 'delete_student', 'enroll_student',
    'create_teacher', 'edit_teacher', 'delete_teacher',
    'create_class', 'edit_class', 'delete_class',
    'create_subject', 'edit_subject', 'delete_subject',
    'create_assessment', 'edit_assessment', 'delete_assessment',
    'grade_students', 'view_grades',
    'manage_users',
    'view_reports',
    'manage_fees',
    'view_fees',
    'record_payment',
  ],
  TEACHER: [
    'view_grades',
    'grade_students',
    'view_reports',
    'view_fees',
  ],
  STUDENT: [
    'view_grades',
    'view_fees',
  ],
  PARENT: [
    'view_grades',
    'view_fees',
  ],
  SUPPORT_STAFF: [
    'view_grades',
    'view_fees'
  ],
};

interface UsePermissionResult {
  can: (permission: Permission) => boolean;
  cannot: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
}

/**
 * usePermission Hook
 * 
 * Granular permission checking for controlling UI element visibility.
 * Shows/hides buttons, forms, etc. based on user permissions.
 * 
 * Usage:
 * const { can, cannot } = usePermission();
 * 
 * {can('create_student') && <Button>Create Student</Button>}
 * {cannot('delete_student') && <span className="text-gray-400">Cannot delete</span>}
 */
export function usePermission(): UsePermissionResult {
  const { user } = useAuthStore();

  const getUserPermissions = (): Permission[] => {
    if (!user) return [];
    return permissionMatrix[user.role] || [];
  };

  const can = (permission: Permission): boolean => {
    const userPermissions = getUserPermissions();
    return userPermissions.includes(permission);
  };

  const cannot = (permission: Permission): boolean => {
    return !can(permission);
  };

  const canAny = (permissions: Permission[]): boolean => {
    return permissions.some(p => can(p));
  };

  const canAll = (permissions: Permission[]): boolean => {
    return permissions.every(p => can(p));
  };

  return {
    can,
    cannot,
    canAny,
    canAll,
  };
}
