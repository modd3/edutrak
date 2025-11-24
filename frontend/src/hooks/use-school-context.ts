import { useAuthStore } from '@/store/auth-store';

export function useSchoolContext() {
    const auth = useAuthStore();

    const user = auth.user;
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const schoolId = user?.schoolId;
    const schoolName = user?.school?.name;

    const canAccessAllSchools  = isSuperAdmin;
    const needsSchoolFilter = !isSuperAdmin;

    return {
        schoolId,
        schoolName,
        isSuperAdmin,
        canAccessAllSchools,
        needsSchoolFilter,
        user
    }
}



