import { Router } from 'express';
import { OnboardingController } from '../controllers/onboarding.controller';
import { rateLimit } from '../middleware/auth.middleware';

const router = Router();
const onboardingController = new OnboardingController();

/**
 * @route   POST /api/onboarding/register
 * @desc    Self-service tenant onboarding — provision a new school workspace.
 *          Creates Tenant → School → BillingAccount → TenantSubscription
 *          → BillingInvoice → User (ADMIN) in a single atomic transaction
 *          and returns JWT tokens so the user is immediately authenticated.
 * @access  Public
 * @body    { school: SchoolDetailsInput, admin: AdminUserInput, plan: PlanSelectionInput }
 */
router.post(
  '/register',
  // 5 registration attempts per IP per hour to prevent abuse
  rateLimit(5, 60 * 60 * 1000),
  (req, res) => onboardingController.register(req, res)
);

export default router;
