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
import { formatPlanPrice, intervalLabel, getPlanFeatureLimit, SUBSCRIPTION_STATUS_META } from '@/lib/utils';

export function SubscriptionOverviewCard() {
  const { schoolId, isSuperAdmin } = useSchoolContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const { data: subscription, isLoading, error } = useMySubscription();
  const { data: plansData } = usePlans({ isActive: true, limit: 50 });
  const plans = plansData?.data || [];
  const { mutateAsync: changePlan } = useChangePlan();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="space-y-3 w-full">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !subscription) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 space-y-4">
            <Zap className="h-12 w-12 text-gray-300 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No Subscription Yet</h3>
              <p className="text-sm text-gray-500 mt-1">
                Choose a plan to activate billing and unlock platform features.
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              Choose a Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const plan = subscription.plan;
  const status = subscription.status;
  const statusMeta = SUBSCRIPTION_STATUS_META[status] || SUBSCRIPTION_STATUS_META.CANCELED;
  const renewalDate = new Date(subscription.currentPeriodEnd);
  const now = new Date();
  const daysUntilRenewal = Math.max(0, Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isPastDue = status === 'PAST_DUE' || status === 'GRACE';
  const graceEnd = isPastDue ? new Date(subscription.currentPeriodEnd) : null;
  const canRenew = ['TRIALING', 'PAST_DUE', 'GRACE', 'SUSPENDED', 'EXPIRED'].includes(status);
  const canChangePlan = !isSuperAdmin;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl">Subscription Overview</CardTitle>
            <span className={`inline-flex items-center gap-1.5 border text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${statusMeta.badge}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
              {statusMeta.label}
            </span>
          </div>
          <div className="flex gap-2">
            {canChangePlan && (
              <Dialog open={showChangePlanModal} onOpenChange={setShowChangePlanModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowUpCircle className="h-4 w-4" />
                    Change Plan
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
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Status banner */}
        {status === 'PAST_DUE' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-orange-900">Payment Overdue</p>
              <p className="text-orange-700">
                Your payment is overdue. Please pay your invoice to avoid service interruption.
              </p>
            </div>
          </div>
        )}

        {status === 'GRACE' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900">Grace Period Active</p>
              <p className="text-yellow-700">
                Your access continues until {graceEnd?.toLocaleDateString()}. Please renew to avoid service interruption.
              </p>
            </div>
          </div>
        )}

        {/* Pricing Info */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">
            {formatPlanPrice(plan?.priceMinor || 0, plan?.currency || 'KES')}
          </span>
          <span className="text-gray-600">
            {intervalLabel(plan?.billingInterval || 'MONTHLY')}
          </span>
        </div>

        {/* Features */}
        {plan?.features && plan.features.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Plan Features:</p>
            <div className="grid grid-cols-2 gap-2">
              {plan.features.slice(0, 6).map((feature) => (
                <div key={feature.id} className="flex items-center gap-2 text-sm">
                  {feature.enabled ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-300 flex-shrink-0" />
                  )}
                  <span className="text-gray-700">
                    {feature.featureKey.replace(/_/g, ' ')}
                  </span>
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

        {/* Create Subscription Modal (for schools without subscription) */}
        <CreateSubscriptionModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          plans={plans}
          isLoadingPlans={!plansData}
        />
      </CardContent>
    </Card>
  );
}
