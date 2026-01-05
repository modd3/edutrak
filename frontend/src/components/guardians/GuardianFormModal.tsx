// src/components/guardians/GuardianFormModal.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GuardianResponse } from '@/services/guardian.service';
import { useCreateGuardian, useUpdateGuardian } from '@/hooks/use-guardians';
import { toast } from 'sonner';

const guardianSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  idNumber: z.string().optional(),
  relationship: z.enum(['FATHER', 'MOTHER', 'GUARDIAN', 'UNCLE', 'AUNT', 'GRANDPARENT', 'OTHER']),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  workPhone: z.string().optional(),
});

type GuardianFormData = z.infer<typeof guardianSchema>;

interface GuardianFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  guardian?: GuardianResponse;
}

const RELATIONSHIPS = [
  { value: 'FATHER', label: 'Father' },
  { value: 'MOTHER', label: 'Mother' },
  { value: 'GUARDIAN', label: 'Guardian' },
  { value: 'UNCLE', label: 'Uncle' },
  { value: 'AUNT', label: 'Aunt' },
  { value: 'GRANDPARENT', label: 'Grandparent' },
  { value: 'OTHER', label: 'Other' },
];

export function GuardianFormModal({
  open,
  onOpenChange,
  mode,
  guardian,
}: GuardianFormModalProps) {
  const { mutate: createGuardian, isPending: isCreating } = useCreateGuardian();
  const { mutate: updateGuardian, isPending: isUpdating } = useUpdateGuardian();
  const isLoading = isCreating || isUpdating;

  const form = useForm<GuardianFormData>({
    resolver: zodResolver(guardianSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      phone: '',
      idNumber: '',
      relationship: 'GUARDIAN',
      occupation: '',
      employer: '',
      workPhone: '',
    },
  });

  useEffect(() => {
    if (guardian && mode === 'edit') {
      form.reset({
        firstName: guardian.user.firstName,
        lastName: guardian.user.lastName,
        middleName: guardian.user.middleName || '',
        email: guardian.user.email,
        phone: guardian.user.phone || '',
        idNumber: guardian.user.idNumber || '',
        relationship: guardian.relationship as any,
        occupation: guardian.occupation || '',
        employer: guardian.employer || '',
        workPhone: guardian.workPhone || '',
      });
    } else {
      form.reset();
    }
  }, [guardian, mode, open, form]);

  const onSubmit = (data: GuardianFormData) => {
    if (mode === 'create') {
      createGuardian(data as any, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      });
    } else if (guardian) {
      const { email, ...updateData } = data;
      updateGuardian(
        { id: guardian.id, data: updateData as any },
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Guardian' : 'Edit Guardian'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new guardian or parent account'
              : 'Update guardian information'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="First name"
                {...form.register('firstName')}
                disabled={isLoading}
              />
              {form.formState.errors.firstName && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Last name"
                {...form.register('lastName')}
                disabled={isLoading}
              />
              {form.formState.errors.lastName && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                placeholder="Middle name"
                {...form.register('middleName')}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                {...form.register('email')}
                disabled={isLoading || mode === 'edit'}
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+254..."
                {...form.register('phone')}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="idNumber">ID Number</Label>
              <Input
                id="idNumber"
                placeholder="National ID or Passport"
                {...form.register('idNumber')}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="relationship">Relationship *</Label>
              <Select
                value={form.watch('relationship')}
                onValueChange={(value) =>
                  form.setValue('relationship', value as any)
                }
              >
                <SelectTrigger id="relationship">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((rel) => (
                    <SelectItem key={rel.value} value={rel.value}>
                      {rel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-4">Employment Information</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  placeholder="e.g., Engineer, Teacher"
                  {...form.register('occupation')}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="employer">Employer</Label>
                <Input
                  id="employer"
                  placeholder="Employer name"
                  {...form.register('employer')}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="workPhone">Work Phone</Label>
              <Input
                id="workPhone"
                placeholder="+254..."
                {...form.register('workPhone')}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? 'Saving...'
                : mode === 'create'
                ? 'Create Guardian'
                : 'Update Guardian'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
