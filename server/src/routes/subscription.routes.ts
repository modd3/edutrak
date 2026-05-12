import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { SubscriptionController } from '../controllers/subscription.controller';

const router = Router();
const controller = new SubscriptionController();

router.use(authenticate);

router.post('/', authorize('SUPER_ADMIN'), controller.create.bind(controller));
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), controller.list.bind(controller));
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN'), controller.getById.bind(controller));
router.patch('/:id/status', authorize('SUPER_ADMIN'), controller.transitionStatus.bind(controller));

export default router;
