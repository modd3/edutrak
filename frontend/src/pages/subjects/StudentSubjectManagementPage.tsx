// src/pages/subjects/StudentSubjectManagementPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Users, BookOpen, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveAcademicYear } from '@/hooks/use-academic';
import { useClasses } from '@/hooks/use-classes';
import { useClassSubjects } from '@/hooks/use-class-subjects';
import { useClassStudents } from '@/hooks/use-class-students';
import { useStudentsEnrolledInSubject } from '@/hooks/use-student-subject-enrollment';
import { AdminSubjectAssignmentDialog } from '@/components/subjects/AdminSubjectAssignment';
import { useSchoolContext } from '@/hooks/use-school-context';

export function StudentSubjectManagementPage() {
  const navigate = useNavigate();
  const { schoolId } = useSchoolContext();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);

  // Get active academic year
  const { data: activeYearData } = useActiveAcademicYear();
  const activeYear = activeYearData;

  // Get classes
  const { data: classesData } = useClasses(activeYear?.id);
  const classes = classesData?.data?.data || [];

  // Get terms
  const terms = activeYear?.terms || [];

  // Get class subjects
  const { data: subjectsData } = useClassSubjects(selectedClass, activeYear?.id || '', selectedTerm);
  const subjects = subjectsData?.data?.data || [];

  // Get students in class
  const { data: studentsData } = useClassStudents(selectedClass, activeYear?.id || '', selectedTerm);
  const classStudents = studentsData?.data?.data || [];

  // Get students enrolled in selected subject
  const { data: enrolledStudentsData } = useStudentsEnrolledInSubject(
    selectedSubject,
    { status: 'ACTIVE' }
  );
  const enrolledStudents = enrolledStudentsData?.data || [];

  const selectedClassData = classes.find((c: any) => c.id === selectedClass);
  const selectedSubjectData = subjects.find((s: any) => s.id === selectedSubject);

  const filteredStudents = classStudents.filter((student: any) => {
    if (!searchQuery) return true;
    const fullName = `${student.student?.firstName} ${student.student?.lastName}`.toLowerCase();
    const admissionNo = student.student?.admissionNo?.toLowerCase() || '';
    return fullName.includes(searchQuery.toLowerCase()) || 
           admissionNo.includes(searchQuery.toLowerCase());
  });

  const handleAssignSubject = () => {
    if (!selectedClass || !selectedTerm) {
      toast.error('Please select a class and term first');
      return;
    }
    setShowAssignmentDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Student Subject Management</h1>
          <p className="text-gray-500 mt-1">
            Manage subject enrollments for students
          </p>
        </div>
        <Button onClick={handleAssignSubject}>
          <BookOpen className="w-4 h-4 mr-2" />
          Assign Subject
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term: any) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name.replace('_', ' ')} (Term {term.termNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                disabled={!selectedClass || !selectedTerm}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.subject?.name} ({subject.subjectCategory})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search Students</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or admission..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStudents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Available Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Enrolled in Selected Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledStudents.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Class Info */}
      {selectedClassData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Class Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Class Name</p>
                <p className="font-semibold">{selectedClassData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Level</p>
                <p className="font-semibold">{selectedClassData.level}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Curriculum</p>
                <Badge variant="outline">{selectedClassData.curriculum}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Class Teacher</p>
                <p className="font-semibold">
                  {selectedClassData.classTeacher?.user?.firstName}{' '}
                  {selectedClassData.classTeacher?.user?.lastName || 'Not assigned'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student List */}
      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Students in Class</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Badge variant="secondary">{filteredStudents.length} students</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No students found</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-sm">
                  <div className="col-span-2">Admission No.</div>
                  <div className="col-span-3">Student Name</div>
                  <div className="col-span-2">Gender</div>
                  <div className="col-span-3">Subjects Enrolled</div>
                  <div className="col-span-2">Actions</div>
                </div>
                <div className="divide-y">
                  {filteredStudents.map((student: any) => (
                    <div key={student.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50">
                      <div className="col-span-2 font-medium">
                        {student.student?.admissionNo}
                      </div>
                      <div className="col-span-3">
                        {student.student?.firstName} {student.student?.lastName}
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline">{student.student?.gender}</Badge>
                      </div>
                      <div className="col-span-3">
                        <div className="flex flex-wrap gap-1">
                          {student.subjectEnrollments?.slice(0, 3).map((enrollment: any) => (
                            <Badge key={enrollment.id} variant="secondary" className="text-xs">
                              {enrollment.classSubject?.subject?.code}
                            </Badge>
                          ))}
                          {student.subjectEnrollments?.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{student.subjectEnrollments.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/students/${student.studentId}/subjects`)}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subject Info */}
      {selectedSubjectData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subject Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Subject</p>
                <p className="font-semibold">{selectedSubjectData.subject?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <Badge variant="outline">{selectedSubjectData.subjectCategory}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Code</p>
                <p className="font-semibold">{selectedSubjectData.subject?.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teacher</p>
                <p className="font-semibold">
                  {selectedSubjectData.teacherProfile?.user?.firstName}{' '}
                  {selectedSubjectData.teacherProfile?.user?.lastName || 'Not assigned'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment Dialog */}
      {showAssignmentDialog && (
        <AdminSubjectAssignmentDialog
          open={showAssignmentDialog}
          onOpenChange={setShowAssignmentDialog}
          classId={selectedClass}
          academicYearId={activeYear?.id || ''}
          termId={selectedTerm}
          schoolId={schoolId}
        />
      )}
    </div>
  );
}