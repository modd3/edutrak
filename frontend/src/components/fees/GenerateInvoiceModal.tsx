// frontend/src/components/fees/GenerateInvoicesModal.tsx
// Two-step bulk invoice generation wizard:
//   Step 1 — Configure (select structure, class, filters)
//   Step 2 — Preview / Confirm results

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useBulkGenerateInvoices, useGetFeeStructures } from '@/hooks/use-fees';
import { useSchoolContext } from '@/hooks/use-school-context';
import { formatCurrency } from '@/lib/utils';

// ─── Schema ────────────────────────────────────────────────────────────────────

const configSchema = z.object({
  feeStructureId: z.string().min(1, 'Please select a fee structure'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  termId: z.string().optional(),
  classLevel: z.string().optional(),
  skipExisting: z.boolean().default(true),
  dueDate: z.string().optional(),
});

type ConfigValues = z.infer<typeof configSchema>;

// ─── Props ──────────────────────────────────────────────────────────────────────

interface GenerateInvoicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected academic year (from page-level term selector) */
  defaultAcademicYearId?: string;
  defaultTermId?: string;
  academicYears: Array<{ id: string; name: string }>;
  terms: Array<{ id: string; name: string }>;
  classLevels: string[];
  onSuccess?: (result: { generated: number; skipped: number }) => void;
}

// ─── Step indicators ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2].map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
              step === current
                ? 'bg-primary text-primary-foreground'
                : step < current
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {step < current ? <CheckCircle2 className="w-4 h-4" /> : step}
          </div>
          <span
            className={`text-xs ${
              step === current ? 'font-medium text-foreground' : 'text-muted-foreground'
            }`}
          >
            {step === 1 ? 'Configure' : 'Confirm'}
          </span>
          {step < 2 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function GenerateInvoicesModal({
  open,
  onOpenChange,
  defaultAcademicYearId = '',
  defaultTermId = '',
  academicYears,
  terms,
  classLevels,
  onSuccess,
}: GenerateInvoicesModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [configValues, setConfigValues] = useState<ConfigValues | null>(null);
  const [result, setResult] = useState<{ generated: number; skipped: number } | null>(null);

  const { schoolId } = useSchoolContext();
  const bulkGenerate = useBulkGenerateInvoices();

  const { data: structuresData } = useGetFeeStructures({
    academicYearId: defaultAcademicYearId || undefined,
    isActive: true,
  });
  const structures = structuresData?.data?.data ?? [];

  const form = useForm<ConfigValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      feeStructureId: '',
      academicYearId: defaultAcademicYearId,
      termId: defaultTermId,
      classLevel: '',
      skipExisting: true,
      dueDate: '',
    },
  });

  // Grab selected structure for preview
  const watchedStructureId = form.watch('feeStructureId');
  const selectedStructure = structures.find((s: any) => s.id === watchedStructureId);

  function handleClose() {
    form.reset();
    setStep(1);
    setConfigValues(null);
    setResult(null);
    onOpenChange(false);
  }

  function handleConfigSubmit(values: ConfigValues) {
    setConfigValues(values);
    setStep(2);
  }

  async function handleConfirm() {
    if (!configValues) return;

    const payload = {
      schoolId,
      feeStructureId: configValues.feeStructureId,
      academicYearId: configValues.academicYearId,
      termId: configValues.termId || undefined,
      classLevel: configValues.classLevel || undefined,
      skipExisting: configValues.skipExisting,
      dueDate: configValues.dueDate || undefined,
    };

    const response = await bulkGenerate.mutateAsync(payload);
    const res = {
      generated: response?.data?.data?.generated ?? 0,
      skipped: response?.data?.data?.skipped ?? 0,
    };
    setResult(res);
    onSuccess?.(res);
  }

  const totalAmount = selectedStructure?.items?.reduce(
    (sum: number, item: any) => sum + (item.isOptional ? 0 : Number(item.amount)),
    0
  ) ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Bulk Generate Invoices
          </DialogTitle>
          <DialogDescription>
            Generate fee invoices for a class or all students in one step.
          </DialogDescription>
        </DialogHeader>

        {/* Success result */}
        {result ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Invoices Generated</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  The fee invoices have been created successfully.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{result.generated}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Generated</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-muted-foreground">{result.skipped}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Skipped (existed)</p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <StepIndicator current={step} />

            {/* ── STEP 1: Configure ── */}
            {step === 1 && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleConfigSubmit)} className="space-y-4">

                  {/* Fee Structure */}
                  <FormField
                    control={form.control}
                    name="feeStructureId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fee Structure</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a fee structure" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {structures.length === 0 ? (
                              <SelectItem value="__none" disabled>
                                No active structures found
                              </SelectItem>
                            ) : (
                              structures.map((s: any) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Selected structure preview */}
                  {selectedStructure && (
                    <div className="rounded-md bg-muted/40 border px-3 py-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{selectedStructure.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedStructure.classLevel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedStructure.items?.length ?? 0} items ·{' '}
                        Base amount: {formatCurrency(totalAmount)}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
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
                                <SelectValue placeholder="Year" />
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

                    {/* Term */}
                    <FormField
                      control={form.control}
                      name="termId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Term</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="All" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">All terms</SelectItem>
                              {terms.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Class Level (optional filter) */}
                  <FormField
                    control={form.control}
                    name="classLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Class Level{' '}
                          <span className="text-muted-foreground text-xs">(leave blank for all)</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="All classes" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">All classes</SelectItem>
                            {classLevels.map((cl) => (
                              <SelectItem key={cl} value={cl}>{cl}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  {/* Due date */}
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Due Date{' '}
                          <span className="text-muted-foreground text-xs">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <input
                            type="date"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Skip existing toggle */}
                  <FormField
                    control={form.control}
                    name="skipExisting"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3 rounded-md border px-3 py-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="skipExisting"
                          />
                        </FormControl>
                        <div className="space-y-0.5">
                          <FormLabel htmlFor="skipExisting" className="cursor-pointer">
                            Skip students who already have an invoice
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Prevents duplicate invoices for the same term.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Preview <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}

            {/* ── STEP 2: Confirm ── */}
            {step === 2 && configValues && (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    This will generate invoices for all eligible students. This action cannot be
                    undone in bulk — individual invoices can be cancelled if needed.
                  </AlertDescription>
                </Alert>

                {/* Summary */}
                <div className="rounded-md border divide-y text-sm">
                  <SummaryRow label="Fee Structure" value={selectedStructure?.name ?? '—'} />
                  <SummaryRow
                    label="Academic Year"
                    value={academicYears.find((y) => y.id === configValues.academicYearId)?.name ?? '—'}
                  />
                  <SummaryRow
                    label="Term"
                    value={
                      configValues.termId
                        ? terms.find((t) => t.id === configValues.termId)?.name ?? '—'
                        : 'All terms'
                    }
                  />
                  <SummaryRow
                    label="Class Level"
                    value={configValues.classLevel || 'All classes'}
                  />
                  <SummaryRow
                    label="Skip Existing"
                    value={configValues.skipExisting ? 'Yes' : 'No'}
                  />
                  {configValues.dueDate && (
                    <SummaryRow label="Due Date" value={configValues.dueDate} />
                  )}
                  <SummaryRow
                    label="Base Invoice Amount"
                    value={formatCurrency(totalAmount)}
                    highlight
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={bulkGenerate.isPending}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={bulkGenerate.isPending}
                  >
                    {bulkGenerate.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      'Generate Invoices'
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Helper ────────────────────────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex justify-between px-3 py-2 ${highlight ? 'bg-muted/40' : ''}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${highlight ? 'text-primary' : ''}`}>{value}</span>
    </div>
  );
}