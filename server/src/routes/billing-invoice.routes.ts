import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { BillingInvoiceController } from '../controllers/billing-invoice.controller';

const router = Router();
const controller = new BillingInvoiceController();

router.use(authenticate);

router.post('/invoices', authorize('SUPER_ADMIN'), controller.createInvoice.bind(controller));
router.get('/invoices', authorize('ADMIN', 'SUPER_ADMIN'), controller.listInvoices.bind(controller));
router.post('/payments', authorize('SUPER_ADMIN'), controller.recordPayment.bind(controller));

export default router;
