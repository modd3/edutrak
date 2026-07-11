import { useState } from 'react';
import { useMySubscription } from '@/hooks/use-subscriptions';
import { usePlans } from '@/hooks/use-plans';
import { useSchoolContext } from '@/hooks/use-school-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Settings2,
  RefreshCw,
  ArrowUpCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
} from 'lucide-react';
import { Subscription } from '@/types';
import { ChangePlanModal } from '@/components/subscriptions/ChangePlanModal';
import { ManageSubscriptionStatusModal } from '@/components/subscriptions/ManageSubscriptionStatusModal';
import { CreateSubscriptionModal } from '@/components/subscriptions/CreateSubscriptionModal';
import { useChangePlan } from '@/hooks/use-subscriptions';

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string; description: string }> = {
  TRIALING: {
    icon: Clock,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Trial Period',
    description: 'You are currently in your trial period',
  },
  ACTIVE: {
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Active',
    description: 'Your subscription is active and in good standing',
  },
  PAST_DUE: {
    icon: AlertTriangle,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    label: 'Past Due',
    description: 'Payment is overdue. Please update your payment method',
  },
  GRACE: {
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Grace Period',
    description: 'Your subscription is in grace period',
  },
  SUSPENDED: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Suspended',
    description: 'Your subscription has been suspended',
  },
  CANCELED: {
    icon: XCircle,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    label: 'Canceled',
    description: 'Your subscription has been canceled',
  },
  EXPIRED: {
    icon: AlertTriangle,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    label: 'Expired',
    description: 'Your subscription has expired. Renew to restore access',
  },
};

export function SubscriptionOverviewCard() {
  const { schoolId, isSuperAdmin } = useSchoolContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const { data: subscription, isLoading, error } = useMySubscription();
  const { data: plansData } = usePlans({ isActive: true, limit: 50 });
  const plans = plansData?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading subscription...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No subscription found - show onboarding
  if (error || !subscription) {
    return (
      <>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get started by choosing a plan that fits your school's needs. All plans include a 14-day free trial.
              </p>
              <Button onClick={() => setShowCreateModal(true)} size="lg">
                Choose a Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        <CreateSubscriptionModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          plans={plans}
          isLoadingPlans={!plansData}
        />
      </>
    );
  }

  const statusConfig = STATUS_CONFIG[subscription.status] || STATUS_CONFIG.ACTIVE;
  const StatusIcon = statusConfig.icon;

  // Calculate days remaining
  const now = new Date();
  const periodEnd = new Date(subscription.currentPeriodEnd);
  const trialEnd = subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
  const graceEnd = subscription.graceEndsAt ? new Date(subscription.graceEndsAt) : null;

  const referenceDate = trialEnd && subscription.status === 'TRIALING' ? trialEnd : periodEnd;
  const totalDays = referenceDate > new Date(subscription.currentPeriodStart)
    ? (referenceDate.getTime() - new Date(subscription.currentPeriodStart).getTime()) / (1000 * 60 * 60 * 24)
    : 1;
  const daysRemaining = Math.max(0, (referenceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const progressPercent = totalDays > 0 ? Math.min(100, Math.max(0, ((totalDays - daysRemaining) / totalDays) * 100)) : 0;

  const isExpired = subscription.status === 'EXPIRED' || subscription.status === 'CANCELED';
  const isActive = subscription.status === 'ACTIVE' || subscription.status === 'TRIALING';
  const canRenew = isExpired;
  const canChangePlan = isActive || isExpired;

  return (
    <>
      <Card className={isExpired ? 'border-orange-200 bg-orange-50' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-1">{subscription.school?.name || 'Your School'}</CardTitle>
              <p className="text-sm text-gray-600">
                {subscription.plan?.name} • {subscription.plan?.billingInterval?.toLowerCase()}
              </p>
            </div>
            <Badge className={`${statusConfig.color} border`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Description */}
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle className={`h-4 w-4 mt-0.5 ${isExpired ? 'text-orange-600' : 'text-gray-500'}`} />
            <p className={isExpired ? 'text-orange-800 font-medium' : 'text-gray-600'}>
              {statusConfig.description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Current Period</span>
              <span className="font-medium">
                {isExpired ? 'Expired' : `${Math.ceil(daysRemaining)} days remaining`}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{new Date(subscription.currentPeriodStart).toLocaleDateString()}</span>
              <span>{referenceDate.toLocaleDateString()}</span>
            </div>
          </div>

          {/* Grace Period Notice */}
          {graceEnd && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900">Grace Period Active</p>
                <p className="text-yellow-700">
                  Your access continues until {graceEnd.toLocaleDateString()}. Please renew to avoid service interruption.
                </p>
              </div>
            </div>
          )}

          {/* Pricing Info */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {(subscription.plan?.priceMinor || 0) / 100}
            </span>
            <span className="text-gray-600">
              {subscription.plan?.currency} / {subscription.plan?.billingInterval?.toLowerCase()}
            </span>
          </div>

          {/* Features */}
          {subscription.plan?.features && subscription.plan.features.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Plan Features:</p>
              <div className="grid grid-cols-2 gap-2">
                {subscription.plan.features.slice(0, 6).map((feature) => (
                  <div key={feature.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{feature.featureKey.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {canRenew && (
              <Button
                size="lg"
                className="gap-2"
                onClick={() => setShowStatusModal(true)}
              >
                <RefreshCw className="h-4 w-4" />
                Renew Subscription
              </Button>
            )}

            {canChangePlan && (
              <Dialog open={showChangePlanModal} onOpenChange={setShowChangePlanModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="gap-2">
                    <ArrowUpCircle className="h-4 w-4" />
                    Change or Upgrade Plan
                  </Button>
                </DialogTrigger>
                <ChangePlanModal
                  open={showChangePlanModal}
                  onOpenChange={setShowChangePlanModal}
                  subscription={subscription}
                  plans={plans}
                />
              </Dialog>
            )}

            <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="lg" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Manage
                </Button>
              </DialogTrigger>
              <ManageSubscriptionStatusModal
                open={showStatusModal}
                onOpenChange={setShowStatusModal}
                subscription={subscription}
              />
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Create Subscription Modal (for schools without subscription) */}
      <CreateSubscriptionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        plans={plans}
        isLoadingPlans={!plansData}
      />
    </>
  );
}