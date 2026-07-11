import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { SubscriptionController } from '../controllers/subscription.controller';

const router = Router();
const controller = new SubscriptionController();

router.use(authenticate);

// Allow both ADMIN and SUPER_ADMIN to create subscriptions
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), controller.create.bind(controller));

// Allow both ADMIN and SUPER_ADMIN to list subscriptions (ADMIN sees only their school)
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), controller.list.bind(controller));

// Allow both ADMIN and SUPER_ADMIN to get their own subscription
router.get('/my', authorize('ADMIN', 'SUPER_ADMIN'), controller.getMySubscription.bind(controller));

// Allow both ADMIN and SUPER_ADMIN to get subscription by ID
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN'), controller.getById.bind(controller));

// Allow both ADMIN and SUPER_ADMIN to transition subscription status
router.patch('/:id/status', authorize('ADMIN', 'SUPER_ADMIN'), controller.transitionStatus.bind(controller));

// Allow both ADMIN and SUPER_ADMIN to change plan
router.patch('/:id/change-plan', authorize('ADMIN', 'SUPER_ADMIN'), controller.changePlan.bind(controller));

// Allow both ADMIN and SUPER_ADMIN to renew subscription
router.post('/:id/renew', authorize('ADMIN', 'SUPER_ADMIN'), controller.renew.bind(controller));

export default router;