import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feesApi } from '@/api';
import { toast } from 'sonner';

/**
 * Fetch fee structures with pagination and filters
 */
export function useGetFeeStructures(params?: {
  academicYearId?: string;
  termId?: string;
  classLevel?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['feeStructures', params],
    queryFn: () => feesApi.getStructures(params),
  });
}

/**
 * Fetch a single fee structure by ID
 */
export function useGetFeeStructureById(id: string) {
  return useQuery({
    queryKey: ['feeStructures', id],
    queryFn: () => feesApi.getStructureById(id),
    enabled: !!id,
  });
}

/**
 * Create a new fee structure
 */
export function useCreateFeeStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof feesApi.createStructure>[0]) =>
      feesApi.createStructure(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      toast.success('Fee structure created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create fee structure');
    },
  });
}

/**
 * Update a fee structure
 */
export function useUpdateFeeStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof feesApi.updateStructure>[1];
    }) => feesApi.updateStructure(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      toast.success('Fee structure updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update fee structure');
    },
  });
}

/**
 * Add a fee item to a structure
 */
export function useAddFeeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      structureId,
      data,
    }: {
      structureId: string;
      data: Parameters<typeof feesApi.addFeeItem>[1];
    }) => feesApi.addFeeItem(structureId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      toast.success('Fee item added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add fee item');
    },
  });
}

/**
 * Update a fee item
 */
export function useUpdateFeeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: Parameters<typeof feesApi.updateFeeItem>[1];
    }) => feesApi.updateFeeItem(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      toast.success('Fee item updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update fee item');
    },
  });
}

/**
 * Delete a fee item
 */
export function useDeleteFeeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => feesApi.deleteFeeItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      toast.success('Fee item deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete fee item');
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════
// INVOICES
// ══════════════════════════════════════════════════════════════════════════

/**
 * Fetch invoices with pagination and filters
 */
export function useGetInvoices(params?: {
  studentId?: string;
  status?: string;
  academicYearId?: string;
  termId?: string;
  isOverdue?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['feeInvoices', params],
    queryFn: () => feesApi.getInvoices(params),
  });
}

/**
 * Fetch a single invoice by ID
 */
export function useGetInvoiceById(id: string) {
  return useQuery({
    queryKey: ['feeInvoices', id],
    queryFn: () => feesApi.getInvoiceById(id),
    enabled: !!id,
  });
}

/**
 * Generate an invoice for a single student
 */
export function useGenerateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof feesApi.generateInvoice>[0]) =>
      feesApi.generateInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
      toast.success('Invoice generated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate invoice');
    },
  });
}

/**
 * Generate invoices for multiple students in bulk
 */
export function useBulkGenerateInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof feesApi.bulkGenerateInvoices>[0]) =>
      feesApi.bulkGenerateInvoices(data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
      const successCount = response.data?.data?.generated || 0;
      const skippedCount = response.data?.data?.skipped || 0;
      
      let message = `${successCount} invoice(s) generated successfully`;
      if (skippedCount > 0) {
        message += ` (${skippedCount} skipped)`;
      }
      
      toast.success(message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate invoices');
    },
  });
}

/**
 * Update an invoice
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof feesApi.updateInvoice>[1];
    }) => feesApi.updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
      toast.success('Invoice updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update invoice');
    },
  });
}

/**
 * Cancel an invoice
 */
export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => feesApi.cancelInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
      toast.success('Invoice cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel invoice');
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Fetch payments with filters
 */
export function useGetPayments(params?: {
  studentId?: string;
  invoiceId?: string;
  method?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['feePayments', params],
    queryFn: () => feesApi.getPayments(params),
  });
}

/**
 * Fetch a single payment by ID
 */
export function useGetPaymentById(id: string) {
  return useQuery({
    queryKey: ['feePayments', id],
    queryFn: () => feesApi.getPaymentById(id),
    enabled: !!id,
  });
}

/**
 * Record a payment against an invoice
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof feesApi.recordPayment>[0]) =>
      feesApi.recordPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feePayments'] });
      queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    },
  });
}

/**
 * Reverse a payment (bounced cheque, M-Pesa error, etc.)
 */
export function useReversePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof feesApi.reversePayment>[1];
    }) => feesApi.reversePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feePayments'] });
      queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
      toast.success('Payment reversed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reverse payment');
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Fetch fee collection report
 */
export function useGetFeeCollectionReport(params?: {
  academicYearId?: string;
  termId?: string;
  classLevel?: string;
  date?: string;
}) {
  return useQuery({
    queryKey: ['feeCollectionReport', params],
    queryFn: () => feesApi.getFeeCollectionReport(params),
  });
}

/**
 * Fetch defaulters report
 */
export function useGetDefaultersReport(params?: {
  academicYearId?: string;
  termId?: string;
  classLevel?: string;
  daysOverdue?: number;
}) {
  return useQuery({
    queryKey: ['feeDefaultersReport', params],
    queryFn: () => feesApi.getDefaultersReport(params),
  });
}
