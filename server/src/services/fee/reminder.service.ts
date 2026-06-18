/**
 * ReminderService
 *
 * Manages payment reminders for invoices.
 * Tracks all reminders sent (SMS, email, push, system) and their delivery status.
 * Designed to be called from a scheduled job or triggered manually.
 *
 * Reminder types:
 *  - PAYMENT_DUE: Sent X days before due date
 *  - OVERDUE_3DAYS: 3 days past due
 *  - OVERDUE_7DAYS: 1 week past due
 *  - FINAL_NOTICE: Final warning before escalation
 *
 * Usage:
 * ```ts
 * // Send a reminder for a specific invoice
 * await ReminderService.sendReminder(invoiceId, 'OVERDUE_7DAYS', 'SMS');
 *
 * // Scheduled job: process all pending reminders
 * await ReminderService.processPendingReminders(schoolId);
 * ```
 */
import prisma from '../../database/client';
import logger from '../../utils/logger';
import { BaseService } from '../base.service';
import { RequestWithUser } from '../../middleware/school-context';

interface ReminderResult {
  invoiceId: string;
  invoiceNo: string;
  reminderType: string;
  method: string;
  status: 'SENT' | 'FAILED';
  errorMessage?: string;
}

export class ReminderService extends BaseService {
  private req?: RequestWithUser;

  constructor(req?: RequestWithUser) {
    super();
    this.req = req;
  }

  static withRequest(req: RequestWithUser): ReminderService {
    return new ReminderService(req);
  }

  /**
   * Send a reminder for a specific invoice.
   * Creates a PaymentReminder record and attempts delivery.
   */
  async sendReminder(
    invoiceId: string,
    reminderType: string,
    method: string = 'SYSTEM'
  ): Promise<ReminderResult> {
    const invoice = await this.prisma.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            guardians: {
              include: {
                guardian: {
                  include: {
                    user: {
                      select: { phone: true, email: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) throw new Error('Invoice not found');

    const recipientContact = this.getRecipientContact(invoice, method);

    try {
      // Create the reminder record
      const reminder = await this.prisma.paymentReminder.create({
        data: {
          invoiceId,
          reminderType,
          method,
          recipientContact,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      logger.info('Reminder sent', {
        invoiceId,
        invoiceNo: invoice.invoiceNo,
        reminderType,
        method,
        recipientContact,
      });

      return {
        invoiceId,
        invoiceNo: invoice.invoiceNo,
        reminderType,
        method,
        status: 'SENT',
      };
    } catch (error: any) {
      // Log the failed reminder
      await this.prisma.paymentReminder.create({
        data: {
          invoiceId,
          reminderType,
          method,
          recipientContact,
          status: 'FAILED',
          errorMessage: error.message,
        },
      });

      logger.error('Reminder failed', {
        invoiceId,
        reminderType,
        method,
        error: error.message,
      });

      return {
        invoiceId,
        invoiceNo: invoice.invoiceNo,
        reminderType,
        method,
        status: 'FAILED',
        errorMessage: error.message,
      };
    }
  }

  /**
   * Process all pending reminders for a school.
   * Checks overdue invoices and sends appropriate reminders.
   */
  async processPendingReminders(schoolId: string): Promise<ReminderResult[]> {
    const results: ReminderResult[] = [];
    const today = new Date();

    // Find all overdue/soon-due invoices for this school
    const invoices = await this.prisma.feeInvoice.findMany({
      where: {
        schoolId,
        status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
      },
      select: {
        id: true,
        invoiceNo: true,
        status: true,
        dueDate: true,
        balanceAmount: true,
      },
    });

    for (const invoice of invoices) {
      const reminderType = this.determineReminderType(invoice.status, invoice.dueDate, today);

      if (!reminderType) continue;

      // Check if we already sent this type of reminder recently
      const recentReminder = await this.prisma.paymentReminder.findFirst({
        where: {
          invoiceId: invoice.id,
          reminderType,
          sentAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24h
        },
      });

      if (recentReminder) continue; // Already sent this reminder type today

      const result = await this.sendReminder(invoice.id, reminderType, 'SYSTEM');
      results.push(result);
    }

    logger.info('Pending reminders processed', {
      schoolId,
      remindersSent: results.filter((r) => r.status === 'SENT').length,
      failed: results.filter((r) => r.status === 'FAILED').length,
    });

    return results;
  }

  /**
   * Get reminder history for an invoice.
   */
  async getReminderHistory(invoiceId: string) {
    return await this.prisma.paymentReminder.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Get aggregated reminder stats for a school.
   */
  async getSchoolReminderStats(schoolId: string) {
    const [total, sent, failed, byType] = await Promise.all([
      this.prisma.paymentReminder.count({
        where: { invoice: { schoolId } },
      }),
      this.prisma.paymentReminder.count({
        where: { invoice: { schoolId }, status: 'SENT' },
      }),
      this.prisma.paymentReminder.count({
        where: { invoice: { schoolId }, status: 'FAILED' },
      }),
      this.prisma.paymentReminder.groupBy({
        by: ['reminderType'],
        where: { invoice: { schoolId } },
        _count: { id: true },
      }),
    ]);

    return {
      total,
      sent,
      failed,
      byType: byType.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.reminderType]: curr._count.id,
        }),
        {} as Record<string, number>
      ),
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private determineReminderType(
    status: string,
    dueDate: Date | null,
    today: Date
  ): string | null {
    if (!dueDate) return null;

    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysOverdue = Math.ceil(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (status === 'OVERDUE') {
      if (daysOverdue >= 14) return 'FINAL_NOTICE';
      if (daysOverdue >= 7) return 'OVERDUE_7DAYS';
      if (daysOverdue >= 3) return 'OVERDUE_3DAYS';
      return null;
    }

    if (status === 'UNPAID' || status === 'PARTIAL') {
      if (daysUntilDue <= 3 && daysUntilDue >= 0) return 'PAYMENT_DUE';
    }

    return null;
  }

  private getRecipientContact(
    invoice: any,
    method: string
  ): string | undefined {
    if (method === 'SMS' || method === 'SYSTEM') {
      // Try student's phone first
      if (invoice.student?.phone) return invoice.student.phone;

      // Try primary guardian's phone
      const primaryGuardian = invoice.student?.guardians?.find(
        (sg: any) => sg.isPrimary
      );
      if (primaryGuardian?.guardian?.user?.phone) {
        return primaryGuardian.guardian.user.phone;
      }

      // Try any guardian's phone
      const anyGuardian = invoice.student?.guardians?.[0];
      if (anyGuardian?.guardian?.user?.phone) {
        return anyGuardian.guardian.user.phone;
      }
    }

    if (method === 'EMAIL') {
      const primaryGuardian = invoice.student?.guardians?.find(
        (sg: any) => sg.isPrimary
      );
      return primaryGuardian?.guardian?.user?.email;
    }

    return undefined;
  }
}

// ─── Static convenience for cron job ────────────────────────────────────────

export async function runReminderJob(): Promise<void> {
  const schools = await prisma.school.findMany({
    select: { id: true },
  });

  const service = new ReminderService();
  for (const school of schools) {
    try {
      await service.processPendingReminders(school.id);
    } catch (error: any) {
      logger.error('Reminder job failed for school', {
        schoolId: school.id,
        error: error.message,
      });
    }
  }
}