import { useBillingInvoices } from "@/hooks/use-billing-invoices";
import { useBillingOverview } from "@/hooks/use-billing-overview";
import { InvoiceHistoryTable } from "@/components/billing/InvoiceHistoryTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PayInvoiceModal } from "@/components/billing/PayInvoiceModal";
import { useState } from "react";
import { BillingInvoice } from "@/types";

export function InvoicesPage() {
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(
    null,
  );

  const { data: overview, isLoading: overviewLoading } = useBillingOverview();
  const {
    data,
    isLoading: invoicesLoading,
    isError,
  } = useBillingInvoices({
    page: 1,
    limit: 20,
  });

  const invoices = (data as any)?.data || overview?.recentInvoices || [];
  const outstandingMinor = overview?.outstandingBalanceMinor || 0;

  const handlePayInvoice = (invoice: BillingInvoice) => {
    setSelectedInvoice(invoice);
    setShowPayModal(true);
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">
            View and pay your billing invoices
          </p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">
              Failed to load invoices. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">
            View and pay your billing invoices
          </p>
        </div>
        {outstandingMinor > 0 && (
          <Button className="gap-2" onClick={() => {}}>
            <CreditCard className="h-4 w-4" />
            Pay Outstanding ({formatCurrency(outstandingMinor / 100)})
          </Button>
        )}
      </div>

      <InvoiceHistoryTable
        invoices={invoices}
        isLoading={overviewLoading || invoicesLoading}
        onPayInvoice={handlePayInvoice}
      />

      {selectedInvoice && (
        <PayInvoiceModal
          open={showPayModal}
          onOpenChange={setShowPayModal}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
}

export default InvoicesPage;
