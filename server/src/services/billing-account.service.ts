import { randomUUID } from 'crypto';
import prisma from '../database/client';

export class BillingAccountService {
  async upsertBillingAccount(data: {
    schoolId: string;
    legalName: string;
    email?: string;
    phone?: string;
    taxId?: string;
    country?: string;
    city?: string;
    addressLine1?: string;
    addressLine2?: string;
    preferredCurrency?: string;
  }) {
    const existing = await (prisma as any).billingAccount.findUnique({ where: { schoolId: data.schoolId } });

    if (existing) {
      return await (prisma as any).billingAccount.update({
        where: { schoolId: data.schoolId },
        data: {
          legalName: data.legalName,
          email: data.email ?? null,
          phone: data.phone ?? null,
          taxId: data.taxId ?? null,
          country: data.country ?? null,
          city: data.city ?? null,
          addressLine1: data.addressLine1 ?? null,
          addressLine2: data.addressLine2 ?? null,
          preferredCurrency: data.preferredCurrency ?? 'KES',
        },
      });
    }

    return await (prisma as any).billingAccount.create({
      data: {
        id: randomUUID(),
        schoolId: data.schoolId,
        legalName: data.legalName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        taxId: data.taxId ?? null,
        country: data.country ?? null,
        city: data.city ?? null,
        addressLine1: data.addressLine1 ?? null,
        addressLine2: data.addressLine2 ?? null,
        preferredCurrency: data.preferredCurrency ?? 'KES',
      },
    });
  }

  async getBillingAccountBySchool(schoolId: string) {
    return await (prisma as any).billingAccount.findUnique({
      where: { schoolId },
      include: { school: { select: { id: true, name: true } } },
    });
  }
}
