import { useNavigate } from 'react-router-dom';
import { SchoolForm, SchoolFormData } from '@/components/schools/SchoolForm';
import { useCreateSchool } from '@/hooks/use-schools';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreateSchool() {
  const navigate = useNavigate();
  const { mutate: createSchool, isPending: isLoading } = useCreateSchool();

  const handleSubmit = (data: SchoolFormData) => {
    // The form data type is compatible with SchoolCreateInput
    createSchool(data, {
      onSuccess: () => {
        navigate('/schools');
      },
    });
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Schools
      </Button>

      <h1 className="text-3xl font-bold">Create New School</h1>
      
      <SchoolForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitButtonText="Create School"
      />
    </div>
  );
}