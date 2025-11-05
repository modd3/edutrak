import { useNavigate } from 'react-router-dom';
import { TeacherForm } from '@/components/teachers/TeacherForm';
import { useCreateTeacher } from '@/hooks/use-teachers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CreateTeacher() {
  const navigate = useNavigate();
  const { mutate: createTeacher, isPending } = useCreateTeacher();

  const handleSubmit = (data: any) => {
    createTeacher(data, {
      onSuccess: () => {
        navigate('/teachers');
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/teachers')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Teacher</h1>
          <p className="text-muted-foreground">
            Create a new teacher profile
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Information</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherForm onSubmit={handleSubmit} isLoading={isPending} />
        </CardContent>
      </Card>
    </div>
  );
}