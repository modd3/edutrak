import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api/client';

interface TransferStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: {
    id: string;
    admissionNo: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  };
  onSuccess?: () => void;
}

export function TransferStudentModal({
  open,
  onOpenChange,
  student,
  onSuccess,
}: TransferStudentModalProps) {
  const [newSchoolId, setNewSchoolId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !newSchoolId || !transferReason) {
      toast.error('Please fill out all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/students/transfer', {
        studentId: student.id,
        newSchoolId,
        transferReason,
      });
      toast.success('Student transferred successfully');
      onOpenChange(false);
      setNewSchoolId('');
      setTransferReason('');
      onSuccess?.();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to transfer student';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!student) return null;

  const studentName = student.user
    ? `${student.user.firstName} ${student.user.lastName}`
    : `Student #${student.admissionNo}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
            Transfer Student: {studentName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleTransfer} className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Target School ID</label>
            <Input
              placeholder="Enter Destination School UUID"
              value={newSchoolId}
              onChange={(e) => setNewSchoolId(e.target.value)}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the exact ID of the school receiving this student.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Reason for Transfer</label>
            <Textarea
              placeholder="e.g., Family relocation, board recommendation..."
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              disabled={isLoading}
              rows={3}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Transfer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
