import api from './client';
import type { OnboardingInput, OnboardingResult, ApiResponse } from '@/types';

export const onboardingApi = {
  /**
   * POST /onboarding/register
   *
   * Provisions a new school workspace atomically and returns JWT tokens.
   * Public endpoint — no Authorization header needed.
   */
  register: (data: OnboardingInput) =>
    api.post<ApiResponse<OnboardingResult>>('/onboarding/register', data),
};
