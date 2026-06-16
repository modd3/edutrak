import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { auditController } from '../controllers/audit.controller';

const router = Router();

// All audit routes require authentication
router.use(authenticate);

// Recent audit logs (for dashboard widgets)
router.get(
  '/recent',
  authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'),
  auditController.getRecent
);

// Paginated audit logs with filters (for audit trail page)
router.get(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN'),
  auditController.getPaginated
);

export default router;