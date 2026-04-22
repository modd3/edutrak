import { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { any, array, z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button as IconButton } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { useCreateFeeStructure, useUpdateFeeStructure, useGetFeeStructureById } from '@/hooks/use-fees';
import { useAcademicYear, useAcademicYears } from '@/hooks/use-academic';

// ══════════════════════════════════════════════════════════════════════════
// ZOD SCHEMA
// ══════════════════════════════════════════════════════════════════════════

const feeItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(200),
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  isOptional: z.boolean().default(false),
  description: z.string().max(300).optional(),
});

const feeStructureSchema = z.object({
  name: z.string().min(1, 'Structure name is required').max(200),
  description: z.string().max(500).optional(),
  academicYearId: z.string().min(1, 'Academic year is required'),
  termId: z.string().optional(),
  classLevel: z.string().max(20).optional(),
  boardingStatus: z.enum(['DAY', 'BOARDING', 'BOTH']).optional(),
  currency: z.string().length(3).default('KES'),
  items: z
    .array(feeItemSchema)
    .min(1, 'At least one fee item is required'),
});

type FeeStructureFormData = z.infer<typeof feeStructureSchema>;

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

interface FeeStructureFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  structureId?: string;
}

const FEE_CATEGORIES = [
  'TUITION',
  'BOARDING',
  'LUNCH',
  'TRANSPORT',
  'ACTIVITY',
  'UNIFORM',
  'EXAM',
  'LIBRARY',
  'LABORATORY',
  'DEVELOPMENT',
  'MISCELLANEOUS',
];

const CLASS_LEVELS = [
  'Grade 1-3',
  'Grade 4-6',
  'Grade 7-9',
  'Grade 10-12',
  'Form 1-2',
  'Form 3-4',
];

export function FeeStructureFormModal({
  open,
  onOpenChange,
  mode,
  structureId,
}: FeeStructureFormModalProps) {
  const [availableTerms, setAvailableTerms] = useState<string[]>([]);
  const { mutate: createStructure, isPending: isCreating } = useCreateFeeStructure();
  const { mutate: updateStructure, isPending: isUpdating } = useUpdateFeeStructure();
  const { data: structureData } = useGetFeeStructureById(
    mode === 'edit' && structureId ? structureId : ''
  );
  const { data: academicYearsData } = useAcademicYears();

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FeeStructureFormData>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: {
      name: '',
      description: '',
      academicYearId: '',
      termId: '',
      classLevel: '',
      boardingStatus: undefined,
      currency: 'KES',
      items: [{ name: '', category: '', amount: 0, isOptional: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: control,
    name: 'items',
  });

  const academicYears = academicYearsData?.data || [];

  const selectedAcademicYearId = watch('academicYearId');
  const selectedAYData = useAcademicYear(selectedAcademicYearId);
  const selectedAY = selectedAYData.data?.data;

  const selectedCurrency = watch('currency');
  console.log("Currency: ", selectedCurrency);

  useEffect(() => {
      if (selectedAY) {
        setAvailableTerms(selectedAY.terms);
      } else {
        setAvailableTerms([]);
      }
    }, [selectedAY]);

  // Populate form with existing data in edit mode
  useEffect(() => {
    if (mode === 'edit' && structureData?.data) {
      const structure = structureData.data;
      reset({
        name: structure.name,
        description: structure.description || '',
        academicYearId: structure.academicYearId,
        termId: structure.termId || '',
        classLevel: structure.classLevel || '',
        boardingStatus: structure.boardingStatus,
        currency: structure.currency || 'KES',
        items: structure.items || [
          { name: '', category: '', amount: 0, isOptional: false },
        ],
      });
    }
  }, [structureData, mode]);

  const onSubmit = (data: FeeStructureFormData) => {
    setIsLoading(true);

    if (mode === 'create') {
      createStructure(data, {
        onSuccess: () => {
          onOpenChange(false);
          reset();
          setIsLoading(false);
        },
        onError: () => {
          setIsLoading(false);
        },
      });
    } else if (mode === 'edit' && structureId) {
      // For edit, only send updatable fields (not items)
      const editData = {
        name: data.name,
        description: data.description,
        classLevel: data.classLevel,
        boardingStatus: data.boardingStatus,
      };

      updateStructure(
        { id: structureId, data: editData },
        {
          onSuccess: () => {
            onOpenChange(false);
            reset();
            setIsLoading(false);
          },
          onError: () => {
            setIsLoading(false);
          },
        }
      );
    }
  };

  useEffect(() => {
      if (!open) {
        reset();
        setAvailableTerms([]);
      }
    }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Fee Structure' : 'Edit Fee Structure'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new fee structure with line items for a specific class level.'
              : 'Update fee structure details. To modify items, use the structure details page.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-180px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Structure Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="e.g., Form 1-2 Day Students"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year *</Label>
                  <Controller
                    name="academicYearId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears.map((year: any) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.year}
                            </SelectItem>
                          
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.academicYearId && (
                    <p className="text-xs text-red-500">
                      {errors.academicYearId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="term">Term *</Label>
                  <Controller
                    name="termId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Term" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTerms.map((term: any) => (
                            <SelectItem key={term.id} value={term.id}>
                              {term.name.replace("_", " ")}
                            </SelectItem>
                          
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.termId && (
                    <p className="text-xs text-red-500">
                      {errors.termId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classLevel">Class Level</Label>
                  <Controller
                    name="classLevel"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class level" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASS_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="boardingStatus">Boarding Status</Label>
                  <Controller
                    name="boardingStatus"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAY">Day</SelectItem>
                          <SelectItem value="BOARDING">Boarding</SelectItem>
                          <SelectItem value="BOTH">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Currency</Label>
                  <Input
                    id="currency"
                    {...register('currency')}
                    placeholder="e.g., KES/USD"
                  />
                  
                </div>

              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
            </div>

            {/* Fee Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Fee Items *</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      name: '',
                      category: '',
                      amount: 0,
                      isOptional: false,
                    })
                  }
                  disabled={mode === 'edit'}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {mode === 'edit' && (
                <p className="text-xs text-amber-600">
                  To add or modify fee items, please use the structure details page after creating.
                </p>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-4 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`items.${index}.name`}>Item Name</Label>
                          <Input
                            id={`items.${index}.name`}
                            {...register(`items.${index}.name`)}
                            placeholder="e.g., Tuition"
                            disabled={mode === 'edit'}
                          />
                          {errors.items?.[index]?.name && (
                            <p className="text-xs text-red-500">
                              {errors.items[index]?.name?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`items.${index}.category`}>Category</Label>
                          <Controller
                            name={`items.${index}.category`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={mode === 'edit'}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {FEE_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                      {cat}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.items?.[index]?.category && (
                            <p className="text-xs text-red-500">
                              {errors.items[index]?.category?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`items.${index}.amount`}>Amount ({selectedCurrency})</Label>
                          <Input
                            id={`items.${index}.amount`}
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.amount`)}
                            placeholder="0.00"
                            disabled={mode === 'edit'}
                          />
                          {errors.items?.[index]?.amount && (
                            <p className="text-xs text-red-500">
                              {errors.items[index]?.amount?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 flex flex-col justify-between">
                          <Label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              {...register(`items.${index}.isOptional`)}
                              disabled={mode === 'edit'}
                            />
                            Optional
                          </Label>
                          {mode === 'create' && (
                            <IconButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </IconButton>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {errors.items && (
                <p className="text-xs text-red-500">{errors.items.message}</p>
              )}
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading || isCreating || isUpdating}
          >
            {isLoading || isCreating || isUpdating
              ? 'Saving...'
              : mode === 'create'
                ? 'Create Structure'
                : 'Update Structure'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
