import prisma from '../database/client';

export class BrandingService {
  async getBySchoolId(schoolId: string) {
    return await (prisma as any).schoolBrandingConfig.findUnique({ where: { schoolId } });
  }

  async upsertBySchoolId(schoolId: string, data: any) {
    const existing = await (prisma as any).schoolBrandingConfig.findUnique({ where: { schoolId } });
    if (existing) {
      return await (prisma as any).schoolBrandingConfig.update({
        where: { schoolId },
        data,
      });
    }

    return await (prisma as any).schoolBrandingConfig.create({
      data: {
        schoolId,
        ...data,
      },
    });
  }
}
