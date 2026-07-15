import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi, CreateSubscriptionInput, TransitionStatusInput, ChangePlanInput, RenewSubscriptionInput } from '@/api/subscriptions-api';
import { useSchoolContext } from './use-school-context';
import { toast } from 'sonner';

/**
 * Fetch subscriptions list for the current school
 */
export function useSubscriptions(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { schoolId } = useSchoolContext();

  return useQuery({
    queryKey: ['subscriptions', { schoolId, ...params }],
    queryFn: async () => {
      const response = await subscriptionsApi.list({
        schoolId,
        ...params,
      });
      return response.data;
    },
  });
}

/**
 * Fetch a single subscription by ID
 */
export function useSubscriptionById(id?: string) {
  return useQuery({
    queryKey: ['subscriptions', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await subscriptionsApi.getById(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

/**
 * Fetch current user's subscription
 */
export function useMySubscription() {
  const { schoolId } = useSchoolContext();

  return useQuery({
    queryKey: ['subscriptions', 'my', schoolId],
    queryFn: async () => {
      const response = await subscriptionsApi.getMySubscription();
      return response.data.data;
    },
  });
}

/**
 * Create a new subscription
 */
export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolContext();

  return useMutation({
    mutationFn: async (data: CreateSubscriptionInput) => {
      const response = await subscriptionsApi.create(data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate both school-specific and my-subscription queries
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions', { schoolId }] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'my', schoolId] });
      toast.success('Subscription created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to create subscription';
      toast.error(message);
    },
  });
}

/**
 * Transition subscription status
 */
export function useTransitionSubscriptionStatus() {
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolContext();

  return useMutation({
    mutationFn: async (params: { subscriptionId: string; data: TransitionStatusInput }) => {
      const response = await subscriptionsApi.transitionStatus(params.subscriptionId, params.data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', { schoolId }] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'my', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions', data?.id] });
      toast.success('Subscription status updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to update subscription status';
      toast.error(message);
    },
  });
}

/**
 * Change subscription plan
 */
export function useChangePlan() {
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolContext();

  return useMutation({
    mutationFn: async (params: { subscriptionId: string; data: ChangePlanInput }) => {
      const response = await subscriptionsApi.changePlan(params.subscriptionId, params.data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', { schoolId }] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'my', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions', data?.id] });
      toast.success('Plan changed successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to change plan';
      toast.error(message);
    },
  });
}

/**
 * Renew subscription
 */
export function useRenewSubscription() {
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolContext();

  return useMutation({
    mutationFn: async (params: { subscriptionId: string; data: RenewSubscriptionInput }) => {
      const response = await subscriptionsApi.renew(params.subscriptionId, params.data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', { schoolId }] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'my', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions', data?.id] });
      toast.success('Subscription renewed successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to renew subscription';
      toast.error(message);
    },
  });
}