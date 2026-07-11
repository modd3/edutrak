import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { useChangePlan } from '@/hooks/use-subscriptions';
import { Subscription, Plan } from '@/types';

const changePlanSchema = z.object({
  planId: z.string().min(1, 'Plan is required'),
  withTrial: z.boolean().optional(),
  trialEndsAt: z.string().optional(),
});

type ChangePlanInput = z.infer<typeof changePlanSchema>;

interface ChangePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  plans: Plan[];
}

export function ChangePlanModal({
  open,
  onOpenChange,
  subscription,
  plans,
}: ChangePlanModalProps) {
  const [withTrial, setWithTrial] = useState(false);
  const changePlanMutation = useChangePlan();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<ChangePlanInput>({
    resolver: zodResolver(changePlanSchema),
    defaultValues: {
      planId: '',
      withTrial: false,
      trialEndsAt: '',
    },
  });

  const selectedPlanId = watch('planId');
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  useEffect(() => {
    if (open) {
      reset({
        planId: '',
        withTrial: false,
        trialEndsAt: '',
      });
      setWithTrial(false);
    }
  }, [open, reset]);

  const currentPlan = subscription?.plan;

  const onSubmit = async (data: ChangePlanInput) => {
    if (!subscription) return;

    await changePlanMutation.mutateAsync({
      subscriptionId: subscription.id,
      data: {
        planId: data.planId,
        withTrial: data.withTrial,
        trialEndsAt: data.withTrial && data.trialEndsAt ? data.trialEndsAt : undefined,
      },
    });

    if (!changePlanMutation.isPending) {
      reset();
      onOpenChange(false);
    }
  };

  if (!subscription) return null;

  const isUpgrade = selectedPlan && currentPlan && selectedPlan.priceMinor > currentPlan.priceMinor;
  const isDowngrade = selectedPlan && currentPlan && selectedPlan.priceMinor < currentPlan.priceMinor;
  const isSamePlan = selectedPlanId === currentPlan?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Subscription Plan</DialogTitle>
          <DialogDescription>
            Upgrade or downgrade your plan. Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Current Plan */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Current Plan</p>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="font-semibold text-lg">{currentPlan?.name || 'None'}</p>
                <p className="text-sm text-gray-600">
                  {(currentPlan?.priceMinor || 0) / 100} {currentPlan?.currency} / {currentPlan?.billingInterval?.toLowerCase()}
                </p>
              </div>
              <Badge variant="outline" className={isUpgrade ? 'bg-green-50 text-green-700 border-green-200' : isDowngrade ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50'}>
                {isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Same Plan'}
              </Badge>
            </div>
          </div>

          {/* New Plan Selection */}
          <div className="space-y-2">
            <Label htmlFor="planId">Select New Plan</Label>
            <Select
              value={selectedPlanId}
              onValueChange={(value) => setValue('planId', value)}
              disabled={changePlanMutation.isPending}
            >
              <SelectTrigger id="planId">
                <SelectValue placeholder="Choose a new plan" />
              </SelectTrigger>
              <SelectContent>
                {plans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{plan.name}</span>
                      <span className="text-gray-500 ml-4">
                        {(plan.priceMinor / 100).toFixed(2)} {plan.currency} / {plan.billingInterval?.toLowerCase()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.planId && (
              <p className="text-red-600 text-sm mt-1">{errors.planId.message}</p>
            )}
          </div>

          {/* Selected Plan Details */}
          {selectedPlan && !isSamePlan && (
            <div className={`border rounded-lg p-4 ${isUpgrade ? 'bg-green-50 border-green-200' : isDowngrade ? 'bg-orange-50 border-orange-200' : 'bg-gray-50'}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${isUpgrade ? 'bg-green-100' : isDowngrade ? 'bg-orange-100' : 'bg-gray-200'}`}>
                  <ArrowUpRight className={`h-5 w-5 ${isUpgrade ? 'text-green-700' : isDowngrade ? 'text-orange-700' : 'text-gray-600'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{selectedPlan.name}</p>
                  <p className="text-sm text-gray-700 mb-2">{selectedPlan.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{(selectedPlan.priceMinor / 100).toFixed(2)}</span>
                    <span className="text-gray-600">
                      {selectedPlan.currency} / {selectedPlan.billingInterval?.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              {selectedPlan.features && selectedPlan.features.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium mb-2">Features included:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPlan.features.map((feature) => (
                      <div key={feature.id} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>{feature.featureKey.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isSamePlan && selectedPlanId && (
            <Alert>
              <AlertDescription>
                You are already subscribed to this plan.
              </AlertDescription>
            </Alert>
          )}

          {/* Trial Option */}
          {selectedPlan && !isSamePlan && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="withTrial"
                  checked={withTrial}
                  onCheckedChange={(checked) => {
                    setWithTrial(checked as boolean);
                    setValue('withTrial', checked as boolean);
                  }}
                  disabled={changePlanMutation.isPending}
                />
                <Label htmlFor="withTrial" className="font-normal cursor-pointer">
                  Start with a 14-day trial
                </Label>
              </div>

              {withTrial && (
                <div>
                  <Label htmlFor="trialEndsAt">Trial End Date</Label>
                  <Input
                    id="trialEndsAt"
                    type="date"
                    {...register('trialEndsAt')}
                    disabled={changePlanMutation.isPending}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.trialEndsAt && (
                    <p className="text-red-600 text-sm mt-1">{errors.trialEndsAt.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    You won't be charged until the trial ends. Cancel anytime.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={changePlanMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={changePlanMutation.isPending || !selectedPlanId || isSamePlan || !isValid}
            >
              {changePlanMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing Plan...
                </>
              ) : (
                'Change Plan'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}