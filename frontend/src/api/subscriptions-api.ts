import api from './index';

export interface Plan {
  id: string;
  key: string;
  name: string;
  description?: string;
  priceMinor: number;
  currency: string;
  billingInterval: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  schoolId: string;
  planId: string;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'GRACE' | 'SUSPENDED' | 'CANCELED' | 'EXPIRED';
  startsAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  graceEndsAt?: string;
  cancelAt?: string;
  canceledAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  plan?: Plan;
  school?: { id: string; name: string };
}

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

export interface SubscriptionsResponse {
  data: Subscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const subscriptionsApi = {
  /**
   * Create a new subscription
   */
  create: (data: CreateSubscriptionInput) =>
    api.post<{ data: Subscription }>('/subscriptions', data),

  /**
   * Get list of subscriptions with filters
   */
  list: (params?: {
    schoolId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<SubscriptionsResponse>('/subscriptions', { params }),

  /**
   * Get a single subscription by ID
   */
  getById: (id: string) =>
    api.get<{ data: Subscription }>(`/subscriptions/${id}`),

  /**
   * Transition subscription status
   */
  transitionStatus: (id: string, data: TransitionStatusInput) =>
    api.patch<{ data: Subscription }>(`/subscriptions/${id}/status`, data),
};
