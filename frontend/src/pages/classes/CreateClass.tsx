import { useNavigate } from 'react-router-dom';
import { ClassForm } from '@/components/classes/ClassFormModal';
import { useCreateClass } from '@/hooks/use-classes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CreateClass() {
  const navigate = useNavigate();
  const { mutate: createClass, isPending } = useCreateClass();

  const handleSubmit = (data: any) => {
    createClass(data, {
      onSuccess: () => {
        navigate('/classes');
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/classes')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Class</h1>
          <p className="text-muted-foreground">
            Set up a new class with streams
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassForm onSubmit={handleSubmit} isLoading={isPending} />
        </CardContent>
      </Card>
    </div>
  );
}