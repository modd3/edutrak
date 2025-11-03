import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { PlusCircle, Trash2, BookOpen } from 'lucide-react';

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
  useDeleteSubjectOffering,
  useCreateSubjectOffering,
  useCoreSubjects 
} from '@/hooks/use-subjects';
import { SubjectOffering, CurriculumLevel } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define Curriculum Levels for selection (based on your schema enum)
const CURRICULUM_LEVELS: { [key in CurriculumLevel]: string } = {
    PRE_PRIMARY: 'Pre-Primary',
    LOWER_PRIMARY: 'Lower Primary',
    UPPER_PRIMARY: 'Upper Primary',
    LOWER_SECONDARY: 'Lower Secondary',
    UPPER_SECONDARY: 'Upper Secondary',
    TVET: 'TVET',
    SPECIAL_NEEDS: 'Special Needs',
};

// --- Add Offering Form Components ---

const addOfferingSchema = z.object({
  subjectId: z.string().min(1, 'Please select a core subject'),
  level: z.nativeEnum(CurriculumLevel, {
    errorMap: () => ({ message: "Please select a curriculum level" }),
  }),
});

type AddOfferingFormData = z.infer<typeof addOfferingSchema>;

function AddSubjectOfferingDialog({ schoolId }: { schoolId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: coreSubjectsData, isLoading: isLoadingCore } = useCoreSubjects({ pageSize: 100 });
  const { mutate: createOffering, isPending: isCreating } = useCreateSubjectOffering(schoolId);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AddOfferingFormData>({
    resolver: zodResolver(addOfferingSchema),
  });

  const onSubmit = (data: AddOfferingFormData) => {
    createOffering({
        ...data,
        schoolId, // Pass the active school ID
        isCompulsory: false, // Default to false, can be edited later
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
          Add Subject to Catalog
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Subject Offering</DialogTitle>
          <DialogDescription>
            Select a core subject and the educational level it is taught at in this school.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subjectId">Core Subject</Label>
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

          <div className="space-y-2">
            <Label htmlFor="level">Curriculum Level</Label>
            <Select onValueChange={(val) => setValue('level', val as CurriculumLevel)} disabled={isCreating}>
                <SelectTrigger id="level">
                    <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(CURRICULUM_LEVELS).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {errors.level && <p className="text-sm text-destructive">{errors.level.message}</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Adding...' : 'Add Offering'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Page Component ---

export default function SubjectOfferingsList() {
  // NOTE: You must implement a way to get the active school ID, 
  // e.g., from the authenticated user's context or a global store.
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || 'placeholder-school-id'; 

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOffering, setSelectedOffering] = useState<SubjectOffering | null>(null);

  const { 
    data: offeringsData, 
    isLoading, 
    isError 
  } = useSubjectOfferings(schoolId, { pageSize: 100 });
  
  const { mutate: deleteOffering, isPending: isDeleting } = useDeleteSubjectOffering(schoolId);

  const handleDeleteClick = (offering: SubjectOffering) => {
    setSelectedOffering(offering);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedOffering) {
      deleteOffering(selectedOffering.id, {
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
      accessorKey: 'level',
      header: 'Curriculum Level',
      cell: ({ row }) => {
        const level = row.getValue('level') as CurriculumLevel;
        return <Badge variant="secondary">{CURRICULUM_LEVELS[level]}</Badge>;
      },
    },
    {
      accessorKey: 'isCompulsory',
      header: 'Compulsory',
      cell: ({ row }) => {
        const isCompulsory = row.getValue('isCompulsory') as boolean;
        return (
          <Badge variant={isCompulsory ? 'default' : 'outline'}>
            {isCompulsory ? 'Yes' : 'No'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const offering = row.original;
        return (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleDeleteClick(offering)}
            className="hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
        <h1 className="text-3xl font-bold">School Subject Catalog</h1>
        <AddSubjectOfferingDialog schoolId={schoolId} />
      </div>
      
      {offeringsData?.data.length === 0 && (
          <div className="text-center p-12 border rounded-lg border-dashed">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                  No subjects have been added to this school yet.
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                  Click 'Add Subject to Catalog' to begin defining what is taught.
              </p>
          </div>
      )}

      {offeringsData && offeringsData.data.length > 0 && (
        <DataTable
          columns={columns}
          data={offeringsData?.data || []}
          searchKey="subject.name" // Search on the name nested in the subject object
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Subject Removal</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the subject "
              <strong className="font-semibold text-primary">
                {selectedOffering?.subject.name}
              </strong>" from this school's catalog? This will prevent new classes from offering it.
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