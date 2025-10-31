import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Term } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUpdateTerm } from '@/hooks/use-academic-years';
import { toast } from 'sonner';

// Zod schema for a single term
const termSchema = z.object({
  id: z.string(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

// Zod schema for the form (an array of terms)
const formSchema = z.object({
  terms: z.array(termSchema),
});

type TermFormData = z.infer<typeof formSchema>;

interface TermDatesFormProps {
  terms: Term[];
}

export function TermDatesForm({ terms }: TermDatesFormProps) {
  const { mutate: updateTerm, isPending } = useUpdateTerm();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TermFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      terms: terms.map((term) => ({
        id: term.id,
        // Format dates to YYYY-MM-DD for the input[type=date]
        startDate: term.startDate ? new Date(term.startDate).toISOString().split('T')[0] : '',
        endDate: term.endDate ? new Date(term.endDate).toISOString().split('T')[0] : '',
      })),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'terms',
  });

  const onSubmit = (data: TermFormData) => {
    // We update each term one by one
    const promises = data.terms.map((term) =>
      updateTerm({
        id: term.id,
        data: {
          startDate: new Date(term.startDate).toISOString(),
          endDate: new Date(term.endDate).toISOString(),
        },
      })
    );

    toast.promise(Promise.all(promises), {
      loading: 'Saving term dates...',
      success: 'All term dates saved successfully!',
      error: 'Failed to save one or more terms',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Term Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.map((field, index) => {
            const termName = terms[index]?.name || `Term ${index + 1}`;
            return (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end"
              >
                <div className="space-y-2">
                  <Label>Term</Label>
                  <Input
                    value={termName.replace('_', ' ')}
                    readOnly
                    disabled
                    className="font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`terms.${index}.startDate`}>Start Date</Label>
                  <Input
                    id={`terms.${index}.startDate`}
                    type="date"
                    {...register(`terms.${index}.startDate`)}
                  />
                  {errors.terms?.[index]?.startDate && (
                    <p className="text-sm text-destructive">
                      {errors.terms[index].startDate.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`terms.${index}.endDate`}>End Date</Label>
                  <Input
                    id={`terms.${index}.endDate`}
                    type="date"
                    {...register(`terms.${index}.endDate`)}
                  />
                  {errors.terms?.[index]?.endDate && (
                    <p className="text-sm text-destructive">
                      {errors.terms[index].endDate.message}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Term Dates'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}