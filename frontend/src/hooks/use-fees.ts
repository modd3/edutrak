import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feesApi } from '@/api';
import { toast } from 'sonner';

/**
 * Fetch fee structures with pagination and filters
 */
export function useGetFeeStructures(params: {
  schoolId: string;
  academicYearId?: string;
  termId?: string;
  classLevel?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['feeStructures', params],
    queryFn: () => feesApi.getStructures(params as typeof params & { schoolId: string}),
    enabled: !!params.schoolId,
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
 * Fetch invoices with pagination and filters.
 * Server returns ResponseUtil.paginated → axios body: { data: Invoice[], pagination }
 * Unwrap here so consumers receive { data: Invoice[], pagination } directly.
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
    queryFn: async () => {
      const res = await feesApi.getInvoices(params);
      // axios: res.data = { success, message, data: Invoice[], pagination }
      return res.data as { data: any[]; pagination: any; count?: number };
    },
  });
}

/**
 * Fetch a single invoice by ID.
 * Server returns ResponseUtil.success → axios body: { data: Invoice }
 * Unwrap here so consumers receive the Invoice object directly.
 */
export function useGetInvoiceById(id: string) {
  return useQuery({
    queryKey: ['feeInvoices', id],
    queryFn: async () => {
      const res = await feesApi.getInvoiceById(id);
      // axios: res.data = { success, message, data: Invoice }
      return res.data?.data ?? res.data ?? null;
    },
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
 * Fetch fee collection report.
 * Server returns ResponseUtil.success → axios body: { data: reportObject }
 * Unwrap here so consumers receive the report object directly.
 */
export function useGetFeeCollectionReport(params?: {
  academicYearId?: string;
  termId?: string;
  classLevel?: string;
  date?: string;
}) {
  return useQuery({
    queryKey: ['feeCollectionReport', params],
    queryFn: async () => {
      const res = await feesApi.getFeeCollectionReport(params);
      return res.data?.data ?? res.data ?? {};
    },
  });
}

/**
 * Fetch defaulters report.
 * Server returns ResponseUtil.success → axios body: { data: defaultersArray }
 * Unwrap here so consumers receive the array directly.
 */
export function useGetDefaultersReport(params?: {
  academicYearId?: string;
  termId?: string;
  classLevel?: string;
  daysOverdue?: number;
}) {
  return useQuery({
    queryKey: ['feeDefaultersReport', params],
    queryFn: async () => {
      const res = await feesApi.getDefaultersReport(params);
      return (res.data?.data ?? res.data ?? []) as any[];
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════
// ONLINE PAYMENTS
// ══════════════════════════════════════════════════════════════════════════

export function useInitiateOnlinePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, ...data }: { invoiceId: string } & Parameters<typeof feesApi.initiateOnlinePayment>[1]) =>
      feesApi.initiateOnlinePayment(invoiceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
      toast.success('Payment initiated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    },
  });
}

export function useGetPaymentStatus(invoiceId: string) {
  return useQuery({
    queryKey: ['feePaymentStatus', invoiceId],
    queryFn: () => feesApi.getPaymentStatus(invoiceId),
    enabled: !!invoiceId,
    refetchInterval: 3000,
  });
}

// ══════════════════════════════════════════════════════════════════════════
// PAYMENT PROVIDERS
// ══════════════════════════════════════════════════════════════════════════

export function useGetPaymentProviders() {
  return useQuery({
    queryKey: ['paymentProviders'],
    queryFn: () => feesApi.getPaymentProviders(),
  });
}

export function useConfigurePaymentProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof feesApi.configurePaymentProvider>[0]) =>
      feesApi.configurePaymentProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentProviders'] });
      toast.success('Payment provider configured successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to configure payment provider');
    },
  });
}

export function useUpdatePaymentProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ providerId, data }: { providerId: string; data: Parameters<typeof feesApi.updatePaymentProvider>[1] }) =>
      feesApi.updatePaymentProvider(providerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentProviders'] });
      toast.success('Payment provider updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update payment provider');
    },
  });
}

export function useDeletePaymentProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (providerId: string) => feesApi.deletePaymentProvider(providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentProviders'] });
      toast.success('Payment provider deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete payment provider');
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════
// LATE FEES
// ══════════════════════════════════════════════════════════════════════════

export function useGetLateFeesConfig() {
  return useQuery({
    queryKey: ['lateFeesConfig'],
    queryFn: () => feesApi.getLateFeesConfig(),
  });
}

export function useUpsertLateFeesConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof feesApi.upsertLateFeesConfig>[0]) =>
      feesApi.upsertLateFeesConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lateFeesConfig'] });
      toast.success('Late fees configuration saved');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save late fees configuration');
    },
  });
}

export function useApplyLateFees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => feesApi.applyLateFees(),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
      const applied = response.data?.data?.applied || 0;
      toast.success(`Late fees applied to ${applied} invoice(s)`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to apply late fees');
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════
// PAYMENT PLANS (INSTALLMENTS)
// ══════════════════════════════════════════════════════════════════════════

export function useCreatePaymentPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, ...data }: { invoiceId: string } & Parameters<typeof feesApi.createPaymentPlan>[1]) =>
      feesApi.createPaymentPlan(invoiceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentPlans'] });
      queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
      toast.success('Payment plan created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create payment plan');
    },
  });
}

export function useGetSchoolPaymentPlans(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['paymentPlans', params],
    queryFn: () => feesApi.getSchoolPaymentPlans(params),
  });
}

export function useGetPaymentPlan(invoiceId: string) {
  return useQuery({
    queryKey: ['paymentPlans', invoiceId],
    queryFn: () => feesApi.getPaymentPlan(invoiceId),
    enabled: !!invoiceId,
  });
}

export function useCancelPaymentPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) => feesApi.cancelPaymentPlan(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentPlans'] });
      queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
      toast.success('Payment plan cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel payment plan');
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════
// REMINDERS
// ══════════════════════════════════════════════════════════════════════════

export function useSendReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, ...data }: { invoiceId: string } & Parameters<typeof feesApi.sendReminder>[1]) =>
      feesApi.sendReminder(invoiceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Reminder sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send reminder');
    },
  });
}

export function useProcessReminders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => feesApi.processReminders(),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      const processed = response.data?.data?.processed || 0;
      toast.success(`Processed ${processed} reminder(s)`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process reminders');
    },
  });
}

export function useGetReminderHistory(invoiceId: string) {
  return useQuery({
    queryKey: ['reminders', invoiceId],
    queryFn: () => feesApi.getReminderHistory(invoiceId),
    enabled: !!invoiceId,
  });
}

export function useGetReminderStats() {
  return useQuery({
    queryKey: ['reminderStats'],
    queryFn: () => feesApi.getReminderStats(),
  });
}

// ══════════════════════════════════════════════════════════════════════════
// RECONCILIATION
// ══════════════════════════════════════════════════════════════════════════

export function useUploadStatement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => feesApi.uploadStatement(file),
    onSuccess: () => {
      toast.success('Statement uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload statement');
    },
  });
}

export function useConfirmReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof feesApi.confirmReconciliation>[0]) =>
      feesApi.confirmReconciliation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feePayments'] });
      queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
      toast.success('Reconciliation confirmed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to confirm reconciliation');
    },
  });
}

export function useGetReconciliationReport(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['reconciliationReport', params],
    queryFn: () => feesApi.getReconciliationReport(params),
  });
}

// ══════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Fee analytics summary.
 * Server returns ResponseUtil.success → axios body: { data: FeeAnalyticsSummary }
 * Unwrap here so consumers receive the summary object directly.
 */
export function useGetAnalytics(params?: { from?: string; to?: string; academicYearId?: string; termId?: string }) {
  return useQuery({
    queryKey: ['feeAnalytics', params],
    queryFn: async () => {
      const res = await feesApi.getAnalytics(params);
      return res.data?.data ?? res.data ?? null;
    },
  });
}

/**
 * Cash flow report.
 * Unwrap at source.
 */
export function useGetCashFlowReport(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['feeCashFlow', params],
    queryFn: async () => {
      const res = await feesApi.getCashFlowReport(params);
      return res.data?.data ?? res.data ?? null;
    },
  });
}

/**
 * Detect payment anomalies.
 * Unwrap at source.
 */
export function useDetectAnomalies(params?: { days?: number }) {
  return useQuery({
    queryKey: ['feeAnomalies', params],
    queryFn: async () => {
      const res = await feesApi.detectAnomalies(params);
      return (res.data?.data ?? res.data ?? []) as any[];
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════
// REFUNDS
// ══════════════════════════════════════════════════════════════════════════

export function useProcessRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, ...data }: { paymentId: string } & Parameters<typeof feesApi.processRefund>[1]) =>
      feesApi.processRefund(paymentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feePayments'] });
      queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
      toast.success('Refund processed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process refund');
    },
  });
}

export function useValidateRefund(paymentId: string) {
  return useQuery({
    queryKey: ['refundValidation', paymentId],
    queryFn: () => feesApi.validateRefund(paymentId),
    enabled: !!paymentId,
  });
}

export function useGetRefundHistory(paymentId: string) {
  return useQuery({
    queryKey: ['refundHistory', paymentId],
    queryFn: () => feesApi.getRefundHistory(paymentId),
    enabled: !!paymentId,
  });
}

export function useGetInvoiceRefunds(invoiceId: string) {
  return useQuery({
    queryKey: ['invoiceRefunds', invoiceId],
    queryFn: () => feesApi.getInvoiceRefunds(invoiceId),
    enabled: !!invoiceId,
  });
}

export function useGetRefundStats(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['refundStats', params],
    queryFn: () => feesApi.getRefundStats(params),
  });
}
