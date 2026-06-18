import { Prisma } from '@prisma/client';
import prisma from '../../database/client';

export interface FeeAnalyticsFilters {
  schoolId: string;
  from?: Date;
  to?: Date;
  academicYearId?: string;
  termId?: string;
}

export interface CollectionTrend {
  date: string;
  billed: number;
  collected: number;
  pending: number;
  methodBreakdown: Record<string, number>;
}

export interface PaymentMethodStats {
  method: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface DefaulterStat {
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  overdueDays: number;
}

export interface RevenueForecast {
  month: string;
  projected: number;
  actual: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface FeeAnalyticsSummary {
  totalBilled: number;
  totalCollected: number;
  collectionRate: number;
  outstandingBalance: number;
  overdueAmount: number;
  averagePaymentTime: number; // days
  topPaymentMethods: PaymentMethodStats[];
  trend: CollectionTrend[];
  defaulters: DefaulterStat[];
  forecast: RevenueForecast[];
}

class FeeAnalyticsService {
  /**
   * Get comprehensive fee analytics for a school
   */
  async getAnalytics(filters: FeeAnalyticsFilters): Promise<FeeAnalyticsSummary> {
    const { schoolId, from, to, academicYearId, termId } = filters;

    const dateFilter: Prisma.FeeInvoiceWhereInput = {
      schoolId,
      ...(academicYearId && { academicYearId }),
      ...(termId && { termId }),
      ...(from && { issuedAt: { gte: from } }),
      ...(to && { issuedAt: { lte: to } }),
    };

    // Get all invoices in range
    const invoices = await prisma.feeInvoice.findMany({
      where: dateFilter,
      include: {
        payments: {
          where: { status: 'COMPLETED' },
        },
        student: {
          include: {
            enrollments: {
              where: { status: 'ACTIVE' },
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    // Calculate summary metrics
    const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
    const outstandingBalance = invoices.reduce((sum, inv) => sum + Number(inv.balanceAmount), 0);
    const overdueAmount = invoices
      .filter(inv => inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + Number(inv.balanceAmount), 0);

    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

    // Average payment time (days from issue to first payment)
    const paidInvoices = invoices.filter(inv => inv.payments.length > 0);
    const avgPaymentTime = paidInvoices.length > 0
      ? paidInvoices.reduce((sum, inv) => {
          const firstPayment = inv.payments[0];
          const days = (firstPayment.paidAt.getTime() - inv.issuedAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / paidInvoices.length
      : 0;

    // Payment method breakdown
    const allPayments = await prisma.feePayment.findMany({
      where: {
        invoice: { schoolId },
        status: 'COMPLETED',
        ...(from && { paidAt: { gte: from } }),
        ...(to && { paidAt: { lte: to } }),
      },
      select: {
        method: true,
        amount: true,
      },
    });

    const methodMap = new Map<string, { count: number; total: number }>();
    allPayments.forEach(p => {
      const current = methodMap.get(p.method) || { count: 0, total: 0 };
      methodMap.set(p.method, {
        count: current.count + 1,
        total: current.total + Number(p.amount),
      });
    });

    const topPaymentMethods: PaymentMethodStats[] = Array.from(methodMap.entries())
      .map(([method, data]) => ({
        method,
        count: data.count,
        totalAmount: data.total,
        percentage: totalCollected > 0 ? (data.total / totalCollected) * 100 : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Collection trend (daily)
    const trend = await this.getCollectionTrend(schoolId, from, to);

    // Defaulters
    const defaulters = await this.getDefaulters(schoolId, academicYearId, termId);

    // Revenue forecast
    const forecast = await this.getRevenueForecast(schoolId);

    return {
      totalBilled,
      totalCollected,
      collectionRate,
      outstandingBalance,
      overdueAmount,
      averagePaymentTime: Math.round(avgPaymentTime),
      topPaymentMethods,
      trend,
      defaulters,
      forecast,
    };
  }

  /**
   * Get daily collection trend
   */
  private async getCollectionTrend(
    schoolId: string,
    from?: Date,
    to?: Date
  ): Promise<CollectionTrend[]> {
    const payments = await prisma.feePayment.findMany({
      where: {
        invoice: { schoolId },
        status: 'COMPLETED',
        ...(from && { paidAt: { gte: from } }),
        ...(to && { paidAt: { lte: to } }),
      },
      include: {
        invoice: true,
      },
    });

    // Group by date
    const dateMap = new Map<string, {
      collected: number;
      methods: Map<string, number>;
    }>();

    payments.forEach(p => {
      const dateKey = p.paidAt.toISOString().split('T')[0];
      const current = dateMap.get(dateKey) || { collected: 0, methods: new Map() };
      
      current.collected += Number(p.amount);
      const methodTotal = current.methods.get(p.method) || 0;
      current.methods.set(p.method, methodTotal + Number(p.amount));
      
      dateMap.set(dateKey, current);
    });

    // Convert to array and fill in missing dates
    const result: CollectionTrend[] = [];
    const startDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to || new Date();
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const data = dateMap.get(dateKey) || { collected: 0, methods: new Map() };
      
      const methodBreakdown: Record<string, number> = {};
      data.methods.forEach((amount, method) => {
        methodBreakdown[method] = amount;
      });

      result.push({
        date: dateKey,
        billed: 0, // Would need invoice issuance data
        collected: data.collected,
        pending: 0,
        methodBreakdown,
      });
    }

    return result;
  }

  /**
   * Get top defaulters
   */
  private async getDefaulters(
    schoolId: string,
    academicYearId?: string,
    termId?: string
  ): Promise<DefaulterStat[]> {
    const invoices = await prisma.feeInvoice.findMany({
      where: {
        schoolId,
        status: { in: ['OVERDUE', 'PARTIAL'] },
        balanceAmount: { gt: 0 },
        ...(academicYearId && { academicYearId }),
        ...(termId && { termId }),
      },
      include: {
        student: {
          include: {
            enrollments: {
              where: { status: 'ACTIVE' },
              include: { class: true },
            },
          },
        },
      },
      orderBy: {
        balanceAmount: 'desc',
      },
      take: 50,
    });

    return invoices.map(inv => {
      const activeClass = inv.student.enrollments[0];
      const overdueDays = inv.dueDate
        ? Math.floor((Date.now() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        studentId: inv.studentId,
        admissionNo: inv.student.admissionNo,
        studentName: `${inv.student.firstName} ${inv.student.lastName}`,
        className: activeClass?.class.name || 'Unknown',
        totalInvoiced: Number(inv.totalAmount),
        totalPaid: Number(inv.paidAmount),
        balance: Number(inv.balanceAmount),
        overdueDays: Math.max(0, overdueDays),
      };
    });
  }

  /**
   * Get revenue forecast based on historical data
   */
  private async getRevenueForecast(schoolId: string): Promise<RevenueForecast[]> {
    // Get last 6 months of data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const historicalPayments = await prisma.feePayment.findMany({
      where: {
        invoice: { schoolId },
        status: 'COMPLETED',
        paidAt: { gte: sixMonthsAgo },
      },
      select: {
        amount: true,
        paidAt: true,
      },
    });

    // Group by month
    const monthlyData = new Map<string, number>();
    historicalPayments.forEach(p => {
      const monthKey = p.paidAt.toISOString().substring(0, 7); // YYYY-MM
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + Number(p.amount));
    });

    // Calculate average and project next 3 months
    const values = Array.from(monthlyData.values());
    const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const stdDev = values.length > 1
      ? Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length)
      : avg * 0.2;

    const forecast: RevenueForecast[] = [];
    const confidence: ('HIGH' | 'MEDIUM' | 'LOW')[] = ['HIGH', 'MEDIUM', 'LOW'];

    for (let i = 1; i <= 3; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthKey = date.toISOString().substring(0, 7);
      
      forecast.push({
        month: monthKey,
        projected: Math.round(avg),
        actual: 0,
        confidence: confidence[i - 1],
      });
    }

    return forecast;
  }

  /**
   * Get cash flow report (money in vs money out)
   */
  async getCashFlowReport(filters: FeeAnalyticsFilters) {
    const { schoolId, from, to } = filters;

    const payments = await prisma.feePayment.findMany({
      where: {
        invoice: { schoolId },
        status: 'COMPLETED',
        ...(from && { paidAt: { gte: from } }),
        ...(to && { paidAt: { lte: to } }),
      },
    });

    const totalInflow = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Group by month
    const monthlyInflow = new Map<string, number>();
    payments.forEach(p => {
      const month = p.paidAt.toISOString().substring(0, 7);
      monthlyInflow.set(month, (monthlyInflow.get(month) || 0) + Number(p.amount));
    });

    return {
      totalInflow,
      totalOutflow: 0, // Would track expenses if needed
      netCashFlow: totalInflow,
      monthlyBreakdown: Array.from(monthlyInflow.entries()).map(([month, amount]) => ({
        month,
        inflow: amount,
        outflow: 0,
        net: amount,
      })),
    };
  }

  /**
   * Detect anomalies in payment patterns
   */
  async detectAnomalies(schoolId: string, days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const payments = await prisma.feePayment.findMany({
      where: {
        invoice: { schoolId },
        status: 'COMPLETED',
        paidAt: { gte: since },
      },
      select: {
        amount: true,
        paidAt: true,
        method: true,
        invoiceId: true,
      },
    });

    const anomalies: any[] = [];

    // Calculate average payment amount
    const amounts = payments.map(p => Number(p.amount));
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length);

    // Detect unusually large payments (>3 std dev)
    payments.forEach(p => {
      if (Math.abs(Number(p.amount) - avg) > 3 * stdDev) {
        anomalies.push({
          type: 'UNUSUALLY_LARGE',
          paymentId: p.invoiceId,
          amount: Number(p.amount),
          average: avg,
          deviation: Math.abs(Number(p.amount) - avg) / stdDev,
          date: p.paidAt,
        });
      }
    });

    // Detect duplicate amounts on same day (possible double payment)
    const amountDateMap = new Map<string, typeof payments>();
    payments.forEach(p => {
      const key = `${Number(p.amount)}-${p.paidAt.toISOString().split('T')[0]}`;
      const existing = amountDateMap.get(key) || [];
      existing.push(p);
      amountDateMap.set(key, existing);
    });

    amountDateMap.forEach((group, key) => {
      if (group.length > 1) {
        anomalies.push({
          type: 'POSSIBLE_DUPLICATE',
          amount: Number(group[0].amount),
          date: group[0].paidAt,
          count: group.length,
          paymentIds: group.map(p => p.invoiceId),
        });
      }
    });

    return anomalies;
  }
}

export const feeAnalyticsService = new FeeAnalyticsService();

