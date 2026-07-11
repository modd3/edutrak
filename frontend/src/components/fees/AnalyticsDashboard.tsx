/**
 * Fee Analytics Dashboard
 * Displays collection metrics, payment method breakdown, defaulters, anomalies, and cash-flow.
 * Data comes from the /fees/analytics endpoint via useGetAnalytics hook (raw axios).
 */

import { useGetAnalytics, useGetCashFlowReport, useDetectAnomalies } from '@/hooks/use-fees';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Users,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function AnalyticsDashboard() {
  // Hooks now return the payload directly (unwrapped in use-fees.ts)
  const { data, isLoading: analyticsLoading } = useGetAnalytics();
  const { data: cashFlow, isLoading: cashFlowLoading } = useGetCashFlowReport();
  const { data: anomalies } = useDetectAnomalies({ days: 30 });

  if (analyticsLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 text-center space-y-3">
        <BarChart3 className="h-12 w-12 mx-auto opacity-30" />
        <p className="text-muted-foreground font-medium">No analytics data available</p>
        <p className="text-sm text-muted-foreground">
          Analytics appear once invoices and payments have been recorded for the current academic year.
        </p>
      </div>
    );
  }

  // Prepare charts
  const methodChartData = (data.topPaymentMethods ?? []).map((m: any) => ({
    method: m.method?.replace(/_/g, ' '),
    amount: Number(m.totalAmount ?? 0),
    count: m.count ?? 0,
    pct: Number(m.percentage ?? 0).toFixed(1),
  }));

  const trendChartData = (data.trend ?? []).map((t: any) => ({
    date: t.date,
    billed: Number(t.billed ?? 0),
    collected: Number(t.collected ?? 0),
    pending: Number(t.pending ?? 0),
  }));

  const cashFlowChartData = cashFlow
    ? (cashFlow.monthly ?? []).map((m: any) => ({
        month: m.month,
        inflow: Number(m.inflow ?? 0),
        outflow: Number(m.outflow ?? 0),
        net: Number(m.net ?? 0),
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(data.totalBilled ?? 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All-time invoiced amount</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(Number(data.totalCollected ?? 0))}
            </div>
            <p className="text-xs text-green-700 dark:text-green-400 mt-1">
              {Number(data.collectionRate ?? 0).toFixed(1)}% collection rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(Number(data.outstandingBalance ?? 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pending collection</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(Number(data.overdueAmount ?? 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg. {Number(data.averagePaymentTime ?? 0).toFixed(0)} days to pay
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Collections by payment channel</CardDescription>
          </CardHeader>
          <CardContent>
            {methodChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={methodChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="method" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <BarChart3 className="h-8 w-8 opacity-30" />
                <p className="text-sm">No payment method data</p>
              </div>
            )}
            {methodChartData.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {methodChartData.map((m: any) => (
                  <div key={m.method} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{m.method}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatCurrency(m.amount)}</span>
                      <Badge variant="secondary" className="text-xs">{m.pct}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Defaulters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-red-500" />
              Top Defaulters
            </CardTitle>
            <CardDescription>Students with highest outstanding balances</CardDescription>
          </CardHeader>
          <CardContent>
            {(data.defaulters ?? []).length > 0 ? (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {(data.defaulters ?? []).slice(0, 10).map((defaulter: any) => (
                  <div
                    key={defaulter.studentId}
                    className="flex justify-between items-center text-sm py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{defaulter.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {defaulter.className} • {defaulter.admissionNo}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-red-600">
                        {formatCurrency(Number(defaulter.balance ?? 0))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {defaulter.overdueDays ?? 0} days overdue
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 opacity-30 text-green-500" />
                <p className="text-sm font-medium text-green-600">No defaulters — all balances settled</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Collection Trend */}
      {trendChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Collection Trend</CardTitle>
            <CardDescription>Billed vs collected over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(v as number)} />
                <Legend />
                <Line type="monotone" dataKey="billed" stroke="#3b82f6" name="Billed" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="collected" stroke="#10b981" name="Collected" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" name="Pending" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Cash Flow */}
      {cashFlowChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
            <CardDescription>Monthly inflow and net position</CardDescription>
          </CardHeader>
          <CardContent>
            {cashFlowLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cashFlowChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                  <Legend />
                  <Bar dataKey="inflow" fill="#10b981" name="Inflow" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="net" fill="#3b82f6" name="Net" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <Card className="border-yellow-300 dark:border-yellow-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Detected Anomalies
            </CardTitle>
            <CardDescription>Unusual patterns in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {anomalies.map((anomaly: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-3 text-sm bg-yellow-50 dark:bg-yellow-950">
                  <p className="font-medium">{anomaly.type}</p>
                  <p className="text-muted-foreground mt-0.5">
                    Amount: {formatCurrency(Number(anomaly.amount ?? 0))} •{' '}
                    Date: {new Date(anomaly.date).toLocaleDateString('en-KE')}
                  </p>
                  {anomaly.description && (
                    <p className="text-xs text-muted-foreground mt-1">{anomaly.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
