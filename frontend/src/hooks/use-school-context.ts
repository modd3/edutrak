import { useAuthStore } from '@/store/auth-store';

export function useSchoolContext() {
    const auth = useAuthStore();
    const { overrideSchool, setOverrideSchool, clearOverrideSchool } = auth;

    const user = auth.user;
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isOverrideActive = isSuperAdmin && !!overrideSchool;
    const schoolId = overrideSchool?.id ?? user?.schoolId;
    const schoolName = overrideSchool?.name ?? user?.school?.name;

    const canAccessAllSchools = isSuperAdmin && !overrideSchool;
    const needsSchoolFilter = !isSuperAdmin || !!overrideSchool;

    return {
        schoolId,
        schoolName,
        isSuperAdmin,
        isOverrideActive,
        canAccessAllSchools,
        needsSchoolFilter,
        user,
        overrideSchool,
        setOverrideSchool,
        clearOverrideSchool,
    }
}



