// src/routes/fee.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { feeController } from '../controllers/fee.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { enforceSchoolContext } from '../middleware/school-context';
import { enforceSubscription } from '../middleware/subscription.middleware';
import { requireFeature } from '../middleware/entitlement.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.use(authenticate);
router.use(enforceSchoolContext);
router.use(enforceSubscription);
router.use(requireFeature('fees.core'));

// ── Fee Structures ────────────────────────────────────────────────────────────

/**
 * POST /api/fees/structures
 * Create a new fee structure with line items.
 */
router.post(
  '/structures',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.createFeeStructure.bind(feeController)
);

/**
 * POST /api/fees/structures/clone
 * Clone a fee structure to a new academic year (and optionally a new term).
 */
router.post(
  '/structures/clone',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.cloneFeeStructure.bind(feeController)
);

/**
 * GET /api/fees/structures
 * List fee structures (filter by academicYearId, termId, classLevel, isActive).
 */
router.get(
  '/structures',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.getFeeStructures.bind(feeController)
);

/**
 * GET /api/fees/structures/:id
 * Get a single fee structure with all its items and invoice count.
 */
router.get(
  '/structures/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.getFeeStructureById.bind(feeController)
);

/**
 * PATCH /api/fees/structures/:id
 * Update name, description, classLevel, boardingStatus, isActive.
 */
router.patch(
  '/structures/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.updateFeeStructure.bind(feeController)
);

// ── Fee Items (sub-resource of structures) ────────────────────────────────────

/**
 * POST /api/fees/structures/:structureId/items
 * Add a new fee item to an existing structure.
 */
router.post(
  '/structures/:structureId/items',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.addFeeItem.bind(feeController)
);

/**
 * PATCH /api/fees/items/:itemId
 * Update a fee item (amount, name, category, isOptional).
 */
router.patch(
  '/items/:itemId',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.updateFeeItem.bind(feeController)
);

/**
 * DELETE /api/fees/items/:itemId
 * Delete a fee item (blocked if referenced in any invoice).
 */
router.delete(
  '/items/:itemId',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.deleteFeeItem.bind(feeController)
);

// ── Invoices ──────────────────────────────────────────────────────────────────

/**
 * POST /api/fees/invoices
 * Generate an invoice for a single student from a fee structure.
 */
router.post(
  '/invoices',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.generateInvoice.bind(feeController)
);

/**
 * POST /api/fees/invoices/bulk
 * Generate invoices for multiple students in one request.
 */
router.post(
  '/invoices/bulk',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.bulkGenerateInvoices.bind(feeController)
);

/**
 * GET /api/fees/invoices
 * List invoices (filter by studentId, status, academicYearId, termId, isOverdue).
 */
router.get(
  '/invoices',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  feeController.getInvoices.bind(feeController)
);

/**
 * GET /api/fees/invoices/:id
 * Get full invoice detail including items and all payments made.
 */
router.get(
  '/invoices/:id',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'),
  feeController.getInvoiceById.bind(feeController)
);

/**
 * PATCH /api/fees/invoices/:id
 * Update dueDate, notes, discountAmount, or manually override status.
 */
router.patch(
  '/invoices/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.updateInvoice.bind(feeController)
);

/**
 * PATCH /api/fees/invoices/:id/cancel
 * Cancel an invoice (only allowed if no payments have been recorded).
 */
router.patch(
  '/invoices/:id/cancel',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.cancelInvoice.bind(feeController)
);

// ── Payments ──────────────────────────────────────────────────────────────────

/**
 * POST /api/fees/payments
 * Record a payment (cash, M-Pesa, bank transfer, cheque…).
 * Auto-generates receipt number and updates invoice balance.
 */
router.post(
  '/payments',
  authorize('ADMIN', 'SUPER_ADMIN'),
  idempotencyMiddleware(),
  feeController.recordPayment.bind(feeController)
);

/**
 * GET /api/fees/payments
 * List payments (filter by studentId, invoiceId, method, status, date range).
 */
router.get(
  '/payments',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.getPayments.bind(feeController)
);

/**
 * GET /api/fees/payments/:id
 * Get a single payment with full invoice context.
 */
router.get(
  '/payments/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.getPaymentById.bind(feeController)
);

/**
 * PATCH /api/fees/payments/:id/reverse
 * Reverse a payment (bounced cheque, M-Pesa error).
 * Requires a reason and restores the invoice balance.
 */
router.patch(
  '/payments/:id/reverse',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.reversePayment.bind(feeController)
);

// ── Reports ───────────────────────────────────────────────────────────────────

/**
 * GET /api/fees/reports/collection
 * Fee collection summary: billed vs collected, daily trend, by payment method.
 */
router.get(
  '/reports/collection',
  authorize('ADMIN', 'SUPER_ADMIN'),
  requireFeature('fees.report'),
  feeController.getFeeCollectionReport.bind(feeController)
);

/**
 * GET /api/fees/reports/defaulters
 * Students with outstanding balances, sorted by amount owed (highest first).
 */
router.get(
  '/reports/defaulters',
  authorize('ADMIN', 'SUPER_ADMIN'),
  requireFeature('fees.report'),
  feeController.getDefaultersReport.bind(feeController)
);

// ── Online Payments ────────────────────────────────────────────────────────────

/**
 * POST /api/fees/invoices/:id/pay-online
 * Initiate an online payment (M-Pesa STK Push) for an invoice.
 * Requires an idempotency key to prevent duplicate charges.
 */
router.post(
  '/invoices/:id/pay-online',
  authorize('ADMIN', 'SUPER_ADMIN', 'PARENT'),
  requireFeature('fees.mpesa'),
  idempotencyMiddleware(),
  feeController.initiateOnlinePayment.bind(feeController)
);

// ── Payment Provider Configuration ─────────────────────────────────────────────

/**
 * POST /api/fees/providers/configure
 * Configure a payment provider (Daraja, Flutterwave, etc.) for the school.
 */
router.post(
  '/providers/configure',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.configurePaymentProvider.bind(feeController)
);

/**
 * GET /api/fees/providers
 * List all configured payment providers for the school.
 */
router.get(
  '/providers',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.getPaymentProviders.bind(feeController)
);

/**
 * PATCH /api/fees/providers/:providerId
 * Update a payment provider configuration.
 */
router.patch(
  '/providers/:providerId',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.updatePaymentProvider.bind(feeController)
);

/**
 * DELETE /api/fees/providers/:providerId
 * Remove a payment provider configuration.
 */
router.delete(
  '/providers/:providerId',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.deletePaymentProvider.bind(feeController)
);

// ── Late Fees ──────────────────────────────────────────────────────────────────

/**
 * GET /api/fees/late-fees/config
 * Get the late fee configuration for the school.
 */
router.get(
  '/late-fees/config',
  authorize('ADMIN', 'SUPER_ADMIN'),
  requireFeature('fees.late_fees'),
  feeController.getLateFeesConfig.bind(feeController)
);

/**
 * PUT /api/fees/late-fees/config
 * Create or update the late fee configuration.
 */
router.put(
  '/late-fees/config',
  authorize('ADMIN', 'SUPER_ADMIN'),
  requireFeature('fees.late_fees'),
  feeController.upsertLateFeesConfig.bind(feeController)
);

/**
 * POST /api/fees/late-fees/apply
 * Manually trigger late fee application for all overdue invoices.
 */
router.post(
  '/late-fees/apply',
  authorize('ADMIN', 'SUPER_ADMIN'),
  requireFeature('fees.late_fees'),
  feeController.applyLateFees.bind(feeController)
);

// ── Payment Plans ──────────────────────────────────────────────────────────────

/**
 * POST /api/fees/plans
 * Create a payment plan (installment schedule) for an invoice.
 */
router.post(
  '/plans',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.createPaymentPlan.bind(feeController)
);

/**
 * GET /api/fees/plans
 * List all active payment plans for the school.
 */
router.get(
  '/plans',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.getSchoolPaymentPlans.bind(feeController)
);

/**
 * GET /api/fees/plans/:invoiceId
 * Get the payment plan for a specific invoice.
 */
router.get(
  '/plans/:invoiceId',
  authorize('ADMIN', 'SUPER_ADMIN', 'PARENT'),
  feeController.getPaymentPlan.bind(feeController)
);

/**
 * PATCH /api/fees/plans/:invoiceId/cancel
 * Cancel a payment plan.
 */
router.patch(
  '/plans/:invoiceId/cancel',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.cancelPaymentPlan.bind(feeController)
);

// ── Reminders ──────────────────────────────────────────────────────────────────

/**
 * POST /api/fees/reminders/send
 * Send a manual reminder for an invoice.
 */
router.post(
  '/reminders/send',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.sendReminder.bind(feeController)
);

/**
 * POST /api/fees/reminders/process
 * Process all pending reminders for the school.
 */
router.post(
  '/reminders/process',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.processReminders.bind(feeController)
);

/**
 * GET /api/fees/reminders/:invoiceId
 * Get reminder history for an invoice.
 */
router.get(
  '/reminders/:invoiceId',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.getReminderHistory.bind(feeController)
);

/**
 * GET /api/fees/reminders/stats
 * Get aggregated reminder statistics for the school.
 */
router.get(
  '/reminders/stats',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.getReminderStats.bind(feeController)
);

// ── Reconciliation ──────────────────────────────────────────────────────────────

/**
 * POST /api/fees/reconciliation/upload
 * Upload a bank statement CSV for auto-matching.
 * Accepts multipart file upload or raw CSV content in body.
 */
router.post(
  '/reconciliation/upload',
  authorize('ADMIN', 'SUPER_ADMIN'),
  requireFeature('fees.reconciliation'),
  upload.single('statement'),
  feeController.uploadStatement.bind(feeController)
);

/**
 * POST /api/fees/reconciliation/confirm
 * Confirm auto-matched transactions and create payments.
 */
router.post(
  '/reconciliation/confirm',
  authorize('ADMIN', 'SUPER_ADMIN'),
  requireFeature('fees.reconciliation'),
  feeController.confirmReconciliation.bind(feeController)
);

/**
 * GET /api/fees/reconciliation/report
 * Generate reconciliation report for a date range.
 * Query: ?from=2025-01-01&to=2025-12-31
 */
router.get(
  '/reconciliation/report',
  authorize('ADMIN', 'SUPER_ADMIN'),
  requireFeature('fees.reconciliation'),
  feeController.getReconciliationReport.bind(feeController)
);

// ── Analytics ────────────────────────────────────────────────────────────────

router.get(
  '/analytics',
  authorize('ADMIN', 'SUPER_ADMIN'),
  requireFeature('fees.report'),
  feeController.getAnalytics.bind(feeController)
);

router.get(
  '/analytics/cash-flow',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.getCashFlowReport.bind(feeController)
);

router.get(
  '/analytics/anomalies',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.detectAnomalies.bind(feeController)
);

export default router;
