import api from './index';
import { ApiResponse, PaginatedResponse, Plan, Subscription } from '@/types';

export interface CreateSubscriptionInput {
  schoolId: string;
  planId: string;
  startsAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
}

export interface TransitionStatusInput {
  status: string;
  graceEndsAt?: string;
}

export const subscriptionsApi = {
  /**
   * Create a new subscription
   */
  create: (data: CreateSubscriptionInput) =>
    api.post<ApiResponse<Subscription>>('/subscriptions', data),

  /**
   * Get list of subscriptions with filters
   */
  list: (params?: {
    schoolId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<PaginatedResponse<Subscription[]>>('/subscriptions', { params }),

  /**
   * Get a single subscription by ID
   */
  getById: (id: string) =>
    api.get<ApiResponse<Subscription>>(`/subscriptions/${id}`),

  /**
   * Transition subscription status
   */
  transitionStatus: (id: string, data: TransitionStatusInput) =>
    api.patch<ApiResponse<Subscription>>(`/subscriptions/${id}/status`, data),
};
