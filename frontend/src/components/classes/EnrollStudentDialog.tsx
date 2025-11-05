import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useStudents } from '@/hooks/use-students';
import { useClassStreams } from '@/hooks/use-classes';
import { useClassSubjects } from '@/hooks/use-class-subjects';
import { useEnrollStudent } from '@/hooks/use-class-students';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';

interface EnrollStudentDialogProps {
    classId: string;
    academicYearId: string;
  }
  
  export function EnrollStudentDialog({ classId, academicYearId }: EnrollStudentDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [selectedStream, setSelectedStream] = useState<string>('');
    
    const { user } = useAuthStore();
    const { data: students } = useStudents({ schoolId: user?.schoolId });
    const { data: streams } = useClassStreams(classId);
    const { mutate: enrollStudent, isPending } = useEnrollStudent();
  
    const handleEnroll = () => {
      if (!selectedStudent) return;
  
      enrollStudent({
        studentId: selectedStudent,
        classId,
        streamId: selectedStream || undefined,
        academicYearId,
        status: 'ACTIVE',
      }, {
        onSuccess: () => {
          setOpen(false);
          setSelectedStudent('');
          setSelectedStream('');
        },
      });
    };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Enroll Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enroll Student</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select
              value={selectedStudent}
              onValueChange={setSelectedStudent}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students?.data.map((student) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.firstName} {student.lastName} ({student.admissionNo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {streams && streams.length > 0 && (
            <div className="space-y-2">
              <Label>Stream</Label>
              <Select
                value={selectedStream}
                onValueChange={setSelectedStream}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stream" />
                </SelectTrigger>
                <SelectContent>
                  {streams.map((stream) => (
                    <SelectItem key={stream.id} value={stream.id.toString()}>
                      {stream.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {subjects?.data && subjects.data.length > 0 && (
            <div className="space-y-2">
              <Label>Subjects</Label>
              <div className="grid grid-cols-2 gap-2">
                {subjects.data.map((subject) => (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${subject.id}`}
                      checked={selectedSubjects.includes(subject.id.toString())}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSubjects([...selectedSubjects, subject.id.toString()]);
                        } else {
                          setSelectedSubjects(
                            selectedSubjects.filter((id) => id !== subject.id.toString())
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`subject-${subject.id}`}>{subject.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={handleEnroll} 
            disabled={!selectedStudent || isPending}
            className="w-full"
          >
            {isPending ? 'Enrolling...' : 'Enroll Student'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}