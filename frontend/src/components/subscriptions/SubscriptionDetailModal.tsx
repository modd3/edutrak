import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Subscription, BillingInvoice, BillingPayment } from '@/types';
import { billingInvoicesApi } from '@/api/billing-invoices-api';
import { InvoiceHistoryTable } from '@/components/billing/InvoiceHistoryTable';
import { PaymentHistoryTable } from '@/components/billing/PaymentHistoryTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calendar, RefreshCw, Clock } from 'lucide-react';

interface SubscriptionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
}

const STATUS_COLORS: Record<string, string> = {
  TRIALING: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  PAST_DUE: 'bg-orange-100 text-orange-800',
  GRACE: 'bg-yellow-100 text-yellow-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  CANCELED: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
};

export function SubscriptionDetailModal({ open, onOpenChange, subscription }: SubscriptionDetailModalProps) {
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [payments, setPayments] = useState<BillingPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !subscription) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await billingInvoicesApi.listInvoices({
          schoolId: subscription.schoolId,
          limit: 20,
        });
        const data = (result as any).data || [];
        setInvoices(data);
        setPayments(subscription.payments || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, subscription]);

  if (!subscription) return null;

  const plan = subscription.plan;
  const school = subscription.school;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subscription Details</DialogTitle>
          <DialogDescription>
            {school?.name || 'Unknown School'} — {plan?.name || 'No Plan'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Subscription Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Overview</span>
                <Badge className={STATUS_COLORS[subscription.status] || 'bg-gray-100'}>
                  {subscription.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Period:</span>
                      <span className="font-medium">
                        {formatDate(subscription.currentPeriodStart)} – {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Start:</span>
                      <span className="font-medium">{formatDate(subscription.startsAt)}</span>
                    </div>
                    {plan && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-medium">
                          {formatCurrency(plan.priceMinor / 100)}/{plan.billingInterval.toLowerCase()}
                        </span>
                      </div>
                    )}
                    {subscription.renewalCount !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Renewals:</span>
                        <span className="font-medium">{subscription.renewalCount}</span>
                      </div>
                    )}
                    {subscription.trialEndsAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Trial Ends:</span>
                        <span className="font-medium">{formatDate(subscription.trialEndsAt)}</span>
                      </div>
                    )}
                    {subscription.graceEndsAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Grace Ends:</span>
                        <span className="font-medium">{formatDate(subscription.graceEndsAt)}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <InvoiceHistoryTable invoices={invoices} isLoading={loading} />

          {/* Payments */}
          <PaymentHistoryTable payments={payments} isLoading={loading} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SubscriptionDetailModal;