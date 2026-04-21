import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useGenerateInvoice, useGetFeeStructureById } from '@/hooks/use-fees';
import { useGetStudents } from '@/hooks/use-students';
import { useSchoolContext } from '@/hooks/use-school-context';

// ══════════════════════════════════════════════════════════════════════════
// ZOD SCHEMA
// ══════════════════════════════════════════════════════════════════════════

const generateInvoiceSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  dueDate: z.string().optional(),
  notes: z.string().max(500).optional(),
  discountAmount: z.coerce.number().min(0).default(0),
});

type GenerateInvoiceFormData = z.infer<typeof generateInvoiceSchema>;

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

interface GenerateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeStructureId: string;
}

export function GenerateInvoiceModal({
  open,
  onOpenChange,
  feeStructureId,
}: GenerateInvoiceModalProps) {
  const { schoolId } = useSchoolContext();
  const { mutate: generateInvoice, isPending: isGenerating } = useGenerateInvoice();
  const { data: structureData, isLoading: isLoadingStructure } =
    useGetFeeStructureById(feeStructureId);
  const { data: studentsData, isLoading: isLoadingStudents } = useGetStudents({
    schoolId,
    page: 1,
    pageSize: 100,
  });

  const [studentSearch, setStudentSearch] = useState('');

  const form = useForm<GenerateInvoiceFormData>({
    resolver: zodResolver(generateInvoiceSchema),
    defaultValues: {
      studentId: '',
      dueDate: '',
      notes: '',
      discountAmount: 0,
    },
  });

  const structure = structureData?.data;
  const students = studentsData?.data || [];
  const totalAmount = structure?.items?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0;

  // Filter students by search
  const filteredStudents = students.filter(
    (student: any) =>
      student.firstName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.admissionNo?.includes(studentSearch)
  );

  const onSubmit = (data: GenerateInvoiceFormData) => {
    generateInvoice(
      {
        studentId: data.studentId,
        feeStructureId,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        notes: data.notes,
        discountAmount: data.discountAmount,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          setStudentSearch('');
        },
      }
    );
  };

  if (isLoadingStructure) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Loading fee structure...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!structure) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-40">
            <p className="text-red-500">Fee structure not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Create an invoice for a student from {structure.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Fee Structure Summary */}
          <div className="bg-blue-50 p-3 rounded-lg space-y-2 text-sm">
            <div>
              <p className="font-semibold text-gray-700">{structure.name}</p>
              <p className="text-xs text-gray-600">{structure.description}</p>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Total Amount:</span>
              <span className="font-semibold">KES {totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Items:</span>
              <span className="font-semibold">{structure.items?.length || 0}</span>
            </div>
          </div>

          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="studentId">Select Student *</Label>
            <Controller
              name="studentId"
              control={form.control}
              render={({ field }) => (
                <>
                  <Input
                    placeholder="Search student by name or admission number..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    disabled={isLoadingStudents}
                  />
                  {isLoadingStudents ? (
                    <div className="text-xs text-gray-500">Loading students...</div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-xs text-gray-500">No students found</div>
                  ) : (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-48">
                          {filteredStudents.map((student: any) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.firstName} {student.lastName} ({student.admissionNo})
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}
            />
            {form.formState.errors.studentId && (
              <p className="text-xs text-red-500">{form.formState.errors.studentId.message}</p>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (optional)</Label>
            <Input
              id="dueDate"
              type="date"
              {...form.register('dueDate')}
            />
          </div>

          {/* Discount */}
          <div className="space-y-2">
            <Label htmlFor="discountAmount">Discount Amount (KES)</Label>
            <Input
              id="discountAmount"
              type="number"
              step="0.01"
              {...form.register('discountAmount')}
              defaultValue="0"
            />
            {form.formState.errors.discountAmount && (
              <p className="text-xs text-red-500">{form.formState.errors.discountAmount.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Any remarks about this invoice"
              rows={2}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isGenerating || form.formState.isSubmitting}
          >
            {isGenerating ? 'Generating...' : 'Generate Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
