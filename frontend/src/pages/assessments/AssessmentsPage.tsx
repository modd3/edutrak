// src/pages/assessments/AssessmentsPage.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { AssessmentList } from '@/components/assessments/AssessmentList';
import { useAssessmentStats } from '@/hooks/use-assessments';
import { useActiveAcademicYear, useClasses } from '@/hooks/use-academic';
import { useClassSubjects } from '@/hooks/use-class-subjects';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export function AssessmentsPage() {
  const navigate = useNavigate();
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedClassSubject, setSelectedClassSubject] = useState<string>('');

  // Fetch active academic year with terms
  const { data: activeYearData, isLoading: isLoadingYear, error: yearError } = useActiveAcademicYear();
  const activeYear = activeYearData;

  console.log("active Year: ", activeYear);

  // Fetch classes for the active academic year
  const { data: classesData, isLoading: isLoadingClasses, error: classesError } = useClasses(activeYear?.id);
  const classes = classesData?.data || [];
  console.log("ClassesData: ", classesData)
  console.log('Classes:', classes);

  // Fetch class subjects based on selected class and term
  const { data: classSubjectsData, isLoading: isLoadingSubjects, error: subjectsError } = useClassSubjects(
    selectedClass,
    activeYear?.id || '',
    selectedTerm
  );
  const classSubjects = classSubjectsData?.data || [];
  console.log('ClassSubjectsData: ', classSubjectsData)
  console.log('Class Subjects:', classSubjects);
  // Fetch assessment statistics
  const { data: stats, isLoading: isLoadingStats, error: statsError } = useAssessmentStats(activeYear?.id);

  // Get terms from active academic year
  const terms = activeYear?.terms || [];

  // Log data for debugging
  useEffect(() => {
    console.log('=== AssessmentsPage Data Log ===');
    console.log('Active Academic Year:', {
      isLoading: isLoadingYear,
      error: yearError,
      data: activeYear ? {
        id: activeYear.id,
        year: activeYear.year,
        isActive: activeYear.isActive,
        termsCount: activeYear.terms?.length || 0
      } : 'No active year'
    });
  }, [activeYear, isLoadingYear, yearError]);

  useEffect(() => {
    if (terms.length > 0) {
      console.log('Academic Terms:', terms.map((term: { id: any; name: any; termNumber: any; startDate: any; endDate: any; }) => ({
        id: term.id,
        name: term.name,
        termNumber: term.termNumber,
        startDate: term.startDate,
        endDate: term.endDate
      })));

      // Auto-select the first term if available
      if (!selectedTerm && terms[0]) {
        console.log('Auto-selecting first term:', terms[0].name);
        setSelectedTerm(terms[0].id);
      }
    }
  }, [terms, selectedTerm]);

  useEffect(() => {
    console.log('Classes Data:', {
      isLoading: isLoadingClasses,
      error: classesError,
      count: classes.length,
      classes: classes.map((cls: { id: any; name: any; level: any; curriculum: any; _count: { students: any; }; }) => ({
        id: cls.id,
        name: cls.name,
        level: cls.level,
        curriculum: cls.curriculum,
        studentCount: cls._count?.students || 0
      }))
    });
  }, [classes, isLoadingClasses, classesError]);

  useEffect(() => {
    if (selectedClass && selectedTerm) {
      console.log('Class Subjects Data:', {
        classId: selectedClass,
        termId: selectedTerm,
        isLoading: isLoadingSubjects,
        error: subjectsError,
        count: classSubjects.length,
        subjects: classSubjects.map((cs: { id: any; subject: { id: any; name: any; code: any; }; teacher: { user: { firstName: any; lastName: any; }; }; }) => ({
          id: cs.id,
          subjectId: cs.subject?.id,
          subjectName: cs.subject?.name,
          subjectCode: cs.subject?.code,
          teacher: cs.teacher ?
            `${cs.teacher.user?.firstName} ${cs.teacher.user?.lastName}` : 'Not assigned'
        }))
      });

      // Auto-select the first subject if available
      if (!selectedClassSubject && classSubjects.length > 0) {
        console.log('Auto-selecting first subject:', classSubjects[0].subject?.name);
        setSelectedClassSubject(classSubjects[0].id);
      }
    }
  }, [selectedClass, selectedTerm, classSubjects, isLoadingSubjects, subjectsError, selectedClassSubject]);

  useEffect(() => {
    if (stats) {
      console.log('Assessment Statistics:', {
        isLoading: isLoadingStats,
        error: statsError,
        data: stats.data
      });
    }
  }, [stats, isLoadingStats, statsError]);

  const handleGradeEntry = (assessmentId: string) => {
    console.log('Grade entry clicked for assessment:', assessmentId);
    navigate(`/assessments/${assessmentId}/grades`);
  };

  const handleCreateAssessment = () => {
    if (!selectedClass || !selectedTerm) {
      toast.error('Please select a class and term first');
      return;
    }

    console.log('Creating new assessment with:', {
      classId: selectedClass,
      termId: selectedTerm,
      classSubjectId: selectedClassSubject || 'Not selected'
    });

    navigate('/assessments/new', {
      state: {
        classId: selectedClass,
        termId: selectedTerm,
        classSubjectId: selectedClassSubject || null
      }
    });
  };

  const handleClassChange = (classId: string) => {
    console.log('Class changed to:', classId);
    setSelectedClass(classId);
    // Reset subject selection when class changes
    setSelectedClassSubject('');
  };

  const handleTermChange = (termId: string) => {
    console.log('Term changed to:', termId);
    setSelectedTerm(termId);
    // Reset subject selection when term changes
    setSelectedClassSubject('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Assessments</h1>
          <p className="text-gray-500 mt-1">
            Manage assessments, enter grades, and generate reports
          </p>
          {activeYear && (
            <p className="text-sm text-gray-600 mt-1">
              Academic Year: {activeYear.year} {activeYear.isActive && '(Active)'}
            </p>
          )}
        </div>
        <Button onClick={handleCreateAssessment} disabled={!selectedClass || !selectedTerm}>
          <Plus className="h-4 w-4 mr-2" />
          Create Assessment
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats?.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.data.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                With Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.data.withResults || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.data.withoutResults || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                By Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.data.byType || {}).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-gray-600">{type}</span>
                    <span className="font-semibold">{count as number}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading States */}
      {(isLoadingYear || isLoadingClasses || isLoadingStats) && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Loading data...</p>
          </CardContent>
        </Card>
      )}

      {/* Error States */}
      {yearError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-12 text-center">
            <p className="text-red-600">Error loading academic year: {yearError.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {selectedClass && selectedTerm && (
              <span className="text-xs font-normal text-gray-500 ml-auto">
                Class: {classes.find((c: { id: string; }) => c.id === selectedClass)?.name},
                Term: {terms.find((t: { id: string; }) => t.id === selectedTerm)?.name?.replace('_', ' ') || 'Unknown'}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Term Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Term</label>
              <Select value={selectedTerm} onValueChange={handleTermChange} disabled={isLoadingYear}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingYear ? "Loading..." : "Select term"} />
                </SelectTrigger>
                <SelectContent>
                  {terms.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No terms available
                    </SelectItem>
                  ) : (
                    terms.map((term: any) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name.replace('_', ' ')} (Term {term.termNumber})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedTerm && (
                <p className="text-xs text-gray-500 mt-1">
                  {terms.find((t: { id: string; }) => t.id === selectedTerm)?.startDate ?
                    `Starts: ${new Date(terms.find((t: { id: string; }) => t.id === selectedTerm)?.startDate).toLocaleDateString()}` : ''}
                </p>
              )}
            </div>

            {/* Class Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Class</label>
              <Select value={selectedClass} onValueChange={handleClassChange} disabled={isLoadingClasses}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingClasses ? "Loading..." : "Select class"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No classes available
                    </SelectItem>
                  ) : (
                    classes.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.level} ({cls.curriculum})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedClass && (
                <p className="text-xs text-gray-500 mt-1">
                  {classes.find((c: { id: string; }) => c.id === selectedClass)?._count?.students || 0} students
                </p>
              )}
            </div>

            {/* Class Subject Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select
                value={selectedClassSubject}
                onValueChange={setSelectedClassSubject}
                disabled={!selectedClass || !selectedTerm || isLoadingSubjects}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !selectedClass || !selectedTerm ? "Select class and term first" :
                        isLoadingSubjects ? "Loading..." :
                          "Select subject"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {classSubjects.length === 0 ? (
                    <SelectItem value="all" disabled>
                      No subjects assigned
                    </SelectItem>
                  ) : (
                    <>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {classSubjects.map((cs: any) => (
                        <SelectItem key={cs.id} value={cs.id}>
                          {cs.subject?.name || 'Unknown Subject'} ({cs.subject?.code})
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              {!selectedClass && (
                <p className="text-xs text-gray-500 mt-1">
                  Select a class first
                </p>
              )}
              {selectedClass && !selectedTerm && (
                <p className="text-xs text-gray-500 mt-1">
                  Select a term first
                </p>
              )}
              {selectedClassSubject && selectedClassSubject !== 'all' && (
                <p className="text-xs text-gray-500 mt-1">
                  {classSubjects.find((cs: { id: string; }) => cs.id === selectedClassSubject)?.teacher ?
                    `Teacher: ${classSubjects.find((cs: { id: string; }) => cs.id === selectedClassSubject)?.teacher?.user?.firstName} 
                    ${classSubjects.find((cs: { id: string; }) => cs.id === selectedClassSubject)?.teacher?.user?.lastName}` :
                    'No teacher assigned'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment List by Type */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="CAT">CATs</TabsTrigger>
          <TabsTrigger value="MIDTERM">Mid-Term</TabsTrigger>
          <TabsTrigger value="END_OF_TERM">End of Term</TabsTrigger>
          <TabsTrigger value="MOCK">Mock</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {selectedTerm ? (
            <AssessmentList
              termId={selectedTerm}
              classSubjectId={selectedClassSubject !== 'all' ? selectedClassSubject : undefined}
              onGradeEntry={handleGradeEntry}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">
                  {isLoadingYear ? "Loading terms..." : "Please select a term to view assessments"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {['CAT', 'MIDTERM', 'END_OF_TERM', 'MOCK'].map((type) => (
          <TabsContent key={type} value={type} className="mt-6">
            {selectedTerm ? (
              <AssessmentList
                termId={selectedTerm}
                classSubjectId={selectedClassSubject !== 'all' ? selectedClassSubject : undefined}
                onGradeEntry={handleGradeEntry}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">
                    {isLoadingYear ? "Loading terms..." : "Please select a term to view assessments"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
