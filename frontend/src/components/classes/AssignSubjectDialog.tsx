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
import { useTeachers } from '@/hooks/use-teachers';
import { useSubjects } from '@/hooks/use-subjects';
import { useAssignSubject } from '@/hooks/use-class-subjects';
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

interface AssignSubjectDialogProps {
  classId: string;
}

export function AssignSubjectDialog({ classId }: AssignSubjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [isCompulsory, setIsCompulsory] = useState(false);
  
  const { user } = useAuthStore();
  const { data: subjects } = useSubjects();
  const { data: teachers } = useTeachers({ schoolId: user?.schoolId });
  const { mutate: assignSubject, isPending } = useAssignSubject();

  const handleAssign = () => {
    if (!selectedSubject) return;

    assignSubject({
      classId,
      subjectId: selectedSubject,
      teacherId: selectedTeacher || undefined,
      isCompulsory,
    }, {
      onSuccess: () => {
        setOpen(false);
        setSelectedSubject('');
        setSelectedTeacher('');
        setIsCompulsory(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Assign Subject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Subject to Class</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select
              value={selectedSubject}
              onValueChange={setSelectedSubject}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects?.data.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subject Teacher (Optional)</Label>
            <Select
              value={selectedTeacher}
              onValueChange={setSelectedTeacher}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {teachers?.data.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.user.firstName} {teacher.user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isCompulsory"
              checked={isCompulsory}
              onCheckedChange={(checked) => setIsCompulsory(!!checked)}
            />
            <Label htmlFor="isCompulsory">Compulsory Subject</Label>
          </div>

          <Button
            onClick={handleAssign}
            disabled={!selectedSubject || isPending}
            className="w-full"
          >
            {isPending ? 'Assigning...' : 'Assign Subject'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}