import { createHmac, timingSafeEqual } from 'crypto';
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../database/client';
import logger from '../utils/logger';
import { RequestWithUser } from '../middleware/school-context';
import { PaymentProviderFactory } from '../services/payment-provider/PaymentProviderFactory';
import { WebhookPayload } from '../types/payment-provider.types';
import { InputJsonArray } from '@prisma/client/runtime/library';

export class WebhookController {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  // ─── Generic webhook (POST /api/v1/webhooks/payments/:provider) ──────────────

  async handlePaymentWebhook(req: RequestWithUser, res: Response) {
    const provider = (req.params.provider || '').toUpperCase();
    const rawBody = req.body;
    const signature = (req.headers['x-signature'] as string) || (req.headers['authorization'] as string);
    const ipAddress = req.ip || req.socket.remoteAddress;

    logger.info('Received payment webhook', { provider, ipAddress });

    try {
      const webhookLog = await this.prisma.webhookLog.create({
        data: {
          provider,
          event: (req.headers['x-event-name'] as string) || 'payment.notification',
          payload: rawBody,
          headers: req.headers as Record<string, InputJsonArray>,
          signature: signature || null,
          ipAddress,
          processed: false,
        },
      });

      const tenantId = await this.resolveTenantFromWebhook(provider, rawBody);

      if (!tenantId) {
        logger.warn('Could not resolve tenant from webhook', { provider, webhookLogId: webhookLog.id });
        return res.status(200).json({ status: 'received' });
      }

      // Verify signature against the tenant's webhookSecret
      const verified = await this.verifySignature(provider, tenantId, signature, req.body);
      if (!verified) {
        logger.warn('Webhook signature verification failed', { provider, tenantId, webhookLogId: webhookLog.id });
        await this.prisma.webhookLog.update({
          where: { id: webhookLog.id },
          data: { error: 'Signature verification failed' },
        });
        // Return 200 to avoid leaking info to attackers, but do NOT process
        return res.status(200).json({ status: 'received' });
      }

      const paymentProvider = await PaymentProviderFactory.getProvider(tenantId, provider);
      const webhookPayload: WebhookPayload = {
        provider,
        event: (req.headers['x-event-name'] as string) || 'payment.notification',
        rawBody,
        signature: signature || undefined,
        timestamp: req.headers['x-timestamp'] as string | undefined,
      };
      await paymentProvider.handleWebhook(webhookPayload);

      await this.processPaymentConfirmation(provider, rawBody, webhookLog.id);

      await this.prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: { processed: true, processedAt: new Date() },
      });

      return res.status(200).json({ status: 'success' });
    } catch (error: any) {
      logger.error('Error processing webhook', { provider, error: error.message });
      return res.status(200).json({ status: 'received' });
    }
  }

  // ─── M-Pesa specific callback (POST /api/v1/webhooks/payments/mpesa/callback) ─

  async handleMpesaCallback(req: RequestWithUser, res: Response) {
    const rawBody = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const callback = rawBody.Body?.stkCallback;

    logger.info('Received M-Pesa callback', {
      ipAddress,
      checkoutRequestId: callback?.CheckoutRequestID,
    });

    try {
      const webhookLog = await this.prisma.webhookLog.create({
        data: {
          provider: 'MPESA',
          event: 'mpesa.callback',
          payload: rawBody,
          headers: req.headers as Record<string, InputJsonArray>,
          ipAddress,
          processed: false,
        },
      });

      if (!callback) {
        logger.warn('Invalid M-Pesa callback body');
        return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
      }

      if (callback.ResultCode === 0) {
        await this.processPaymentConfirmation('MPESA', rawBody, webhookLog.id);
        await this.prisma.webhookLog.update({
          where: { id: webhookLog.id },
          data: { processed: true, processedAt: new Date() },
        });
      } else {
        logger.warn('M-Pesa payment failed', {
          checkoutRequestId: callback.CheckoutRequestID,
          resultCode: callback.ResultCode,
          reason: callback.ResultDesc,
        });
        // Mark the pending payment as failed
        await this.prisma.feePayment.updateMany({
          where: { transactionRef: callback.CheckoutRequestID, status: 'PENDING' },
          data: { status: 'FAILED' },
        });
      }

      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error: any) {
      logger.error('Error processing M-Pesa callback', { error: error.message });
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
  }

  async handleMpesaTimeout(req: RequestWithUser, res: Response) {
    logger.warn('M-Pesa B2C timeout', { body: req.body });
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  async handleMpesaResult(req: RequestWithUser, res: Response) {
    logger.info('M-Pesa B2C result', { body: req.body });
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Resolve which school owns this webhook by looking up the pending payment
   * (M-Pesa: by CheckoutRequestID) or the provider config (Flutterwave: by tx_ref).
   */
  private async resolveTenantFromWebhook(
    provider: string,
    rawBody: Record<string, unknown>
  ): Promise<string | null> {
    try {
      if (provider === 'MPESA') {
        const checkoutRequestId = (rawBody as any)?.Body?.stkCallback?.CheckoutRequestID;
        if (checkoutRequestId) {
          const payment = await this.prisma.feePayment.findFirst({
            where: { transactionRef: checkoutRequestId },
            select: { schoolId: true },
          });
          if (payment) return payment.schoolId;
        }
      }

      if (provider === 'FLUTTERWAVE') {
        // Flutterwave sends tx_ref which we set to our transactionRef
        const txRef = (rawBody as any)?.data?.tx_ref as string | undefined;
        if (txRef) {
          const payment = await this.prisma.feePayment.findFirst({
            where: { transactionRef: txRef },
            select: { schoolId: true },
          });
          if (payment) return payment.schoolId;
        }
        // Fall back: match by first active Flutterwave config that has the right secret
        // (handled during signature verification — here we return the first active one
        // so verifySignature can run; if it fails we discard)
        const config = await this.prisma.paymentProviderConfig.findFirst({
          where: { provider: 'FLUTTERWAVE', isActive: true },
          select: { tenantId: true },
        });
        return config?.tenantId ?? null;
      }

      return null;
    } catch (error: any) {
      logger.error('Error resolving tenant from webhook', { error: error.message });
      return null;
    }
  }

  /**
   * Verify the webhook signature against the stored webhookSecret for the tenant.
   *
   * M-Pesa (Daraja): Safaricom does not sign STK Push callbacks — we accept
   *   them if we can match the CheckoutRequestID to a known pending payment (done
   *   above in resolveTenantFromWebhook), which is sufficient for this flow.
   *
   * Flutterwave: Sends `verif-hash` header matching the webhook secret configured
   *   in the Flutterwave dashboard.
   */
  private async verifySignature(
    provider: string,
    tenantId: string,
    signature: string | undefined,
    body: unknown
  ): Promise<boolean> {
    // M-Pesa STK Push callbacks are not HMAC-signed by Safaricom;
    // tenant resolution via CheckoutRequestID is our security check.
    if (provider === 'MPESA') return true;

    if (!signature) {
      logger.warn('Missing signature for provider', { provider, tenantId });
      return false;
    }

    const config = await this.prisma.paymentProviderConfig.findFirst({
      where: { tenantId, provider, isActive: true },
      select: { webhookSecret: true },
    });

    if (!config?.webhookSecret) {
      // No secret configured — allow but warn
      logger.warn('No webhookSecret configured for provider, skipping signature check', { provider, tenantId });
      return true;
    }

    try {
      if (provider === 'FLUTTERWAVE') {
        // Flutterwave sends the raw secret as the header value
        const expected = Buffer.from(config.webhookSecret);
        const received = Buffer.from(signature);
        if (expected.length !== received.length) return false;
        return timingSafeEqual(expected, received);
      }

      // Generic HMAC-SHA256 (future providers)
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      const expected = createHmac('sha256', config.webhookSecret).update(bodyStr).digest('hex');
      const received = signature.replace(/^sha256=/, '');
      const expectedBuf = Buffer.from(expected, 'hex');
      const receivedBuf = Buffer.from(received, 'hex');
      if (expectedBuf.length !== receivedBuf.length) return false;
      return timingSafeEqual(expectedBuf, receivedBuf);
    } catch {
      return false;
    }
  }

  /**
   * Apply a confirmed payment to the invoice — shared by the generic handler
   * and the M-Pesa dedicated callback.
   */
  private async processPaymentConfirmation(
    provider: string,
    rawBody: Record<string, unknown>,
    webhookLogId: string
  ): Promise<void> {
    try {
      let checkoutRequestId: string | undefined;
      let mpesaReceiptCode: string | undefined;
      let txRef: string | undefined;

      if (provider === 'MPESA') {
        const callback = (rawBody as any)?.Body?.stkCallback;
        if (!callback || callback.ResultCode !== 0) return;
        const meta = this.extractMpesaMetadata(callback.CallbackMetadata?.Item || []);
        checkoutRequestId = callback.CheckoutRequestID as string;
        mpesaReceiptCode = meta.MpesaReceiptNumber as string;
      } else if (provider === 'FLUTTERWAVE') {
        const data = (rawBody as any)?.data;
        if (!data || data.status !== 'successful') return;
        txRef = data.tx_ref as string;
      } else {
        return;
      }

      const lookupRef = checkoutRequestId ?? txRef;
      if (!lookupRef) return;

      // First try to match a FeePayment (student fees)
      const feePayment = await this.prisma.feePayment.findFirst({
        where: { transactionRef: lookupRef, status: 'PENDING' },
        include: { invoice: true },
      });

      if (feePayment) {
        const invoice = feePayment.invoice;
        const newPaid = Number(invoice.paidAmount) + Number(feePayment.amount);
        const net = Number(invoice.totalAmount) - Number(invoice.discountAmount);
        const newBalance = Math.max(0, net - newPaid);
        const newStatus = newPaid >= net ? 'PAID' : 'PARTIAL';

        await this.prisma.$transaction(async (tx) => {
          await tx.feePayment.update({
            where: { id: feePayment.id },
            data: {
              status: 'COMPLETED',
              paidAt: new Date(),
              ...(mpesaReceiptCode && { mpesaCode: mpesaReceiptCode, transactionRef: mpesaReceiptCode }),
            },
          });
          await tx.feeInvoice.update({
            where: { id: invoice.id },
            data: {
              paidAmount: new Decimal(newPaid),
              balanceAmount: new Decimal(newBalance),
              status: newStatus,
            },
          });
        });

        logger.info('Fee payment confirmed via webhook', {
          paymentId: feePayment.id,
          invoiceId: invoice.id,
          provider,
          newStatus,
        });
        return;
      }

      // If no fee payment found, try BillingPayment (subscription invoices)
      const billingPayment = await this.prisma.billingPayment.findFirst({
        where: {
          providerReference: lookupRef,
          status: 'PENDING',
        },
        include: { invoice: true },
      });

      if (billingPayment) {
        await this.prisma.$transaction(async (tx: any) => {
          // Mark payment as completed
          await tx.billingPayment.update({
            where: { id: billingPayment.id },
            data: {
              status: 'COMPLETED',
              paidAt: new Date(),
              providerReference: mpesaReceiptCode || billingPayment.providerReference,
            },
          });

          // Update invoice
          if (billingPayment.billingInvoiceId) {
            const billInvoice = await tx.billingInvoice.findUnique({
              where: { id: billingPayment.billingInvoiceId },
            });

            if (billInvoice) {
              const nextPaid = billInvoice.amountPaidMinor + billingPayment.amountMinor;
              const nextStatus = nextPaid >= billInvoice.totalMinor ? 'PAID' : 'OPEN';

              await tx.billingInvoice.update({
                where: { id: billingPayment.billingInvoiceId },
                data: {
                  amountPaidMinor: nextPaid,
                  status: nextStatus,
                  paidAt: nextStatus === 'PAID' ? new Date() : null,
                },
              });

              // If invoice is fully paid, transition subscription back to ACTIVE
              // if it was in PAST_DUE, GRACE, or SUSPENDED
              if (nextStatus === 'PAID') {
                const subscription = await tx.tenantSubscription.findUnique({
                  where: { id: billingPayment.subscriptionId },
                });

                if (subscription && ['PAST_DUE', 'GRACE', 'SUSPENDED'].includes(subscription.status)) {
                  await tx.tenantSubscription.update({
                    where: { id: subscription.id },
                    data: { status: 'ACTIVE' },
                  });
                  logger.info('Subscription reactivated after payment', {
                    subscriptionId: subscription.id,
                  });
                }
              }
            }
          }
        });

        logger.info('Billing payment confirmed via webhook', {
          paymentId: billingPayment.id,
          invoiceId: billingPayment.billingInvoiceId,
          provider,
        });
        return;
      }

      logger.warn('No pending payment found for webhook', { lookupRef, provider, webhookLogId });
    } catch (error: any) {
      logger.error('Error processing payment confirmation from webhook', {
        error: error.message,
        webhookLogId,
      });
    }
  }

  private extractMpesaMetadata(
    items: Array<{ Name: string; Value?: string | number }>
  ): Record<string, string | number> {
    const metadata: Record<string, string | number> = {};
    for (const item of items) {
      if (item.Value !== undefined) metadata[item.Name] = item.Value;
    }
    return metadata;
  }
}

export const webhookController = new WebhookController();
