import { Decimal } from '@prisma/client/runtime/library';
import { InvoiceStatus, Prisma } from '@prisma/client';
import prisma from '../../database/client';
import { PaymentProviderFactory } from '../payment-provider/PaymentProviderFactory';
import { auditService } from '../audit.service';

export interface RefundRequest {
  paymentId: string;
  amount: number;
  reason: string;
  initiatedBy: string;
  notes?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amountRefunded: number;
  providerRefundId?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  message: string;
}

export interface RefundValidation {
  canRefund: boolean;
  reason?: string;
  maxRefundAmount: number;
  alreadyRefunded: number;
}

class RefundService {
  async validateRefund(paymentId: string): Promise<RefundValidation> {
    const payment = await prisma.feePayment.findUnique({
      where: { id: paymentId },
      include: { refunds: true },
    });

    if (!payment) {
      return { canRefund: false, reason: 'Payment not found', maxRefundAmount: 0, alreadyRefunded: 0 };
    }

    if (payment.status === 'REVERSED') {
      return { canRefund: false, reason: 'Payment already reversed', maxRefundAmount: 0, alreadyRefunded: 0 };
    }

    const alreadyRefunded = payment.refunds.reduce((sum, r) => sum + Number(r.amount), 0);
    const maxRefundAmount = Number(payment.amount) - alreadyRefunded;

    if (maxRefundAmount <= 0) {
      return { canRefund: false, reason: 'Fully refunded', maxRefundAmount: 0, alreadyRefunded };
    }

    return { canRefund: true, maxRefundAmount, alreadyRefunded };
  }

  async processRefund(request: RefundRequest): Promise<RefundResult> {
    const { paymentId, amount, reason, initiatedBy, notes } = request;

    const validation = await this.validateRefund(paymentId);
    if (!validation.canRefund) {
      return { success: false, refundId: '', amountRefunded: 0, status: 'FAILED', message: validation.reason || 'Cannot refund' };
    }

    if (amount > validation.maxRefundAmount) {
      return { success: false, refundId: '', amountRefunded: 0, status: 'FAILED', message: `Exceeds max: ${validation.maxRefundAmount}` };
    }

    const payment = await prisma.feePayment.findUnique({
      where: { id: paymentId },
      include: { invoice: true },
    });

    if (!payment) {
      return { success: false, refundId: '', amountRefunded: 0, status: 'FAILED', message: 'Payment not found' };
    }

    const result = await prisma.$transaction(async (tx) => {
      const refund = await tx.feeRefund.create({
        data: {
          paymentId,
          invoiceId: payment.invoiceId,
          studentId: payment.studentId,
          schoolId: payment.schoolId,
          amount,
          reason,
          initiatedBy,
          notes,
          status: 'PENDING',
        },
      });

      let providerRefundId: string | undefined;
      if (['MPESA', 'FLUTTERWAVE', 'CARD'].includes(payment.method)) {
        try {
          const provider = await PaymentProviderFactory.getProvider(payment.schoolId);
          const verification = await provider.verifyPayment(payment.transactionRef || payment.mpesaCode || '');
          
          if (verification.status === 'SUCCESS') {
            const refundResult = await provider.refundPayment(verification.providerTransactionId, amount);
            providerRefundId = refundResult.providerRefundId;

            await tx.feeRefund.update({
              where: { id: refund.id },
              data: { providerRefundId, status: 'COMPLETED', completedAt: new Date() },
            });
          }
        } catch (error) {
          await tx.feeRefund.update({
            where: { id: refund.id },
            data: { status: 'FAILED', errorMessage: error instanceof Error ? error.message : 'Provider refund failed' },
          });
          return { success: false, refundId: refund.id, amountRefunded: 0, status: 'FAILED' as const, message: 'Provider refund failed' };
        }
      } else {
        await tx.feeRefund.update({
          where: { id: refund.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      }

      const totalRefunded = validation.alreadyRefunded + amount;
      if (totalRefunded >= Number(payment.amount)) {
        await tx.feePayment.update({
          where: { id: paymentId },
          data: { status: 'REVERSED', reversalReason: reason, reversedAt: new Date() },
        });
      }

      // Recompute invoice balance and derive status (mirrors reversePayment logic)
      const inv = payment.invoice;
      const newPaid = Math.max(0, Number(inv.paidAmount) - amount);
      const newBalance = Number(inv.totalAmount) - Number(inv.discountAmount) - newPaid;

      let newStatus: InvoiceStatus;
      if (inv.status === 'CANCELLED' || inv.status === 'WAIVED') {
        newStatus = inv.status as InvoiceStatus;
      } else if (newPaid >= Number(inv.totalAmount) - Number(inv.discountAmount)) {
        newStatus = 'PAID';
      } else if (newPaid > 0) {
        newStatus = 'PARTIAL';
      } else if (inv.dueDate && inv.dueDate < new Date()) {
        newStatus = 'OVERDUE';
      } else {
        newStatus = 'UNPAID';
      }

      await tx.feeInvoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: new Decimal(newPaid),
          balanceAmount: new Decimal(Math.max(0, newBalance)),
          status: newStatus,
        },
      });

      return { success: true, refundId: refund.id, amountRefunded: amount, providerRefundId, status: 'COMPLETED' as const, message: 'Refund processed' };
    });

    auditService.log({
      schoolId: payment.schoolId,
      actorId: initiatedBy,
      actorRole: 'ADMIN',
      action: 'PROCESS_REFUND',
      entityType: 'FeePayment',
      entityId: paymentId,
      details: `Refund of ${amount} processed. Reason: ${reason}`,
    }).catch(() => {});

    return result;
  }

  async getRefundHistory(paymentId: string) {
    return prisma.feeRefund.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoiceRefunds(invoiceId: string) {
    return prisma.feeRefund.findMany({
      where: { invoiceId },
      include: {
        payment: { select: { receiptNo: true, method: true, paidAt: true } },
        initiator: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRefundStats(schoolId: string, from?: Date, to?: Date) {
    const where: Prisma.FeeRefundWhereInput = {
      schoolId,
      ...(from && { createdAt: { gte: from } }),
      ...(to && { createdAt: { lte: to } }),
    };

    const [totalRefunds, refundsByMethod] = await Promise.all([
      prisma.feeRefund.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.feeRefund.groupBy({
        by: ['paymentMethod'],
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      totalRefunded: Number(totalRefunds._sum.amount || 0),
      totalRefundCount: totalRefunds._count,
      byMethod: refundsByMethod.map(r => ({ method: r.paymentMethod, amount: Number(r._sum.amount || 0), count: r._count })),
    };
  }
}

export const refundService = new RefundService();
