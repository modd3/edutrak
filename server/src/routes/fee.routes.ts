// src/routes/fee.routes.ts
import { Router } from 'express';
import { feeController } from '../controllers/fee.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { enforceSchoolContext } from '../middleware/school-context';

const router = Router();

router.use(authenticate);
router.use(enforceSchoolContext);

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
  feeController.getFeeCollectionReport.bind(feeController)
);

/**
 * GET /api/fees/reports/defaulters
 * Students with outstanding balances, sorted by amount owed (highest first).
 */
router.get(
  '/reports/defaulters',
  authorize('ADMIN', 'SUPER_ADMIN'),
  feeController.getDefaultersReport.bind(feeController)
);

export default router;