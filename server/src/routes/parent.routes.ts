// src/routes/parent.routes.ts
import { Router } from 'express';
import { parentController } from '../controllers/parent.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

const router = Router();

// All parent routes require authentication and PARENT role
router.use(authenticate);
router.use(authorize('PARENT'));

/**
 * GET /api/parent/children
 * Get all children for the authenticated parent/guardian
 */
router.get('/children', parentController.getMyChildren);

/**
 * GET /api/parent/invoices
 * Get fee invoices for all my children
 * Query params: page, limit, status, academicYearId, termId, isOverdue
 */
router.get('/invoices', parentController.getMyChildrenInvoices);

/**
 * GET /api/parent/invoices/:id
 * Get a specific invoice (if it belongs to my children)
 */
router.get('/invoices/:id', parentController.getMyChildInvoice);

/**
 * GET /api/parent/payments
 * Get payment history for all my children
 * Query params: page, limit, method, status, startDate, endDate, invoiceId
 */
router.get('/payments', parentController.getMyChildrenPayments);

/**
 * GET /api/parent/summary
 * Get payment summary dashboard for all my children
 */
router.get('/summary', parentController.getMyChildrenSummary);

/**
 * POST /api/parent/invoices/:id/pay-online
 * Initiate online payment for an invoice (parent-specific)
 * Body: { provider, phoneNumber, callbackUrl }
 */
router.post(
  '/invoices/:id/pay-online',
  idempotencyMiddleware(),
  parentController.initiateOnlinePayment
);

/**
 * GET /api/parent/invoices/:id/payment-status
 * Check payment status for an invoice
 */
router.get('/invoices/:id/payment-status', parentController.getPaymentStatus);

export default router;