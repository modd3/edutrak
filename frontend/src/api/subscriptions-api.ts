import api from './client';
import { ApiResponse, PaginatedResponse, Plan, Subscription, BillingAccount, BillingInvoice, BillingPayment } from '@/types';

export interface CreateSubscriptionInput {
  schoolId?: string;
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

export interface ChangePlanInput {
  planId: string;
  withTrial?: boolean;
  trialEndsAt?: string;
}

export interface RenewSubscriptionInput {
  withTrial?: boolean;
  trialEndsAt?: string;
}

export interface BillingOverview {
  subscription?: Subscription;
  billingAccount?: BillingAccount;
  recentInvoices: BillingInvoice[];
  availablePlans: Plan[];
  usageMetrics: any[];
  outstandingBalanceMinor: number;
  currency: string;
  hasActiveSubscription: boolean;
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
    api.get<PaginatedResponse<Subscription>>('/subscriptions', { params }),

  /**
   * Get a single subscription by ID
   */
  getById: (id: string) =>
    api.get<ApiResponse<Subscription>>(`/subscriptions/${id}`),

  /**
   * Get current user's subscription
   */
  getMySubscription: () =>
    api.get<ApiResponse<Subscription>>('/subscriptions/my'),

  /**
   * Get consolidated billing overview
   */
  getOverview: () =>
    api.get<ApiResponse<BillingOverview>>('/subscriptions/overview'),

  /**
   * Transition subscription status
   */
  transitionStatus: (id: string, data: TransitionStatusInput) =>
    api.patch<ApiResponse<Subscription>>(`/subscriptions/${id}/status`, data),

  /**
   * Change subscription plan
   */
  changePlan: (id: string, data: ChangePlanInput) =>
    api.patch<ApiResponse<Subscription>>(`/subscriptions/${id}/change-plan`, data),

  /**
   * Renew subscription
   */
  renew: (id: string, data: RenewSubscriptionInput) =>
    api.post<ApiResponse<Subscription>>(`/subscriptions/${id}/renew`, data),
};