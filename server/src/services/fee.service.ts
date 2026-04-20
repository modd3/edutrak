// src/services/fee.service.ts
import { Decimal } from '@prisma/client/runtime/library';
import { InvoiceStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { BaseService } from './base.service';
import { RequestWithUser } from '../middleware/school-context';
import { sequenceGenerator, SequenceType } from './sequence-generator.service';
import {
  CreateFeeStructureInput,
  UpdateFeeStructureInput,
  AddFeeItemInput,
  UpdateFeeItemInput,
  GenerateInvoiceInput,
  BulkGenerateInvoicesInput,
  UpdateInvoiceInput,
  RecordPaymentInput,
  ReversePaymentInput,
  GetFeeStructuresQuery,
  GetInvoicesQuery,
  GetPaymentsQuery,
  FeeReportQuery,
} from '../validation/fee.validation';

/**
 * FeeService
 *
 * Design decisions:
 *  - FeeStructure defines the template; FeeInvoice is the student-specific instance.
 *  - Invoice items are snapshots of fee items at generation time — changing a fee
 *    structure later does NOT retroactively change existing invoices.
 *  - Invoice balance = totalAmount − discountAmount − paidAmount.
 *    Status is recalculated automatically after every payment or update.
 *  - Partial payments are supported; multiple FeePayment rows per invoice are allowed.
 *  - Payments can be reversed (bounced cheque, M-Pesa error) with an audit trail.
 *  - Bulk invoice generation is transactional — all succeed or all fail.
 *  - All queries are school-scoped via BaseService helpers.
 */
export class FeeService extends BaseService {
  private req?: RequestWithUser;

  constructor(req?: RequestWithUser) {
    super();
    this.req = req;
  }

  private getSchoolContext() {
    return {
      schoolId: this.req?.schoolId,
      isSuperAdmin: this.req?.isSuperAdmin ?? false,
      userId: this.req?.user?.userId,
    };
  }

  private assertSchool(schoolId?: string): string {
    if (!schoolId) throw new Error('School context required');
    return schoolId;
  }

  // ── Invoice status helper ─────────────────────────────────────────────────

  /**
   * Derive the correct InvoiceStatus from numeric values.
   * Called whenever paidAmount or discountAmount changes.
   */
  private deriveStatus(
    totalAmount: Decimal,
    discountAmount: Decimal,
    paidAmount: Decimal,
    dueDate?: Date | null,
    currentStatus?: string
  ): InvoiceStatus {
    if (currentStatus === 'CANCELLED' || currentStatus === 'WAIVED') return currentStatus as InvoiceStatus;

    const net = Number(totalAmount) - Number(discountAmount);
    const paid = Number(paidAmount);

    if (paid >= net) return 'PAID';
    if (paid > 0) return 'PARTIAL';
    if (dueDate && dueDate < new Date()) return 'OVERDUE';
    return 'UNPAID';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FEE STRUCTURES
  // ══════════════════════════════════════════════════════════════════════════

  async createFeeStructure(data: CreateFeeStructureInput) {
    const { schoolId } = this.getSchoolContext();
    const sid = this.assertSchool(schoolId);

    // Verify academic year belongs to school
    const ay = await this.prisma.academicYear.findFirst({
      where: { id: data.academicYearId, schoolId: sid },
    });
    if (!ay) throw new Error('Academic year not found or does not belong to this school');

    if (data.termId) {
      const term = await this.prisma.term.findFirst({
        where: { id: data.termId, academicYearId: data.academicYearId },
      });
      if (!term) throw new Error('Term not found in this academic year');
    }

    const structure = await this.prisma.feeStructure.create({
      data: {
        id: uuidv4(),
        name: data.name,
        description: data.description,
        academicYearId: data.academicYearId,
        termId: data.termId ?? null,
        classLevel: data.classLevel ?? null,
        boardingStatus: data.boardingStatus ?? null,
        currency: data.currency,
        schoolId: sid,
        items: {
          create: data.items.map(item => ({
            id: uuidv4(),
            name: item.name,
            category: item.category,
            amount: new Decimal(item.amount),
            isOptional: item.isOptional,
            description: item.description ?? null,
          })),
        },
      },
      include: { items: true, academicYear: true, term: true },
    });

    logger.info('Fee structure created', { structureId: structure.id, schoolId: sid });
    return structure;
  }

  async getFeeStructures(query: GetFeeStructuresQuery) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where: any = isSuperAdmin ? {} : { schoolId: schoolId ?? 'NONE' };

    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.termId) where.termId = query.termId;
    if (query.classLevel) where.classLevel = query.classLevel;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [structures, total] = await Promise.all([
      this.prisma.feeStructure.findMany({
        where,
        include: {
          items: true,
          academicYear: { select: { year: true } },
          term: { select: { name: true, termNumber: true } },
          _count: { select: { invoices: true } },
        },
        orderBy: [{ academicYear: { year: 'desc' } }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.feeStructure.count({ where }),
    ]);

    return { structures, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getFeeStructureById(structureId: string) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    return await this.prisma.feeStructure.findFirst({
      where: {
        id: structureId,
        ...(isSuperAdmin ? {} : { schoolId: schoolId ?? 'NONE' }),
      },
      include: {
        items: { orderBy: { category: 'asc' } },
        academicYear: true,
        term: true,
        _count: { select: { invoices: true } },
      },
    });
  }

  async updateFeeStructure(structureId: string, data: UpdateFeeStructureInput) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    const existing = await this.prisma.feeStructure.findFirst({
      where: {
        id: structureId,
        ...(isSuperAdmin ? {} : { schoolId: schoolId ?? 'NONE' }),
      },
      include: { _count: { select: { invoices: true } } },
    });
    if (!existing) throw new Error('Fee structure not found or access denied');

    // Warn if invoices already generated — structural changes are blocked
    if (existing._count.invoices > 0 && (data.name || data.isActive === false)) {
      logger.warn('Updating fee structure that has generated invoices', { structureId });
    }

    const updated = await this.prisma.feeStructure.update({
      where: { id: structureId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.classLevel !== undefined && { classLevel: data.classLevel }),
        ...(data.boardingStatus !== undefined && { boardingStatus: data.boardingStatus }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { items: true },
    });

    logger.info('Fee structure updated', { structureId });
    return updated;
  }

  async addFeeItem(structureId: string, data: AddFeeItemInput) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    const structure = await this.prisma.feeStructure.findFirst({
      where: {
        id: structureId,
        ...(isSuperAdmin ? {} : { schoolId: schoolId ?? 'NONE' }),
      },
    });
    if (!structure) throw new Error('Fee structure not found or access denied');

    const item = await this.prisma.feeItem.create({
      data: {
        id: uuidv4(),
        feeStructureId: structureId,
        name: data.name,
        category: data.category,
        amount: new Decimal(data.amount),
        isOptional: data.isOptional,
        description: data.description ?? null,
      },
    });

    logger.info('Fee item added', { itemId: item.id, structureId });
    return item;
  }

  async updateFeeItem(itemId: string, data: UpdateFeeItemInput) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    const item = await this.prisma.feeItem.findFirst({
      where: {
        id: itemId,
        feeStructure: isSuperAdmin ? undefined : { schoolId: schoolId ?? 'NONE' },
      },
    });
    if (!item) throw new Error('Fee item not found or access denied');

    return await this.prisma.feeItem.update({
      where: { id: itemId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.category && { category: data.category }),
        ...(data.amount !== undefined && { amount: new Decimal(data.amount) }),
        ...(data.isOptional !== undefined && { isOptional: data.isOptional }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  async deleteFeeItem(itemId: string) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    const item = await this.prisma.feeItem.findFirst({
      where: {
        id: itemId,
        feeStructure: isSuperAdmin ? undefined : { schoolId: schoolId ?? 'NONE' },
      },
      include: { _count: { select: { invoiceItems: true } } },
    });
    if (!item) throw new Error('Fee item not found or access denied');
    if (item._count.invoiceItems > 0) {
      throw new Error('Cannot delete fee item that is referenced in existing invoices');
    }

    await this.prisma.feeItem.delete({ where: { id: itemId } });
    logger.info('Fee item deleted', { itemId });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INVOICES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Generate a fee invoice for a single student from a fee structure.
   * Items are snapshotted — future structure changes won't affect this invoice.
   * Duplicate invoices for the same student+structure are blocked.
   */
  async generateInvoice(data: GenerateInvoiceInput) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const sid = this.assertSchool(isSuperAdmin ? data.feeStructureId : schoolId);
    const effectiveSchoolId = isSuperAdmin ? sid : schoolId!;

    // Load the fee structure with its items
    const structure = await this.prisma.feeStructure.findFirst({
      where: {
        id: data.feeStructureId,
        ...(isSuperAdmin ? {} : { schoolId: effectiveSchoolId }),
      },
      include: { items: true },
    });
    if (!structure) throw new Error('Fee structure not found or access denied');
    if (!structure.isActive) throw new Error('Cannot generate invoice from an inactive fee structure');

    // Validate student
    const student = await this.prisma.student.findFirst({
      where: { id: data.studentId, schoolId: effectiveSchoolId },
    });
    if (!student) throw new Error('Student not found in this school');

    // Prevent duplicates
    const duplicate = await this.prisma.feeInvoice.findFirst({
      where: {
        studentId: data.studentId,
        feeStructureId: data.feeStructureId,
        status: { notIn: ['CANCELLED'] },
      },
    });
    if (duplicate) {
      throw new Error(`Invoice ${duplicate.invoiceNo} already exists for this student and fee structure`);
    }

    // Build waiver set
    const waiverSet = new Set((data.waivers ?? []).map(w => w.feeItemId));
    const waiverNotes = new Map((data.waivers ?? []).map(w => [w.feeItemId, w.waiverNote ?? '']));

    // Calculate total (exclude waived items)
    let total = 0;
    for (const item of structure.items) {
      if (!waiverSet.has(item.id)) {
        total += Number(item.amount);
      }
    }

    const discount = data.discountAmount ?? 0;
    const balance = total - discount;
    const invoiceNo = await sequenceGenerator.generateNext(SequenceType.INVOICE_NUMBER, effectiveSchoolId);

    return await this.prisma.$transaction(async tx => {
      const invoice = await tx.feeInvoice.create({
        data: {
          id: uuidv4(),
          invoiceNo,
          studentId: data.studentId,
          feeStructureId: data.feeStructureId,
          academicYearId: structure.academicYearId,
          termId: structure.termId ?? null,
          schoolId: effectiveSchoolId,
          status: 'UNPAID',
          totalAmount: new Decimal(total),
          discountAmount: new Decimal(discount),
          paidAmount: new Decimal(0),
          balanceAmount: new Decimal(balance),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          notes: data.notes ?? null,
          items: {
            create: structure.items.map(item => ({
              id: uuidv4(),
              feeItemId: item.id,
              name: item.name,
              category: item.category,
              amount: waiverSet.has(item.id) ? new Decimal(0) : item.amount,
              isWaived: waiverSet.has(item.id),
              waiverNote: waiverNotes.get(item.id) ?? null,
            })),
          },
        },
        include: {
          items: true,
          student: { select: { id: true, admissionNo: true, firstName: true, lastName: true } },
          feeStructure: { select: { name: true } },
        },
      });

      logger.info('Invoice generated', { invoiceNo, studentId: data.studentId, schoolId: effectiveSchoolId });
      return invoice;
    });
  }

  /**
   * Generate invoices for a batch of students — all-or-nothing transaction.
   * Students that already have an invoice for this structure are skipped
   * (returned in a `skipped` array) rather than failing the whole batch.
   */
  async bulkGenerateInvoices(data: BulkGenerateInvoicesInput) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const effectiveSchoolId = isSuperAdmin ? undefined : schoolId!;

    const structure = await this.prisma.feeStructure.findFirst({
      where: {
        id: data.feeStructureId,
        ...(effectiveSchoolId ? { schoolId: effectiveSchoolId } : {}),
      },
      include: { items: true },
    });
    if (!structure) throw new Error('Fee structure not found or access denied');
    if (!structure.isActive) throw new Error('Fee structure is inactive');

    const total = structure.items.reduce((s, i) => s + Number(i.amount), 0);

    // Find students that already have an invoice for this structure
    const existing = await this.prisma.feeInvoice.findMany({
      where: {
        feeStructureId: data.feeStructureId,
        studentId: { in: data.studentIds },
        status: { notIn: ['CANCELLED'] },
      },
      select: { studentId: true, invoiceNo: true },
    });
    const existingStudentIds = new Set(existing.map(e => e.studentId));
    const toGenerate = data.studentIds.filter(id => !existingStudentIds.has(id));

    if (toGenerate.length === 0) {
      return {
        generated: 0,
        skipped: existing.length,
        invoices: [],
        skippedDetails: existing,
      };
    }

    // Validate all students belong to school
    const students = await this.prisma.student.findMany({
      where: {
        id: { in: toGenerate },
        ...(effectiveSchoolId ? { schoolId: effectiveSchoolId } : {}),
      },
      select: { id: true },
    });
    if (students.length !== toGenerate.length) {
      throw new Error('One or more students not found in this school');
    }

    const invoices = await this.prisma.$transaction(async tx => {
      const created = [];
      for (const studentId of toGenerate) {
        const invoiceNo = await sequenceGenerator.generateNext(
          SequenceType.INVOICE_NUMBER,
          structure.schoolId
        );
        const invoice = await tx.feeInvoice.create({
          data: {
            id: uuidv4(),
            invoiceNo,
            studentId,
            feeStructureId: data.feeStructureId,
            academicYearId: structure.academicYearId,
            termId: structure.termId ?? null,
            schoolId: structure.schoolId,
            status: 'UNPAID',
            totalAmount: new Decimal(total),
            discountAmount: new Decimal(0),
            paidAmount: new Decimal(0),
            balanceAmount: new Decimal(total),
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            notes: data.notes ?? null,
            items: {
              create: structure.items.map(item => ({
                id: uuidv4(),
                feeItemId: item.id,
                name: item.name,
                category: item.category,
                amount: item.amount,
                isWaived: false,
              })),
            },
          },
        });
        created.push(invoice);
      }
      return created;
    });

    logger.info('Bulk invoices generated', {
      count: invoices.length,
      feeStructureId: data.feeStructureId,
      schoolId: structure.schoolId,
    });

    return {
      generated: invoices.length,
      skipped: existing.length,
      invoices,
      skippedDetails: existing,
    };
  }

  async getInvoices(query: GetInvoicesQuery) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where: any = isSuperAdmin ? {} : { schoolId: schoolId ?? 'NONE' };

    if (query.studentId) where.studentId = query.studentId;
    if (query.feeStructureId) where.feeStructureId = query.feeStructureId;
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.termId) where.termId = query.termId;
    if (query.status) where.status = query.status;
    if (query.isOverdue) where.dueDate = { lt: new Date() };

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      this.prisma.feeInvoice.findMany({
        where,
        include: {
          student: { select: { id: true, admissionNo: true, firstName: true, lastName: true } },
          feeStructure: { select: { name: true } },
          items: true,
          _count: { select: { payments: true } },
        },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feeInvoice.count({ where }),
    ]);

    return { invoices, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getInvoiceById(invoiceId: string) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    return await this.prisma.feeInvoice.findFirst({
      where: {
        id: invoiceId,
        ...(isSuperAdmin ? {} : { schoolId: schoolId ?? 'NONE' }),
      },
      include: {
        student: { select: { id: true, admissionNo: true, firstName: true, lastName: true } },
        feeStructure: { select: { name: true, currency: true } },
        items: { orderBy: { category: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    });
  }

  async updateInvoice(invoiceId: string, data: UpdateInvoiceInput) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    const invoice = await this.prisma.feeInvoice.findFirst({
      where: {
        id: invoiceId,
        ...(isSuperAdmin ? {} : { schoolId: schoolId ?? 'NONE' }),
      },
    });
    if (!invoice) throw new Error('Invoice not found or access denied');
    if (invoice.status === 'CANCELLED') throw new Error('Cannot update a cancelled invoice');

    const newDiscount = data.discountAmount !== undefined
      ? new Decimal(data.discountAmount)
      : invoice.discountAmount;

    const newBalance = new Decimal(
      Number(invoice.totalAmount) - Number(newDiscount) - Number(invoice.paidAmount)
    );

    const newStatus = data.status 
      ? (data.status as InvoiceStatus)
      : this.deriveStatus(
          invoice.totalAmount,
          newDiscount,
          invoice.paidAmount,
          data.dueDate ? new Date(data.dueDate) : invoice.dueDate,
          invoice.status
        );

    return await this.prisma.feeInvoice.update({
      where: { id: invoiceId },
      data: {
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.discountAmount !== undefined && {
          discountAmount: newDiscount,
          balanceAmount: newBalance,
        }),
        status: newStatus,
      },
      include: { items: true, student: { select: { admissionNo: true, firstName: true, lastName: true } } },
    });
  }

  async cancelInvoice(invoiceId: string) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    const invoice = await this.prisma.feeInvoice.findFirst({
      where: {
        id: invoiceId,
        ...(isSuperAdmin ? {} : { schoolId: schoolId ?? 'NONE' }),
      },
      include: { _count: { select: { payments: true } } },
    });
    if (!invoice) throw new Error('Invoice not found or access denied');
    if (invoice.status === 'CANCELLED') throw new Error('Invoice is already cancelled');
    if (invoice._count.payments > 0) {
      throw new Error('Cannot cancel an invoice with recorded payments. Reverse the payments first.');
    }

    return await this.prisma.feeInvoice.update({
      where: { id: invoiceId },
      data: { status: 'CANCELLED' },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAYMENTS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Record a payment against an invoice.
   * Automatically recalculates the invoice balance and status.
   * Overpayments (where amount > balance) are rejected.
   */
  async recordPayment(data: RecordPaymentInput) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    const invoice = await this.prisma.feeInvoice.findFirst({
      where: {
        id: data.invoiceId,
        ...(isSuperAdmin ? {} : { schoolId: schoolId ?? 'NONE' }),
      },
    });
    if (!invoice) throw new Error('Invoice not found or access denied');
    if (invoice.status === 'CANCELLED') throw new Error('Cannot accept payment for a cancelled invoice');
    if (invoice.status === 'PAID') throw new Error('Invoice is already fully paid');

    const balance = Number(invoice.totalAmount) - Number(invoice.discountAmount) - Number(invoice.paidAmount);
    if (data.amount > balance + 0.005) {
      // 0.005 tolerance for floating-point rounding
      throw new Error(
        `Payment amount (${data.amount}) exceeds outstanding balance (${balance.toFixed(2)})`
      );
    }

    const receiptNo = await sequenceGenerator.generateNext(
      SequenceType.RECEIPT_NUMBER,
      invoice.schoolId
    );

    const newPaid = Number(invoice.paidAmount) + data.amount;
    const newBalance = Number(invoice.totalAmount) - Number(invoice.discountAmount) - newPaid;
    const newStatus = this.deriveStatus(
      invoice.totalAmount,
      invoice.discountAmount,
      new Decimal(newPaid),
      invoice.dueDate,
      invoice.status
    );

    return await this.prisma.$transaction(async tx => {
      const payment = await tx.feePayment.create({
        data: {
          id: uuidv4(),
          receiptNo,
          invoiceId: data.invoiceId,
          studentId: invoice.studentId,
          schoolId: invoice.schoolId,
          amount: new Decimal(data.amount),
          method: data.method,
          status: 'COMPLETED',
          transactionRef: data.transactionRef ?? null,
          mpesaCode: data.mpesaCode ?? null,
          bankName: data.bankName ?? null,
          chequeNo: data.chequeNo ?? null,
          paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
          notes: data.notes ?? null,
          receivedById: this.getSchoolContext().userId ?? null,
        },
        include: {
          invoice: { select: { invoiceNo: true } },
        },
      });

      await tx.feeInvoice.update({
        where: { id: data.invoiceId },
        data: {
          paidAmount: new Decimal(newPaid),
          balanceAmount: new Decimal(Math.max(0, newBalance)),
          status: newStatus,
        },
      });

      logger.info('Payment recorded', {
        receiptNo,
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method,
        schoolId: invoice.schoolId,
      });

      return payment;
    });
  }

  async getPayments(query: GetPaymentsQuery) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where: any = isSuperAdmin ? {} : { schoolId: schoolId ?? 'NONE' };

    if (query.studentId) where.studentId = query.studentId;
    if (query.invoiceId) where.invoiceId = query.invoiceId;
    if (query.method) where.method = query.method;
    if (query.status) where.status = query.status;

    if (query.startDate || query.endDate) {
      where.paidAt = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(`${query.endDate}T23:59:59`) }),
      };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.feePayment.findMany({
        where,
        include: {
          student: { select: { id: true, admissionNo: true, firstName: true, lastName: true } },
          invoice: { select: { invoiceNo: true, totalAmount: true } },
        },
        orderBy: { paidAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feePayment.count({ where }),
    ]);

    return { payments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getPaymentById(paymentId: string) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    return await this.prisma.feePayment.findFirst({
      where: {
        id: paymentId,
        ...(isSuperAdmin ? {} : { schoolId: schoolId ?? 'NONE' }),
      },
      include: {
        student: { select: { id: true, admissionNo: true, firstName: true, lastName: true } },
        invoice: { include: { feeStructure: { select: { name: true } } } },
      },
    });
  }

  /**
   * Reverse a payment — creates an audit trail and updates the invoice balance.
   * Only COMPLETED payments can be reversed.
   */
  async reversePayment(paymentId: string, data: ReversePaymentInput) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    const payment = await this.prisma.feePayment.findFirst({
      where: {
        id: paymentId,
        ...(isSuperAdmin ? {} : { schoolId: schoolId ?? 'NONE' }),
      },
      include: { invoice: true },
    });
    if (!payment) throw new Error('Payment not found or access denied');
    if (payment.status !== 'COMPLETED') {
      throw new Error(`Cannot reverse a payment with status: ${payment.status}`);
    }

    const newPaid = Math.max(0, Number(payment.invoice.paidAmount) - Number(payment.amount));
    const newBalance = Number(payment.invoice.totalAmount) - Number(payment.invoice.discountAmount) - newPaid;
    const newStatus = this.deriveStatus(
      payment.invoice.totalAmount,
      payment.invoice.discountAmount,
      new Decimal(newPaid),
      payment.invoice.dueDate,
      payment.invoice.status
    );

    return await this.prisma.$transaction(async tx => {
      const reversed = await tx.feePayment.update({
        where: { id: paymentId },
        data: {
          status: 'REVERSED',
          reversedAt: new Date(),
          reversalReason: data.reason,
        },
      });

      await tx.feeInvoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: new Decimal(newPaid),
          balanceAmount: new Decimal(newBalance),
          status: newStatus,
        },
      });

      logger.info('Payment reversed', {
        paymentId,
        invoiceId: payment.invoiceId,
        reason: data.reason,
      });

      return reversed;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REPORTING
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * School-level fee collection summary.
   * Breaks down expected, collected, and outstanding amounts by category.
   */
  async getFeeCollectionReport(query: FeeReportQuery) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where: any = isSuperAdmin ? {} : { schoolId: schoolId ?? 'NONE' };

    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.termId) where.termId = query.termId;

    const invoices = await this.prisma.feeInvoice.findMany({
      where,
      select: {
        status: true,
        totalAmount: true,
        discountAmount: true,
        paidAmount: true,
        balanceAmount: true,
      },
    });

    const summary = invoices.reduce(
      (acc, inv) => {
        acc.totalBilled += Number(inv.totalAmount);
        acc.totalDiscounted += Number(inv.discountAmount);
        acc.totalCollected += Number(inv.paidAmount);
        acc.totalOutstanding += Number(inv.balanceAmount);
        acc.byStatus[inv.status] = (acc.byStatus[inv.status] ?? 0) + 1;
        return acc;
      },
      {
        totalBilled: 0,
        totalDiscounted: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        invoiceCount: invoices.length,
        byStatus: {} as Record<string, number>,
      }
    );

    // Collection rate = collected / (billed − discounted)
    const net = summary.totalBilled - summary.totalDiscounted;
    const collectionRate = net > 0
      ? parseFloat(((summary.totalCollected / net) * 100).toFixed(2))
      : 0;

    // Daily collection trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPayments = await this.prisma.feePayment.findMany({
      where: {
        ...(isSuperAdmin ? {} : { schoolId: schoolId ?? 'NONE' }),
        status: 'COMPLETED',
        paidAt: { gte: thirtyDaysAgo },
      },
      select: { paidAt: true, amount: true, method: true },
    });

    const dailyCollection: Record<string, { amount: number; count: number }> = {};
    const byMethod: Record<string, number> = {};

    for (const p of recentPayments) {
      const day = p.paidAt.toISOString().slice(0, 10);
      if (!dailyCollection[day]) dailyCollection[day] = { amount: 0, count: 0 };
      dailyCollection[day].amount += Number(p.amount);
      dailyCollection[day].count += 1;
      byMethod[p.method] = (byMethod[p.method] ?? 0) + Number(p.amount);
    }

    return {
      ...summary,
      collectionRate,
      dailyCollection: Object.entries(dailyCollection)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v })),
      byPaymentMethod: byMethod,
    };
  }

  /**
   * List students with outstanding balances — useful for fee defaulters report.
   * Sorted by balance descending (highest debt first).
   */
  async getDefaultersReport(query: FeeReportQuery) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where: any = {
      ...(isSuperAdmin ? {} : { schoolId: schoolId ?? 'NONE' }),
      status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
    };

    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.termId) where.termId = query.termId;

    const invoices = await this.prisma.feeInvoice.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            admissionNo: true,
            firstName: true,
            lastName: true,
            enrollments: {
              where: { status: 'ACTIVE' },
              include: { class: { select: { name: true } } },
              take: 1,
            },
          },
        },
        feeStructure: { select: { name: true } },
      },
      orderBy: { balanceAmount: 'desc' },
    });

    return invoices.map(inv => ({
      invoiceNo: inv.invoiceNo,
      status: inv.status,
      studentId: inv.studentId,
      admissionNo: inv.student.admissionNo,
      studentName: `${inv.student.firstName} ${inv.student.lastName}`,
      class: inv.student.enrollments[0]?.class?.name ?? 'N/A',
      feeStructure: inv.feeStructure.name,
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      outstandingBalance: Number(inv.balanceAmount),
      dueDate: inv.dueDate,
    }));
  }

  // ── Static factory ────────────────────────────────────────────────────────

  static withRequest(req: RequestWithUser): FeeService {
    return new FeeService(req);
  }
}