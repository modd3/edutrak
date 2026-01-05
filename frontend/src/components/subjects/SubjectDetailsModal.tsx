// src/components/subjects/SubjectDetailsModal.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Subject } from '@/types';

interface SubjectDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject;
}

const CATEGORY_LABELS: Record<string, string> = {
  CORE: 'Core',
  ELECTIVE: 'Elective',
  COMPETENCY: 'Competency',
};

const CURRICULUM_LABELS: Record<string, string> = {
  '8_4_4': '8-4-4',
  CBC: 'CBC',
};

export function SubjectDetailsModal({
  open,
  onOpenChange,
  subject,
}: SubjectDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{subject.name}</DialogTitle>
          <DialogDescription>
            Subject Code: {subject.code}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-600">Category</h4>
              <div className="mt-2">
                <Badge variant="outline">
                  {CATEGORY_LABELS[subject.category] || subject.category}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-600">Learning Area</h4>
              <p className="mt-2">{subject.learningArea || '-'}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold text-sm text-gray-600 mb-2">
              Curriculum Levels
            </h4>
            <div className="flex gap-2">
              {subject.curriculum?.map((curr) => (
                <Badge key={curr} variant="secondary">
                  {CURRICULUM_LABELS[curr] || curr}
                </Badge>
              ))}
            </div>
          </div>

          {subject.subjectGroup && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold text-sm text-gray-600">Subject Group</h4>
                <p className="mt-2">{subject.subjectGroup}</p>
              </div>
            </>
          )}

          {subject.description && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold text-sm text-gray-600">Description</h4>
                <p className="mt-2 text-sm text-gray-700">{subject.description}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
