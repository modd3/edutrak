import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface AssignSubjectDialogProps {
  classId: string;
}

export function AssignSubjectDialog({ classId }: AssignSubjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isCompulsory, setIsCompulsory] = useState(false);
  
  const { data: subjects } = useSubjects();
  const { mutate: assignSubject, isPending } = useAssignSubject();

  const handleAssign = () => {
    if (!selectedSubject) return;

    assignSubject({
      classId,
      subjectId: selectedSubject,
      teacherId: undefined,
      isCompulsory,
    }, {
      onSuccess: () => {
        setOpen(false);
        setSelectedSubject('');
        setIsCompulsory(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Subject to Class</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Select a subject to add to this class. You can assign teachers to subjects separately.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Subject *</Label>
            <Select
              value={selectedSubject}
              onValueChange={setSelectedSubject}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {!subjects?.data || subjects.data.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No subjects available
                  </SelectItem>
                ) : (
                  subjects.data.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isCompulsory"
              checked={isCompulsory}
              onCheckedChange={(checked) => setIsCompulsory(!!checked)}
            />
            <Label htmlFor="isCompulsory" className="font-normal cursor-pointer">
              This is a compulsory subject
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedSubject || isPending}
          >
            {isPending ? 'Adding...' : 'Add Subject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}