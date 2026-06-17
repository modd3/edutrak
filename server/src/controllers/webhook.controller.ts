/**
 * Webhook Controller
 *
 * Handles incoming webhook notifications from payment providers.
 * Each provider (Daraja, Flutterwave, Stripe) sends payment confirmations
 * to these endpoints. The controller:
 * 1. Logs the raw payload for audit
 * 2. Validates the provider signature
 * 3. Routes to the appropriate provider handler
 * 4. Updates the invoice status on successful payment
 */
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import prisma from '../database/client';
import logger from '../utils/logger';
import { ResponseUtil } from '../utils/response';
import { RequestWithUser } from '../middleware/school-context';
import { PaymentProviderFactory } from '../services/payment-provider/PaymentProviderFactory';
import { WebhookPayload } from '../types/payment-provider.types';

export class WebhookController {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Generic webhook receiver for all providers.
   * Logs the payload first, then routes to the specific provider handler.
   *
   * POST /api/v1/webhooks/payments/:provider
   */
  async handlePaymentWebhook(req: RequestWithUser, res: Response) {
    const provider = (req.params.provider || '').toUpperCase();
    const rawBody = req.body;
    const signature = req.headers['x-signature'] as string || req.headers['authorization'] as string;
    const ipAddress = req.ip || req.socket.remoteAddress;

    logger.info('Received payment webhook', {
      provider,
      ipAddress,
      contentType: req.headers['content-type'],
    });

    try {
      // 1. Log the incoming webhook for audit trail
      const webhookLog = await this.prisma.webhookLog.create({
        data: {
          provider,
          event: req.headers['x-event-name'] as string || 'payment.notification',
          payload: rawBody,
          headers: req.headers as Record<string, unknown>,
          signature: signature || null,
          ipAddress,
          processed: false,
        },
      });

      // 2. Find which tenant this webhook belongs to
      //    This is determined by the provider's configuration (shortcode, account, etc.)
      const tenantId = await this.resolveTenantFromWebhook(provider, rawBody);

      if (!tenantId) {
        logger.warn('Could not resolve tenant from webhook', { provider, webhookLogId: webhookLog.id });
        // Still acknowledge to prevent provider from retrying
        return res.status(200).json({ status: 'received' });
      }

      // 3. Get the provider instance and let it handle the webhook
      const paymentProvider = await PaymentProviderFactory.getProvider(tenantId, provider);

      const webhookPayload: WebhookPayload = {
        provider,
        event: req.headers['x-event-name'] as string || 'payment.notification',
        rawBody,
        signature: signature || undefined,
        timestamp: req.headers['x-timestamp'] as string || undefined,
      };

      await paymentProvider.handleWebhook(webhookPayload);

      // 4. Process the payment confirmation (update invoice + create payment record)
      await this.processPaymentConfirmation(provider, rawBody, webhookLog.id);

      // 5. Mark webhook as processed
      await this.prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      // Always respond 200 to prevent provider from retrying
      return res.status(200).json({ status: 'success' });
    } catch (error: any) {
      logger.error('Error processing webhook', {
        provider,
        error: error.message,
      });

      // Still respond 200 for known providers to prevent retry storms
      return res.status(200).json({ status: 'received' });
    }
  }

  /**
   * M-Pesa specific callback endpoint.
   * Safaricom sends callbacks to this URL.
   *
   * POST /api/v1/webhooks/payments/mpesa/callback
   */
  async handleMpesaCallback(req: RequestWithUser, res: Response) {
    const rawBody = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;

    logger.info('Received M-Pesa callback', {
      ipAddress,
      checkoutRequestId: rawBody.Body?.stkCallback?.CheckoutRequestID,
    });

    try {
      // Log the callback
      await this.prisma.webhookLog.create({
        data: {
          provider: 'MPESA',
          event: 'mpesa.callback',
          payload: rawBody,
          headers: req.headers as Record<string, unknown>,
          ipAddress,
          processed: false,
        },
      });

      const callback = rawBody.Body?.stkCallback;
      if (!callback) {
        logger.warn('Invalid M-Pesa callback body');
        return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
      }

      const success = callback.ResultCode === 0;

      if (success) {
        const metadata = this.extractMpesaMetadata(callback.CallbackMetadata?.Item || []);
        logger.info('M-Pesa payment successful', {
          checkoutRequestId: callback.CheckoutRequestID,
          receiptNumber: metadata.MpesaReceiptNumber,
          amount: metadata.Amount,
          phoneNumber: metadata.PhoneNumber,
        });

        // TODO: Find the pending payment record by CheckoutRequestID and update it
        // This will be fully implemented when we add the online payment flow
        // to the fee service. For now we log it successfully.
      } else {
        logger.warn('M-Pesa payment failed', {
          checkoutRequestId: callback.CheckoutRequestID,
          resultCode: callback.ResultCode,
          reason: callback.ResultDesc,
        });
      }

      // M-Pesa expects ResultCode 0 to acknowledge receipt
      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Success',
      });
    } catch (error: any) {
      logger.error('Error processing M-Pesa callback', { error: error.message });
      // Still return success to M-Pesa
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
  }

  /**
   * Safaricom B2C (refund) timeout URL.
   */
  async handleMpesaTimeout(req: RequestWithUser, res: Response) {
    logger.warn('M-Pesa B2C timeout', { body: req.body });
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  /**
   * Safaricom B2C (refund) result URL.
   */
  async handleMpesaResult(req: RequestWithUser, res: Response) {
    logger.info('M-Pesa B2C result', { body: req.body });
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  /**
   * Try to resolve which tenant (school) a webhook belongs to.
   * For M-Pesa, this is based on the BusinessShortCode in the callback.
   */
  private async resolveTenantFromWebhook(
    provider: string,
    rawBody: Record<string, unknown>
  ): Promise<string | null> {
    try {
      if (provider === 'MPESA') {
        // For M-Pesa, the callback may not contain the tenant ID directly.
        // We need to look it up from the CheckoutRequestID or MerchantRequestID.
        const checkoutRequestId =
          (rawBody as any)?.Body?.stkCallback?.CheckoutRequestID;

        if (checkoutRequestId) {
          // Look up the pending payment record
          // This will work once we store CheckoutRequestID on payments
          // For now, return null and log
          logger.info('M-Pesa webhook needs CheckoutRequestID mapping', {
            checkoutRequestId,
          });
        }
      }

      // TODO: For Flutterwave/Stripe, use the webhook secret to find the config
      return null;
    } catch (error: any) {
      logger.error('Error resolving tenant from webhook', { error: error.message });
      return null;
    }
  }

  /**
   * Process a payment confirmation from a webhook.
   * Updates the invoice status and creates a FeePayment record.
   */
  private async processPaymentConfirmation(
    provider: string,
    rawBody: Record<string, unknown>,
    webhookLogId: string
  ): Promise<void> {
    try {
      if (provider === 'MPESA') {
        const callback = (rawBody as any)?.Body?.stkCallback;
        if (!callback || callback.ResultCode !== 0) return;

        const metadata = this.extractMpesaMetadata(
          callback.CallbackMetadata?.Item || []
        );

        const transactionRef = metadata.MpesaReceiptNumber as string;
        const amount = Number(metadata.Amount || 0);
        const phoneNumber = (metadata.PhoneNumber as string) || '';
        const checkoutRequestId = callback.CheckoutRequestID;

        // Find the invoice associated with this CheckoutRequestID
        // This requires storing CheckoutRequestID on FeePayment during initiation
        const payment = await this.prisma.feePayment.findFirst({
          where: { transactionRef: checkoutRequestId },
          include: { invoice: true },
        });

        if (payment) {
          if (payment.status === 'COMPLETED') {
            logger.warn('Payment already completed, skipping webhook processing', {
              paymentId: payment.id,
              transactionRef,
            });
            return;
          }

          // Update the payment record
          await this.prisma.$transaction(async (tx) => {
            await tx.feePayment.update({
              where: { id: payment.id },
              data: {
                status: 'COMPLETED',
                mpesaCode: transactionRef,
                transactionRef,
                paidAt: new Date(),
              },
            });

            // Update the invoice balance
            const invoice = payment.invoice;
            const newPaid = Number(invoice.paidAmount) + Number(payment.amount);
            const newBalance = Number(invoice.totalAmount) - Number(invoice.discountAmount) - newPaid;

            await tx.feeInvoice.update({
              where: { id: invoice.id },
              data: {
                paidAmount: newPaid,
                balanceAmount: Math.max(0, newBalance),
                status: newPaid >= Number(invoice.totalAmount) - Number(invoice.discountAmount)
                  ? 'PAID'
                  : 'PARTIAL',
              },
            });
          });

          logger.info('Payment confirmed via webhook', {
            paymentId: payment.id,
            invoiceId: payment.invoiceId,
            mpesaCode: transactionRef,
          });
        }
      }
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
      if (item.Value !== undefined) {
        metadata[item.Name] = item.Value;
      }
    }
    return metadata;
  }
}

export const webhookController = new WebhookController();