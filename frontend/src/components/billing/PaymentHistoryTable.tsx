import { BillingPayment, BillingPaymentStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate, invoiceStatusClass } from '@/lib/utils';

interface PaymentHistoryTableProps {
  payments: BillingPayment[];
  isLoading?: boolean;
}

export function PaymentHistoryTable({ payments, isLoading }: PaymentHistoryTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">No payments found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium capitalize">
                    {payment.provider.toLowerCase()}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {payment.providerReference || payment.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(payment.amountMinor / 100)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={invoiceStatusClass(payment.status)}>
                      {payment.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}