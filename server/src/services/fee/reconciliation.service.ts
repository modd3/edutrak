/**
 * ReconciliationService
 *
 * Matches bank statement deposits to student fee invoices automatically.
 * Handles the common Kenyan school scenario where parents pay via bank transfer
 * and the admin must manually figure out which student each deposit belongs to.
 *
 * Flow:
 * 1. Admin downloads CSV statement from bank portal
 * 2. Uploads to EduTrak via POST /api/fees/reconciliation/upload
 * 3. System parses CSV → extracts deposits → matches to invoices
 * 4. Matched → auto-creates FeePayment records
 * 5. Unmatched → flagged for manual review
 *
 * Bank CSV formats supported:
 *  - Equity Bank (standard format)
 *  - KCB (standard format)
 *  - Co-operative Bank
 *  - Generic CSV (configurable column mapping)
 */
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'csv-parse/sync';
import prisma from '../../database/client';
import logger from '../../utils/logger';
import { BaseService } from '../base.service';
import { RequestWithUser } from '../../middleware/school-context';
import { sequenceGenerator, SequenceType } from '../sequence-generator.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BankTransaction {
  /** Date of the transaction from the bank statement */
  transactionDate: Date;
  /** Description/narrative from the bank */
  description: string;
  /** Amount deposited (positive = credit) */
  amount: number;
  /** Available reference (invoice no, admission no, name, etc.) */
  reference?: string;
  /** Raw row data for audit */
  rawRow: Record<string, string>;
}

export interface MatchResult {
  /** How confident the match is */
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  /** The bank transaction */
  transaction: BankTransaction;
  /** Matched invoice (null if unmatched) */
  invoiceId: string | null;
  /** Matched student (null if unmatched) */
  studentId: string | null;
  /** Reason for the match decision */
  reason: string;
  /** Suggested action */
  suggestedAction: 'AUTO_CONFIRM' | 'REVIEW' | 'FLAG';
}

export interface ReconciliationResult {
  matched: number;
  unmatched: number;
  totalAmount: number;
  matchedAmount: number;
  results: MatchResult[];
  anomalies: string[];
}

interface BankStatementConfig {
  columnMapping: {
    date: string;
    description: string;
    amount?: string;      // Generic amount column
    reference?: string;    // Transaction reference/ID column
    credit?: string;       // Credit column (for banks with separate credit/debit columns)
    debit?: string;        // Debit column
  };
  dateFormat: string;
  headerRows: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ReconciliationService extends BaseService {
  private req?: RequestWithUser;

  constructor(req?: RequestWithUser) {
    super();
    this.req = req;
  }

  static withRequest(req: RequestWithUser): ReconciliationService {
    return new ReconciliationService(req);
  }

  private getSchoolContext() {
    return {
      schoolId: this.req?.schoolId,
      isSuperAdmin: this.req?.isSuperAdmin ?? false,
      userId: this.req?.user?.userId,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CORE RECONCILIATION FLOW
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Upload and process a bank statement CSV.
   * Returns match results without persisting — admin can review first.
   */
  async uploadStatement(
    csvContent: string,
    schoolId: string,
    bankName?: string
  ): Promise<ReconciliationResult> {
    const transactions = this.parseCSV(csvContent, bankName);
    const results = await this.matchTransactions(transactions, schoolId);

    const matched = results.filter((r) => r.suggestedAction === 'AUTO_CONFIRM');
    const unmatched = results.filter((r) => r.suggestedAction !== 'AUTO_CONFIRM');

    const totalAmount = results.reduce((s, r) => s + r.transaction.amount, 0);
    const matchedAmount = matched.reduce((s, r) => s + r.transaction.amount, 0);

    // Detect anomalies
    const anomalies = this.detectAnomalies(results, schoolId);

    logger.info('Bank statement processed', {
      schoolId,
      transactions: transactions.length,
      matched: matched.length,
      unmatched: unmatched.length,
      totalAmount,
    });

    return {
      matched: matched.length,
      unmatched: unmatched.length,
      totalAmount,
      matchedAmount,
      results,
      anomalies,
    };
  }

  /**
   * Confirm matches and create payments for auto-confirmed transactions.
   * Called by admin after reviewing the reconciliation results.
   */
  async confirmMatches(
    matchIds: string[],
    schoolId: string
  ): Promise<{ confirmed: number; payments: any[] }> {
    const { schoolId: ctxSchoolId, isSuperAdmin, userId } = this.getSchoolContext();
    const sid = ctxSchoolId || schoolId;

    // We need to re-run the matching for the specified transactions.
    // In a full implementation, we'd store the parsed statement temporarily.
    // For now, this accepts payment creation directly for matched invoices.
    const payments = [];

    for (const invoiceId of matchIds) {
      const invoice = await this.prisma.feeInvoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice || invoice.schoolId !== sid) continue;
      if (invoice.status === 'CANCELLED' || invoice.status === 'PAID') continue;

      const balance =
        Number(invoice.totalAmount) -
        Number(invoice.discountAmount) -
        Number(invoice.paidAmount);

      if (balance <= 0) continue;

      const receiptNo = await sequenceGenerator.generateNext(
        SequenceType.RECEIPT_NUMBER,
        sid
      );

      const payment = await this.prisma.$transaction(async (tx) => {
        const p = await tx.feePayment.create({
          data: {
            id: uuidv4(),
            receiptNo,
            invoiceId: invoice.id,
            studentId: invoice.studentId,
            schoolId: sid,
            amount: new Decimal(balance),
            method: 'BANK_TRANSFER',
            status: 'PENDING',
            notes: 'Auto-matched via bank reconciliation',
            receivedById: userId ?? null,
          },
        });

        const newPaid = Number(invoice.paidAmount) + balance;
        await tx.feeInvoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: new Decimal(newPaid),
            balanceAmount: new Decimal(0),
            status: 'PAID',
          },
        });

        return p;
      });

      payments.push(payment);
      logger.info('Reconciliation payment created', {
        invoiceId: invoice.id,
        receiptNo,
        amount: balance,
      });
    }

    return { confirmed: payments.length, payments };
  }

  /**
   * Generate a reconciliation report for a date range.
   */
  async generateReport(
    schoolId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<Record<string, unknown>> {
    const invoices = await this.prisma.feeInvoice.findMany({
      where: {
        schoolId,
        createdAt: { gte: fromDate, lte: toDate },
      },
      include: {
        payments: true,
        student: {
          select: { id: true, admissionNo: true, firstName: true, lastName: true },
        },
      },
    });

    // Expected: total invoice amounts
    const totalExpected = invoices.reduce(
      (s, inv) => s + Number(inv.totalAmount) - Number(inv.discountAmount),
      0
    );

    // Actual: payments received
    const payments = invoices.flatMap((inv) => inv.payments);
    const totalReceived = payments.reduce(
      (s, p) => s + (p.status === 'COMPLETED' ? Number(p.amount) : 0),
      0
    );

    // By payment method
    const byMethod: Record<string, number> = {};
    for (const p of payments) {
      if (p.status === 'COMPLETED') {
        byMethod[p.method] = (byMethod[p.method] || 0) + Number(p.amount);
      }
    }

    // Outstanding by status
    const byStatus: Record<string, number> = {};
    for (const inv of invoices) {
      byStatus[inv.status] = (byStatus[inv.status] || 0) + 1;
    }

    return {
      period: { from: fromDate, to: toDate },
      invoiceCount: invoices.length,
      totalExpected,
      totalReceived,
      variance: totalExpected - totalReceived,
      collectionRate:
        totalExpected > 0
          ? parseFloat(((totalReceived / totalExpected) * 100).toFixed(2))
          : 0,
      byPaymentMethod: byMethod,
      byStatus,
      pendingPayments: payments.filter((p) => p.status === 'PENDING').length,
      reversedPayments: payments.filter((p) => p.status === 'REVERSED').length,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CSV PARSING
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Parse a CSV bank statement into structured transactions.
   * Supports multiple bank formats.
   */
  private parseCSV(csvContent: string, bankName?: string): BankTransaction[] {
    const config = this.getBankConfig(bankName);
    const rawRecords = this.parseRawCSV(csvContent, config);
    const transactions: BankTransaction[] = [];

    for (const record of rawRecords) {
      try {
        const transaction = this.extractTransaction(record, config);
        if (transaction && transaction.amount > 0) {
          // Only include deposits/credits
          transactions.push(transaction);
        }
      } catch (error: any) {
        logger.warn('Failed to parse bank row', {
          row: record,
          error: error.message,
        });
      }
    }

    return transactions;
  }

  private parseRawCSV(
    content: string,
    config: BankStatementConfig
  ): Record<string, string>[] {
    const lines = content.split('\n').slice(config.headerRows);
    const raw = parse(lines.join('\n'), {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    });

    return raw as Record<string, string>[];
  }

  private extractTransaction(
    row: Record<string, string>,
    config: BankStatementConfig
  ): BankTransaction | null {
    const mapping = config.columnMapping;

    // Try to get the amount (credit column, or positive value in amount column)
    let amount = 0;
    if (mapping.credit && row[mapping.credit]) {
      amount = parseFloat(row[mapping.credit].replace(/[^0-9.]/g, ''));
    } else if (mapping.amount) {
      // May contain both debits and credits
      const val = parseFloat(row[mapping.amount].replace(/[^0-9.-]/g, ''));
      amount = Math.abs(val); // Take absolute value for credits
    }

    if (amount <= 0) return null;

    // Parse date
    let transactionDate: Date;
    try {
      transactionDate = new Date(row[mapping.date]);
      if (isNaN(transactionDate.getTime())) {
        // Try common Kenyan date formats
        const parts = row[mapping.date].split(/[/-]/);
        if (parts.length === 3) {
          // DD/MM/YYYY or DD-MM-YYYY
          transactionDate = new Date(
            parseInt(parts[2]),
            parseInt(parts[1]) - 1,
            parseInt(parts[0])
          );
        }
      }
    } catch {
      transactionDate = new Date();
    }

    const description = (row[mapping.description] || '').trim();
    const reference = mapping.reference ? row[mapping.reference] : undefined;

    return {
      transactionDate,
      description,
      amount: Math.round(amount * 100) / 100,
      reference,
      rawRow: row,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MATCHING ENGINE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Match bank transactions to invoices.
   * Strategy: Try multiple approaches and pick the best match.
   */
  private async matchTransactions(
    transactions: BankTransaction[],
    schoolId: string
  ): Promise<MatchResult[]> {
    const results: MatchResult[] = [];

    // Load all unpaid/partial invoices for the school
    const invoices = await this.prisma.feeInvoice.findMany({
      where: {
        schoolId,
        status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
      },
      include: {
        student: {
          select: { id: true, admissionNo: true, firstName: true, lastName: true },
        },
        feeStructure: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const transaction of transactions) {
      const match = this.findBestMatch(transaction, invoices);
      results.push(match);
    }

    return results;
  }

  private findBestMatch(
    transaction: BankTransaction,
    invoices: Array<any>
  ): MatchResult {
    const ref = (transaction.reference || transaction.description).toLowerCase();

    // Strategy 1: Exact invoice number match
    const byInvoiceNo = invoices.find((inv) => {
      const invNo = inv.invoiceNo.toLowerCase();
      return ref.includes(invNo) || invNo.includes(ref);
    });
    if (byInvoiceNo) {
      const balance =
        Number(byInvoiceNo.totalAmount) -
        Number(byInvoiceNo.discountAmount) -
        Number(byInvoiceNo.paidAmount);

      const closeAmount = Math.abs(transaction.amount - balance) < 10;

      return {
        confidence: closeAmount ? 'HIGH' : 'MEDIUM',
        transaction,
        invoiceId: byInvoiceNo.id,
        studentId: byInvoiceNo.studentId,
        reason: `Matched to invoice ${byInvoiceNo.invoiceNo}${
          closeAmount
            ? ' with exact amount'
            : ` (invoice: ${balance}, deposit: ${transaction.amount})`
        }`,
        suggestedAction: closeAmount ? 'AUTO_CONFIRM' : 'REVIEW',
      };
    }

    // Strategy 2: Admission number match
    const byAdmissionNo = invoices.find((inv) => {
      const admNo = inv.student.admissionNo.toLowerCase();
      return ref.includes(admNo);
    });
    if (byAdmissionNo) {
      const balance =
        Number(byAdmissionNo.totalAmount) -
        Number(byAdmissionNo.discountAmount) -
        Number(byAdmissionNo.paidAmount);

      const closeEnough = Math.abs(transaction.amount - balance) < 100;

      return {
        confidence: closeEnough ? 'HIGH' : 'MEDIUM',
        transaction,
        invoiceId: byAdmissionNo.id,
        studentId: byAdmissionNo.studentId,
        reason: `Matched to student ${byAdmissionNo.student.firstName} ${byAdmissionNo.student.lastName} (${byAdmissionNo.student.admissionNo})`,
        suggestedAction: closeEnough ? 'AUTO_CONFIRM' : 'REVIEW',
      };
    }

    // Strategy 3: Student name match (fuzzy)
    const byName = invoices.find((inv) => {
      const fullName = `${inv.student.firstName} ${inv.student.lastName}`.toLowerCase();
      const reverseName = `${inv.student.lastName} ${inv.student.firstName}`.toLowerCase();
      return ref.includes(fullName) || ref.includes(reverseName);
    });
    if (byName) {
      return {
        confidence: 'LOW',
        transaction,
        invoiceId: byName.id,
        studentId: byName.studentId,
        reason: `Possible match to student ${byName.student.firstName} ${byName.student.lastName} — name found in transaction memo`,
        suggestedAction: 'REVIEW',
      };
    }

    // Strategy 4: Amount-only match (least reliable)
    const byAmount = invoices.filter((inv) => {
      const balance =
        Number(inv.totalAmount) -
        Number(inv.discountAmount) -
        Number(inv.paidAmount);
      return Math.abs(transaction.amount - balance) < 5; // Within 5 KES
    });

    if (byAmount.length === 1) {
      return {
        confidence: 'MEDIUM',
        transaction,
        invoiceId: byAmount[0].id,
        studentId: byAmount[0].studentId,
        reason: `Amount (${transaction.amount}) matches outstanding balance for ${byAmount[0].invoiceNo}`,
        suggestedAction: 'REVIEW',
      };
    }

    if (byAmount.length > 1) {
      return {
        confidence: 'LOW',
        transaction,
        invoiceId: null,
        studentId: null,
        reason: `Amount ${transaction.amount} matches ${byAmount.length} invoices — cannot determine which`,
        suggestedAction: 'FLAG',
      };
    }

    // No match found
    return {
      confidence: 'LOW',
      transaction,
      invoiceId: null,
      studentId: null,
      reason: 'Could not match to any invoice. Check if deposit is for this school.',
      suggestedAction: 'FLAG',
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ANOMALY DETECTION
  // ══════════════════════════════════════════════════════════════════════════

  private detectAnomalies(
    results: MatchResult[],
    _schoolId: string
  ): string[] {
    const anomalies: string[] = [];

    // Check for duplicate amounts within short timeframes
    const amountMap = new Map<number, MatchResult[]>();
    for (const r of results) {
      const key = r.transaction.amount;
      if (!amountMap.has(key)) amountMap.set(key, []);
      amountMap.get(key)!.push(r);
    }

    for (const [amount, matches] of amountMap) {
      if (matches.length > 1) {
        // Check if they're on the same day
        const dates = matches.map((m) =>
          m.transaction.transactionDate.toISOString().slice(0, 10)
        );
        const uniqueDates = new Set(dates);
        if (uniqueDates.size === 1) {
          anomalies.push(
            `Multiple deposits of exactly ${amount} on ${[...uniqueDates][0]} — possible duplicate`
          );
        }
      }
    }

    // Flag unusually high amounts
    const amounts = results.map((r) => r.transaction.amount);
    const avgAmount =
      amounts.reduce((s, a) => s + a, 0) / (amounts.length || 1);
    for (const r of results) {
      if (r.transaction.amount > avgAmount * 5) {
        anomalies.push(
          `Unusually large deposit: ${r.transaction.amount} (avg is ${avgAmount.toFixed(2)}) — reference: ${r.transaction.reference || r.transaction.description}`
        );
      }
    }

    // Flag weekend/holiday deposits
    for (const r of results) {
      const day = r.transaction.transactionDate.getDay();
      if (day === 0 || day === 6) {
        anomalies.push(
          `Weekend deposit on ${r.transaction.transactionDate.toISOString().slice(0, 10)} — ${r.transaction.amount}`
        );
      }
    }

    return anomalies;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BANK CONFIGURATION
  // ══════════════════════════════════════════════════════════════════════════

  private getBankConfig(bankName?: string): BankStatementConfig {
    const defaults: BankStatementConfig = {
      columnMapping: {
        date: 'Date',
        description: 'Description',
        amount: 'Amount',
      },
      dateFormat: 'DD/MM/YYYY',
      headerRows: 0,
    };

    switch ((bankName || '').toUpperCase()) {
      case 'EQUITY':
        return {
          columnMapping: {
            date: 'Transaction Date',
            description: 'Description',
            amount: 'Amount',
            reference: 'Reference',
          },
          dateFormat: 'DD/MM/YYYY',
          headerRows: 1,
        };

      case 'KCB':
        return {
          columnMapping: {
            date: 'Value Date',
            description: 'Narrative',
            credit: 'Credit',
            debit: 'Debit',
          },
          dateFormat: 'DD/MM/YYYY',
          headerRows: 2,
        };

      case 'COOP':
      case 'CO-OPERATIVE':
        return {
          columnMapping: {
            date: 'Date',
            description: 'Details',
            credit: 'Credit',
            debit: 'Debit',
          },
          dateFormat: 'DD-MM-YYYY',
          headerRows: 1,
        };

      default:
        return defaults;
    }
  }
}