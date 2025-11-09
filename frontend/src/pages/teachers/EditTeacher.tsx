import { useNavigate, useParams } from 'react-router-dom';
import { TeacherForm } from '@/components/teachers/TeacherForm';
import { useTeacher, useUpdateTeacher } from '@/hooks/use-teachers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditTeacher() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: teacher, isLoading } = useTeacher(id!);
  const { mutate: updateTeacher, isPending } = useUpdateTeacher();

  const handleSubmit = (data: any) => {
    updateTeacher(
      { id: id!, data },
      {
        onSuccess: () => {
          navigate(`/teachers/${id}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-[200px]" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!teacher) {
    return <div>Teacher not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/teachers/${id}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Teacher</h1>
          <p className="text-muted-foreground">
            Update teacher information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Information</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherForm
            teacher={teacher}
            onSubmit={handleSubmit}
            isLoading={isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}