import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi, CreatePlanInput, UpdatePlanInput } from '@/api/plans-api';

export function usePlans(params?: { page?: number; limit?: number; isActive?: boolean }) {
  return useQuery({
    queryKey: ['plans', params],
    queryFn: async () => {
      const response = await plansApi.list(params);
      return response.data;
    },
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanInput) => 
      plansApi.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanInput }) =>
      plansApi.update(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => plansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}
