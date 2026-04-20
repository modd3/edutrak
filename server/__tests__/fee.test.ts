/**
 * __tests__/fee.test.ts
 *
 * Integration tests for the fee management module.
 *
 * Test flow:
 *  A. Fee Structure: create → fetch → add item → update item → update structure
 *  B. Invoice: generate single → verify amounts → bulk generate → skip duplicate
 *  C. Payment: full payment → invoice status = PAID
 *             partial payment → status = PARTIAL
 *             overpayment rejected
 *             reverse payment → balance restored
 *  D. Cancel invoice (no payments)
 *  E. Cancel invoice blocked (has payments)
 *  F. Reports: collection report, defaulters report
 *  G. Validation edge cases
 */

import request from 'supertest';
import app from '../src/app'; // adjust path as needed
import prisma from '../src/database/client';
import { hashPassword } from '../src/utils/hash';
import { Decimal } from '@prisma/client/runtime/library';

// ── Shared state ──────────────────────────────────────────────────────────────

let adminToken: string;
let schoolId: string;
let academicYearId: string;
let termId: string;
let studentId: string;
let studentId2: string;
let structureId: string;
let itemId: string;       // id of a specific fee item
let invoiceId: string;
let invoiceId2: string;   // second student's invoice
let paymentId: string;

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  // Wipe fee data
  await prisma.feePayment.deleteMany();
  await prisma.feeInvoiceItem.deleteMany();
  await prisma.feeInvoice.deleteMany();
  await prisma.feeItem.deleteMany();
  await prisma.feeStructure.deleteMany();

  // ── Bootstrap school + admin ─────────────────────────────────────────────
  const adminPw = await hashPassword('admin123');
  let school = await prisma.school.findFirst({ where: { knecCode: 'FEE001' } });
  if (!school) {
    school = await prisma.school.create({
      data: {
        name: 'Fee Test School',
        type: 'SECONDARY',
        county: 'Nairobi',
        ownership: 'PRIVATE',
        boardingStatus: 'BOTH',
        gender: 'MIXED',
        knecCode: 'FEE001',
        kemisCode: 'KEM_FEE001',
      },
    });
  }
  schoolId = school.id;

  const adminUser = await prisma.user.upsert({
    where: { email: 'feeadmin@school.com' },
    update: { schoolId },
    create: {
      email: 'feeadmin@school.com',
      password: adminPw,
      firstName: 'Fee',
      lastName: 'Admin',
      role: 'ADMIN',
      schoolId,
    },
  });

  // ── Academic year + term ─────────────────────────────────────────────────
  let ay = await prisma.academicYear.findFirst({ where: { year: 8888, schoolId } });
  if (!ay) {
    ay = await prisma.academicYear.create({
      data: {
        year: 8888,
        startDate: new Date('2088-01-01'),
        endDate: new Date('2088-12-31'),
        schoolId,
        isActive: false,
      },
    });
  }
  academicYearId = ay.id;

  let term = await prisma.term.findFirst({ where: { academicYearId, termNumber: 1 } });
  if (!term) {
    term = await prisma.term.create({
      data: {
        name: 'TERM_1',
        termNumber: 1,
        startDate: new Date('2088-01-08'),
        endDate: new Date('2088-04-05'),
        academicYearId,
        schoolId,
      },
    });
  }
  termId = term.id;

  // ── Two students ─────────────────────────────────────────────────────────
  const s1 = await prisma.student.upsert({
    where: { admissionNo: 'FEE-STU-001' },
    update: { schoolId },
    create: {
      admissionNo: 'FEE-STU-001',
      firstName: 'Fee',
      lastName: 'Student1',
      gender: 'MALE',
      schoolId,
    },
  });
  studentId = s1.id;

  const s2 = await prisma.student.upsert({
    where: { admissionNo: 'FEE-STU-002' },
    update: { schoolId },
    create: {
      admissionNo: 'FEE-STU-002',
      firstName: 'Fee',
      lastName: 'Student2',
      gender: 'FEMALE',
      schoolId,
    },
  });
  studentId2 = s2.id;

  // ── Admin login ──────────────────────────────────────────────────────────
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'feeadmin@school.com', password: 'admin123' });
  adminToken = res.body.token;
});

afterAll(async () => {
  await prisma.feePayment.deleteMany();
  await prisma.feeInvoiceItem.deleteMany();
  await prisma.feeInvoice.deleteMany();
  await prisma.feeItem.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.$disconnect();
});

// ══════════════════════════════════════════════════════════════════════════════
// A. FEE STRUCTURES
// ══════════════════════════════════════════════════════════════════════════════

describe('A – Fee Structures', () => {
  test('Create fee structure with items', async () => {
    const res = await request(app)
      .post('/api/v1/fees/structures')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Form 1 – Term 1 2088',
        academicYearId,
        termId,
        classLevel: '1',
        currency: 'KES',
        items: [
          { name: 'Tuition Fee', category: 'TUITION', amount: 15000, isOptional: false },
          { name: 'Activity Fee', category: 'ACTIVITY', amount: 2000, isOptional: true },
          { name: 'Exam Fee', category: 'EXAM', amount: 1500, isOptional: false },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Form 1 – Term 1 2088');
    expect(res.body.data.items).toHaveLength(3);

    structureId = res.body.data.id;
    itemId = res.body.data.items.find((i: any) => i.category === 'ACTIVITY').id;
  });

  test('Fetch fee structures list', async () => {
    const res = await request(app)
      .get('/api/v1/fees/structures')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ academicYearId });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('Fetch fee structure by ID includes items and invoice count', async () => {
    const res = await request(app)
      .get(`/api/v1/fees/structures/${structureId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(3);
    expect(res.body.data._count.invoices).toBe(0);
  });

  test('Add a fee item to existing structure', async () => {
    const res = await request(app)
      .post(`/api/v1/fees/structures/${structureId}/items`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Library Fee', category: 'LIBRARY', amount: 500, isOptional: false });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Library Fee');
  });

  test('Update a fee item amount', async () => {
    const res = await request(app)
      .patch(`/api/v1/fees/items/${itemId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 2500 });

    expect(res.status).toBe(200);
    expect(Number(res.body.data.amount)).toBe(2500);
  });

  test('Update fee structure name', async () => {
    const res = await request(app)
      .patch(`/api/v1/fees/structures/${structureId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Form 1 – Term 1 2088 (Revised)' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Form 1 – Term 1 2088 (Revised)');
  });

  test('Reject invalid fee structure (no items)', async () => {
    const res = await request(app)
      .post('/api/v1/fees/structures')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bad', academicYearId, items: [] });

    expect(res.status).toBe(422);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// B. INVOICES
// ══════════════════════════════════════════════════════════════════════════════

describe('B – Invoices', () => {
  test('Generate invoice for student 1', async () => {
    const res = await request(app)
      .post('/api/v1/fees/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId,
        feeStructureId: structureId,
        discountAmount: 1000,
        waivers: [{ feeItemId: itemId, waiverNote: 'Day student – activity fee waived' }],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.invoiceNo).toMatch(/^INV/);
    expect(res.body.data.status).toBe('UNPAID');

    // totalAmount = 15000 + 2500(updated) + 1500 + 500(library) = 19500
    // Activity (itemId) is waived so total should exclude it
    // total = 15000 + 1500 + 500 = 17000, discount 1000 → balance 16000
    expect(Number(res.body.data.totalAmount)).toBe(17000);
    expect(Number(res.body.data.discountAmount)).toBe(1000);
    expect(Number(res.body.data.balanceAmount)).toBe(16000);

    invoiceId = res.body.data.id;
  });

  test('Duplicate invoice for same student + structure is rejected', async () => {
    const res = await request(app)
      .post('/api/v1/fees/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId, feeStructureId: structureId });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('Bulk generate invoices skips existing, creates new', async () => {
    const res = await request(app)
      .post('/api/v1/fees/invoices/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        feeStructureId: structureId,
        studentIds: [studentId, studentId2], // student1 already has one
      });

    expect(res.status).toBe(201);
    expect(res.body.data.generated).toBe(1);  // only student2
    expect(res.body.data.skipped).toBe(1);    // student1 skipped

    invoiceId2 = res.body.data.invoices[0].id;
  });

  test('List invoices filtered by studentId', async () => {
    const res = await request(app)
      .get('/api/v1/fees/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ studentId });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(invoiceId);
  });

  test('Fetch invoice by ID includes items and payment history', async () => {
    const res = await request(app)
      .get(`/api/v1/fees/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.payments).toBeDefined();
    // Waived item has amount 0
    const waived = res.body.data.items.find((i: any) => i.isWaived);
    expect(waived).toBeDefined();
    expect(Number(waived.amount)).toBe(0);
  });

  test('Update invoice due date and notes', async () => {
    const res = await request(app)
      .patch(`/api/v1/fees/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ dueDate: '2088-02-28T00:00:00Z', notes: 'Please pay on time' });

    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe('Please pay on time');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// C. PAYMENTS
// ══════════════════════════════════════════════════════════════════════════════

describe('C – Payments', () => {
  test('Record partial M-Pesa payment', async () => {
    const res = await request(app)
      .post('/api/v1/fees/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        invoiceId,
        amount: 8000,
        method: 'MPESA',
        mpesaCode: 'QWE123456',
        notes: 'First instalment',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.receiptNo).toMatch(/^RCT/);
    expect(Number(res.body.data.amount)).toBe(8000);

    paymentId = res.body.data.id;

    // Invoice should now be PARTIAL
    const inv = await prisma.feeInvoice.findUnique({ where: { id: invoiceId } });
    expect(inv?.status).toBe('PARTIAL');
    expect(Number(inv?.paidAmount)).toBe(8000);
    expect(Number(inv?.balanceAmount)).toBe(8000); // 16000 - 8000
  });

  test('Record second cash payment clearing the balance', async () => {
    const res = await request(app)
      .post('/api/v1/fees/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ invoiceId, amount: 8000, method: 'CASH' });

    expect(res.status).toBe(201);

    const inv = await prisma.feeInvoice.findUnique({ where: { id: invoiceId } });
    expect(inv?.status).toBe('PAID');
    expect(Number(inv?.balanceAmount)).toBe(0);
  });

  test('Overpayment is rejected', async () => {
    // Invoice is already PAID — this also tests the "PAID" guard
    const res = await request(app)
      .post('/api/v1/fees/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ invoiceId, amount: 100, method: 'CASH' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already fully paid/i);
  });

  test('Reverse a payment restores invoice balance', async () => {
    const res = await request(app)
      .patch(`/api/v1/fees/payments/${paymentId}/reverse`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'M-Pesa transaction error — refunded' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('REVERSED');

    // Invoice goes back to PARTIAL
    const inv = await prisma.feeInvoice.findUnique({ where: { id: invoiceId } });
    expect(inv?.status).toBe('PARTIAL');
    expect(Number(inv?.paidAmount)).toBe(8000);  // only second payment remains
    expect(Number(inv?.balanceAmount)).toBe(8000);
  });

  test('List payments filtered by method', async () => {
    const res = await request(app)
      .get('/api/v1/fees/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ method: 'MPESA' });

    expect(res.status).toBe(200);
    expect(res.body.data.every((p: any) => p.method === 'MPESA')).toBe(true);
  });

  test('Fetch payment by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/fees/payments/${paymentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('REVERSED');
  });

  test('M-Pesa payment without code is rejected', async () => {
    const res = await request(app)
      .post('/api/v1/fees/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ invoiceId: invoiceId2, amount: 5000, method: 'MPESA' }); // no mpesaCode

    expect(res.status).toBe(422);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// D & E. INVOICE CANCELLATION
// ══════════════════════════════════════════════════════════════════════════════

describe('D & E – Invoice Cancellation', () => {
  let cancelableInvoiceId: string;

  test('D: Cancel invoice with no payments', async () => {
    // Create a fresh student + invoice for clean cancel test
    const student = await prisma.student.create({
      data: {
        admissionNo: 'FEE-STU-003',
        firstName: 'Cancel',
        lastName: 'Test',
        gender: 'MALE',
        schoolId,
      },
    });

    const inv = await prisma.feeInvoice.create({
      data: {
        invoiceNo: 'INV/TEST/CANCEL',
        studentId: student.id,
        feeStructureId: structureId,
        academicYearId,
        schoolId,
        status: 'UNPAID',
        totalAmount: new Decimal(5000),
        discountAmount: new Decimal(0),
        paidAmount: new Decimal(0),
        balanceAmount: new Decimal(5000),
      },
    });
    cancelableInvoiceId = inv.id;

    const res = await request(app)
      .patch(`/api/v1/fees/invoices/${cancelableInvoiceId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  test('E: Cancel invoice with payments is blocked', async () => {
    // invoiceId still has one CASH payment on it
    const res = await request(app)
      .patch(`/api/v1/fees/invoices/${invoiceId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/reverse the payments first/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// F. REPORTS
// ══════════════════════════════════════════════════════════════════════════════

describe('F – Reports', () => {
  test('Fee collection report returns summary and daily trend', async () => {
    const res = await request(app)
      .get('/api/v1/fees/reports/collection')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ academicYearId });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalBilled');
    expect(res.body.data).toHaveProperty('totalCollected');
    expect(res.body.data).toHaveProperty('collectionRate');
    expect(Array.isArray(res.body.data.dailyCollection)).toBe(true);
    expect(res.body.data).toHaveProperty('byPaymentMethod');
  });

  test('Defaulters report lists students with outstanding balances', async () => {
    const res = await request(app)
      .get('/api/v1/fees/reports/defaulters')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ academicYearId });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // invoiceId2 (student2) has no payments — should appear
    const defaulter = res.body.data.find((d: any) => d.studentId === studentId2);
    expect(defaulter).toBeDefined();
    expect(defaulter.outstandingBalance).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// G. VALIDATION EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe('G – Validation', () => {
  test('Negative payment amount rejected', async () => {
    const res = await request(app)
      .post('/api/v1/fees/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ invoiceId: invoiceId2, amount: -500, method: 'CASH' });

    expect(res.status).toBe(422);
  });

  test('Zero-amount fee item rejected', async () => {
    const res = await request(app)
      .post('/api/v1/fees/structures')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bad Structure',
        academicYearId,
        items: [{ name: 'Zero', category: 'TUITION', amount: 0 }],
      });

    expect(res.status).toBe(422);
  });

  test('Fee structure with missing academicYearId rejected', async () => {
    const res = await request(app)
      .post('/api/v1/fees/structures')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'No Year',
        items: [{ name: 'Tuition', category: 'TUITION', amount: 5000 }],
      });

    expect(res.status).toBe(422);
  });
});