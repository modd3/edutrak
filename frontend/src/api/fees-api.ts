import { FeeStructure, PaginatedResponse } from '@/types';
import api from './index';

/**
 * Fee Management API Client
 * Handles all fee-related operations: structures, invoices, payments, and reports.
 * All operations are school-scoped via JWT context.
 */
export const feesApi = {
  // ══════════════════════════════════════════════════════════════════════════
  // FEE STRUCTURES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new fee structure with items
   */
  createStructure: (data: {
    name: string;
    description?: string;
    academicYearId: string;
    termId?: string;
    classLevel?: string;
    boardingStatus?: 'DAY' | 'BOARDING' | 'BOTH';
    currency?: string;
    items: Array<{
      name: string;
      category: string;
      amount: number;
      isOptional?: boolean;
      description?: string;
    }>;
  }) => api.post('/fees/structures', data),

  /**
   * Get list of fee structures with pagination and filters
   */
  getStructures: async (params?: {
    academicYearId?: string;
    termId?: string;
    classLevel?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<FeeStructure>> => {
    const results = await api.get<PaginatedResponse<FeeStructure>>('/fees/structures', { params });
    return results.data
  },

  /**
   * Get a single fee structure with all items and invoice count
   */
  getStructureById: (id: string) =>
    api.get(`/fees/structures/${id}`),

  /**
   * Update fee structure (name, description, classLevel, boardingStatus, isActive)
   */
  updateStructure: (id: string, data: {
    name?: string;
    description?: string;
    classLevel?: string;
    boardingStatus?: 'DAY' | 'BOARDING' | 'BOTH';
    isActive?: boolean;
  }) => api.patch(`/fees/structures/${id}`, data),

  /**
   * Add a new fee item to a structure
   */
  addFeeItem: (structureId: string, data: {
    name: string;
    category: string;
    amount: number;
    isOptional?: boolean;
    description?: string;
  }) => api.post(`/fees/structures/${structureId}/items`, data),

  /**
   * Update a fee item (amount, name, category, isOptional)
   */
  updateFeeItem: (itemId: string, data: {
    name?: string;
    category?: string;
    amount?: number;
    isOptional?: boolean;
    description?: string;
  }) => api.patch(`/fees/items/${itemId}`, data),

  /**
   * Delete a fee item (blocked if referenced in invoices)
   */
  deleteFeeItem: (itemId: string) =>
    api.delete(`/fees/items/${itemId}`),

  // ══════════════════════════════════════════════════════════════════════════
  // INVOICES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Generate an invoice for a single student from a fee structure
   * Waivers allow skipping specific items; discountAmount gives flat discount
   */
  generateInvoice: (data: {
    studentId: string;
    feeStructureId: string;
    dueDate?: string; // ISO datetime
    notes?: string;
    waivers?: Array<{
      feeItemId: string;
      waiverNote?: string;
    }>;
    discountAmount?: number;
  }) => api.post('/fees/invoices', data),

  /**
   * Generate invoices for multiple students (all-or-nothing transaction)
   * Returns success count and skipped students
   */
  bulkGenerateInvoices: (data: {
    feeStructureId: string;
    studentIds: string[];
    dueDate?: string;
    notes?: string;
  }) => api.post('/fees/invoices/bulk', data),

  /**
   * Get list of invoices with filters
   */
  getInvoices: (params?: {
    studentId?: string;
    status?: string;
    academicYearId?: string;
    termId?: string;
    isOverdue?: boolean;
    page?: number;
    limit?: number;
  }) => api.get('/fees/invoices', { params }),

  /**
   * Get full invoice detail including items and all payments
   */
  getInvoiceById: (id: string) =>
    api.get(`/fees/invoices/${id}`),

  /**
   * Update invoice (dueDate, notes, discountAmount, status)
   */
  updateInvoice: (id: string, data: {
    dueDate?: string;
    notes?: string;
    discountAmount?: number;
    status?: string;
  }) => api.patch(`/fees/invoices/${id}`, data),

  /**
   * Cancel an invoice (only allowed if no payments recorded)
   */
  cancelInvoice: (id: string) =>
    api.patch(`/fees/invoices/${id}/cancel`, {}),

  // ══════════════════════════════════════════════════════════════════════════
  // PAYMENTS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Record a payment against an invoice
   * Supports CASH, MPESA, BANK_TRANSFER, CHEQUE, CARD, SCHOLARSHIP
   */
  recordPayment: (data: {
    invoiceId: string;
    amount: number;
    method: 'CASH' | 'MPESA' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD' | 'SCHOLARSHIP';
    transactionRef?: string;
    mpesaCode?: string;
    bankName?: string;
    chequeNo?: string;
    paidAt?: string; // ISO datetime
    notes?: string;
  }) => api.post('/fees/payments', data),

  /**
   * Get list of payments with filters
   */
  getPayments: (params?: {
    studentId?: string;
    invoiceId?: string;
    method?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get('/fees/payments', { params }),

  /**
   * Get a single payment with full invoice context
   */
  getPaymentById: (id: string) =>
    api.get(`/fees/payments/${id}`),

  /**
   * Reverse a payment (bounced cheque, M-Pesa error, etc.)
   * Only COMPLETED payments can be reversed
   */
  reversePayment: (id: string, data: {
    reason: string;
  }) => api.patch(`/fees/payments/${id}/reverse`, data),

  // ══════════════════════════════════════════════════════════════════════════
  // REPORTS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * School-level fee collection summary
   * Breaks down expected, collected, and outstanding by category
   */
  getFeeCollectionReport: (params?: {
    academicYearId?: string;
    termId?: string;
    classLevel?: string;
    date?: string;
  }) => api.get('/fees/reports/collection', { params }),

  /**
   * Get defaulters report (students with overdue invoices)
   */
  getDefaultersReport: (params?: {
    academicYearId?: string;
    termId?: string;
    classLevel?: string;
    daysOverdue?: number;
  }) => api.get('/fees/reports/defaulters', { params }),

  // ══════════════════════════════════════════════════════════════════════════
  // ONLINE PAYMENTS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Initiate an online payment (M-Pesa STK Push / Flutterwave checkout)
   */
  initiateOnlinePayment: (invoiceId: string, data: {
    provider: 'MPESA' | 'FLUTTERWAVE';
    callbackUrl?: string;
    idempotencyKey?: string;
  }) => api.post(`/fees/invoices/${invoiceId}/pay-online`, data),

  /**
   * Check payment status for an invoice
   */
  getPaymentStatus: (invoiceId: string) =>
    api.get(`/fees/invoices/${invoiceId}/payment-status`),

  // ══════════════════════════════════════════════════════════════════════════
  // PAYMENT PROVIDERS
  // ══════════════════════════════════════════════════════════════════════════

  getPaymentProviders: () =>
    api.get('/fees/providers'),

  configurePaymentProvider: (data: {
    provider: 'MPESA' | 'FLUTTERWAVE' | 'STRIPE';
    apiKey: string;
    secretKey: string;
    callbackUrl?: string;
    webhookSecret?: string;
    extraConfig?: Record<string, string>;
  }) => api.post('/fees/providers/configure', data),

  updatePaymentProvider: (providerId: string, data: {
    apiKey?: string;
    secretKey?: string;
    callbackUrl?: string;
    webhookSecret?: string;
    isActive?: boolean;
    extraConfig?: Record<string, string>;
  }) => api.patch(`/fees/providers/${providerId}`, data),

  deletePaymentProvider: (providerId: string) =>
    api.delete(`/fees/providers/${providerId}`),

  // ══════════════════════════════════════════════════════════════════════════
  // LATE FEES
  // ══════════════════════════════════════════════════════════════════════════

  getLateFeesConfig: () =>
    api.get('/fees/late-fees/config'),

  upsertLateFeesConfig: (data: {
    penaltyType: 'FLAT' | 'PERCENTAGE' | 'COMPOUND';
    penaltyAmount: number;
    graceDays?: number;
    maxPenalty?: number;
    applyRecurring?: boolean;
    recurrenceDays?: number;
    isActive?: boolean;
  }) => api.put('/fees/late-fees/config', data),

  applyLateFees: () =>
    api.post('/fees/late-fees/apply'),

  // ══════════════════════════════════════════════════════════════════════════
  // PAYMENT PLANS (INSTALLMENTS)
  // ══════════════════════════════════════════════════════════════════════════

  createPaymentPlan: (invoiceId: string, data: {
    installments: number;
    frequency: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'CUSTOM';
    firstDueDate: string;
    notes?: string;
  }) => api.post(`/fees/plans`, { ...data, invoiceId }),

  getSchoolPaymentPlans: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get('/fees/plans', { params }),

  getPaymentPlan: (invoiceId: string) =>
    api.get(`/fees/plans/${invoiceId}`),

  cancelPaymentPlan: (invoiceId: string) =>
    api.patch(`/fees/plans/${invoiceId}/cancel`, {}),

  // ══════════════════════════════════════════════════════════════════════════
  // REMINDERS
  // ══════════════════════════════════════════════════════════════════════════

  sendReminder: (invoiceId: string, data?: {
    method?: 'SMS' | 'EMAIL' | 'PUSH' | 'SYSTEM';
    reminderType?: string;
  }) => api.post(`/fees/reminders/send`, { invoiceId, ...data }),

  processReminders: () =>
    api.post('/fees/reminders/process'),

  getReminderHistory: (invoiceId: string) =>
    api.get(`/fees/reminders/${invoiceId}`),

  getReminderStats: () =>
    api.get('/fees/reminders/stats'),

  // ══════════════════════════════════════════════════════════════════════════
  // RECONCILIATION
  // ══════════════════════════════════════════════════════════════════════════

  uploadStatement: (file: File) => {
    const formData = new FormData();
    formData.append('statement', file);
    return api.post('/fees/reconciliation/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  confirmReconciliation: (data: {
    matches: Array<{
      transactionId: string;
      invoiceId: string;
      amount: number;
      confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
  }) => api.post('/fees/reconciliation/confirm', data),

  getReconciliationReport: (params?: {
    from?: string;
    to?: string;
  }) => api.get('/fees/reconciliation/report', { params }),

  // ══════════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ══════════════════════════════════════════════════════════════════════════

  getAnalytics: (params?: {
    from?: string;
    to?: string;
    academicYearId?: string;
    termId?: string;
  }) => api.get('/fees/analytics', { params }),

  getCashFlowReport: (params?: {
    from?: string;
    to?: string;
  }) => api.get('/fees/analytics/cash-flow', { params }),

  detectAnomalies: (params?: {
    days?: number;
  }) => api.get('/fees/analytics/anomalies', { params }),

  // ══════════════════════════════════════════════════════════════════════════
  // REFUNDS
  // ══════════════════════════════════════════════════════════════════════════

  processRefund: (paymentId: string, data: {
    amount: number;
    reason: string;
    notes?: string;
  }) => api.post(`/fees/payments/${paymentId}/refund`, data),

  validateRefund: (paymentId: string) =>
    api.get(`/fees/payments/${paymentId}/refund/validate`),

  getRefundHistory: (paymentId: string) =>
    api.get(`/fees/payments/${paymentId}/refund/history`),

  getInvoiceRefunds: (invoiceId: string) =>
    api.get(`/fees/invoices/${invoiceId}/refunds`),

  getRefundStats: (params?: {
    from?: string;
    to?: string;
  }) => api.get('/fees/refunds/stats', { params }),
};
