// src/components/academic/AcademicYearFormModal.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateAcademicYear } from '@/hooks/use-academic';
import { Calendar } from 'lucide-react';

const termSchema = z.object({
  name: z.enum(['TERM_1', 'TERM_2', 'TERM_3']),
  termNumber: z.number(),
  startDate: z.string(),
  endDate: z.string(),
});

const academicYearSchema = z.object({
  year: z.number().min(2020).max(2050),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean().default(false),
  terms: z.array(termSchema).length(3),
});

type AcademicYearFormData = z.infer<typeof academicYearSchema>;

interface AcademicYearFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AcademicYearFormModal({
  open,
  onOpenChange,
}: AcademicYearFormModalProps) {
  const [step, setStep] = useState(1);
  const { mutate: createAcademicYear, isPending } = useCreateAcademicYear();

  const currentYear = new Date().getFullYear();

  const form = useForm<AcademicYearFormData>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      year: currentYear,
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-12-31`,
      isActive: false,
      terms: [
        {
          name: 'TERM_1',
          termNumber: 1,
          startDate: `${currentYear}-01-01`,
          endDate: `${currentYear}-04-30`,
        },
        {
          name: 'TERM_2',
          termNumber: 2,
          startDate: `${currentYear}-05-01`,
          endDate: `${currentYear}-08-31`,
        },
        {
          name: 'TERM_3',
          termNumber: 3,
          startDate: `${currentYear}-09-01`,
          endDate: `${currentYear}-12-31`,
        },
      ],
    },
  });

  const onSubmit = (data: AcademicYearFormData) => {
    createAcademicYear(
      {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        terms: data.terms.map((term) => ({
          ...term,
          startDate: new Date(term.startDate),
          endDate: new Date(term.endDate),
        })),
      },
      {
        onSuccess: () => {
          form.reset();
          setStep(1);
          onOpenChange(false);
        },
      }
    );
  };

  const handleClose = () => {
    form.reset();
    setStep(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Academic Year</DialogTitle>
          <DialogDescription>
            Set up a new academic year with three terms
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2">
              <div
                className={`flex items-center gap-2 ${
                  step === 1 ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === 1 ? 'bg-primary text-white' : 'bg-muted'
                  }`}
                >
                  1
                </div>
                <span className="font-medium">Year Details</span>
              </div>
              <div className="w-12 h-0.5 bg-muted" />
              <div
                className={`flex items-center gap-2 ${
                  step === 2 ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === 2 ? 'bg-primary text-white' : 'bg-muted'
                  }`}
                >
                  2
                </div>
                <span className="font-medium">Terms</span>
              </div>
            </div>

            {/* Step 1: Academic Year Details */}
            {step === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">
                        Set as active academic year
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="button" onClick={() => setStep(2)}>
                    Next: Configure Terms
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Terms Configuration */}
            {step === 2 && (
              <div className="space-y-4">
                {[0, 1, 2].map((index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Term {index + 1}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`terms.${index}.startDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`terms.${index}.endDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Creating...' : 'Create Academic Year'}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}