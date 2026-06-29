import { useBillingInvoices } from '@/hooks/use-billing-invoices';
import { InvoiceHistoryTable } from '@/components/billing/InvoiceHistoryTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function InvoicesPage() {
  const { data, isLoading, isError } = useBillingInvoices({
    page: 1,
    limit: 20,
  });

  const invoices = (data as any)?.data || [];

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">View and pay your billing invoices</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Failed to load invoices. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Invoices</h1>
        <p className="text-muted-foreground">View and pay your billing invoices</p>
      </div>

      <InvoiceHistoryTable invoices={invoices} isLoading={isLoading} />
    </div>
  );
}

export default InvoicesPage;