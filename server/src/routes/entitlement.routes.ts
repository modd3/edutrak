// src/routes/entitlement.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { enforceSchoolContext } from '../middleware/school-context';
import { entitlementController } from '../controllers/entitlement.controller';

const router = Router();
router.get('/me', authenticate, enforceSchoolContext, entitlementController.getMyEntitlements.bind(entitlementController));
export default router;

// routes/index.ts: router.use('/entitlements', entitlementRoutes);