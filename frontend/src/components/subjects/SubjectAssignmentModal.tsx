import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from '@/components/ui/button';
import { useSubjects, useAssignSubject } from '@/hooks/use-class-subjects';
import { useTeachers } from '@/hooks/use-teachers';
import { Loader2 } from 'lucide-react';
import { Term } from '@/types';

const formSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  teacherId: z.string().optional(),
  subjectCategory: z.string().min(1, 'Category is required'),
  termId: z.string().min(1, 'Term is required'), // Add termId to schema
});

interface SubjectAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  academicYearId: string;
  terms: Term[]; // Add terms prop
}

export function SubjectAssignmentModal({
  open,
  onOpenChange,
  classId,
  academicYearId,
  terms,
}: SubjectAssignmentModalProps) {
  // Queries
  const { data: subjectsData, isLoading: loadingSubjects } = useSubjects();
  const { data: teachersData, isLoading: loadingTeachers } = useTeachers();
  
  // Mutation
  const { mutate: assignSubject, isPending } = useAssignSubject();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectCategory: 'CORE',
      termId: '', // Initialize with empty
    },
  });

  // Set default term when modal opens
  useEffect(() => {
    if (open && terms.length > 0) {
      // Find active term based on current date
      const today = new Date();
      const activeTerm = terms.find(term => {
        const startDate = new Date(term.startDate);
        const endDate = new Date(term.endDate);
        return today >= startDate && today <= endDate;
      });
      
      // Set to active term if found, otherwise first term
      form.setValue('termId', activeTerm?.id || terms[0].id);
    }
  }, [open, terms, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    assignSubject({
      classId,
      academicYearId,
      termId: values.termId, // Use selected termId
      subjectId: values.subjectId,
      teacherId: values.teacherId === "none" ? undefined : values.teacherId,
      subjectCategory: values.subjectCategory,
      streamId: undefined,
    }, {
      onSuccess: () => {
        form.reset({
          subjectCategory: 'CORE',
          termId: terms.length > 0 ? terms[0].id : '',
        });
        onOpenChange(false);
      }
    });
  };

  const subjects = subjectsData?.data?.subjects || [];
  const teachers = teachersData?.data || [];

  // Helper function to get term display name
  const getTermDisplayName = (term: Term) => {
    const termNumber = term.termNumber || term.name?.split('_')[1] || 'N/A';
    return `Term ${termNumber}`;
  };

  // Helper function to get term date range
  const getTermDateRange = (term: Term) => {
    const startDate = new Date(term.startDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const endDate = new Date(term.endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${startDate} - ${endDate}`;
  };

  // Check if term is active (current date within term range)
  const isTermActive = (term: Term) => {
    const today = new Date();
    const startDate = new Date(term.startDate);
    const endDate = new Date(term.endDate);
    return today >= startDate && today <= endDate;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Subject to Class</DialogTitle>
          <DialogDescription>
            Add a subject to this class and optionally assign a teacher for a specific term.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Term Selection */}
            <FormField
              control={form.control}
              name="termId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Term</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a term" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {terms.map((term) => (
                        <SelectItem key={term.id} value={term.id}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span>{getTermDisplayName(term)}</span>
                              {isTermActive(term) && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  Active
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {getTermDateRange(term)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subject Selection */}
            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={loadingSubjects}>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Teacher Selection */}
            <FormField
              control={form.control}
              name="teacherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Teacher (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={loadingTeachers}>
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">-- No Teacher --</SelectItem>
                      {teachers.map((teacher: any) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.user.firstName} {teacher.user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category Selection */}
            <FormField
              control={form.control}
              name="subjectCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CORE">Core</SelectItem>
                      <SelectItem value="ELECTIVE">Elective</SelectItem>
                      <SelectItem value="OPTIONAL">Optional</SelectItem>
                      <SelectItem value="TECHNICAL">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Subject
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}