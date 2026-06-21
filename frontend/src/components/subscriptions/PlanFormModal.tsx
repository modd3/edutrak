import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useCreatePlan, useUpdatePlan } from '@/hooks/use-plans';
import { Plan } from '@/types';
import { Badge } from '@/components/ui/badge';

// Mirrors the server-side FEATURE_REGISTRY so the UI offers known feature keys
const FEATURE_REGISTRY: Record<string, { name: string; limitType: 'BOOLEAN' | 'COUNT' }> = {
  'fees.core': { name: 'Fee Management', limitType: 'BOOLEAN' },
  'fees.mpesa': { name: 'M-PESA Integration', limitType: 'BOOLEAN' },
  'fees.report': { name: 'Fee Reports', limitType: 'BOOLEAN' },
  'academic.core': { name: 'Academic Management', limitType: 'BOOLEAN' },
  'assessments.bulk': { name: 'Bulk Grade Entry', limitType: 'BOOLEAN' },
  'students.max': { name: 'Student Limit', limitType: 'COUNT' },
  'teachers.max': { name: 'Teacher Limit', limitType: 'COUNT' },
  'sms.monthly_quota': { name: 'SMS Quota', limitType: 'COUNT' },
  'lms.core': { name: 'Learning Management', limitType: 'BOOLEAN' },
};

const FEATURE_KEYS = Object.keys(FEATURE_REGISTRY);

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
  features: z.array(
    z.object({
      featureKey: z.string().min(1, 'Select a feature'),
      enabled: z.boolean().default(true),
      limitType: z.enum(['BOOLEAN', 'COUNT']).default('BOOLEAN'),
      limitValue: z.number().int().positive().optional().nullable(),
    }).refine(
      d => d.limitType === 'BOOLEAN' || d.limitValue !== undefined,
      { message: 'Limit value is required when limit type is COUNT', path: ['limitValue'] }
    )
  ).optional(),
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
    control,
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
      features: initialData?.features?.map(f => ({
        featureKey: f.featureKey,
        enabled: f.enabled,
        limitType: f.limitType as 'BOOLEAN' | 'COUNT',
        limitValue: f.limitValue ?? null,
      })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'features',
  });

  const billingInterval = watch('billingInterval');
  const isActive = watch('isActive');
  const features = watch('features');

  useEffect(() => {
    if (open && initialData) {
      setValue('key', initialData.key);
      setValue('name', initialData.name);
      setValue('description', initialData.description);
      setValue('priceMinor', initialData.priceMinor);
      setValue('currency', initialData.currency);
      setValue('billingInterval', initialData.billingInterval as any);
      setValue('isActive', initialData.isActive);

      // Reset the features array with initial data
      setValue('features', initialData.features?.map(f => ({
        featureKey: f.featureKey,
        enabled: f.enabled,
        limitType: f.limitType as 'BOOLEAN' | 'COUNT',
        limitValue: f.limitValue ?? null,
      })) || []);
    }
  }, [open, initialData, setValue]);

  const onSubmit = async (data: PlanFormInput) => {
    try {
      // Strip out empty/incomplete feature rows
      const featuresPayload = (data.features || [])
        .filter(f => f.featureKey)
        .map(f => ({
          featureKey: f.featureKey,
          enabled: f.enabled,
          limitType: f.limitType,
          limitValue: f.limitType === 'COUNT' ? f.limitValue : null,
        }));

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
            features: featuresPayload.length > 0 ? featuresPayload : undefined,
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
          features: featuresPayload.length > 0 ? featuresPayload : undefined,
        });
      }
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleAddFeature = () => {
    append({
      featureKey: '',
      enabled: true,
      limitType: 'BOOLEAN',
      limitValue: null,
    });
  };

  const handleFeatureKeySelect = (index: number, value: string) => {
    const featureDef = FEATURE_REGISTRY[value];
    setValue(`features.${index}.featureKey`, value);
    if (featureDef) {
      setValue(`features.${index}.limitType`, featureDef.limitType);
      if (featureDef.limitType === 'BOOLEAN') {
        setValue(`features.${index}.limitValue`, null);
      }
    }
  };

  // Determine which feature keys are already selected (to prevent duplicates)
  const selectedKeys = (features || []).map(f => f?.featureKey).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the billing plan details and features' : 'Create a new billing plan with features for subscriptions'}
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

          {/* ===== FEATURES SECTION ===== */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Plan Features</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddFeature}
                disabled={isLoading}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Feature
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-gray-500 py-2">
                No features configured. Click "Add Feature" to attach capabilities to this plan.
              </p>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-md p-3 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feature #{index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={isLoading}
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  {/* Feature Key */}
                  <div className="col-span-5">
                    <Label className="text-xs">Feature</Label>
                    <Select
                      value={watch(`features.${index}.featureKey`) || ''}
                      onValueChange={(value) => handleFeatureKeySelect(index, value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={errors.features?.[index]?.featureKey ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a feature..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FEATURE_KEYS.map((key) => {
                          const isSelected = selectedKeys.includes(key);
                          const isCurrent = (features?.[index]?.featureKey) === key;
                          return (
                            <SelectItem key={key} value={key} disabled={isSelected && !isCurrent}>
                              <span className="flex items-center gap-2">
                                {FEATURE_REGISTRY[key].name}
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {key}
                                </Badge>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors.features?.[index]?.featureKey && (
                      <p className="text-red-600 text-xs mt-1">{errors.features[index]?.featureKey?.message}</p>
                    )}
                  </div>

                  {/* Enabled Toggle */}
                  <div className="col-span-2 flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register(`features.${index}.enabled`)}
                        disabled={isLoading}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Enabled</span>
                    </label>
                  </div>

                  {/* Limit Type */}
                  <div className="col-span-2">
                    <Label className="text-xs">Limit Type</Label>
                    <Select
                      value={watch(`features.${index}.limitType`) || 'BOOLEAN'}
                      onValueChange={(value: 'BOOLEAN' | 'COUNT') => {
                        setValue(`features.${index}.limitType`, value);
                        if (value === 'BOOLEAN') {
                          setValue(`features.${index}.limitValue`, null);
                        }
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOOLEAN">On/Off</SelectItem>
                        <SelectItem value="COUNT">Count</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Limit Value (only for COUNT) */}
                  <div className="col-span-3">
                    {watch(`features.${index}.limitType`) === 'COUNT' ? (
                      <>
                        <Label className="text-xs">Limit Value</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g., 500"
                          {...register(`features.${index}.limitValue`, {
                            setValueAs: (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
                          })}
                          disabled={isLoading}
                          className={errors.features?.[index]?.limitValue ? 'border-red-500' : ''}
                        />
                        {errors.features?.[index]?.limitValue && (
                          <p className="text-red-600 text-xs mt-1">{errors.features[index]?.limitValue?.message}</p>
                        )}
                      </>
                    ) : (
                      <div className="pt-5">
                        <p className="text-xs text-gray-400">N/A</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {errors.features && !Array.isArray(errors.features) && (
              <p className="text-red-600 text-sm">{errors.features.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
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