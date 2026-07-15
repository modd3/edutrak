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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, Info, Building2 } from 'lucide-react';
import { useCreateSubscription } from '@/hooks/use-subscriptions';
import { useSchoolContext } from '@/hooks/use-school-context';
import { usePlans } from '@/hooks/use-plans';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { Plan } from '@/types';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

const createSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Plan is required'),
  startsAt: z.string().min(1, 'Start date is required'),
  currentPeriodStart: z.string().min(1, 'Period start date is required'),
  currentPeriodEnd: z.string().min(1, 'Period end date is required'),
  trialEndsAt: z.string().optional(),
});

type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

interface CreateSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: any[];
  isLoadingPlans?: boolean;
}

export function CreateSubscriptionModal({
  open,
  onOpenChange,
  plans,
  isLoadingPlans,
}: CreateSubscriptionModalProps) {
  const { schoolId, isSuperAdmin } = useSchoolContext();
  const { data: plansData } = usePlans({ isActive: true, limit: 50 });
  const createMutation = useCreateSubscription();
  const [isTrialing, setIsTrialing] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');

  // Fetch schools list for super admin
  const { data: schoolsData, isLoading: isLoadingSchools } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const response = await api.get('/schools', { params: { limit: 100 } });
      return response.data.data;
    },
    enabled: isSuperAdmin && open,
  });

  const availablePlans = plans || [];
  const schools = schoolsData || [];

  const {
    watch,
    handleSubmit,
    reset,
    setValue,
    register,
    formState: { errors },
  } = useForm<CreateSubscriptionInput>({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: {
      planId: '',
      startsAt: new Date().toISOString().split('T')[0],
      currentPeriodStart: new Date().toISOString().split('T')[0],
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      trialEndsAt: '',
    },
  });

  const selectedPlanId = watch('planId');
  const selectedPlan = availablePlans.find(p => p.id === selectedPlanId);

  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      reset({
        planId: '',
        startsAt: today,
        currentPeriodStart: today,
        currentPeriodEnd: nextMonth,
        trialEndsAt: '',
      });
      setIsTrialing(false);
      setSelectedSchoolId('');
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateSubscriptionInput) => {
    const targetSchoolId = isSuperAdmin ? selectedSchoolId : schoolId;

    if (!targetSchoolId) {
      toast.error('Please select a school');
      return;
    }

    await createMutation.mutateAsync({
      schoolId: targetSchoolId,
      planId: data.planId,
      startsAt: data.startsAt,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      trialEndsAt: isTrialing && data.trialEndsAt ? data.trialEndsAt : undefined,
    });

    if (!createMutation.isPending) {
      reset();
      setSelectedSchoolId('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Plan</DialogTitle>
          <DialogDescription>
            {isSuperAdmin 
              ? 'Create a new subscription for a school. Choose a plan and configure the billing period.'
              : 'Select a plan to subscribe your school. Start with a free trial if you prefer.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {!isSuperAdmin && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You are subscribing <strong>{schoolId}</strong>. All plans include a 14-day free trial.
              </AlertDescription>
            </Alert>
          )}

          {/* School Selection for Super Admin */}
          {isSuperAdmin && (
            <div className="space-y-3">
              <Label htmlFor="schoolId">Select School</Label>
              {isLoadingSchools ? (
                <div className="text-sm text-gray-500 py-4 text-center">Loading schools...</div>
              ) : (
                <Select
                  value={selectedSchoolId}
                  onValueChange={(value) => setSelectedSchoolId(value)}
                  disabled={createMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school: any) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!selectedSchoolId && (
                <p className="text-red-600 text-sm mt-1">Please select a school</p>
              )}
            </div>
          )}

          {/* Plan Selection */}
          <div className="space-y-3">
            <Label htmlFor="planId">Select Plan</Label>
            {isLoadingPlans || !plansData ? (
              <div className="text-sm text-gray-500 py-4 text-center">Loading plans...</div>
            ) : (
              <div className="grid gap-3">
                {availablePlans.map((plan: Plan) => (
                  <div
                    key={plan.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPlanId === plan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('planId', plan.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={selectedPlanId === plan.id}
                            onChange={() => setValue('planId', plan.id)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={`plan-${plan.id}`} className="font-semibold cursor-pointer">
                            {plan.name}
                          </Label>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 ml-6">{plan.description}</p>
                        <div className="flex items-baseline gap-2 mt-2 ml-6">
                          <span className="text-2xl font-bold">{formatCurrency(plan.priceMinor / 100)}</span>
                          <span className="text-sm text-gray-600">
                            {plan.currency} / {plan.billingInterval?.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="mt-3 ml-6 grid grid-cols-2 gap-2">
                        {plan.features.map((feature: any) => (
                          <div key={feature.id} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-gray-700">{feature.featureKey.replace(/_/g, ' ')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {errors.planId && (
              <p className="text-red-600 text-sm mt-1">{errors.planId.message}</p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <Label htmlFor="startsAt">Start Date</Label>
            <Input
              id="startsAt"
              type="date"
              {...register('startsAt')}
              disabled={createMutation.isPending}
            />
            {errors.startsAt && (
              <p className="text-red-600 text-sm mt-1">{errors.startsAt.message}</p>
            )}
          </div>

          {/* Billing Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentPeriodStart">Period Start</Label>
              <Input
                id="currentPeriodStart"
                type="date"
                {...register('currentPeriodStart')}
                disabled={createMutation.isPending}
              />
              {errors.currentPeriodStart && (
                <p className="text-red-600 text-sm mt-1">{errors.currentPeriodStart.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="currentPeriodEnd">Period End</Label>
              <Input
                id="currentPeriodEnd"
                type="date"
                {...register('currentPeriodEnd')}
                disabled={createMutation.isPending}
              />
              {errors.currentPeriodEnd && (
                <p className="text-red-600 text-sm mt-1">{errors.currentPeriodEnd.message}</p>
              )}
            </div>
          </div>

          {/* Trial Mode */}
          {selectedPlan && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isTrialing"
                  checked={isTrialing}
                  onCheckedChange={(checked) => setIsTrialing(checked as boolean)}
                  disabled={createMutation.isPending}
                />
                <Label htmlFor="isTrialing" className="font-normal cursor-pointer">
                  Start with a 14-day trial period
                </Label>
              </div>

              {isTrialing && (
                <div>
                  <Label htmlFor="trialEndsAt">Trial End Date</Label>
                  <Input
                    id="trialEndsAt"
                    type="date"
                    {...register('trialEndsAt')}
                    disabled={createMutation.isPending}
                    min={watch('startsAt')}
                  />
                  {errors.trialEndsAt && (
                    <p className="text-red-600 text-sm mt-1">{errors.trialEndsAt.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    You won't be charged until the trial ends. Cancel anytime during the trial.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {selectedPlan && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-1">Subscription Summary</p>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Plan:</strong> {selectedPlan.name}</p>
                <p><strong>Price:</strong> {formatCurrency(selectedPlan.priceMinor/100)} {selectedPlan.currency} / {selectedPlan.billingInterval?.toLowerCase()}</p>
                {isTrialing && <p><strong>Trial:</strong> Ends {watch('trialEndsAt') || 'after 14 days'}</p>}
                {!isTrialing && <p><strong>Billing:</strong> Starts immediately</p>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !selectedPlanId}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Subscription'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}