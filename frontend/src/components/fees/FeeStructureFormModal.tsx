// frontend/src/components/fees/FeeStructureFormModal.tsx
// Create or edit a fee structure, including dynamic fee item rows.

import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { useCreateFeeStructure, useUpdateFeeStructure } from '@/hooks/use-fees';
import { useSchoolContext } from '@/hooks/use-school-context';

// ─── Zod Schema ────────────────────────────────────────────────────────────────

const feeItemSchema = z.object({
  id: z.string().optional(),           // present when editing existing item
  name: z.string().min(1, 'Item name is required'),
  amount: z.coerce.number().min(0, 'Amount must be ≥ 0'),
  category: z.enum([
    'TUITION', 'BOARDING', 'TRANSPORT', 'UNIFORM', 'BOOKS',
    'ACTIVITY', 'EXAM', 'MEDICAL', 'CAUTION', 'OTHER',
  ]),
  isOptional: z.boolean().default(false),
  description: z.string().optional(),
});

const feeStructureSchema = z.object({
  name: z.string().min(1, 'Structure name is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  termId: z.string().optional(),
  classLevel: z.string().min(1, 'Class level is required'),
  isActive: z.boolean().default(true),
  items: z.array(feeItemSchema).min(1, 'At least one fee item is required'),
});

type FeeStructureFormValues = z.infer<typeof feeStructureSchema>;

// ─── Props ──────────────────────────────────────────────────────────────────────

interface FeeStructureFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass existing structure data to switch into edit mode */
  initialData?: {
    id: string;
    name: string;
    academicYearId: string;
    termId?: string;
    classLevel: string;
    isActive: boolean;
    items: Array<{
      id: string;
      name: string;
      amount: number;
      category: string;
      isOptional: boolean;
      description?: string;
    }>;
  };
  /** Injected dropdown options — fetch from your academic year / term hooks */
  academicYears: Array<{ id: string; name: string }>;
  terms: Array<{ id: string; name: string }>;
  classLevels: string[];   // e.g. ['Grade 1', 'Grade 2', ...]
  onSuccess?: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const FEE_CATEGORIES = [
  'TUITION', 'BOARDING', 'TRANSPORT', 'UNIFORM', 'BOOKS',
  'ACTIVITY', 'EXAM', 'MEDICAL', 'CAUTION', 'OTHER',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  TUITION: 'Tuition',
  BOARDING: 'Boarding',
  TRANSPORT: 'Transport',
  UNIFORM: 'Uniform',
  BOOKS: 'Books & Stationery',
  ACTIVITY: 'Activity / Co-curricular',
  EXAM: 'Examination',
  MEDICAL: 'Medical / Health',
  CAUTION: 'Caution / Deposit',
  OTHER: 'Other',
};

const EMPTY_ITEM = {
  name: '',
  amount: 0,
  category: 'TUITION' as const,
  isOptional: false,
  description: '',
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function FeeStructureFormModal({
  open,
  onOpenChange,
  initialData,
  academicYears,
  terms,
  classLevels,
  onSuccess,
}: FeeStructureFormModalProps) {
  const isEditMode = !!initialData;
  const { schoolId } = useSchoolContext();

  const createStructure = useCreateFeeStructure();
  const updateStructure = useUpdateFeeStructure();

  const form = useForm<FeeStructureFormValues>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: {
      name: '',
      academicYearId: '',
      termId: '',
      classLevel: '',
      isActive: true,
      items: [{ ...EMPTY_ITEM }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Populate form when editing
  useEffect(() => {
    if (open && initialData) {
      form.reset({
        name: initialData.name,
        academicYearId: initialData.academicYearId,
        termId: initialData.termId ?? '',
        classLevel: initialData.classLevel,
        isActive: initialData.isActive,
        items: initialData.items.map((i) => ({
          id: i.id,
          name: i.name,
          amount: i.amount,
          category: i.category as any,
          isOptional: i.isOptional,
          description: i.description ?? '',
        })),
      });
    }
    if (open && !initialData) {
      form.reset({
        name: '',
        academicYearId: '',
        termId: '',
        classLevel: '',
        isActive: true,
        items: [{ ...EMPTY_ITEM }],
      });
    }
  }, [open, initialData]);

  // Calculate running total
  const watchedItems = form.watch('items');
  const total = watchedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  async function onSubmit(values: FeeStructureFormValues) {
    const payload = {
      ...values,
      schoolId,
      termId: values.termId || undefined,
    };

    if (isEditMode) {
      await updateStructure.mutateAsync({ id: initialData!.id, data: payload });
    } else {
      await createStructure.mutateAsync(payload);
    }

    onSuccess?.();
    onOpenChange(false);
  }

  const isPending = createStructure.isPending || updateStructure.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Fee Structure' : 'Create Fee Structure'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* ── Header fields ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Structure Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Term 1 – Grade 7 Day Scholar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Academic Year */}
              <FormField
                control={form.control}
                name="academicYearId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYears.map((y) => (
                          <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Term (optional) */}
              <FormField
                control={form.control}
                name="termId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All terms / annual" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">All terms</SelectItem>
                        {terms.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Class Level */}
              <FormField
                control={form.control}
                name="classLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classLevels.map((cl) => (
                          <SelectItem key={cl} value={cl}>{cl}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Active toggle */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 mt-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">Active</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* ── Fee Items ────────────────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Fee Items</h3>
                <span className="text-xs text-muted-foreground">
                  Total:{' '}
                  <span className="font-medium text-foreground">
                    KES {total.toLocaleString()}
                  </span>
                </span>
              </div>

              {/* Column headers */}
              <div className="hidden sm:grid grid-cols-[1fr_1fr_110px_80px_36px] gap-2 px-1">
                <span className="text-xs text-muted-foreground font-medium">Name</span>
                <span className="text-xs text-muted-foreground font-medium">Category</span>
                <span className="text-xs text-muted-foreground font-medium">Amount (KES)</span>
                <span className="text-xs text-muted-foreground font-medium">Optional</span>
                <span />
              </div>

              {fields.map((fieldItem, index) => (
                <div
                  key={fieldItem.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_110px_80px_36px] gap-2 items-start p-2 rounded-md bg-muted/30 border border-border/60"
                >
                  {/* Drag handle (visual only) */}
                  <div className="hidden sm:flex items-center col-start-1 row-start-1 absolute -ml-5 mt-2 opacity-30">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Name */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sm:hidden text-xs">Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Tuition Fee" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.category`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sm:hidden text-xs">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {FEE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {CATEGORY_LABELS[cat]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Amount */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sm:hidden text-xs">Amount (KES)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Optional toggle */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.isOptional`}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 pt-1">
                        <FormLabel className="sm:hidden text-xs">Optional</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        {field.value && (
                          <Badge variant="outline" className="text-xs">Optional</Badge>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Remove button */}
                  <div className="flex items-center pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Description (full width, collapsed) */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="sm:col-span-5">
                        <FormControl>
                          <Input
                            placeholder="Description (optional)"
                            className="text-xs h-7"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              ))}

              {/* Add item */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ ...EMPTY_ITEM })}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Fee Item
              </Button>

              {/* Error on items array level */}
              {form.formState.errors.items?.root && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.items.root.message}
                </p>
              )}
            </div>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditMode ? 'Saving…' : 'Creating…'
                  : isEditMode ? 'Save Changes' : 'Create Structure'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}