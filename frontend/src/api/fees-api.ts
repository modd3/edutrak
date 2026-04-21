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
  getStructures: (params?: {
    academicYearId?: string;
    termId?: string;
    classLevel?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => api.get('/fees/structures', { params }),

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
};
