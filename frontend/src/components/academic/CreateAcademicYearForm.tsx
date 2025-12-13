import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useCreateAcademicYear } from '@/hooks/use-academic';
import { useState } from 'react';
import { PlusCircle } from 'lucide-react';

const currentYear = new Date().getFullYear();

// Zod schema for creating a new academic year
const createYearSchema = z.object({
  year: z.coerce
    .number()
    .min(currentYear - 5, `Year must be after ${currentYear - 5}`)
    .max(currentYear + 5, `Year must be before ${currentYear + 5}`),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

type CreateYearFormData = z.infer<typeof createYearSchema>;

export function CreateAcademicYearForm() {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: createYear, isPending } = useCreateAcademicYear();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateYearFormData>({
    resolver: zodResolver(createYearSchema),
    defaultValues: {
      year: new Date().getFullYear(),
    },
  });

  const onSubmit = (data: CreateYearFormData) => {
    createYear(
      {
        ...data,
        isActive: false, // New years are not active by default
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      },
      {
        onSuccess: () => {
          reset();
          setIsOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Academic Year
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Academic Year</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="year">Academic Year (e.g., 2024)</Label>
            <Input id="year" type="number" {...register('year')} />
            {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" type="date" {...register('startDate')} />
            {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input id="endDate" type="date" {...register('endDate')} />
            {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Year'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}