/**
 * PaymentPlanService
 *
 * Manages installment payment plans for invoices.
 * Allows splitting a large invoice into smaller, scheduled payments.
 *
 * Features:
 *  - Create installment plans (monthly, weekly, bi-weekly)
 *  - Auto-generate installment schedule
 *  - Track installment status (PENDING, PAID, OVERDUE)
 *  - Link payments to specific installments
 *
 * Usage:
 * ```ts
 * const plan = await PaymentPlanService.createPlan({
 *   invoiceId,
 *   installments: 3,
 *   frequency: 'MONTHLY',
 *   firstDueDate: '2025-02-01',
 * });
 * ```
 */
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';
import { addMonths, addWeeks, addDays } from 'date-fns';
import prisma from '../../database/client';
import logger from '../../utils/logger';
import { BaseService } from '../base.service';
import { RequestWithUser } from '../../middleware/school-context';

interface CreatePlanInput {
  invoiceId: string;
  installments: number;
  frequency: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'CUSTOM';
  firstDueDate: Date | string;
  customDays?: number; // For CUSTOM frequency
  notes?: string;
}

interface PlanWithSchedule {
  id: string;
  invoiceId: string;
  totalAmount: number;
  installments: number;
  frequency: string;
  firstDueDate: Date;
  isActive: boolean;
  schedule: Array<{
    installmentNo: number;
    dueDate: Date;
    amount: number;
    status: string;
    paidAmount: number | null;
    paidAt: Date | null;
  }>;
}

export class PaymentPlanService extends BaseService {
  private req?: RequestWithUser;

  constructor(req?: RequestWithUser) {
    super();
    this.req = req;
  }

  static withRequest(req: RequestWithUser): PaymentPlanService {
    return new PaymentPlanService(req);
  }

  /**
   * Create a payment plan with installment schedule for an invoice.
   */
  async createPlan(data: CreatePlanInput): Promise<PlanWithSchedule> {
    // Validate the invoice
    const invoice = await this.prisma.feeInvoice.findUnique({
      where: { id: data.invoiceId },
    });

    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'CANCELLED') throw new Error('Cannot create plan for cancelled invoice');
    if (invoice.status === 'PAID') throw new Error('Invoice is already paid');

    const outstandingBalance = Number(invoice.totalAmount) - Number(invoice.discountAmount) - Number(invoice.paidAmount);
    if (outstandingBalance <= 0) throw new Error('Invoice has no outstanding balance');

    // Check if a plan already exists
    const existing = await this.prisma.paymentPlan.findUnique({
      where: { invoiceId: data.invoiceId },
    });
    if (existing) {
      throw new Error('A payment plan already exists for this invoice');
    }

    if (data.installments < 2) {
      throw new Error('Payment plan must have at least 2 installments');
    }

    // Calculate installment amounts
    const installmentAmount = Math.round((outstandingBalance / data.installments) * 100) / 100;
    const lastInstallmentAmount = Math.round(
      (outstandingBalance - installmentAmount * (data.installments - 1)) * 100
    ) / 100;

    // Generate the schedule dates
    const firstDueDate = new Date(data.firstDueDate);
    const scheduleDates = this.generateScheduleDates(
      firstDueDate,
      data.installments,
      data.frequency,
      data.customDays
    );

    // Create the plan and installments in a transaction
    const plan = await this.prisma.$transaction(async (tx) => {
      const created = await tx.paymentPlan.create({
        data: {
          id: uuidv4(),
          invoiceId: data.invoiceId,
          totalAmount: new Decimal(outstandingBalance),
          installments: data.installments,
          frequency: data.frequency,
          firstDueDate,
          notes: data.notes ?? null,
          schedule: {
            create: scheduleDates.map((dueDate, index) => ({
              id: uuidv4(),
              installmentNo: index + 1,
              dueDate,
              amount: new Decimal(
                index === data.installments - 1 ? lastInstallmentAmount : installmentAmount
              ),
              status: 'PENDING',
            })),
          },
        },
        include: {
          schedule: { orderBy: { installmentNo: 'asc' } },
        },
      });

      return created;
    });

    logger.info('Payment plan created', {
      invoiceId: data.invoiceId,
      installments: data.installments,
      frequency: data.frequency,
      totalAmount: outstandingBalance,
    });

    return this.formatPlan(plan);
  }

  /**
   * Get a payment plan with its schedule.
   */
  async getPlan(invoiceId: string) {
    const plan = await this.prisma.paymentPlan.findUnique({
      where: { invoiceId },
      include: {
        schedule: { orderBy: { installmentNo: 'asc' } },
        invoice: {
          select: {
            invoiceNo: true,
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
            status: true,
            student: {
              select: { admissionNo: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    return plan ? this.formatPlan(plan) : null;
  }

  /**
   * Get all active payment plans for a school.
   */
  async getSchoolPlans(schoolId: string) {
    const plans = await this.prisma.paymentPlan.findMany({
      where: {
        isActive: true,
        invoice: { schoolId },
      },
      include: {
        schedule: {
          where: { status: { notIn: ['PAID', 'SKIPPED'] } },
          orderBy: { dueDate: 'asc' },
        },
        invoice: {
          select: {
            invoiceNo: true,
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map((p) => ({
      id: p.id,
      invoiceId: p.invoiceId,
      invoiceNo: p.invoice.invoiceNo,
      totalAmount: Number(p.totalAmount),
      installments: p.installments,
      frequency: p.frequency,
      nextDueDate: p.schedule[0]?.dueDate || null,
      nextAmount: p.schedule[0]?.amount ? Number(p.schedule[0].amount) : null,
      remainingInstallments: p.schedule.length,
      isActive: p.isActive,
      createdAt: p.createdAt,
    }));
  }

  /**
   * Cancel a payment plan.
   */
  async cancelPlan(invoiceId: string) {
    const plan = await this.prisma.paymentPlan.findUnique({
      where: { invoiceId },
      include: {
        schedule: {
          where: { status: 'PENDING' },
        },
      },
    });

    if (!plan) throw new Error('Payment plan not found');
    if (!plan.isActive) throw new Error('Payment plan is already cancelled');

    // Cancel pending installments
    if (plan.schedule.length > 0) {
      await this.prisma.paymentPlanInstallment.updateMany({
        where: { planId: plan.id, status: 'PENDING' },
        data: { status: 'SKIPPED' },
      });
    }

    await this.prisma.paymentPlan.update({
      where: { id: plan.id },
      data: { isActive: false },
    });

    logger.info('Payment plan cancelled', { invoiceId, planId: plan.id });
  }

  /**
   * Record a payment against a specific installment.
   */
  async payInstallment(
    installmentId: string,
    amount: number,
    paymentId: string
  ) {
    const installment = await this.prisma.paymentPlanInstallment.findUnique({
      where: { id: installmentId },
      include: { plan: true },
    });

    if (!installment) throw new Error('Installment not found');
    if (installment.status === 'PAID') throw new Error('Installment is already paid');

    const installmentAmount = Number(installment.amount);
    if (amount < installmentAmount) {
      throw new Error(
        `Payment amount (${amount}) is less than installment amount (${installmentAmount})`
      );
    }

    await this.prisma.paymentPlanInstallment.update({
      where: { id: installmentId },
      data: {
        status: 'PAID',
        paidAmount: new Decimal(amount),
        paidAt: new Date(),
        paymentId,
      },
    });

    logger.info('Installment paid', {
      installmentId,
      planId: installment.planId,
      amount,
    });
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private generateScheduleDates(
    firstDueDate: Date,
    count: number,
    frequency: string,
    customDays?: number
  ): Date[] {
    const dates: Date[] = [];
    let current = new Date(firstDueDate);

    for (let i = 0; i < count; i++) {
      if (i === 0) {
        dates.push(new Date(current));
      } else {
        switch (frequency) {
          case 'MONTHLY':
            current = addMonths(current, 1);
            break;
          case 'WEEKLY':
            current = addWeeks(current, 1);
            break;
          case 'BIWEEKLY':
            current = addWeeks(current, 2);
            break;
          case 'CUSTOM':
            current = addDays(current, customDays ?? 30);
            break;
          default:
            current = addMonths(current, 1);
        }
        dates.push(new Date(current));
      }
    }

    return dates;
  }

  private formatPlan(plan: any): PlanWithSchedule {
    return {
      id: plan.id,
      invoiceId: plan.invoiceId,
      totalAmount: Number(plan.totalAmount),
      installments: plan.installments,
      frequency: plan.frequency,
      firstDueDate: plan.firstDueDate,
      isActive: plan.isActive,
      schedule: plan.schedule.map((s: any) => ({
        installmentNo: s.installmentNo,
        dueDate: s.dueDate,
        amount: Number(s.amount),
        status: s.status,
        paidAmount: s.paidAmount ? Number(s.paidAmount) : null,
        paidAt: s.paidAt,
      })),
    };
  }
}

// ─── Static helper for school-level plan summary ────────────────────────────

export async function getSchoolPlanSummary(schoolId: string) {
  const [activePlans, overdueInstallments] = await Promise.all([
    prisma.paymentPlan.count({
      where: {
        isActive: true,
        invoice: { schoolId },
      },
    }),
    prisma.paymentPlanInstallment.count({
      where: {
        status: 'OVERDUE',
        plan: {
          isActive: true,
          invoice: { schoolId },
        },
      },
    }),
  ]);

  return {
    activePlans,
    overdueInstallments,
  };
}