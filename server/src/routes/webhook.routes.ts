/**
 * Webhook Routes
 *
 * Payment provider webhook endpoints.
 * These are PUBLIC endpoints (no authentication) because payment providers
 * call them directly. Security is handled via signature verification.
 *
 * All endpoints respond 200 OK to prevent provider retry storms,
 * even if processing fails. Errors are logged for manual reconciliation.
 */
import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';

const router = Router();

// ─── Payment Webhooks (Public) ────────────────────────────────────────────────

/**
 * POST /webhooks/payments/mpesa/callback
 * Safaricom M-Pesa STK Push callback URL.
 * Called after user enters PIN on their phone.
 * Must respond with ResultCode: 0 to acknowledge.
 */
router.post(
  '/payments/mpesa/callback',
  webhookController.handleMpesaCallback.bind(webhookController)
);

/**
 * POST /webhooks/payments/mpesa/timeout
 * M-Pesa B2C (refund) timeout URL.
 */
router.post(
  '/payments/mpesa/timeout',
  webhookController.handleMpesaTimeout.bind(webhookController)
);

/**
 * POST /webhooks/payments/mpesa/result
 * M-Pesa B2C (refund) result URL.
 */
router.post(
  '/payments/mpesa/result',
  webhookController.handleMpesaResult.bind(webhookController)
);

/**
 * POST /webhooks/payments/:provider
 * Generic webhook receiver for other providers (Flutterwave, Stripe).
 * Provider-specific routing is handled in the controller.
 */
router.post(
  '/payments/:provider',
  webhookController.handlePaymentWebhook.bind(webhookController)
);

export default router;