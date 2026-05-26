import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingAccountsApi } from "@/api";
import { CreateBillingAccountInput } from '@/api/billing-accounts-api';
import { useSchoolContext } from './use-school-context';
import { toast } from 'sonner';

export function useBillingAccounts(params?: {
    page?: number;
    limit?: number;
}) {
    const {schoolId} = useSchoolContext();

    return useQuery({
        queryKey: ['billing_accounts', {schoolId, ...params}],
        queryFn: async () => {
            const response = await billingAccountsApi.list({
                schoolId,
                ...params
            });
            return response.data;
        }
    })
}

export function useSchoolBillingAccount(id: string) {
   // const {schoolId} = useSchoolContext();

    return useQuery({
        queryKey: ['billing_account', id],
        queryFn: async () => {
            const response = await billingAccountsApi.getBySchool(id);
            return response.data;
        }
    })
}

export function useCreateBillingAccount() {
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolContext();

  return useMutation({
    mutationFn: async (data: CreateBillingAccountInput) => {
      const response = await billingAccountsApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing_accounts', { schoolId }] });
      toast.success('Billing Account created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to create Billing Account';
      toast.error(message);
    },
  });
}
