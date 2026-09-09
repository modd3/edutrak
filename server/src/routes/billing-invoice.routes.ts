import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { BillingInvoiceController } from '../controllers/billing-invoice.controller';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

const router = Router();
const controller = new BillingInvoiceController();

router.use(authenticate);

router.post('/invoices', authorize('SUPER_ADMIN'), controller.createInvoice.bind(controller));
router.get('/invoices', authorize('ADMIN', 'SUPER_ADMIN'), controller.listInvoices.bind(controller));
router.get('/invoices/my', authorize('ADMIN', 'SUPER_ADMIN'), controller.getMyInvoices.bind(controller));
router.post(
  '/invoices/:invoiceId/checkout-sessions',
  authorize('ADMIN', 'SUPER_ADMIN'),
  idempotencyMiddleware(),
  controller.createCheckoutSession.bind(controller)
);
router.post(
  '/payments/pay-invoice',
  authorize('ADMIN', 'SUPER_ADMIN'),
  idempotencyMiddleware(),
  controller.payInvoice.bind(controller)
);
router.post(
  '/payments',
  authorize('SUPER_ADMIN'),
  idempotencyMiddleware(),
  controller.recordPayment.bind(controller)
);

export default router;
