import { useState, useEffect, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { useSubjects, useAssignSubject } from '@/hooks/use-class-subjects';
import { useTeachers } from '@/hooks/use-teachers';
import { Loader2, Info, CheckCircle } from 'lucide-react';
import { Term, Stream } from '@/types';
import { toast } from 'sonner';

const formSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  teacherId: z.string().optional(),
  streamId: z.string().optional(),
  subjectCategory: z.string().min(1, 'Category is required'),
  termId: z.string().min(1, 'Term is required'),
});

interface SubjectAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  academicYearId: string;
  terms: Term[];
  streams: Stream[];
}

export function SubjectAssignmentModal({
  open,
  onOpenChange,
  classId,
  academicYearId,
  terms = [],
  streams = [],
}: SubjectAssignmentModalProps) {
  const { data: subjectsData, isLoading: loadingSubjects } = useSubjects();
  const { data: teachersData, isLoading: loadingTeachers } = useTeachers();
  const { mutate: assignSubject, isPending } = useAssignSubject();

  // Find active term based on current date
  const activeTerm = useMemo(() => {
    if (terms.length === 0) return null;
    const today = new Date();
    return terms.find(term => {
      const startDate = new Date(term.startDate);
      const endDate = new Date(term.endDate);
      return today >= startDate && today <= endDate;
    });
  }, [terms]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectId: '',
      subjectCategory: 'CORE',
      termId: activeTerm?.id || (terms.length > 0 ? terms[0].id : ''),
      streamId: 'all',
      teacherId: 'none',
    },
  });

  const subjects = subjectsData?.data?.data || [];
  const teachers = teachersData?.data || [];

  
  // Watch subjectId to auto-set category
  const selectedSubjectId = form.watch('subjectId');
  const selectedTermId = form.watch('termId');


  // Set initial term to active term or first term
  useEffect(() => {
    if (open && terms.length > 0) {
      const initialTermId = activeTerm?.id || terms[0].id;
      form.setValue('termId', initialTermId);
      
    }
  }, [open, terms, activeTerm, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
           
    assignSubject({
      classId,
      academicYearId,
      termId: values.termId,
      subjectId: values.subjectId,
      teacherId: values.teacherId === "none" ? undefined : values.teacherId,
      streamId: values.streamId === "all" ? undefined : values.streamId,
      subjectCategory: values.subjectCategory,
    }, {
      onSuccess: () => {
       // toast.success(`Subject assignment successful!`);
        form.reset({
          subjectId: '',
          subjectCategory: 'CORE',
          termId: activeTerm?.id || (terms.length > 0 ? terms[0].id : ''),
          streamId: 'all',
          teacherId: 'none',
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error('Subject assignment failed:', error);
      }
    });
  };

  const getTermDisplayName = (term: Term) => {
    const termNumber = term.termNumber || term.name?.split('_')[1] || 'N/A';
    return `Term ${termNumber}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Subject</DialogTitle>
          <DialogDescription>
            Map a school subject to this class or a specific stream.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="termId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Term
                      {selectedTermId === activeTerm?.id && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {terms.map((term) => {
                          const isActiveTerm = term.id === activeTerm?.id;
                          return (
                            <SelectItem key={term.id} value={term.id}>
                              <div className="flex items-center justify-between">
                                <span>{getTermDisplayName(term)}</span>
                                {isActiveTerm && (
                                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 text-xs">
                                    Active
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {selectedTermId === activeTerm?.id && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        <span>This term is currently active based on today's date</span>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="streamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Entire Class</SelectItem>
                        {streams && streams.length > 0 && streams.map((stream) => (
                          <SelectItem key={stream.id} value={stream.id}>
                            {stream.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                  {/* Visual indicator of the auto-selected category */}
                  {selectedSubjectId && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground bg-muted p-2 rounded">
                      <Info className="h-3 w-3" />
                      <span>Category: <strong>{form.getValues('subjectCategory')}</strong> (Inherited from Subject)</span>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => {
                console.log('Subject assignment cancelled');
                onOpenChange(false);
              }}>
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
