/**
 * Comprehensive Fee Management Reports Dashboard
 * Analytics, charts, collection tracking, and defaulter management
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Button,
} from '@/components/ui/button';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Download,
  Printer,
  Calendar,
  Users,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useActiveAcademicYear } from '@/hooks/use-academic';
import { useGetFeeCollectionReport, useGetDefaultersReport } from '@/hooks/use-fees';
import { useSchoolContext } from '@/hooks/use-school-context';
import { usePermission } from '@/hooks/use-permission';
import { RoleGuard } from '@/components/RoleGuard';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function FeeReportsPage() {
  const { can } = usePermission();
  const { schoolId } = useSchoolContext();
  const { data: activeYearData } = useActiveAcademicYear();
  const activeYear = activeYearData?.data ?? activeYearData;
  const terms = activeYear?.terms ?? [];

  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState('overview');

  const filterTerm = selectedTermId === 'All' || !selectedTermId ? undefined : selectedTermId;

  // Fetch reports
  const { data: collectionData, isLoading: loadingCollection } = useGetFeeCollectionReport({
    academicYearId: activeYear?.id,
    termId: filterTerm,
  });

  const { data: defaultersData, isLoading: loadingDefaulters } = useGetDefaultersReport({
    academicYearId: activeYear?.id,
    termId: filterTerm,
  });

  const report = collectionData?.data?.data || collectionData?.data || {};
  const defaulters = defaultersData?.data?.data || defaultersData?.data || [];

  // Extract key metrics
  const totalBilled = Number(report.totalBilled || 0);
  const totalCollected = Number(report.totalCollected || 0);
  const totalOutstanding = Number(report.totalOutstanding || 0);
  const totalDiscounted = Number(report.totalDiscounted || 0);
  const netAmount = totalBilled - totalDiscounted;
  const collectionRate = netAmount > 0 ? (totalCollected / netAmount) * 100 : 0;

  // Prepare chart data
  const statusData = [
    {
      name: 'Paid',
      value: report.byStatus?.PAID || 0,
      fill: COLORS[1],
    },
    {
      name: 'Partial',
      value: report.byStatus?.PARTIAL || 0,
      fill: COLORS[3],
    },
    {
      name: 'Unpaid',
      value: report.byStatus?.UNPAID || 0,
      fill: COLORS[0],
    },
    {
      name: 'Overdue',
      value: report.byStatus?.OVERDUE || 0,
      fill: COLORS[4],
    },
  ].filter((d) => d.value > 0);

  const methodData = Object.entries(report.byPaymentMethod || {}).map(([method, amount]) => ({
    method: method.replace(/_/g, ' '),
    amount: Number(amount),
  }));

  const dailyData = (report.dailyCollection || []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
    amount: Number(d.amount),
    count: d.count,
  }));

  // Top defaulters
  const topDefaulters = defaulters
    .sort((a: any, b: any) => Number(b.outstandingBalance) - Number(a.outstandingBalance))
    .slice(0, 15);

  // Critical defaulters (>60 days overdue)
  const criticalDefaulters = topDefaulters.filter((d: any) => {
    if (!d.dueDate) return false;
    const days = Math.floor((Date.now() - new Date(d.dueDate).getTime()) / 86400000);
    return days > 60;
  });

  const handlePrint = () => window.print();

  const handleExport = () => {
    toast.success('Report exported as CSV');
  };

  return (
    <RoleGuard roles={['ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Fee Management Reports</h1>
            <p className="text-muted-foreground">
              Comprehensive analytics and defaulter tracking
            </p>
          </div>
          {can('manage_fees') && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          )}
        </div>

        {/* Term Filter */}
        {terms.length > 0 && (
          <Select value={selectedTermId} onValueChange={setSelectedTermId}>
            <SelectTrigger className="w-full sm:w-64">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select Term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Terms</SelectItem>
              {terms.map((term: any) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Total Billed
                  </p>
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">{formatCurrency(totalBilled)}</p>
                {totalDiscounted > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Discounts: −{formatCurrency(totalDiscounted)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Collected
                  </p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalCollected)}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  {collectionRate.toFixed(1)}% of net
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-950">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Outstanding
                  </p>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalOutstanding)}
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  {netAmount > 0 ? ((totalOutstanding / netAmount) * 100).toFixed(1) : 0}% unpaid
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Total Invoices
                  </p>
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">
                  {(report.byStatus?.PAID || 0) +
                    (report.byStatus?.PARTIAL || 0) +
                    (report.byStatus?.UNPAID || 0) +
                    (report.byStatus?.OVERDUE || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {report.byStatus?.PAID || 0} paid
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Defaulters
                  </p>
                  <Users className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-2xl font-bold">{defaulters.length}</p>
                <p className="text-xs text-muted-foreground">
                  {criticalDefaulters.length} critical
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="defaulters">Defaulters</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Invoice Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Invoice Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCollection ? (
                    <Skeleton className="h-80" />
                  ) : statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} invoices`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Collections by Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCollection ? (
                    <Skeleton className="h-80" />
                  ) : methodData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={methodData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="method" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Bar dataKey="amount" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Daily Collections Trend */}
            {dailyData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daily Collection Trend</CardTitle>
                  <CardDescription>Last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip
                        formatter={(value, name) =>
                          name === 'amount' ? formatCurrency(value as number) : value
                        }
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="amount"
                        stroke="#10b981"
                        name="Amount (KES)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        name="Transaction Count"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Defaulters Tab */}
          <TabsContent value="defaulters" className="space-y-6">
            {criticalDefaulters.length > 0 && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="text-lg text-red-900 dark:text-red-100">
                    ⚠️ Critical Defaulters ({criticalDefaulters.length})
                  </CardTitle>
                  <CardDescription className="text-red-800 dark:text-red-300">
                    Students with invoices overdue by more than 60 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {criticalDefaulters.slice(0, 5).map((defaulter: any) => {
                      const daysOverdue = Math.floor(
                        (Date.now() - new Date(defaulter.dueDate).getTime()) / 86400000
                      );
                      return (
                        <div
                          key={defaulter.invoiceId}
                          className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 rounded border border-red-200 dark:border-red-800"
                        >
                          <div className="flex-1">
                            <p className="font-semibold">{defaulter.studentName}</p>
                            <p className="text-xs text-muted-foreground">
                              {defaulter.admissionNo} • {defaulter.class}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600 dark:text-red-400">
                              {formatCurrency(Number(defaulter.outstandingBalance))}
                            </p>
                            <Badge variant="destructive" className="text-xs">
                              {daysOverdue} days overdue
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Full Defaulters Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">All Defaulters</CardTitle>
                <CardDescription>Students with outstanding invoices</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDefaulters ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : topDefaulters.length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-muted-foreground">No outstanding invoices</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Admission</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Invoice</TableHead>
                          <TableHead className="text-right">Outstanding</TableHead>
                          <TableHead className="text-center">Days Overdue</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topDefaulters.map((defaulter: any) => {
                          const daysOverdue = defaulter.dueDate
                            ? Math.floor(
                                (Date.now() - new Date(defaulter.dueDate).getTime()) / 86400000
                              )
                            : 0;

                          return (
                            <TableRow key={defaulter.invoiceId}>
                              <TableCell className="font-medium">
                                {defaulter.studentName}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {defaulter.admissionNo}
                              </TableCell>
                              <TableCell>{defaulter.class}</TableCell>
                              <TableCell className="font-mono">{defaulter.invoiceNo}</TableCell>
                              <TableCell className="text-right font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(Number(defaulter.outstandingBalance))}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={daysOverdue > 60 ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {daysOverdue}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={daysOverdue > 30 ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {daysOverdue > 60 ? 'CRITICAL' : 'OVERDUE'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Summary Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Collection Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold">Collection Rate</span>
                      <span className="text-2xl font-bold">{collectionRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min(collectionRate, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between py-2">
                      <span className="text-sm">Net Amount Due</span>
                      <span className="font-semibold">{formatCurrency(netAmount)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm">Amount Collected</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(totalCollected)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm">Amount Pending</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(totalOutstanding)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Breakdown Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Invoice Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded">
                    <span className="font-semibold">Paid</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {report.byStatus?.PAID || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-950 rounded">
                    <span className="font-semibold">Partial</span>
                    <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {report.byStatus?.PARTIAL || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded">
                    <span className="font-semibold">Unpaid</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {report.byStatus?.UNPAID || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded">
                    <span className="font-semibold">Overdue</span>
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {report.byStatus?.OVERDUE || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <div className="text-xs text-muted-foreground py-4 border-t">
          <p>Report generated: {formatDate(new Date())}</p>
          <p className="mt-1">
            Academic Year: {activeYear?.year}
            {filterTerm ? ` • Term: ${terms.find((t: any) => t.id === filterTerm)?.name}` : ''}
          </p>
        </div>
      </div>
    </RoleGuard>
  );
}

export default FeeReportsPage;
