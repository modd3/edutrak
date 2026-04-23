// frontend/src/components/fees/ApplyWaiverModal.tsx
// Apply a fee waiver or discount to a specific invoice.
// Calls feesApi.updateInvoice with waiver fields.

import { useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';
import { useUpdateInvoice } from '@/hooks/use-fees';
import { formatCurrency } from '@/lib/utils';

// ─── Schema ────────────────────────────────────────────────────────────────────

const waiverSchema = z.object({
  waiverType: z.enum(['FIXED', 'PERCENTAGE']),
  waiverAmount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  waiverReason: z.string().min(5, 'Please provide a reason (at least 5 characters)'),
});

type WaiverFormValues = z.infer<typeof waiverSchema>;

// ─── Props ──────────────────────────────────────────────────────────────────────

interface ApplyWaiverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoiceNumber: string;
    studentName: string;
    totalAmount: number;
    discountAmount?: number;
  } | null;
  onSuccess?: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ApplyWaiverModal({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: ApplyWaiverModalProps) {
  const updateInvoice = useUpdateInvoice();

  const form = useForm<WaiverFormValues>({
    resolver: zodResolver(waiverSchema),
    defaultValues: {
      waiverType: 'FIXED',
      waiverAmount: 0,
      waiverReason: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ waiverType: 'FIXED', waiverAmount: 0, waiverReason: '' });
    }
  }, [open]);

  const watchedType = form.watch('waiverType');
  const watchedAmount = form.watch('waiverAmount');

  // Preview calculated discount
  const calculatedDiscount =
    invoice && watchedAmount > 0
      ? watchedType === 'FIXED'
        ? Math.min(watchedAmount, invoice.totalAmount)
        : (invoice.totalAmount * Math.min(watchedAmount, 100)) / 100
      : 0;

  const afterWaiver = invoice ? invoice.totalAmount - calculatedDiscount : 0;

  async function onSubmit(values: WaiverFormValues) {
    if (!invoice) return;

    // The backend expects discountAmount + discountReason on the invoice update
    const discountAmount =
      values.waiverType === 'FIXED'
        ? values.waiverAmount
        : (invoice.totalAmount * values.waiverAmount) / 100;

    await updateInvoice.mutateAsync({
      id: invoice.id,
      data: {
        discountAmount,
        discountReason: values.waiverReason,
      },
    });

    onSuccess?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Apply Waiver / Discount
          </DialogTitle>
          {invoice && (
            <DialogDescription>
              Invoice{' '}
              <span className="font-medium text-foreground">{invoice.invoiceNumber}</span>
              {' '}— {invoice.studentName}
            </DialogDescription>
          )}
        </DialogHeader>

        {invoice && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Invoice summary */}
              <div className="rounded-md bg-muted/40 border px-3 py-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total invoice amount</span>
                <span className="font-semibold">{formatCurrency(invoice.totalAmount)}</span>
              </div>

              {/* Existing discount warning */}
              {(invoice.discountAmount ?? 0) > 0 && (
                <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                  ⚠ A discount of{' '}
                  <strong>{formatCurrency(invoice.discountAmount!)}</strong> is already applied.
                  Submitting will replace it.
                </div>
              )}

              {/* Waiver type */}
              <FormField
                control={form.control}
                name="waiverType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waiver Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FIXED">Fixed Amount (KES)</SelectItem>
                        <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount / Percentage */}
              <FormField
                control={form.control}
                name="waiverAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {watchedType === 'FIXED' ? 'Waiver Amount (KES)' : 'Percentage (%)'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0.01"
                        step={watchedType === 'PERCENTAGE' ? '0.1' : '1'}
                        max={watchedType === 'PERCENTAGE' ? '100' : undefined}
                        placeholder={watchedType === 'PERCENTAGE' ? '0–100' : '0.00'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Live preview */}
              {calculatedDiscount > 0 && (
                <div className="rounded-md border divide-y text-sm">
                  <div className="flex justify-between px-3 py-2">
                    <span className="text-muted-foreground">Discount applied</span>
                    <Badge variant="secondary" className="text-destructive bg-destructive/10">
                      − {formatCurrency(calculatedDiscount)}
                    </Badge>
                  </div>
                  <div className="flex justify-between px-3 py-2">
                    <span className="font-medium">Amount after waiver</span>
                    <span className="font-semibold text-primary">{formatCurrency(afterWaiver)}</span>
                  </div>
                </div>
              )}

              {/* Reason */}
              <FormField
                control={form.control}
                name="waiverReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason / Justification</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. Scholarship award, sibling discount, hardship waiver…"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={updateInvoice.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateInvoice.isPending}>
                  {updateInvoice.isPending ? 'Applying…' : 'Apply Waiver'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}