import { useState, useEffect } from 'react';
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
import { useAcademicYears, useTerms } from '@/hooks/use-academic-years';
import { useStudents } from '@/hooks/use-students';
import { useAuthStore } from '@/store/auth-store';
import { useSchoolClasses } from '@/hooks/use-classes';

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
  academicYearId: z.string().min(1, 'Academic year is required'),
  classId: z.string().min(1, 'Class is required'),
  studentId: z.string().min(1, 'Student is required'),
  classSubjectId: z.string().min(1, 'Subject is required'),
  termId: z.string().min(1, 'Term is required'),
  assessedDate: z.string().optional(),
});

export default function CreateAssessment() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  const { mutate: createAssessment, isPending: isCreatingAssessment } = useCreateAssessment();

  const { data: academicYears } = useAcademicYears();
  const { data: terms } = useTerms(selectedAcademicYearId);
  const { data: classes } = useSchoolClasses(user?.schoolId || '', { academicYearId: selectedAcademicYearId });
  const { data: subjects } = useClassSubjects(selectedClassId);
  const { data: students } = useStudents({ schoolId: user?.schoolId });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      academicYearId: '',
      classId: '',
      studentId: '',
      classSubjectId: '',
      termId: '',
      assessedDate: new Date().toISOString().split('T')[0], // Default to today
    },
  });

  // Watch for changes in academic year and class to update dependent selects
  const watchedAcademicYearId = watch('academicYearId');
  const watchedClassId = watch('classId');

  useEffect(() => {
    setSelectedAcademicYearId(watchedAcademicYearId);
    setValue('termId', ''); // Reset term when academic year changes
    setValue('classId', ''); // Reset class when academic year changes
    setValue('classSubjectId', ''); // Reset subject when academic year changes
    setValue('studentId', ''); // Reset student when academic year changes
  }, [watchedAcademicYearId, setValue]);

  useEffect(() => {
    setSelectedClassId(watchedClassId);
    setValue('classSubjectId', ''); // Reset subject when class changes
    setValue('studentId', ''); // Reset student when class changes
  }, [watchedClassId, setValue]);


  const handleFormSubmit = (baseData: any) => (assessmentData: any) => {
    const combinedData = {
      ...baseData,
      ...assessmentData,
      assessedDate: baseData.assessedDate || new Date().toISOString(),
      schoolId: user?.schoolId, // Ensure schoolId is passed to the backend
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
                <Label htmlFor="academicYearId">Academic Year</Label>
                <Select
                  name="academicYearId"
                  value={watchedAcademicYearId}
                  onValueChange={(value) => setValue('academicYearId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears?.data.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.academicYearId && (
                  <p className="text-sm text-destructive">
                    {errors.academicYearId.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="termId">Term</Label>
                <Select
                  name="termId"
                  value={watch('termId')}
                  onValueChange={(value) => setValue('termId', value)}
                  disabled={!selectedAcademicYearId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms?.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name}
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
                <Label htmlFor="classId">Class</Label>
                <Select
                  name="classId"
                  value={watchedClassId}
                  onValueChange={(value) => setValue('classId', value)}
                  disabled={!selectedAcademicYearId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.data.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} (Level {cls.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.classId && (
                  <p className="text-sm text-destructive">
                    {errors.classId.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="classSubjectId">Subject</Label>
                <Select
                  name="classSubjectId"
                  value={watch('classSubjectId')}
                  onValueChange={(value) => setValue('classSubjectId', value)}
                  disabled={!selectedClassId}
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
                <Label htmlFor="studentId">Student</Label>
                <Select
                  name="studentId"
                  value={watch('studentId')}
                  onValueChange={(value) => setValue('studentId', value)}
                  disabled={!user?.schoolId} // Consider also disabling until class is selected
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
                  name="type"
                  value={selectedType}
                  onValueChange={(value) => {
                    setSelectedType(value);
                    setValue('type', value as any); // Update form state
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
              onSubmit={handleSubmit(handleFormSubmit)} // Pass form's handleSubmit
              isLoading={isCreatingAssessment}
            />
          ) : (
            <GradeBasedForm
              onSubmit={handleSubmit(handleFormSubmit)} // Pass form's handleSubmit
              isLoading={isCreatingAssessment}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}