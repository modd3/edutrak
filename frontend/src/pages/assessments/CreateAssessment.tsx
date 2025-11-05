import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useCreateAssessment } from '@/hooks/use-assessments';
import { GradeBasedForm } from '@/components/assessments/GradeBasedForm';
import { CompetencyBasedForm } from '@/components/assessments/CompetencyBasedForm';
import { useClassSubjects } from '@/hooks/use-class-subjects';
import { useTerms } from '@/hooks/use-academic-years';
import { useStudents } from '@/hooks/use-students';
import { useAuthStore } from '@/store/auth-store';

const baseSchema = z.object({
  name: z.string().min(1, 'Assessment name is required'),
  type: z.enum([
    'CAT',
    'MIDTERM',
    'END_OF_TERM',
    'MOCK',
    'NATIONAL_EXAM',
    'COMPETENCY_BASED',
  ]),
  studentId: z.string().min(1, 'Student is required'),
  classSubjectId: z.string().min(1, 'Subject is required'),
  termId: z.string().min(1, 'Term is required'),
  assessedDate: z.string().optional(),
});

export default function CreateAssessment() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedType, setSelectedType] = useState<string>('');
  const { mutate: createAssessment, isPending } = useCreateAssessment();

  const { data: subjects } = useClassSubjects(classId);
  const { data: terms } = useTerms();
  const { data: students } = useStudents({ schoolId: user?.schoolId });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(baseSchema),
  });

  const handleFormSubmit = (baseData: any) => (assessmentData: any) => {
    const combinedData = {
      ...baseData,
      ...assessmentData,
      assessedDate: baseData.assessedDate || new Date().toISOString(),
    };

    createAssessment(combinedData, {
      onSuccess: () => {
        navigate('/assessments');
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/assessments')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Assessment</h1>
          <p className="text-muted-foreground">
            Record new student assessment
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Assessment Name</Label>
                <Input
                  id="name"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Assessment Type</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => {
                    setSelectedType(value);
                    register('type').onChange({ target: { value } });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assessment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAT">Continuous Assessment</SelectItem>
                    <SelectItem value="MIDTERM">Mid-Term Exam</SelectItem>
                    <SelectItem value="END_OF_TERM">End of Term Exam</SelectItem>
                    <SelectItem value="MOCK">Mock Exam</SelectItem>
                    <SelectItem value="NATIONAL_EXAM">National Exam</SelectItem>
                    <SelectItem value="COMPETENCY_BASED">Competency Based</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-destructive">
                    {errors.type.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId">Student</Label>
                <Select
                  name="studentId"
                  onValueChange={(value) => register('studentId').onChange({ target: { value } })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.data.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} ({student.admissionNo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.studentId && (
                  <p className="text-sm text-destructive">
                    {errors.studentId.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="classSubjectId">Subject</Label>
                <Select
                  name="classSubjectId"
                  onValueChange={(value) => register('classSubjectId').onChange({ target: { value } })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.data.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.classSubjectId && (
                  <p className="text-sm text-destructive">
                    {errors.classSubjectId.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="termId">Term</Label>
                <Select
                  name="termId"
                  onValueChange={(value) => register('termId').onChange({ target: { value } })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms?.data.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name} - {term.academicYear.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.termId && (
                  <p className="text-sm text-destructive">
                    {errors.termId.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessedDate">Date Assessed</Label>
                <Input
                  id="assessedDate"
                  type="date"
                  {...register('assessedDate')}
                />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedType === 'COMPETENCY_BASED' ? (
            <CompetencyBasedForm
              onSubmit={handleFormSubmit}
              isLoading={isPending}
            />
          ) : (
            <GradeBasedForm
              onSubmit={handleFormSubmit}
              isLoading={isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}