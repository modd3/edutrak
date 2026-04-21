import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBulkGenerateInvoices, useGetFeeStructureById } from '@/hooks/use-fees';
import { useStudents } from '@/hooks/use-students';
import { useSchoolContext } from '@/hooks/use-school-context';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';

// ══════════════════════════════════════════════════════════════════════════
// ZOD SCHEMA
// ══════════════════════════════════════════════════════════════════════════

const bulkGenerateInvoicesSchema = z.object({
  studentIds: z.array(z.string()).min(1, 'Select at least one student'),
  dueDate: z.string().optional(),
  notes: z.string().max(500).optional(),
});

type BulkGenerateInvoicesFormData = z.infer<typeof bulkGenerateInvoicesSchema>;

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

interface BulkGenerateInvoicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeStructureId: string;
}

export function BulkGenerateInvoicesModal({
  open,
  onOpenChange,
  feeStructureId,
}: BulkGenerateInvoicesModalProps) {
  const { schoolId } = useSchoolContext();
  const { mutate: bulkGenerateInvoices, isPending: isGenerating } =
    useBulkGenerateInvoices();
  const { data: structureData, isLoading: isLoadingStructure } =
    useGetFeeStructureById(feeStructureId);
  const { data: studentsData, isLoading: isLoadingStudents } = useStudents({
    schoolId,
    page: 1,
    pageSize: 200,
  });

  const [studentSearch, setStudentSearch] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  const form = useForm<BulkGenerateInvoicesFormData>({
    resolver: zodResolver(bulkGenerateInvoicesSchema),
    defaultValues: {
      studentIds: [],
      dueDate: '',
      notes: '',
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

  const selectedStudentIds = form.watch('studentIds');
  const isAllSelected = filteredStudents.length > 0 &&
    filteredStudents.every((s: any) => selectedStudentIds.includes(s.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      form.setValue(
        'studentIds',
        selectedStudentIds.filter(
          (id) => !filteredStudents.some((s: any) => s.id === id)
        )
      );
    } else {
      const newIds = [
        ...selectedStudentIds,
        ...filteredStudents
          .map((s: any) => s.id)
          .filter((id) => !selectedStudentIds.includes(id)),
      ];
      form.setValue('studentIds', newIds);
    }
  };

  const toggleStudent = (studentId: string) => {
    const current = selectedStudentIds || [];
    if (current.includes(studentId)) {
      form.setValue(
        'studentIds',
        current.filter((id) => id !== studentId)
      );
    } else {
      form.setValue('studentIds', [...current, studentId]);
    }
  };

  const onSubmit = (data: BulkGenerateInvoicesFormData) => {
    bulkGenerateInvoices(
      {
        feeStructureId,
        studentIds: data.studentIds,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        notes: data.notes,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          setStudentSearch('');
          setSelectAll(false);
        },
      }
    );
  };

  if (isLoadingStructure) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Generate Invoices</DialogTitle>
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
            <DialogTitle>Bulk Generate Invoices</DialogTitle>
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Generate Invoices</DialogTitle>
          <DialogDescription>
            Create invoices for multiple students from {structure.name}
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
              <span className="text-gray-700">Total Amount per Student:</span>
              <span className="font-semibold">KES {totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Selected Students:</span>
              <span className="font-semibold">{selectedStudentIds?.length || 0}</span>
            </div>
            {selectedStudentIds && selectedStudentIds.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-700">Total Invoices Value:</span>
                <span className="font-semibold text-blue-600">
                  KES {(totalAmount * selectedStudentIds.length).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Student Selection */}
          <div className="space-y-3">
            <Label>Select Students *</Label>

            {/* Search */}
            <Input
              placeholder="Search student by name or admission number..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              disabled={isLoadingStudents}
            />

            {/* Select All Checkbox */}
            {filteredStudents.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  id="selectAll"
                />
                <Label htmlFor="selectAll" className="cursor-pointer text-sm font-medium flex-1">
                  Select all {filteredStudents.length} students
                </Label>
              </div>
            )}

            {/* Student List */}
            {isLoadingStudents ? (
              <div className="text-xs text-gray-500 p-2">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-xs text-gray-500 p-2">
                {studentSearch
                  ? 'No students found matching your search'
                  : 'No students available'}
              </div>
            ) : (
              <ScrollArea className="h-48 border rounded-lg p-2">
                <div className="space-y-2">
                  {filteredStudents.map((student: any) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                    >
                      <Checkbox
                        checked={selectedStudentIds?.includes(student.id) || false}
                        onCheckedChange={() => toggleStudent(student.id)}
                        id={`student-${student.id}`}
                      />
                      <Label
                        htmlFor={`student-${student.id}`}
                        className="cursor-pointer text-sm flex-1"
                      >
                        <div>
                          <p className="font-medium">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-gray-600">{student.admissionNo}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
                </ScrollArea>
              )}
            </div>

            {form.formState.errors.studentIds && (
              <p className="text-xs text-red-500">{form.formState.errors.studentIds.message}</p>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (optional)</Label>
            <Input id="dueDate" type="date" {...form.register('dueDate')} />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Any remarks about these invoices"
              rows={2}
            />
          </div>

          {selectedStudentIds && selectedStudentIds.length > 50 && (
            <div className="flex gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Generating {selectedStudentIds.length} invoices may take a few moments.
              </p>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isGenerating || (selectedStudentIds?.length || 0) === 0}
          >
            {isGenerating ? 'Generating...' : `Generate ${selectedStudentIds?.length || 0} Invoice(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
