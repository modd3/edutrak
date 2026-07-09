import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { useCreateSubscription } from '@/hooks/use-subscriptions';
import { useSchoolContext, } from '@/hooks/use-school-context';
import { useSchools } from '@/hooks/use-schools';
import { School } from '@/types';

const createSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Plan is required'),
  schoolId: z.string().min(1, 'School is required'),
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
  const schoolsData = useSchools();
  const createMutation = useCreateSubscription();
  const [isTrialing, setIsTrialing] = useState(false);
    
  const schools = schoolsData.data?.data
 
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

  const selectedSchool = watch("schoolId");
  const onSubmit = async (data: CreateSubscriptionInput) => {
    // Prefer the selected school when super admin, otherwise use context school
    const finalSchoolId = isSuperAdmin ? (selectedSchool ?? schoolId) : schoolId;
    if (!finalSchoolId) {
      return;
    }

    await createMutation.mutateAsync({
      schoolId: finalSchoolId,
      planId: data.planId,
      startsAt: data.startsAt,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      trialEndsAt: isTrialing && data.trialEndsAt ? data.trialEndsAt : undefined,
    });

    if (!createMutation.isPending) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Subscription</DialogTitle>
          <DialogDescription>
            Set up a new subscription for your school with a selected plan
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* School Selection (only applicable when user is SUPER_ADMIN) */}
         {isSuperAdmin &&
          <div>
            <Label htmlFor="schoolId">Select School</Label>
            <Select
              value={selectedSchool}
              onValueChange={(value) => setValue('schoolId', value)}
              disabled={!isSuperAdmin || isLoadingPlans || createMutation.isPending}
            >
              <SelectTrigger id="schoolId">
                <SelectValue placeholder="Select a School" />
              </SelectTrigger>
              <SelectContent>
                {schools?.map((school: School) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name} 
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.schoolId && (
              <p className="text-red-600 text-sm mt-1">{errors.schoolId.message}</p>
            )}
          </div>}
          {/* Plan Selection */}
          <div>
            <Label htmlFor="planId">Billing Plan</Label>
            <Select
              value={watch('planId')}
              onValueChange={(value) => setValue('planId', value)}
              disabled={isLoadingPlans || createMutation.isPending}
            >
              <SelectTrigger id="planId">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - {(plan.priceMinor / 100).toFixed(2)} {plan.currency} / {plan.billingInterval}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.planId && (
              <p className="text-red-600 text-sm mt-1">{errors.planId.message}</p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <Label htmlFor="startsAt">Subscription Start Date</Label>
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
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isTrialing"
              checked={isTrialing}
              onChange={(e) => setIsTrialing(e.target.checked)}
              disabled={createMutation.isPending}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isTrialing" className="font-normal cursor-pointer">
              Start with trial period
            </Label>
          </div>

          {/* Trial End Date */}
          {isTrialing && (
            <div>
              <Label htmlFor="trialEndsAt">Trial End Date</Label>
              <Input
                id="trialEndsAt"
                type="date"
                {...register('trialEndsAt')}
                disabled={createMutation.isPending}
              />
              {errors.trialEndsAt && (
                <p className="text-red-600 text-sm mt-1">{errors.trialEndsAt.message}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
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
