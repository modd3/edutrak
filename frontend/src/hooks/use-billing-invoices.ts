import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingInvoicesApi } from '@/api/billing-invoices-api';
import { useSchoolContext } from './use-school-context';
import { toast } from 'sonner';

/**
 * Fetch billing invoices for the current school
 */
export function useBillingInvoices(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { schoolId } = useSchoolContext();

  return useQuery({
    queryKey: ['billing-invoices', { schoolId, ...params }],
    queryFn: async () => {
      const response = await billingInvoicesApi.getMyInvoices(params);
      return response.data;
    },
  });
}

/**
 * Pay an invoice via M-Pesa STK Push
 */
export function usePayInvoice() {
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolContext();

  return useMutation({
    mutationFn: async ({ invoiceId, phoneNumber }: { invoiceId: string; phoneNumber: string }) => {
      const response = await billingInvoicesApi.payInvoice(invoiceId, phoneNumber);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-invoices', { schoolId }] });
      toast.success('M-Pesa STK Push sent! Check your phone to enter PIN.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to initiate payment';
      toast.error(message);
    },
  });
}