import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { Student } from '@/types';

const editStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  admissionNo: z.string().optional(),
  gender: z.union([z.literal('MALE'), z.literal('FEMALE')]).optional(),
  dob: z.string().optional(),
  county: z.string().optional(),
  medicalCondition: z.string().optional(),
});

type EditStudentForm = z.infer<typeof editStudentSchema>;

export default function EditStudent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: studentResp, isLoading } = useQuery(
    ['student', id],
    async () => {
      const res = await apiClient.get<{ data: Student }>(`/students/${id}`);
      return res.data.data;
    },
    { enabled: !!id }
  );

  const updateMutation = useMutation(
    async (payload: Partial<Student>) => {
      const res = await apiClient.put<{ data: Student }>(`/students/${id}`, payload);
      return res.data.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['students'] });
        queryClient.invalidateQueries({ queryKey: ['student', id] });
        toast.success('Student updated successfully');
        navigate(`/students/${id}`);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to update student');
      },
    }
  );

  const { register, handleSubmit, reset, formState } = useForm<EditStudentForm>({
    resolver: zodResolver(editStudentSchema),
  });

  useEffect(() => {
    if (studentResp) {
      reset({
        firstName: studentResp.firstName,
        middleName: studentResp.middleName || '',
        lastName: studentResp.lastName,
        admissionNo: studentResp.admissionNo,
        gender: studentResp.gender,
        dob: studentResp.dob ? studentResp.dob.split('T')[0] : undefined,
        county: studentResp.county,
        medicalCondition: studentResp.medicalCondition,
      });
    }
  }, [studentResp, reset]);

  const onSubmit = (values: EditStudentForm) => {
    updateMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Student</h1>
        <p className="text-muted-foreground">Update student profile and details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : !studentResp ? (
            <p>Student not found</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" {...register('firstName')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input id="middleName" {...register('middleName')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" {...register('lastName')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admissionNo">Admission No</Label>
                  <Input id="admissionNo" {...register('admissionNo')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select id="gender" className="w-full rounded-md border px-3 py-2" {...register('gender')}>
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" {...register('dob')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="county">County</Label>
                  <Input id="county" {...register('county')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalCondition">Medical Condition</Label>
                  <Input id="medicalCondition" {...register('medicalCondition')} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isLoading}>
                  {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="ghost" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}