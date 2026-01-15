import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { PlusCircle, Trash2, BookOpen, ToggleLeft, ToggleRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, 
  DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';

import { 
  useSubjectOfferings, 
  useRemoveSubjectFromSchool,
  useAddSubjectToSchool,
  useToggleSubjectOffering,
  useSubjects
} from '@/hooks/use-subjects';
import { SubjectOffering } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const addOfferingSchema = z.object({
  subjectId: z.string().min(1, 'Please select a core subject'),
});

type AddOfferingFormData = z.infer<typeof addOfferingSchema>;

function AddSubjectOfferingDialog({ schoolId }: { schoolId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: coreSubjectsData, isLoading: isLoadingCore } = useSubjects({ pageSize: 100 });
  const { mutate: addOffering, isPending: isCreating } = useAddSubjectToSchool(schoolId);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AddOfferingFormData>({
    resolver: zodResolver(addOfferingSchema),
  });

  const onSubmit = (data: AddOfferingFormData) => {
    addOffering({
      subjectId: data.subjectId,
    }, {
      onSuccess: () => {
        reset();
        setIsOpen(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Subject to School
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Subject to School</DialogTitle>
          <DialogDescription>
            Select a subject from the global catalog to add to your school's offerings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subjectId">Subject</Label>
            {isLoadingCore ? (
                <Skeleton className="h-10 w-full" />
            ) : (
                <Select onValueChange={(val) => setValue('subjectId', val)} disabled={isCreating}>
                    <SelectTrigger id="subjectId">
                        <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                        {coreSubjectsData?.data.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                                {subject.name} ({subject.code})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
            {errors.subjectId && <p className="text-sm text-destructive">{errors.subjectId.message}</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Adding...' : 'Add Subject'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SubjectOfferingsList() {
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || ''; 

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOffering, setSelectedOffering] = useState<SubjectOffering | null>(null);

  const { 
    data: offeringsData, 
    isLoading, 
    isError 
  } = useSubjectOfferings(schoolId, { pageSize: 100 });
  
  const { mutate: removeOffering, isPending: isDeleting } = useRemoveSubjectFromSchool(schoolId);
  const { mutate: toggleOffering } = useToggleSubjectOffering(schoolId);

  const handleDeleteClick = (offering: SubjectOffering) => {
    setSelectedOffering(offering);
    setShowDeleteDialog(true);
  };

  const handleToggleClick = (offering: SubjectOffering) => {
    toggleOffering(offering.id);
  };

  const confirmDelete = () => {
    if (selectedOffering) {
      removeOffering(selectedOffering.subject.id, {
        onSuccess: () => {
          setShowDeleteDialog(false);
          setSelectedOffering(null);
        },
      });
    }
  };

  const columns: ColumnDef<SubjectOffering>[] = [
    {
      accessorKey: 'subject.name',
      header: 'Subject Name',
      cell: ({ row }) => row.original.subject.name,
    },
    {
      accessorKey: 'subject.code',
      header: 'Code',
      cell: ({ row }) => row.original.subject.code,
    },
    {
      accessorKey: 'subject.category',
      header: 'Category',
      cell: ({ row }) => {
        const category = row.original.subject.category;
        return <Badge variant="outline">{category}</Badge>;
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const offering = row.original;
        return (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleToggleClick(offering)}
              title={offering.isActive ? 'Deactivate' : 'Activate'}
            >
              {offering.isActive ? (
                <ToggleRight className="h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleDeleteClick(offering)}
              className="hover:text-destructive"
              title="Remove from school"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return <div className="text-center text-destructive">Failed to load subject offerings.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">School Subject Catalog</h1>
          <p className="text-muted-foreground mt-2">
            Manage the subjects offered at your school. Subjects are added from the global catalog.
          </p>
        </div>
        <AddSubjectOfferingDialog schoolId={schoolId} />
      </div>
      
      {offeringsData?.data.length === 0 && (
          <div className="text-center p-12 border rounded-lg border-dashed">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                  No subjects have been added to this school yet.
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                  Click 'Add Subject to School' to begin adding subjects from the global catalog.
              </p>
          </div>
      )}

      {offeringsData && offeringsData.data.length > 0 && (
        <DataTable
          columns={columns}
          data={offeringsData?.data || []}
          searchKey="subject.name"
        />
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Subject Removal</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the subject "
              <strong className="font-semibold text-primary">
                {selectedOffering?.subject.name}
              </strong>" from this school's offerings?
              <br />
              <span className="text-destructive">
                This will prevent new classes from being assigned this subject.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Removing...' : 'Remove Subject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}