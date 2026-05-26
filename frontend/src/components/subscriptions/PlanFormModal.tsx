import { useEffect } from 'react';
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
import { useCreatePlan, useUpdatePlan } from '@/hooks/use-plans';
import { Plan } from '@/api/plans-api';

const planFormSchema = z.object({
  key: z.string().min(1, 'Plan key is required').regex(/^[a-z0-9_-]+$/, 'Key must be lowercase with only letters, numbers, hyphens, and underscores'),
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  priceMinor: z.number().min(0, 'Price must be greater than or equal to 0'),
  currency: z.string().default('KES'),
  billingInterval: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY'], {
    errorMap: () => ({ message: 'Please select a valid billing interval' }),
  }),
  isActive: z.boolean().default(true),
});

type PlanFormInput = z.infer<typeof planFormSchema>;

interface PlanFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Plan;
  isEditing?: boolean;
}

export function PlanFormModal({
  open,
  onOpenChange,
  initialData,
  isEditing = false,
}: PlanFormModalProps) {
  const createMutation = useCreatePlan();
  const updateMutation = useUpdatePlan();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlanFormInput>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      key: initialData?.key || '',
      name: initialData?.name || '',
      description: initialData?.description || '',
      priceMinor: initialData?.priceMinor || 0,
      currency: initialData?.currency || 'KES',
      billingInterval: (initialData?.billingInterval as any) || 'MONTHLY',
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    },
  });

  const billingInterval = watch('billingInterval');
  const isActive = watch('isActive');

  useEffect(() => {
    if (open && initialData) {
      setValue('key', initialData.key);
      setValue('name', initialData.name);
      setValue('description', initialData.description);
      setValue('priceMinor', initialData.priceMinor);
      setValue('currency', initialData.currency);
      setValue('billingInterval', initialData.billingInterval as any);
      setValue('isActive', initialData.isActive);
    }
  }, [open, initialData, setValue]);

  const onSubmit = async (data: PlanFormInput) => {
    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: {
            name: data.name,
            description: data.description,
            priceMinor: data.priceMinor,
            currency: data.currency,
            billingInterval: data.billingInterval,
            isActive: data.isActive,
          },
        });
      } else {
        await createMutation.mutateAsync({
          key: data.key,
          name: data.name,
          description: data.description,
          priceMinor: data.priceMinor,
          currency: data.currency,
          billingInterval: data.billingInterval,
          isActive: data.isActive,
        });
      }
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the billing plan details' : 'Create a new billing plan for subscriptions'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Plan Key */}
          <div>
            <Label htmlFor="key">Plan Key *</Label>
            <Input
              id="key"
              placeholder="e.g., starter, pro, enterprise"
              {...register('key')}
              disabled={isLoading || isEditing}
              className={errors.key ? 'border-red-500' : ''}
            />
            {errors.key && (
              <p className="text-red-600 text-sm mt-1">{errors.key.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Lowercase alphanumeric, hyphens, and underscores only. Cannot be changed after creation.</p>
          </div>

          {/* Plan Name */}
          <div>
            <Label htmlFor="name">Plan Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Starter Plan"
              {...register('name')}
              disabled={isLoading}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Brief description of the plan"
              {...register('description')}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Price and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priceMinor">Price (in cents) *</Label>
              <Input
                id="priceMinor"
                type="number"
                min="0"
                placeholder="e.g., 9999 for 99.99"
                {...register('priceMinor', { valueAsNumber: true })}
                disabled={isLoading}
                className={errors.priceMinor ? 'border-red-500' : ''}
              />
              {errors.priceMinor && (
                <p className="text-red-600 text-sm mt-1">{errors.priceMinor.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={watch('currency')}
                onValueChange={(value) => setValue('currency', value)}
                disabled={isLoading}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-red-600 text-sm mt-1">{errors.currency.message}</p>
              )}
            </div>
          </div>

          {/* Billing Interval */}
          <div>
            <Label htmlFor="billingInterval">Billing Interval *</Label>
            <Select
              value={billingInterval}
              onValueChange={(value) => setValue('billingInterval', value as any)}
              disabled={isLoading}
            >
              <SelectTrigger id="billingInterval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                <SelectItem value="ANNUALLY">Annually</SelectItem>
              </SelectContent>
            </Select>
            {errors.billingInterval && (
              <p className="text-red-600 text-sm mt-1">{errors.billingInterval.message}</p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setValue('isActive', e.target.checked)}
              disabled={isLoading}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isActive" className="font-normal cursor-pointer">
              Active (available for new subscriptions)
            </Label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : isEditing ? (
                'Update Plan'
              ) : (
                'Create Plan'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
