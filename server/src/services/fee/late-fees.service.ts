/**
 * LateFeesService
 *
 * Auto-apply late payment penalties to overdue invoices.
 * Can be triggered via a scheduled job (cron) or manually by admin.
 *
 * Penalty types:
 *  - FLAT: Fixed amount (e.g., 500 KES per overdue invoice)
 *  - PERCENTAGE: Percentage of outstanding balance (e.g., 5% of overdue amount)
 *  - COMPOUND: Compound interest on outstanding balance
 *
 * Usage:
 * ```ts
 * // Scheduled job (cron)
 * await LateFeesService.applyLateFees(schoolId);
 *
 * // Manual for specific invoice
 * await LateFeesService.applyPenaltyToInvoice(invoiceId);
 * ```
 */
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../database/client';
import logger from '../../utils/logger';
import { BaseService } from '../base.service';
import { RequestWithUser } from '../../middleware/school-context';

interface LateFeeResult {
  invoiceId: string;
  invoiceNo: string;
  penaltyAmount: number;
  penaltyType: string;
}

export class LateFeesService extends BaseService {
  private req?: RequestWithUser;

  constructor(req?: RequestWithUser) {
    super();
    this.req = req;
  }

  static withRequest(req: RequestWithUser): LateFeesService {
    return new LateFeesService(req);
  }

  /**
   * Apply late fees to all overdue invoices for a school.
   * Designed to be called from a scheduled job (cron).
   */
  async applyLateFees(schoolId: string): Promise<LateFeeResult[]> {
    // Get the school's late fee configuration
    const config = await this.prisma.lateFeesConfig.findUnique({
      where: { schoolId },
    });

    if (!config || !config.isActive) {
      logger.info('Late fees not configured or inactive', { schoolId });
      return [];
    }

    // Find overdue invoices past the grace period
    const graceDate = new Date();
    graceDate.setDate(graceDate.getDate() - config.graceDays);

    const overdueInvoices = await this.prisma.feeInvoice.findMany({
      where: {
        schoolId,
        status: 'OVERDUE',
        dueDate: { lt: graceDate },
      },
      select: {
        id: true,
        invoiceNo: true,
        totalAmount: true,
        discountAmount: true,
        paidAmount: true,
        balanceAmount: true,
      },
    });

    if (overdueInvoices.length === 0) {
      logger.info('No overdue invoices found for late fee application', { schoolId });
      return [];
    }

    const results: LateFeeResult[] = [];

    for (const invoice of overdueInvoices) {
      const penalty = this.calculatePenalty(config, Number(invoice.balanceAmount));

      if (penalty <= 0) continue;

      // Apply the penalty by adding to the invoice total
      await this.prisma.feeInvoice.update({
        where: { id: invoice.id },
        data: {
          totalAmount: new Decimal(Number(invoice.totalAmount) + penalty),
          balanceAmount: new Decimal(Number(invoice.balanceAmount) + penalty),
        },
      });

      logger.info('Late fee applied', {
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        penaltyAmount: penalty,
        penaltyType: config.penaltyType,
      });

      results.push({
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        penaltyAmount: penalty,
        penaltyType: config.penaltyType,
      });
    }

    logger.info('Late fees applied', {
      schoolId,
      count: results.length,
      totalAmount: results.reduce((s, r) => s + r.penaltyAmount, 0),
    });

    return results;
  }

  /**
   * Apply a one-time penalty to a specific overdue invoice.
   */
  async applyPenaltyToInvoice(invoiceId: string): Promise<number> {
    const invoice = await this.prisma.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: { feeStructure: true },
    });

    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status !== 'OVERDUE') throw new Error('Invoice is not overdue');

    const config = await this.prisma.lateFeesConfig.findUnique({
      where: { schoolId: invoice.schoolId },
    });

    if (!config || !config.isActive) {
      throw new Error('Late fees not configured for this school');
    }

    const penalty = this.calculatePenalty(config, Number(invoice.balanceAmount));

    if (penalty <= 0) return 0;

    await this.prisma.feeInvoice.update({
      where: { id: invoiceId },
      data: {
        totalAmount: new Decimal(Number(invoice.totalAmount) + penalty),
        balanceAmount: new Decimal(Number(invoice.balanceAmount) + penalty),
      },
    });

    logger.info('Manual late fee applied', {
      invoiceId,
      invoiceNo: invoice.invoiceNo,
      penaltyAmount: penalty,
    });

    return penalty;
  }

  // ─── Penalty Calculation ──────────────────────────────────────────────────

  private calculatePenalty(
    config: { penaltyType: string; penaltyAmount: Decimal; maxPenalty?: Decimal | null },
    outstandingBalance: number
  ): number {
    const penaltyAmount = Number(config.penaltyAmount);

    let penalty: number;

    switch (config.penaltyType) {
      case 'FLAT':
        penalty = penaltyAmount;
        break;

      case 'PERCENTAGE':
        penalty = (outstandingBalance * penaltyAmount) / 100;
        break;

      case 'COMPOUND': {
        // Compound interest: balance * (1 + rate/100)^days
        const dailyRate = penaltyAmount / 100 / 365;
        penalty = outstandingBalance * dailyRate * 30; // Approx monthly
        break;
      }

      default:
        penalty = 0;
    }

    // Apply max penalty cap if configured
    if (config.maxPenalty) {
      penalty = Math.min(penalty, Number(config.maxPenalty));
    }

    // Round to 2 decimal places
    return Math.round(penalty * 100) / 100;
  }

  // ─── Configuration Management ─────────────────────────────────────────────

  /**
   * Get or create late fee configuration for a school.
   */
  async getConfig(schoolId: string) {
    const config = await this.prisma.lateFeesConfig.findUnique({
      where: { schoolId },
    });

    if (!config) {
      // Return defaults
      return {
        schoolId,
        penaltyType: 'FLAT',
        penaltyAmount: 500,
        graceDays: 7,
        maxPenalty: null,
        applyRecurring: false,
        recurrenceDays: null,
        isActive: false,
      };
    }

    return config;
  }

  /**
   * Upsert (create or update) late fee configuration for a school.
   */
  async upsertConfig(schoolId: string, data: {
    penaltyType: string;
    penaltyAmount: number;
    graceDays?: number;
    maxPenalty?: number | null;
    applyRecurring?: boolean;
    recurrenceDays?: number | null;
    isActive?: boolean;
  }) {
    const config = await this.prisma.lateFeesConfig.upsert({
      where: { schoolId },
      create: {
        id: uuidv4(),
        schoolId,
        penaltyType: data.penaltyType,
        penaltyAmount: new Decimal(data.penaltyAmount),
        graceDays: data.graceDays ?? 7,
        maxPenalty: data.maxPenalty ? new Decimal(data.maxPenalty) : null,
        applyRecurring: data.applyRecurring ?? false,
        recurrenceDays: data.recurrenceDays ?? null,
        isActive: data.isActive ?? true,
      },
      update: {
        penaltyType: data.penaltyType,
        penaltyAmount: new Decimal(data.penaltyAmount),
        graceDays: data.graceDays ?? 7,
        maxPenalty: data.maxPenalty ? new Decimal(data.maxPenalty) : null,
        applyRecurring: data.applyRecurring ?? false,
        recurrenceDays: data.recurrenceDays ?? null,
        isActive: data.isActive ?? true,
      },
    });

    logger.info('Late fee config updated', { schoolId, penaltyType: data.penaltyType });
    return config;
  }
}

// ─── Static convenience method for cron jobs ─────────────────────────────────

export async function runLateFeeJob(): Promise<void> {
  const schools = await prisma.school.findMany({
    where: {
      lateFeesConfig: {
        isActive: true,
      },
    },
    select: { id: true },
  });

  const service = new LateFeesService();
  for (const school of schools) {
    try {
      await service.applyLateFees(school.id);
    } catch (error: any) {
      logger.error('Late fee job failed for school', {
        schoolId: school.id,
        error: error.message,
      });
    }
  }
}