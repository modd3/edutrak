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
import { AlertCircle, Loader2 } from 'lucide-react';
import { useTransitionSubscriptionStatus } from '@/hooks/use-subscriptions';
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
}

export function ManageSubscriptionStatusModal({
  open,
  onOpenChange,
  subscription,
}: ManageSubscriptionStatusModalProps) {
  const transitionMutation = useTransitionSubscriptionStatus();

  const form = useForm<TransitionStatusInput>({
    resolver: zodResolver(transitionStatusSchema),
    defaultValues: {
      status: '',
      graceEndsAt: '',
    },
  });

  const allowedStatuses = subscription ? ALLOWED_TRANSITIONS[subscription.status] || [] : [];

  const handleSubmit = async (data: TransitionStatusInput) => {
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

  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Subscription Status</DialogTitle>
          <DialogDescription>
            Update the subscription status for {subscription.school?.name}
          </DialogDescription>
        </DialogHeader>

        {allowedStatuses.length === 0 ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No status transitions available from {subscription.status}. This subscription cannot be modified.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Current Status */}
            <div>
              <Label>Current Status</Label>
              <div className="px-3 py-2 border rounded bg-gray-50">
                <span className="font-medium">{subscription.status}</span>
              </div>
            </div>

            {/* Status Info */}
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
                disabled={transitionMutation.isPending}
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
                  disabled={transitionMutation.isPending}
                />
                <p className="text-xs text-gray-500 mt-1">When should the grace period end?</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={transitionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={transitionMutation.isPending || !form.watch('status')}
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
      </DialogContent>
    </Dialog>
  );
}
