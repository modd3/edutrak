import { useNavigate, useParams } from 'react-router-dom';
import { SchoolForm, SchoolFormData } from '@/components/schools/SchoolForm';
import { useSchool, useUpdateSchool } from '@/hooks/use-schools';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function EditSchool() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  if (!id) {
    navigate('/schools');
    return null;
  }

  const { data: school, isLoading: isLoadingSchool } = useSchool(id);
  const { mutate: updateSchool, isPending: isUpdating } = useUpdateSchool();

  const handleSubmit = (data: SchoolFormData) => {
    updateSchool(
      { id, data },
      {
        onSuccess: () => {
          navigate('/schools');
        },
      }
    );
  };

  if (isLoadingSchool) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!school) {
    return <div className="text-center text-destructive">School not found.</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <h1 className="text-3xl font-bold">Edit {school.name}</h1>
      
      <SchoolForm
        onSubmit={handleSubmit}
        isLoading={isUpdating}
        defaultValues={school}
        submitButtonText="Save Changes"
      />
    </div>
  );
}