import { randomUUID } from 'crypto';
import prisma from '../database/client';

export class BillingInvoiceService {
  async createInvoice(data: {
    schoolId: string;
    subscriptionId: string;
    invoiceNumber: string;
    subtotalMinor: number;
    taxMinor?: number;
    currency?: string;
    dueAt: string;
  }) {
    const taxMinor = data.taxMinor ?? 0;
    const totalMinor = data.subtotalMinor + taxMinor;

    return await (prisma as any).billingInvoice.create({
      data: {
        id: randomUUID(),
        schoolId: data.schoolId,
        subscriptionId: data.subscriptionId,
        invoiceNumber: data.invoiceNumber,
        subtotalMinor: data.subtotalMinor,
        taxMinor,
        totalMinor,
        amountPaidMinor: 0,
        currency: data.currency ?? 'KES',
        dueAt: new Date(data.dueAt),
        status: 'OPEN',
      },
      include: { school: true, subscription: true },
    });
  }

  async listInvoices(filters: { schoolId?: string; status?: string; page?: number; limit?: number }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.schoolId) where.schoolId = filters.schoolId;
    if (filters.status) where.status = filters.status;

    const [invoices, total] = await Promise.all([
      (prisma as any).billingInvoice.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      (prisma as any).billingInvoice.count({ where }),
    ]);

    return { invoices, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async recordPayment(data: {
    schoolId: string;
    subscriptionId: string;
    billingInvoiceId?: string;
    provider: string;
    providerReference?: string;
    amountMinor: number;
    currency?: string;
    paidAt?: string;
  }) {
    return await (prisma as any).$transaction(async (tx: any) => {
      const payment = await tx.billingPayment.create({
        data: {
          id: randomUUID(),
          schoolId: data.schoolId,
          subscriptionId: data.subscriptionId,
          billingInvoiceId: data.billingInvoiceId ?? null,
          provider: data.provider,
          providerReference: data.providerReference ?? null,
          amountMinor: data.amountMinor,
          currency: data.currency ?? 'KES',
          status: 'SUCCEEDED',
          paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
        },
      });

      if (data.billingInvoiceId) {
        const invoice = await tx.billingInvoice.findUnique({ where: { id: data.billingInvoiceId } });
        if (!invoice) throw new Error('Invoice not found');

        const nextPaid = invoice.amountPaidMinor + data.amountMinor;
        const nextStatus = nextPaid >= invoice.totalMinor ? 'PAID' : 'OPEN';

        await tx.billingInvoice.update({
          where: { id: data.billingInvoiceId },
          data: {
            amountPaidMinor: nextPaid,
            status: nextStatus,
            paidAt: nextStatus === 'PAID' ? new Date() : null,
          },
        });
      }

      return payment;
    });
  }
}
