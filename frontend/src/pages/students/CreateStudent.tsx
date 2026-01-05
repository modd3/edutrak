import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { StudentForm, StudentFormData } from '@/components/students/StudentForm';
import { studentService, StudentCreateInput } from '@/services/student.service';
import { useAuthStore } from '@/store/auth-store';

const CreateStudent = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: (data: StudentCreateInput) => studentService.create(data),
    onSuccess: () => {
      toast.success('Student created successfully!');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      navigate('/students');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create student.');
    },
  });

  const handleSubmit = (data: StudentFormData) => {
    if (!user?.schoolId) {
      toast.error('School information is missing. Cannot create student.');
      return;
    }
    const finalData: StudentCreateInput = { ...data, schoolId: user.schoolId };
    mutate(finalData);
  };

  return <StudentForm onSubmit={handleSubmit} isLoading={isLoading} />;
};

export default CreateStudent;