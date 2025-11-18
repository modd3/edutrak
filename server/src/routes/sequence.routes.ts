import { Router } from 'express';
import { SequenceController } from '../controllers/sequence.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const controller = new SequenceController();

// All sequence routes require authentication
router.use(authenticate);

// Preview next number (anyone can preview)
router.get('/:type/preview', controller.previewNext);

// Get current value
router.get('/:type/current', controller.getCurrentValue);

// Get statistics
router.get('/:type/stats', controller.getStats);

// Reset sequence (admin only)
router.post(
  '/:type/reset',
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.resetSequence
);

// Generate batch (admin only)
router.post(
  '/:type/batch',
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.generateBatch
);

export default router;