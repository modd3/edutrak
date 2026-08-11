import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/response';
import { OnboardingService } from '../services/onboarding.service';
import { onboardingSchema } from '../validation/onboarding.validation';
import logger from '../utils/logger';

const onboardingService = new OnboardingService();

export class OnboardingController {
  /**
   * POST /onboarding/register
   *
   * Self-service tenant registration. Provisions a new school workspace
   * atomically and returns auth tokens so the user is logged in immediately.
   *
   * Public endpoint — no authentication required.
   */
  async register(req: Request, res: Response): Promise<Response> {
    // ── Validate payload with Zod ────────────────────────────────────────────
    const parsed = onboardingSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return ResponseUtil.validationError(res, JSON.stringify(errors));
    }

    // ── Provision workspace ──────────────────────────────────────────────────
    try {
      const result = await onboardingService.register(parsed.data);

      logger.info('Onboarding completed', {
        schoolId: result.school.id,
        userId: result.user.id,
        plan: parsed.data.plan.planId,
        startTrial: parsed.data.plan.startTrial,
      });

      return ResponseUtil.created(res, 'School registered successfully. Welcome to EduTrak!', result);
    } catch (err: any) {
      logger.error('Onboarding failed', { error: err.message });

      // Disambiguate known errors from unexpected ones
      if (err.message.includes('already exists')) {
        return ResponseUtil.conflict(res, err.message);
      }

      if (
        err.message.includes('does not exist') ||
        err.message.includes('not currently available')
      ) {
        return ResponseUtil.error(res, err.message, 400);
      }

      // P2002 = Prisma unique constraint violation (race condition on email / slug)
      if (err.code === 'P2002') {
        return ResponseUtil.conflict(
          res,
          'A school or account with one of the provided details already exists. Please check your input.'
        );
      }

      return ResponseUtil.serverError(res, err.message);
    }
  }
}
