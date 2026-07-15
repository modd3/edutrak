import { useMemo, useState } from 'react';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { useFeatureRegistry } from '@/hooks/use-feature-registry';
import { useSchoolContext } from '@/hooks/use-school-context';
import { useBillingInvoices } from '@/hooks/use-billing-invoices';
import { usePlans } from '@/hooks/use-plans';
import { FeatureRow } from '@/components/subscriptions/FeatureRow';
import { ChangePlanModal } from '@/components/subscriptions/ChangePlanModal';
import { InvoiceHistoryTable } from '@/components/billing/InvoiceHistoryTable';
import { PaymentHistoryTable } from '@/components/billing/PaymentHistoryTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  AlertCircle,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BillingInvoice, Subscription, SubscriptionStatus } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CurrentPlanCard } from '@/components/billing/CurrentPlanCard';
import { CapacityCard } from '@/components/billing/CapacityCard';
import { UpgradeBanner } from '@/components/billing/UpgradeBanner';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { LimitWarningModal } from '@/components/billing/LimitWarningModal';

function getStatusConfig(status: SubscriptionStatus) {
  switch (status) {
    case 'ACTIVE':
      return {
        color: 'bg-green-50 border-green-200',
        icon: CheckCircle2,
        iconColor: 'text-green-600',
        badgeColor: 'bg-green-100 text-green-800',
        title: 'Active Subscription',
        message: 'Your subscription is active and all features are available.',
      };
    case 'TRIALING':
      return {
        color: 'bg-blue-50 border-blue-200',
        icon: Clock,
        iconColor: 'text-blue-600',
        badgeColor: 'bg-blue-100 text-blue-800',
        title: 'Trial Period',
        message: 'You are currently on a trial. Upgrade to continue after trial ends.',
      };
    case 'PAST_DUE':
      return {
        color: 'bg-orange-50 border-orange-200',
        icon: AlertTriangle,
        iconColor: 'text-orange-600',
        badgeColor: 'bg-orange-100 text-orange-800',
        title: 'Payment Overdue',
        message: 'Your payment is overdue. Please pay your invoice to avoid service interruption.',
      };
    case 'GRACE':
      return {
        color: 'bg-yellow-50 border-yellow-200',
        icon: AlertCircle,
        iconColor: 'text-yellow-600',
        badgeColor: 'bg-yellow-100 text-yellow-800',
        title: 'Grace Period',
        message: 'You are in a grace period. Please pay your invoice to avoid suspension.',
      };
    case 'SUSPENDED':
      return {
        color: 'bg-red-50 border-red-200',
        icon: XCircle,
        iconColor: 'text-red-600',
        badgeColor: 'bg-red-100 text-red-800',
        title: 'Subscription Suspended',
        message: 'Your subscription has been suspended due to non-payment. Please pay your invoice to reactivate.',
      };
    case 'EXPIRED':
      return {
        color: 'bg-gray-50 border-gray-200',
        icon: XCircle,
        iconColor: 'text-gray-600',
        badgeColor: 'bg-gray-100 text-gray-800',
        title: 'Subscription Expired',
        message: 'Your subscription has expired. Please renew to restore access.',
      };
    case 'CANCELED':
      return {
        color: 'bg-gray-50 border-gray-200',
        icon: XCircle,
        iconColor: 'text-gray-600',
        badgeColor: 'bg-gray-100 text-gray-800',
        title: 'Subscription Canceled',
        message: 'Your subscription has been canceled. Contact support to reactivate.',
      };
    default:
      return {
        color: 'bg-gray-50 border-gray-200',
        icon: AlertCircle,
        iconColor: 'text-gray-600',
        badgeColor: 'bg-gray-100 text-gray-800',
        title: 'Unknown Status',
        message: 'Please contact support for assistance.',
      };
  }
}

function getDaysUntilExpiry(subscription: Subscription): number | null {
  const now = new Date();
  const endDate = new Date(subscription.currentPeriodEnd);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function MySubscriptionPage() {
  const [showLimitWarningModal, setShowLimitWarningModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { schoolId } = useSchoolContext();
  const {
    data: registryData,
    isLoading: isRegistryLoading,
    isError: isRegistryError,
  } = useFeatureRegistry();

const registry = registryData?.data || {};
  const { data: subscriptionsData, isLoading: subsLoading, isError: subsError } = useSubscriptions({
    page: 1,
    limit: 1,
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useBillingInvoices({
    page: 1,
    limit: 10,
  });

  const planQuery = usePlans({ isActive: true, limit: 50 });
  const plans = planQuery.data?.data || [];

  const subscriptions = subscriptionsData?.data || [];
  const subscription = subscriptions.find(
    (s) => s.schoolId === schoolId && ['ACTIVE', 'TRIALING', 'GRACE', 'PAST_DUE', 'SUSPENDED', 'EXPIRED'].includes(s.status)
  ) || subscriptions[0];

  const plan = subscription?.plan;
  const invoices = (invoicesData as any)?.data ?? [];
  const payments = useMemo(() => {
    return (subscription?.payments || []).slice(0, 10);
  }, [subscription]);

  if (subsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Subscription</h1>
          <p className="text-muted-foreground">View your school's current subscription details</p>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (subsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Subscription</h1>
          <p className="text-muted-foreground">View your school's current subscription details</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-red-800">Failed to load subscription details. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subscription || !plan) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Subscription</h1>
          <p className="text-muted-foreground">View your school's current subscription details</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No active subscription found for your school.</p>
            <Link to="/billing/plans">
              <Button className="mt-4" variant="outline">
                Browse Plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

 
  const statusConfig = getStatusConfig(subscription.status);
  const StatusIcon = statusConfig.icon;
  const daysUntilExpiry = getDaysUntilExpiry(subscription);
  const features = plan.features || [];
  const sortedFeatures = [...features].sort((a, b) => a.featureKey.localeCompare(b.featureKey));

  const needsPayment = ['PAST_DUE', 'GRACE', 'SUSPENDED'].includes(subscription.status);
  const hasOpenInvoices = invoices.some((inv: BillingInvoice) => inv.status === 'OPEN');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Subscription</h1>
        <p className="text-muted-foreground">Manage your school's subscription and billing</p>
      </div>

      {/* Status Banner */}
      <Alert className={`${statusConfig.color} border`}>
        <StatusIcon className={`h-5 w-5 ${statusConfig.iconColor}`} />
        <AlertDescription className="ml-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{statusConfig.title}</h3>
              <p className="text-sm text-gray-700 mt-1">{statusConfig.message}</p>
              {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} until renewal
                </p>
              )}
            </div>
            <Badge className={statusConfig.badgeColor}>{subscription.status}</Badge>
          </div>
        </AlertDescription>
      </Alert>

      {/* Quick Actions */}
      {needsPayment && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Action Required</h3>
                <p className="text-sm text-gray-700 mt-1">
                  {hasOpenInvoices
                    ? 'You have unpaid invoices. Pay now to restore full access.'
                    : 'Please contact support to resolve your subscription status.'}
                </p>
              </div>
              {hasOpenInvoices && (
                <Link to="/billing/invoices">
                  <Button className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pay Invoice
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Overview */}
   {/*   
      <Card>
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              {plan.description && (
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">
                {formatCurrency(plan.priceMinor / 100)}
              </p>
              <p className="text-sm text-muted-foreground">
                {plan.billingInterval.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Billing Period:</span>
              <span className="font-medium">
                {formatDate(subscription.currentPeriodStart)} – {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
            {subscription.trialEndsAt && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Trial Ends:</span>
                <span className="font-medium">{formatDate(subscription.trialEndsAt)}</span>
              </div>
            )}
            {subscription.renewalCount !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Renewals:</span>
                <span className="font-medium">{subscription.renewalCount}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
 */}
      {/* Current Plan Card */}
      <CurrentPlanCard subscription={subscription} isLoading={subsLoading} />

      {/* Capacity Trackers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <CapacityCard
          title="Student Capacity"
          used={subscription.plan?.features?.find(f => f.featureKey === 'used_students')?.limitValue ?? 110}
          total={subscription.plan?.features?.find(f => f.featureKey === 'students.max')?.limitValue ?? 150}
          color="#10b981"
          trackColor="#d1fae5"
          icon="🎓"
          status="healthy"
        />
        <CapacityCard
          title="Teacher Capacity"
          used={15}
          total={subscription.plan?.features?.find(f => f.featureKey === 'teachers.max')?.limitValue ?? 20}
          color="#ef4444"
          trackColor="#fee2e2"
          icon="👩‍🏫"
          status="critical"
        />
      </div>

      {/* Upgrade Banner */}
      <UpgradeBanner onUpgrade={() => setShowLimitWarningModal(true)} />

       {/* Limit Warning Modal — triggers from UpgradeBanner */}
      <LimitWarningModal
        open={showLimitWarningModal}
        onClose={() => setShowLimitWarningModal(false)}
        onUpgrade={() => {
          setShowLimitWarningModal(false);
          setShowUpgradeModal(true);
        }}
        currentPlanName={plan.name}
        currentLimit={plan.features?.find(f => f.featureKey === 'max_teachers')?.limitValue ?? 20}
        newPlanName={plans.length > 1 ? plans[1].name : 'Growth Plan'}
        newLimit={plans.length > 1 ? (plans[1].features?.find(f => f.featureKey === 'max_teachers')?.limitValue ?? 50) : 50}
        price={plans.length > 1 ? `$${Math.round(plans[1].priceMinor / 100 * 0.8)}/mo` : '$400/mo'}
      />

      {/* Upgrade Modal — full plan selector */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        plans={plans}
        currentPlanName={plan.name}
        currentPrice={plan?.priceMinor || 20000}
        currency={plan.currency || 'KES'}
        onConfirm={(planId, billing) => {
          console.log('Upgrade confirmed:', { planId, billing });
          setShowUpgradeModal(false);
        }}
        />

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedFeatures.length > 0 ? (
            <div className="divide-y">
              {sortedFeatures.map((f) => (
                <FeatureRow key={f.id} feature={f} registry={registry} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No features configured for this plan.</p>
          )}
        </CardContent>
      </Card>

      {/* Invoice History */}
      <InvoiceHistoryTable invoices={invoices} isLoading={invoicesLoading} />

      {/* Payment History */}
      <PaymentHistoryTable payments={payments} isLoading={false} />
    </div>
  );
}

export default MySubscriptionPage;