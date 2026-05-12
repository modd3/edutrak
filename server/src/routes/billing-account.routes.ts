import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { BillingAccountController } from '../controllers/billing-account.controller';

const router = Router();
const controller = new BillingAccountController();

router.use(authenticate);

router.put('/', authorize('SUPER_ADMIN'), controller.upsert.bind(controller));
router.get('/school/:schoolId', authorize('ADMIN', 'SUPER_ADMIN'), controller.getBySchool.bind(controller));

export default router;
