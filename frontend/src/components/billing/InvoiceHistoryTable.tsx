import { useState } from 'react';
import { BillingInvoice, BillingInvoiceStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, invoiceStatusClass } from '@/lib/utils';
import { Eye, CreditCard } from 'lucide-react';
import { PayInvoiceModal } from './PayInvoiceModal';

interface InvoiceHistoryTableProps {
  invoices: BillingInvoice[];
  isLoading?: boolean;
  onPayInvoice?: (invoice: BillingInvoice) => void;
}

export function InvoiceHistoryTable({ invoices, isLoading, onPayInvoice }: InvoiceHistoryTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);

  const handlePay = (invoice: BillingInvoice) => {
    setSelectedInvoice(invoice);
    setShowPayModal(true);
    onPayInvoice?.(invoice);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">No invoices found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const remaining = invoice.totalMinor - invoice.amountPaidMinor;
                const isPayable = invoice.status === 'OPEN' && remaining > 0;

                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={invoiceStatusClass(invoice.status)}>
                        {invoice.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatCurrency(invoice.totalMinor / 100)}</p>
                        {remaining > 0 && (
                          <p className="text-xs text-gray-500">
                            {formatCurrency(remaining / 100)} due
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(invoice.dueAt)}</TableCell>
                    <TableCell className="text-sm">
                      {invoice.paidAt ? formatDate(invoice.paidAt) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isPayable && (
                          <Button
                            size="sm"
                            onClick={() => handlePay(invoice)}
                            className="gap-1"
                          >
                            <CreditCard className="h-3 w-3" />
                            Pay Now
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {selectedInvoice && (
        <PayInvoiceModal
          open={showPayModal}
          onOpenChange={setShowPayModal}
          invoice={selectedInvoice}
        />
      )}
    </Card>
  );
}