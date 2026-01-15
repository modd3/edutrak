import { useState } from 'react';
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
import { useTeachers } from '@/hooks/use-teachers'; // Assuming you have this, or use teachersApi directly
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  teacherId: z.string().optional(),
  subjectCategory: z.string().min(1, 'Category is required'),
});

interface SubjectAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  academicYearId: string;
  termId: string; // You'll need to pass the active term ID
}

export function SubjectAssignmentModal({
  open,
  onOpenChange,
  classId,
  academicYearId,
  termId,
}: SubjectAssignmentModalProps) {
  // Queries
  const { data: subjectsData, isLoading: loadingSubjects } = useSubjects();
  const { data: teachersData, isLoading: loadingTeachers } = useTeachers(); // You might need to create this hook wrapping teachersApi.getAll
  
  // Mutation
  const { mutate: assignSubject, isPending } = useAssignSubject();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectCategory: 'CORE',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    assignSubject({
      classId,
      academicYearId,
      termId,
      subjectId: values.subjectId,
      teacherId: values.teacherId === "none" ? undefined : values.teacherId,
      subjectCategory: values.subjectCategory,
      streamId: undefined, // Pass streamId if you want to assign to a specific stream only
    }, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      }
    });
  };

  const subjects = subjectsData?.data?.subjects || []; // Adjust based on actual API response structure
  const teachers = teachersData?.data || []; // Adjust based on actual API response structure

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Subject to Class</DialogTitle>
          <DialogDescription>
            Add a subject to this class and optionally assign a teacher.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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