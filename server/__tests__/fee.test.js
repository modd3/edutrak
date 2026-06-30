"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const client_1 = __importDefault(require("../src/database/client"));
const hash_1 = require("../src/utils/hash");
const library_1 = require("@prisma/client/runtime/library");
let adminToken;
let schoolId;
let academicYearId;
let termId;
let studentId;
let studentId2;
let structureId;
let itemId;
let invoiceId;
let invoiceId2;
let paymentId;
beforeAll(async () => {
    await client_1.default.feePayment.deleteMany();
    await client_1.default.feeInvoiceItem.deleteMany();
    await client_1.default.feeInvoice.deleteMany();
    await client_1.default.feeItem.deleteMany();
    await client_1.default.feeStructure.deleteMany();
    const adminPw = await (0, hash_1.hashPassword)('admin123');
    let school = await client_1.default.school.findFirst({ where: { knecCode: 'FEE001' } });
    if (!school) {
        school = await client_1.default.school.create({
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
    const adminUser = await client_1.default.user.upsert({
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
    let ay = await client_1.default.academicYear.findFirst({ where: { year: 8888, schoolId } });
    if (!ay) {
        ay = await client_1.default.academicYear.create({
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
    let term = await client_1.default.term.findFirst({ where: { academicYearId, termNumber: 1 } });
    if (!term) {
        term = await client_1.default.term.create({
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
    const s1 = await client_1.default.student.upsert({
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
    const s2 = await client_1.default.student.upsert({
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
    const res = await (0, supertest_1.default)(app_1.default)
        .post('/api/v1/auth/login')
        .send({ email: 'feeadmin@school.com', password: 'admin123' });
    adminToken = res.body.token;
});
afterAll(async () => {
    await client_1.default.feePayment.deleteMany();
    await client_1.default.feeInvoiceItem.deleteMany();
    await client_1.default.feeInvoice.deleteMany();
    await client_1.default.feeItem.deleteMany();
    await client_1.default.feeStructure.deleteMany();
    await client_1.default.$disconnect();
});
describe('A – Fee Structures', () => {
    test('Create fee structure with items', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
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
        itemId = res.body.data.items.find((i) => i.category === 'ACTIVITY').id;
    });
    test('Fetch fee structures list', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/v1/fees/structures')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({ academicYearId });
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
    });
    test('Fetch fee structure by ID includes items and invoice count', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/v1/fees/structures/${structureId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.items).toHaveLength(3);
        expect(res.body.data._count.invoices).toBe(0);
    });
    test('Add a fee item to existing structure', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/v1/fees/structures/${structureId}/items`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Library Fee', category: 'LIBRARY', amount: 500, isOptional: false });
        expect(res.status).toBe(201);
        expect(res.body.data.name).toBe('Library Fee');
    });
    test('Update a fee item amount', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/v1/fees/items/${itemId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ amount: 2500 });
        expect(res.status).toBe(200);
        expect(Number(res.body.data.amount)).toBe(2500);
    });
    test('Update fee structure name', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/v1/fees/structures/${structureId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Form 1 – Term 1 2088 (Revised)' });
        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe('Form 1 – Term 1 2088 (Revised)');
    });
    test('Reject invalid fee structure (no items)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/fees/structures')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Bad', academicYearId, items: [] });
        expect(res.status).toBe(422);
    });
});
describe('B – Invoices', () => {
    test('Generate invoice for student 1', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
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
        expect(Number(res.body.data.totalAmount)).toBe(17000);
        expect(Number(res.body.data.discountAmount)).toBe(1000);
        expect(Number(res.body.data.balanceAmount)).toBe(16000);
        invoiceId = res.body.data.id;
    });
    test('Duplicate invoice for same student + structure is rejected', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/fees/invoices')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ studentId, feeStructureId: structureId });
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/already exists/i);
    });
    test('Bulk generate invoices skips existing, creates new', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/fees/invoices/bulk')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            feeStructureId: structureId,
            studentIds: [studentId, studentId2],
        });
        expect(res.status).toBe(201);
        expect(res.body.data.generated).toBe(1);
        expect(res.body.data.skipped).toBe(1);
        invoiceId2 = res.body.data.invoices[0].id;
    });
    test('List invoices filtered by studentId', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/v1/fees/invoices')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({ studentId });
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].id).toBe(invoiceId);
    });
    test('Fetch invoice by ID includes items and payment history', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/v1/fees/invoices/${invoiceId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.items).toBeDefined();
        expect(res.body.data.payments).toBeDefined();
        const waived = res.body.data.items.find((i) => i.isWaived);
        expect(waived).toBeDefined();
        expect(Number(waived.amount)).toBe(0);
    });
    test('Update invoice due date and notes', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/v1/fees/invoices/${invoiceId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ dueDate: '2088-02-28T00:00:00Z', notes: 'Please pay on time' });
        expect(res.status).toBe(200);
        expect(res.body.data.notes).toBe('Please pay on time');
    });
});
describe('C – Payments', () => {
    test('Record partial M-Pesa payment', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
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
        const inv = await client_1.default.feeInvoice.findUnique({ where: { id: invoiceId } });
        expect(inv?.status).toBe('PARTIAL');
        expect(Number(inv?.paidAmount)).toBe(8000);
        expect(Number(inv?.balanceAmount)).toBe(8000);
    });
    test('Record second cash payment clearing the balance', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/fees/payments')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ invoiceId, amount: 8000, method: 'CASH' });
        expect(res.status).toBe(201);
        const inv = await client_1.default.feeInvoice.findUnique({ where: { id: invoiceId } });
        expect(inv?.status).toBe('PAID');
        expect(Number(inv?.balanceAmount)).toBe(0);
    });
    test('Overpayment is rejected', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/fees/payments')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ invoiceId, amount: 100, method: 'CASH' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already fully paid/i);
    });
    test('Reverse a payment restores invoice balance', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/v1/fees/payments/${paymentId}/reverse`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ reason: 'M-Pesa transaction error — refunded' });
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('REVERSED');
        const inv = await client_1.default.feeInvoice.findUnique({ where: { id: invoiceId } });
        expect(inv?.status).toBe('PARTIAL');
        expect(Number(inv?.paidAmount)).toBe(8000);
        expect(Number(inv?.balanceAmount)).toBe(8000);
    });
    test('List payments filtered by method', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/v1/fees/payments')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({ method: 'MPESA' });
        expect(res.status).toBe(200);
        expect(res.body.data.every((p) => p.method === 'MPESA')).toBe(true);
    });
    test('Fetch payment by ID', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/v1/fees/payments/${paymentId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('REVERSED');
    });
    test('M-Pesa payment without code is rejected', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/fees/payments')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ invoiceId: invoiceId2, amount: 5000, method: 'MPESA' });
        expect(res.status).toBe(422);
    });
});
describe('D & E – Invoice Cancellation', () => {
    let cancelableInvoiceId;
    test('D: Cancel invoice with no payments', async () => {
        const student = await client_1.default.student.create({
            data: {
                admissionNo: 'FEE-STU-003',
                firstName: 'Cancel',
                lastName: 'Test',
                gender: 'MALE',
                schoolId,
            },
        });
        const inv = await client_1.default.feeInvoice.create({
            data: {
                invoiceNo: 'INV/TEST/CANCEL',
                studentId: student.id,
                feeStructureId: structureId,
                academicYearId,
                schoolId,
                status: 'UNPAID',
                totalAmount: new library_1.Decimal(5000),
                discountAmount: new library_1.Decimal(0),
                paidAmount: new library_1.Decimal(0),
                balanceAmount: new library_1.Decimal(5000),
            },
        });
        cancelableInvoiceId = inv.id;
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/v1/fees/invoices/${cancelableInvoiceId}/cancel`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('CANCELLED');
    });
    test('E: Cancel invoice with payments is blocked', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/v1/fees/invoices/${invoiceId}/cancel`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/reverse the payments first/i);
    });
});
describe('F – Reports', () => {
    test('Fee collection report returns summary and daily trend', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
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
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/v1/fees/reports/defaulters')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({ academicYearId });
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        const defaulter = res.body.data.find((d) => d.studentId === studentId2);
        expect(defaulter).toBeDefined();
        expect(defaulter.outstandingBalance).toBeGreaterThan(0);
    });
});
describe('G – Validation', () => {
    test('Negative payment amount rejected', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/fees/payments')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ invoiceId: invoiceId2, amount: -500, method: 'CASH' });
        expect(res.status).toBe(422);
    });
    test('Zero-amount fee item rejected', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
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
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/fees/structures')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            name: 'No Year',
            items: [{ name: 'Tuition', category: 'TUITION', amount: 5000 }],
        });
        expect(res.status).toBe(422);
    });
});
//# sourceMappingURL=fee.test.js.map