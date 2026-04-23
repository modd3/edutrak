// frontend/src/components/fees/FeeArrearsTable.tsx
import { useState } from 'react';
import { AlertCircle, DollarSign, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetDefaultersReport } from '@/hooks/use-fees';
import { useSchoolContext } from '@/hooks/use-school-context';
import { formatCurrency } from '@/lib/utils';
 
interface FeeArrearsTableProps {
  academicYearId?: string;
  termId?: string;
  /** Called when admin clicks "Record Payment" for a student */
  onRecordPayment?: (invoiceId: string) => void;
  /** Called when admin clicks "View Invoice" */
  onViewInvoice?: (invoiceId: string) => void;
  limit?: number;  // if set, only show first N rows (for dashboard preview)
}
 
 
function daysOverdue(dueDate: string | null): number {
  if (!dueDate) return 0;
  const diff = Date.now() - new Date(dueDate).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
 
export function FeeArrearsTable({
  academicYearId,
  termId,
  onRecordPayment,
  onViewInvoice,
  limit,
}: FeeArrearsTableProps) {
  const { schoolId } = useSchoolContext();
  const [search, setSearch] = useState('');
 
  const { data, isLoading, error } = useGetDefaultersReport({ academicYearId, termId });
  const rawList: any[] = data?.data?.data ?? data?.data ?? [];
 
  // Filter by search
  const filtered = rawList.filter((row) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      row.studentName?.toLowerCase().includes(s) ||
      row.admissionNo?.toLowerCase().includes(s) ||
      row.invoiceNo?.toLowerCase().includes(s) ||
      row.class?.toLowerCase().includes(s)
    );
  });
 
  const displayed = limit ? filtered.slice(0, limit) : filtered;
 
  const totalOutstanding = filtered.reduce((sum, r) => sum + (r.outstandingBalance ?? 0), 0);
 
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }
 
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load arrears report</AlertDescription>
      </Alert>
    );
  }
 
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Fee Defaulters
              {filtered.length > 0 && (
                <Badge variant="destructive" className="ml-1">{filtered.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Students with outstanding fee balances
              {filtered.length > 0 && ` · Total: ${formatCurrency(totalOutstanding)}`}
            </CardDescription>
          </div>
          {!limit && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search student, invoice..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-sm w-64"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {displayed.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <DollarSign className="mx-auto h-10 w-10 text-green-300 mb-3" />
            <p className="text-sm font-medium text-green-700">All fees are up to date!</p>
            <p className="text-xs text-gray-400 mt-1">No outstanding balances found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-xs font-semibold">Student</TableHead>
                  <TableHead className="text-xs font-semibold">Class</TableHead>
                  <TableHead className="text-xs font-semibold">Invoice</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Total Due</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Paid</TableHead>
                  <TableHead className="text-xs font-semibold text-right text-red-600">Balance</TableHead>
                  <TableHead className="text-xs font-semibold">Days Overdue</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((row, idx) => {
                  const days = daysOverdue(row.dueDate);
                  const isCritical = days > 30;
                  return (
                    <TableRow
                      key={row.invoiceNo ?? idx}
                      className={isCritical ? 'bg-red-50 hover:bg-red-50' : undefined}
                    >
                      <TableCell>
                        <p className="font-medium text-sm text-gray-900">{row.studentName}</p>
                        <p className="text-xs text-gray-500">{row.admissionNo}</p>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{row.class ?? 'N/A'}</TableCell>
                      <TableCell className="font-mono text-xs text-gray-600">{row.invoiceNo}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatCurrency(row.totalAmount ?? 0)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-green-700">
                        {formatCurrency(row.paidAmount ?? 0)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold text-red-700">
                        {formatCurrency(row.outstandingBalance ?? 0)}
                      </TableCell>
                      <TableCell>
                        {days > 0 ? (
                          <Badge
                            variant={isCritical ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {days}d
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">Current</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onViewInvoice && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => onViewInvoice(row.invoiceId ?? '')}
                            >
                              View
                            </Button>
                          )}
                          {onRecordPayment && (
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => onRecordPayment(row.invoiceId ?? '')}
                            >
                              Pay
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {limit && filtered.length > limit && (
              <p className="text-xs text-center text-gray-500 py-2 border-t">
                Showing {limit} of {filtered.length} defaulters
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
