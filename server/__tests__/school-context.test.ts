import { enforceSchoolContext, buildSchoolWhereClause, RequestWithUser } from '../src/middleware/school-context';
import prisma from '../src/database/client';
import { Response, NextFunction } from 'express';

jest.mock('../src/database/client', () => ({
  __esModule: true,
  default: {
    school: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../src/services/subscription.service', () => ({
  SubscriptionService: jest.fn().mockImplementation(() => ({
    getSubscriptions: jest.fn(),
  })),
}));

describe('school context override', () => {
  const createResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets req.schoolId from X-School-Override for super admins', async () => {
    (prisma.school.findUnique as jest.Mock).mockResolvedValue({ id: 'school-123' });
    const req = {
      user: { id: 'super-1', role: 'SUPER_ADMIN' },
      headers: { 'x-school-override': 'school-123' },
    } as unknown as RequestWithUser;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await enforceSchoolContext(req, res, next);

    expect(prisma.school.findUnique).toHaveBeenCalledWith({
      where: { id: 'school-123' },
      select: { id: true },
    });
    expect(req.isSuperAdmin).toBe(true);
    expect(req.schoolId).toBe('school-123');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('scopes where clauses for super admins when override schoolId is present', () => {
    expect(buildSchoolWhereClause({ isActive: true }, 'school-123', true)).toEqual({
      isActive: true,
      schoolId: 'school-123',
    });
  });
});
