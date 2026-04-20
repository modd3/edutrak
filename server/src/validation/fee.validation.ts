// src/validation/fee.validation.ts
import { z } from 'zod';

// ── Enums ────────────────────────────────────────────────────────────────────

export const FeeCategoryEnum = z.enum([
  'TUITION', 'BOARDING', 'LUNCH', 'TRANSPORT', 'ACTIVITY',
  'UNIFORM', 'EXAM', 'LIBRARY', 'LABORATORY', 'DEVELOPMENT', 'MISCELLANEOUS',
]);

export const InvoiceStatusEnum = z.enum([
  'UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED', 'WAIVED',
]);

export const PaymentMethodEnum = z.enum([
  'CASH', 'MPESA', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'SCHOLARSHIP',
]);

export const PaymentStatusEnum = z.enum([
  'PENDING', 'COMPLETED', 'REVERSED', 'FAILED',
]);

// ── Fee Structure ─────────────────────────────────────────────────────────────

export const createFeeStructureSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(500).optional(),
  academicYearId: z.string().uuid('Invalid academic year ID'),
  termId: z.string().uuid().optional(),
  classLevel: z.string().max(20).optional(),
  boardingStatus: z.enum(['DAY', 'BOARDING', 'BOTH']).optional(),
  currency: z.string().length(3).default('KES'),
  items: z
    .array(
      z.object({
        name: z.string().min(1, 'Item name is required').max(200),
        category: FeeCategoryEnum,
        amount: z.number().positive('Amount must be positive'),
        isOptional: z.boolean().default(false),
        description: z.string().max(300).optional(),
      })
    )
    .min(1, 'At least one fee item is required'),
});

export const updateFeeStructureSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  classLevel: z.string().max(20).optional(),
  boardingStatus: z.enum(['DAY', 'BOARDING', 'BOTH']).optional(),
  isActive: z.boolean().optional(),
});

export const addFeeItemSchema = z.object({
  name: z.string().min(1).max(200),
  category: FeeCategoryEnum,
  amount: z.number().positive(),
  isOptional: z.boolean().default(false),
  description: z.string().max(300).optional(),
});

export const updateFeeItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: FeeCategoryEnum.optional(),
  amount: z.number().positive().optional(),
  isOptional: z.boolean().optional(),
  description: z.string().max(300).optional(),
});

// ── Invoice ───────────────────────────────────────────────────────────────────

export const generateInvoiceSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  feeStructureId: z.string().uuid('Invalid fee structure ID'),
  dueDate: z.string().datetime({ offset: true }).optional(),
  notes: z.string().max(500).optional(),
  // Optional per-item overrides — e.g. waive boarding for a day student
  waivers: z
    .array(
      z.object({
        feeItemId: z.string().uuid(),
        waiverNote: z.string().max(300).optional(),
      })
    )
    .optional(),
  // Flat discount applied to the invoice total (scholarship, bursary)
  discountAmount: z.number().min(0).default(0),
});

export const bulkGenerateInvoicesSchema = z.object({
  feeStructureId: z.string().uuid('Invalid fee structure ID'),
  studentIds: z.array(z.string().uuid()).min(1, 'At least one student required'),
  dueDate: z.string().datetime({ offset: true }).optional(),
  notes: z.string().max(500).optional(),
});

export const updateInvoiceSchema = z.object({
  dueDate: z.string().datetime({ offset: true }).optional(),
  notes: z.string().max(500).optional(),
  discountAmount: z.number().min(0).optional(),
  status: InvoiceStatusEnum.optional(),
});

// ── Payment ───────────────────────────────────────────────────────────────────

export const recordPaymentSchema = z
  .object({
    invoiceId: z.string().uuid('Invalid invoice ID'),
    amount: z.number().positive('Payment amount must be positive'),
    method: PaymentMethodEnum,
    transactionRef: z.string().max(100).optional(),
    mpesaCode: z.string().max(50).optional(),
    bankName: z.string().max(100).optional(),
    chequeNo: z.string().max(50).optional(),
    paidAt: z.string().datetime({ offset: true }).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    data => {
      // M-Pesa payments should have a code
      if (data.method === 'MPESA' && !data.mpesaCode && !data.transactionRef) return false;
      return true;
    },
    { message: 'M-Pesa payments require mpesaCode or transactionRef' }
  );

export const reversePaymentSchema = z.object({
  reason: z.string().min(1, 'Reversal reason is required').max(500),
});

// ── Query Schemas ─────────────────────────────────────────────────────────────

export const getFeeStructuresQuerySchema = z.object({
  academicYearId: z.string().uuid().optional(),
  termId: z.string().uuid().optional(),
  classLevel: z.string().optional(),
  isActive: z
    .string()
    .transform(v => v === 'true')
    .optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const getInvoicesQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  feeStructureId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  termId: z.string().uuid().optional(),
  status: InvoiceStatusEnum.optional(),
  isOverdue: z.string().transform(v => v === 'true').optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const getPaymentsQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  method: PaymentMethodEnum.optional(),
  status: PaymentStatusEnum.optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const feeReportQuerySchema = z.object({
  academicYearId: z.string().uuid().optional(),
  termId: z.string().uuid().optional(),
  classLevel: z.string().optional(),
});

// ── Type Exports ──────────────────────────────────────────────────────────────

export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;
export type UpdateFeeStructureInput = z.infer<typeof updateFeeStructureSchema>;
export type AddFeeItemInput = z.infer<typeof addFeeItemSchema>;
export type UpdateFeeItemInput = z.infer<typeof updateFeeItemSchema>;
export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type BulkGenerateInvoicesInput = z.infer<typeof bulkGenerateInvoicesSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type ReversePaymentInput = z.infer<typeof reversePaymentSchema>;
export type GetFeeStructuresQuery = z.infer<typeof getFeeStructuresQuerySchema>;
export type GetInvoicesQuery = z.infer<typeof getInvoicesQuerySchema>;
export type GetPaymentsQuery = z.infer<typeof getPaymentsQuerySchema>;
export type FeeReportQuery = z.infer<typeof feeReportQuerySchema>;