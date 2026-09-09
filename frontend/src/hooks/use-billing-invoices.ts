import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billingInvoicesApi } from "@/api/billing-invoices-api";
import { useSchoolContext } from "./use-school-context";
import { toast } from "sonner";
import { generateIdempotencyKey } from "@/lib/utils";

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
    queryKey: ["billing-invoices", { schoolId, ...params }],
    queryFn: async () => {
      const response = await billingInvoicesApi.getMyInvoices(params);
      return response.data;
    },
  });
}

/**
 * Fetch billing invoices for any school (SUPER_ADMIN). Pass schoolId to
 * scope to one school, e.g. for the billing admin detail panel.
 */
export function useAllBillingInvoices(params?: {
  schoolId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["billing-invoices", "all", params],
    queryFn: async () => {
      const response = await billingInvoicesApi.listInvoices(params);
      return response;
    },
    enabled: params?.schoolId !== undefined,
  });
}

/**
 * Pay an invoice via M-Pesa STK Push
 */
export function usePayInvoice() {
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolContext();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      phoneNumber,
      idempotencyKey,
      provider = "MPESA",
    }: {
      invoiceId: string;
      phoneNumber?: string;
      idempotencyKey?: string;
      provider?: string;
    }) => {
      const headers: Record<string, string> = {};
      if (idempotencyKey) {
        headers["Idempotency-Key"] = idempotencyKey;
      }
      const response = await billingInvoicesApi.payInvoice(
        invoiceId,
        phoneNumber,
        provider,
        headers,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["billing-invoices", { schoolId }],
      });
      toast.success("M-Pesa STK Push sent! Check your phone to enter PIN.");
    },
    onError: (error: any) => {
      const status = error.response?.status;
      if (status === 409) {
        toast.info(
          "This payment is already in progress. Please check your phone or wait a moment and try again.",
        );
        return;
      }
      const message =
        error.response?.data?.error ||
        error.message ||
        "Failed to initiate payment";
      toast.error(message);
    },
  });
}

/** Creates a hosted Flutterwave session; card data never enters EduTrak. */
export function useCreateBillingCheckout() {
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolContext();

  return useMutation({
    mutationFn: async ({ invoiceId, paymentMethod, saveForAutomaticRenewal }: {
      invoiceId: string;
      paymentMethod: 'CARD' | 'MPESA';
      saveForAutomaticRenewal?: boolean;
    }) => billingInvoicesApi.createCheckoutSession(invoiceId, {
      paymentMethod,
      saveForAutomaticRenewal,
      returnUrl: `${window.location.origin}/billing/my-subscription`,
    }, { 'Idempotency-Key': generateIdempotencyKey('billing-checkout') }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['billing-invoices', { schoolId }] }),
    onError: (error: any) => toast.error(error.response?.data?.error || error.message || 'Unable to start checkout'),
  });
}
