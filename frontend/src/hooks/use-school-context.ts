import { useAuthStore } from '@/store/auth-store';

export function useSchoolContext() {
    const auth = useAuthStore();
    const { overrideSchool, setOverrideSchool, clearOverrideSchool } = auth;

    const user = auth.user;
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
   // const overrideSchool = auth.overrideSchool;
    const schoolId = isSuperAdmin ? overrideSchool?.id : user?.schoolId;
    const schoolName = isSuperAdmin ? overrideSchool?.name : user?.school?.name;

    const canAccessAllSchools  = isSuperAdmin && !overrideSchool;
    const needsSchoolFilter = !isSuperAdmin || !!overrideSchool;

    return {
        schoolId,
        schoolName,
        isSuperAdmin,
        canAccessAllSchools,
        needsSchoolFilter,
        user,
        overrideSchool,
        setOverrideSchool: auth.setOverrideSchool,
        clearOverrideSchool: auth.clearOverrideSchool,
        isOverrideActive: !!overrideSchool
    }
}



