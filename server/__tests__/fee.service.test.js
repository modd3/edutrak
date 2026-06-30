"use strict";
describe('Fee Calculation Utilities', () => {
    describe('Minor Currency Unit Conversion (KES Cents)', () => {
        const toMinor = (amount) => Math.round(amount * 100);
        const toMajor = (minor) => minor / 100;
        it('should correctly convert major currency units to minor units', () => {
            expect(toMinor(15000)).toBe(1500000);
            expect(toMinor(2500.5)).toBe(250050);
            expect(toMinor(0)).toBe(0);
        });
        it('should correctly convert minor currency units back to major units', () => {
            expect(toMajor(1500000)).toBe(15000);
            expect(toMajor(250050)).toBe(2500.5);
            expect(toMajor(0)).toBe(0);
        });
    });
    describe('Fee Balance & Overdue Computations', () => {
        const calculateBalance = (totalAmount, paidAmount) => {
            const balance = totalAmount - paidAmount;
            return {
                balance: Math.max(0, balance),
                status: balance <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID',
            };
        };
        it('should correctly identify fully paid invoices', () => {
            const result = calculateBalance(50000, 50000);
            expect(result.balance).toBe(0);
            expect(result.status).toBe('PAID');
        });
        it('should correctly compute partial fee balances', () => {
            const result = calculateBalance(50000, 20000);
            expect(result.balance).toBe(30000);
            expect(result.status).toBe('PARTIAL');
        });
        it('should handle overpayments gracefully without negative balance', () => {
            const result = calculateBalance(50000, 60000);
            expect(result.balance).toBe(0);
            expect(result.status).toBe('PAID');
        });
    });
});
//# sourceMappingURL=fee.service.test.js.map