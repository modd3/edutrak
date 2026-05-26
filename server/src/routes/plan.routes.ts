import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { PlanController } from '../controllers/plan.controller';

const router = Router();
const controller = new PlanController();

router.use(authenticate);

// GET operations - accessible to SUPER_ADMIN and ADMIN
router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), controller.getPlans.bind(controller));
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN'), controller.getPlanById.bind(controller));

// CREATE, UPDATE, DELETE - SUPER_ADMIN only
router.post('/', authorize('SUPER_ADMIN'), controller.create.bind(controller));
router.patch('/:id', authorize('SUPER_ADMIN'), controller.update.bind(controller));
router.delete('/:id', authorize('SUPER_ADMIN'), controller.delete.bind(controller));

export default router;
