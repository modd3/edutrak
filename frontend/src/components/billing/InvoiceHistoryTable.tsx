import { useState } from "react";
import { BillingInvoice, BillingInvoiceStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatCurrency,
  formatDate,
  invoiceStatusMeta,
  invoiceStatusLabel,
} from "@/lib/utils";
import { ArrowUpRight, CreditCard, FileText } from "lucide-react";
import { PayInvoiceModal } from "./PayInvoiceModal";

interface InvoiceHistoryTableProps {
  invoices: BillingInvoice[];
  isLoading?: boolean;
  onPayInvoice?: (invoice: BillingInvoice) => void;
}

export function InvoiceHistoryTable({
  invoices,
  isLoading,
  onPayInvoice,
}: InvoiceHistoryTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(
    null,
  );
  const [showPayModal, setShowPayModal] = useState(false);

  const handlePay = (invoice: BillingInvoice) => {
    setSelectedInvoice(invoice);
    setShowPayModal(true);
    onPayInvoice?.(invoice);
  };

  const handleView = (invoice: BillingInvoice) => {
    setSelectedInvoice(invoice);
    // Placeholder: wire to invoice detail view when available.
  };

  if (isLoading) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Invoices</CardTitle>
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
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center"><FileText className="mx-auto mb-3 h-8 w-8 text-slate-300" /><p className="font-medium text-slate-700">No invoices yet</p><p className="mt-1 text-sm text-slate-500">Your subscription invoices will appear here.</p></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div><CardTitle className="text-lg">Invoices</CardTitle><p className="mt-1 text-sm text-muted-foreground">Track payments, due dates, and receipts.</p></div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{invoices.length} recent</span>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                <TableHead>Invoice</TableHead>
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
                const isPayable = invoice.status === "OPEN" && remaining > 0;

                return (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <p className="font-medium text-slate-900">{invoice.invoiceNumber}</p>
                      <p className="mt-0.5 text-xs text-slate-500">Issued {formatDate(invoice.issuedAt)}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={invoiceStatusMeta(invoice).badge}
                      >
                        {invoiceStatusLabel(invoice)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(invoice.totalMinor / 100, invoice.currency)}
                        </p>
                        {remaining > 0 && (
                          <p className="text-xs text-gray-500">
                            {formatCurrency(remaining / 100, invoice.currency)} due
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(invoice.dueAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {invoice.paidAt ? formatDate(invoice.paidAt) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isPayable && (
                          <Button size="sm" onClick={() => handlePay(invoice)} className="gap-1.5">
                            <CreditCard className="h-3.5 w-3.5" /> Pay now
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="gap-1 text-slate-600" onClick={() => handleView(invoice)}>
                          Details <ArrowUpRight className="h-3.5 w-3.5" />
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
