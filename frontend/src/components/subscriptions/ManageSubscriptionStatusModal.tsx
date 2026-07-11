import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useTransitionSubscriptionStatus, useRenewSubscription } from '@/hooks/use-subscriptions';
import { Subscription } from '@/types';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  TRIALING: ['ACTIVE', 'CANCELED', 'EXPIRED'],
  ACTIVE: ['PAST_DUE', 'GRACE', 'CANCELED', 'SUSPENDED'],
  PAST_DUE: ['GRACE', 'SUSPENDED', 'ACTIVE', 'CANCELED'],
  GRACE: ['ACTIVE', 'SUSPENDED', 'CANCELED'],
  SUSPENDED: ['ACTIVE', 'CANCELED', 'EXPIRED'],
  CANCELED: [],
  EXPIRED: ['ACTIVE'],
};

const transitionStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  graceEndsAt: z.string().optional(),
});

type TransitionStatusInput = z.infer<typeof transitionStatusSchema>;

interface ManageSubscriptionStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  onRenewed?: () => void;
}

export function ManageSubscriptionStatusModal({
  open,
  onOpenChange,
  subscription,
  onRenewed,
}: ManageSubscriptionStatusModalProps) {
  const transitionMutation = useTransitionSubscriptionStatus();
  const renewMutation = useRenewSubscription();

  const form = useForm<TransitionStatusInput>({
    resolver: zodResolver(transitionStatusSchema),
    defaultValues: {
      status: '',
      graceEndsAt: '',
    },
  });

  const allowedStatuses = subscription ? ALLOWED_TRANSITIONS[subscription.status] || [] : [];
  const hasTrialOption = subscription && ['EXPIRED', 'CANCELED', 'ACTIVE'].includes(subscription.status);
  const isExpired = subscription?.status === 'EXPIRED' || subscription?.status === 'CANCELED';

  const handleStatusSubmit = async (data: TransitionStatusInput) => {
    if (!subscription) return;

    await transitionMutation.mutateAsync({
      subscriptionId: subscription.id,
      data: {
        status: data.status,
        graceEndsAt: data.status === 'GRACE' && data.graceEndsAt ? data.graceEndsAt : undefined,
      },
    });

    if (!transitionMutation.isPending) {
      form.reset();
      onOpenChange(false);
    }
  };

  const handleRenew = async (withTrial: boolean = false, trialEndsAt?: string) => {
    if (!subscription) return;

    await renewMutation.mutateAsync({
      subscriptionId: subscription.id,
      data: {
        withTrial,
        trialEndsAt,
      },
    });

    if (!renewMutation.isPending) {
      onRenewed?.();
      onOpenChange(false);
    }
  };

  if (!subscription) return null;

  const isPending = transitionMutation.isPending || renewMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Subscription</DialogTitle>
          <DialogDescription>
            Update subscription status for {subscription.school?.name}
          </DialogDescription>
        </DialogHeader>

        {/* Quick Renewal for Expired Subscriptions */}
        {isExpired && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your subscription has expired. Renew now to restore access to all features.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={() => handleRenew(false)}
                disabled={isPending}
              >
                {renewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Renew Now (Start Immediately)
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={() => {
                  const trialDate = new Date();
                  trialDate.setDate(trialDate.getDate() + 14);
                  handleRenew(true, trialDate.toISOString().split('T')[0]);
                }}
                disabled={isPending}
              >
                <RefreshCw className="h-4 w-4" />
                Renew with 14-Day Trial
              </Button>
            </div>
          </div>
        )}

        {/* Status Transition Form */}
        {!isExpired && allowedStatuses.length > 0 && (
          <form onSubmit={form.handleSubmit(handleStatusSubmit)} className="space-y-4">
            {/* Current Status */}
            <div>
              <Label>Current Status</Label>
              <div className="px-3 py-2 border rounded bg-gray-50">
                <Badge variant="outline" className="font-medium">
                  {subscription.status}
                </Badge>
              </div>
            </div>

            {/* Period Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Period:</strong> {new Date(subscription.currentPeriodStart).toLocaleDateString()} to{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                {subscription.graceEndsAt && (
                  <>
                    <br />
                    <strong>Grace ends:</strong> {new Date(subscription.graceEndsAt).toLocaleDateString()}
                  </>
                )}
              </AlertDescription>
            </Alert>

            {/* New Status */}
            <div>
              <Label htmlFor="status">Transition to Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value) => form.setValue('status', value)}
                disabled={isPending}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {allowedStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-red-600 text-sm mt-1">{form.formState.errors.status.message}</p>
              )}
            </div>

            {/* Grace End Date (if transitioning to GRACE) */}
            {form.watch('status') === 'GRACE' && (
              <div>
                <Label htmlFor="graceEndsAt">Grace Period Ends At</Label>
                <Input
                  id="graceEndsAt"
                  type="date"
                  {...form.register('graceEndsAt')}
                  disabled={isPending}
                />
                <p className="text-xs text-gray-500 mt-1">When should the grace period end?</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !form.watch('status')}
                variant={form.watch('status') === 'CANCELED' ? 'destructive' : 'default'}
              >
                {transitionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </Button>
            </div>
          </form>
        )}

        {/* No transitions available */}
        {!isExpired && allowedStatuses.length === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No status transitions available from {subscription.status}. This subscription cannot be modified.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}