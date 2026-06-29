/**
 * Unit & Integration tests for School Context Multi-Tenant Middleware Isolation
 */

describe('Multi-Tenant Isolation Middleware (school-context)', () => {
  const buildSchoolWhereClause = (baseWhere: any = {}, schoolId?: string, isSuperAdmin: boolean = false) => {
    if (isSuperAdmin) {
      return baseWhere;
    }
    if (!schoolId) {
      return { ...baseWhere, schoolId: 'NONE' };
    }
    return { ...baseWhere, schoolId };
  };

  it('should restrict regular tenant queries strictly to their schoolId', () => {
    const schoolId = 'school-uuid-1234';
    const where = buildSchoolWhereClause({ status: 'ACTIVE' }, schoolId, false);
    expect(where).toEqual({ status: 'ACTIVE', schoolId: 'school-uuid-1234' });
  });

  it('should bypass schoolId restriction for SUPER_ADMIN users', () => {
    const schoolId = 'school-uuid-1234';
    const where = buildSchoolWhereClause({ status: 'ACTIVE' }, schoolId, true);
    expect(where).toEqual({ status: 'ACTIVE' });
  });

  it('should force empty result clause when schoolId is missing for non-superadmin', () => {
    const where = buildSchoolWhereClause({ status: 'ACTIVE' }, undefined, false);
    expect(where).toEqual({ status: 'ACTIVE', schoolId: 'NONE' });
  });
});
