import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { PlanController } from '../controllers/plan.controller';
import { PlanFeatureController } from '../controllers/plan-feature.controller';

const router = Router();
const featureController = new PlanFeatureController();
const controller = new PlanController();

router.use(authenticate);

// GET operations - accessible to SUPER_ADMIN and ADMIN
router.get('/features/registry', authorize('SUPER_ADMIN', 'ADMIN'), featureController.getRegistry.bind(featureController));
router.get('/features/compare', authorize('SUPER_ADMIN', 'ADMIN'), featureController.compare.bind(featureController));

router.get('/:planId/features', authorize('SUPER_ADMIN', 'ADMIN'), featureController.list.bind(featureController));
router.put('/:planId/features', authorize('SUPER_ADMIN'), featureController.upsert.bind(featureController));
router.post('/:planId/features/bulk', authorize('SUPER_ADMIN'), featureController.bulkSet.bind(featureController));
router.delete('/:planId/features/:featureKey', authorize('SUPER_ADMIN'), featureController.remove.bind(featureController));
router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), controller.getPlans.bind(controller));
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN'), controller.getPlanById.bind(controller));

// CREATE, UPDATE, DELETE - SUPER_ADMIN only
router.post('/', authorize('SUPER_ADMIN'), controller.create.bind(controller));
router.patch('/:id', authorize('SUPER_ADMIN'), controller.update.bind(controller));
router.delete('/:id', authorize('SUPER_ADMIN'), controller.delete.bind(controller));

export default router;
