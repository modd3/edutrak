// src/components/guardians/GuardianDetailsModal.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, Building2 } from 'lucide-react';
import { GuardianResponse } from '@/services/guardian.service';

interface GuardianDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guardian: GuardianResponse;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  FATHER: 'Father',
  MOTHER: 'Mother',
  GUARDIAN: 'Guardian',
  UNCLE: 'Uncle',
  AUNT: 'Aunt',
  GRANDPARENT: 'Grandparent',
  OTHER: 'Other',
};

export function GuardianDetailsModal({
  open,
  onOpenChange,
  guardian,
}: GuardianDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {guardian.user.firstName} {guardian.user.lastName}
          </DialogTitle>
          <DialogDescription>
            {RELATIONSHIP_LABELS[guardian.relationship] || guardian.relationship}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-600">Full Name</h4>
              <p className="mt-2">
                {guardian.user.firstName} {guardian.user.middleName || ''} {guardian.user.lastName}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-600">ID Number</h4>
              <p className="mt-2">{guardian.user.idNumber || '-'}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold text-sm text-gray-600 mb-3">Contact Information</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <a href={`mailto:${guardian.user.email}`} className="text-blue-600 hover:underline">
                  {guardian.user.email}
                </a>
              </div>
              {guardian.user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <a href={`tel:${guardian.user.phone}`} className="text-blue-600 hover:underline">
                    {guardian.user.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold text-sm text-gray-600">Relationship</h4>
            <div className="mt-2">
              <Badge variant="outline">
                {RELATIONSHIP_LABELS[guardian.relationship] || guardian.relationship}
              </Badge>
            </div>
          </div>

          {(guardian.occupation || guardian.employer) && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-3">Employment</h4>
                <div className="space-y-2">
                  {guardian.occupation && (
                    <div>
                      <p className="text-sm text-gray-500">Occupation</p>
                      <p className="font-medium">{guardian.occupation}</p>
                    </div>
                  )}
                  {guardian.employer && (
                    <div>
                      <p className="text-sm text-gray-500">Employer</p>
                      <p className="font-medium">{guardian.employer}</p>
                    </div>
                  )}
                  {guardian.workPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <a href={`tel:${guardian.workPhone}`} className="text-blue-600 hover:underline">
                        {guardian.workPhone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div>
            <h4 className="font-semibold text-sm text-gray-600">Account Status</h4>
            <div className="mt-2">
              <Badge variant={guardian.user.isActive ? 'default' : 'destructive'}>
                {guardian.user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
