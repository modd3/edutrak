import prisma from '../database/client';
import logger from '../utils/logger';
import { BillingInvoiceService } from './billing-invoice.service';
import emailService from '../utils/email';

const GRACE_DAYS = parseInt(process.env.SUBSCRIPTION_GRACE_DAYS || '7', 10);

export class SubscriptionLifecycleService {
  private billingInvoiceService = new BillingInvoiceService();

  /**
   * Run ALL lifecycle transitions in the correct order.
   * Called once per day by the scheduler.
   */
  async runAll(): Promise<LifecycleReport> {
    const report: LifecycleReport = {
      trialsExpired: 0,
      markedPastDue: 0,
      markedGrace: 0,
      suspended: 0,
      invoicesGenerated: 0,
      remindersSent: 0,
      errors: [],
    };

    try {
      report.trialsExpired = await this.expireTrials();
    } catch (err: any) {
      report.errors.push(`expireTrials: ${err.message}`);
      logger.error('Lifecycle expireTrials failed', { error: err.message });
    }

    try {
      report.markedPastDue = await this.markPastDue();
    } catch (err: any) {
      report.errors.push(`markPastDue: ${err.message}`);
      logger.error('Lifecycle markPastDue failed', { error: err.message });
    }

    try {
      report.markedGrace = await this.markGrace();
    } catch (err: any) {
      report.errors.push(`markGrace: ${err.message}`);
      logger.error('Lifecycle markGrace failed', { error: err.message });
    }

    try {
      report.suspended = await this.suspendGrace();
    } catch (err: any) {
      report.errors.push(`suspendGrace: ${err.message}`);
      logger.error('Lifecycle suspendGrace failed', { error: err.message });
    }

    try {
      report.invoicesGenerated = await this.autoGenerateInvoices();
    } catch (err: any) {
      report.errors.push(`autoGenerateInvoices: ${err.message}`);
      logger.error('Lifecycle autoGenerateInvoices failed', { error: err.message });
    }

    try {
      report.remindersSent = await this.sendExpiryReminders();
    } catch (err: any) {
      report.errors.push(`sendExpiryReminders: ${err.message}`);
      logger.error('Lifecycle sendExpiryReminders failed', { error: err.message });
    }

    logger.info('Subscription lifecycle run complete', { report });
    return report;
  }

  /**
   * Expire TRIALING subscriptions past their trialEndsAt.
   */
  async expireTrials(): Promise<number> {
    const now = new Date();
    const expired = await (prisma as any).tenantSubscription.updateMany({
      where: {
        status: 'TRIALING',
        trialEndsAt: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });

    if (expired.count > 0) {
      logger.info(`Expired ${expired.count} trialing subscriptions`);
    }
    return expired.count;
  }

  /**
   * Move ACTIVE subscriptions to PAST_DUE when currentPeriodEnd has passed.
   */
  async markPastDue(): Promise<number> {
    const now = new Date();
    const result = await (prisma as any).tenantSubscription.updateMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: { lt: now },
      },
      data: { status: 'PAST_DUE' },
    });

    if (result.count > 0) {
      logger.info(`Marked ${result.count} subscriptions as PAST_DUE`);
    }
    return result.count;
  }

  /**
   * Move PAST_DUE subscriptions to GRACE after grace period has elapsed.
   */
  async markGrace(): Promise<number> {
    const now = new Date();
    const graceThreshold = new Date(now.getTime() - GRACE_DAYS * 24 * 60 * 60 * 1000);

    const result = await (prisma as any).tenantSubscription.updateMany({
      where: {
        status: 'PAST_DUE',
        // If no explicit graceEndsAt, use currentPeriodEnd as baseline
        OR: [
          { graceEndsAt: { lt: now } },
          {
            graceEndsAt: null,
            currentPeriodEnd: { lt: graceThreshold },
          },
        ],
      },
      data: {
        status: 'GRACE',
        graceEndsAt: new Date(now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    if (result.count > 0) {
      logger.info(`Moved ${result.count} subscriptions to GRACE`);
    }
    return result.count;
  }

  /**
   * Move GRACE subscriptions to SUSPENDED when graceEndsAt has passed.
   */
  async suspendGrace(): Promise<number> {
    const now = new Date();
    const result = await (prisma as any).tenantSubscription.updateMany({
      where: {
        status: 'GRACE',
        graceEndsAt: { lt: now },
      },
      data: { status: 'SUSPENDED' },
    });

    if (result.count > 0) {
      logger.info(`Suspended ${result.count} subscriptions after grace period`);
    }
    return result.count;
  }

  /**
   * Auto-generate billing invoices for ACTIVE subscriptions at the start
   * of a new billing period. Advances currentPeriodStart/currentPeriodEnd
   * and increments renewalCount.
   */
  async autoGenerateInvoices(): Promise<number> {
    const now = new Date();
    let count = 0;

    const subscriptions = await (prisma as any).tenantSubscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: { lt: now },
      },
      include: {
        plan: true,
        school: true,
      },
    });

    for (const sub of subscriptions) {
      try {
        const plan = sub.plan;
        if (!plan) {
          logger.warn(`Sub ${sub.id} has no plan — skipping auto-invoice`);
          continue;
        }

        // Calculate new period dates based on billing interval
        const newPeriodStart = new Date(sub.currentPeriodEnd);
        const newPeriodEnd = this.calculateNextPeriodEnd(newPeriodStart, plan.billingInterval);

        // Generate invoice number: INV/{YYYYMMDD}/{SCHOOL_SHORT_ID}
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const schoolShort = (sub.schoolId || '').substring(0, 8).toUpperCase();
        const invoiceNumber = `SUB-INV-${dateStr}-${schoolShort}-${sub.renewalCount + 1}`;

        // Create the billing invoice
        await this.billingInvoiceService.createInvoice({
          schoolId: sub.schoolId,
          subscriptionId: sub.id,
          invoiceNumber,
          subtotalMinor: plan.priceMinor,
          taxMinor: 0,
          currency: plan.currency || 'KES',
          dueAt: newPeriodEnd.toISOString(),
        });

        // Advance the subscription period
        await (prisma as any).tenantSubscription.update({
          where: { id: sub.id },
          data: {
            currentPeriodStart: newPeriodStart,
            currentPeriodEnd: newPeriodEnd,
            lastBillingDate: now,
            renewalCount: { increment: 1 },
          },
        });

        count++;
        logger.info(`Auto-generated invoice ${invoiceNumber} for subscription ${sub.id}`);
      } catch (err: any) {
        logger.error(`Failed to auto-generate invoice for subscription ${sub.id}`, {
          error: err.message,
        });
      }
    }

    if (count > 0) {
      logger.info(`Auto-generated ${count} billing invoices`);
    }
    return count;
  }

  /**
   * Send email reminders for subscriptions expiring in 7, 3, or 1 day(s).
   */
  async sendExpiryReminders(): Promise<number> {
    const now = new Date();
    let totalSent = 0;

    // Check subscriptions expiring in 7, 3, or 1 days
    const reminderWindows = [7, 3, 1];

    for (const days of reminderWindows) {
      const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const targetStart = new Date(targetDate);
      targetStart.setHours(0, 0, 0, 0);
      const targetEnd = new Date(targetDate);
      targetEnd.setHours(23, 59, 59, 999);

      const subscriptions = await (prisma as any).tenantSubscription.findMany({
        where: {
          status: { in: ['TRIALING', 'ACTIVE'] },
          OR: [
            { trialEndsAt: { gte: targetStart, lte: targetEnd } },
            { currentPeriodEnd: { gte: targetStart, lte: targetEnd } },
          ],
        },
        include: {
          school: true,
          plan: true,
        },
      });

      for (const sub of subscriptions) {
        try {
          const schoolName = sub.school?.name || 'Your School';
          const planName = sub.plan?.name || 'Current Plan';
          const adminEmail = sub.school?.email;

          if (!adminEmail) {
            logger.warn(`No email for school ${sub.schoolId} — skipping reminder`);
            continue;
          }

          const expiryDate =
            sub.trialEndsAt && sub.trialEndsAt >= targetStart && sub.trialEndsAt <= targetEnd
              ? sub.trialEndsAt
              : sub.currentPeriodEnd;

          await emailService.sendSubscriptionExpiryReminder(
            adminEmail,
            schoolName,
            days,
            planName,
            expiryDate,
            sub.id,
          );

          totalSent++;
        } catch (err: any) {
          logger.error(`Failed to send reminder for subscription ${sub.id}`, {
            error: err.message,
          });
        }
      }
    }

    if (totalSent > 0) {
      logger.info(`Sent ${totalSent} subscription expiry reminders`);
    }
    return totalSent;
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private calculateNextPeriodEnd(from: Date, interval: string): Date {
    const date = new Date(from);
    switch (interval) {
      case 'MONTHLY':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'QUARTERLY':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'YEARLY':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
        break;
    }
    return date;
  }
}

export interface LifecycleReport {
  trialsExpired: number;
  markedPastDue: number;
  markedGrace: number;
  suspended: number;
  invoicesGenerated: number;
  remindersSent: number;
  errors: string[];
}