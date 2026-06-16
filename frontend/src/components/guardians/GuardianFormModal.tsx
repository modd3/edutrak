// src/components/guardians/GuardianFormModal.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { GuardianResponse } from '@/services/guardian.service';
import { useCreateGuardian, useUpdateGuardian } from '@/hooks/use-guardians';

export type InlineGuardianData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  idNumber?: string;
  relationship: string;
  occupation?: string;
  employer?: string;
  workPhone?: string;
  isPrimary: boolean;
};

// Schema for standalone guardian mode (relationship is enum)
const standaloneGuardianSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  idNumber: z.string().optional(),
  relationship: z.enum(['FATHER', 'MOTHER', 'GUARDIAN', 'UNCLE', 'AUNT', 'GRANDPARENT', 'OTHER']),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  workPhone: z.string().optional(),
});

// Schema for student-context mode (relationship is free-text, includes isPrimary)
const studentContextGuardianSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  idNumber: z.string().optional(),
  relationship: z.string().min(1, 'Relationship is required'),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  workPhone: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
});

type StandaloneGuardianFormData = z.infer<typeof standaloneGuardianSchema>;
type StudentContextGuardianFormData = z.infer<typeof studentContextGuardianSchema>;

interface GuardianFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  guardian?: GuardianResponse;
  /** When true, shows isPrimary checkbox and uses free-text relationship. Default false. */
  studentContext?: boolean;
  /** When provided, submits data via this callback instead of API mutations */
  onInlineSave?: (data: InlineGuardianData) => void;
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
  studentContext = false,
  onInlineSave,
}: GuardianFormModalProps) {
  const { mutate: createGuardian, isPending: isCreating } = useCreateGuardian();
  const { mutate: updateGuardian, isPending: isUpdating } = useUpdateGuardian();
  const isLoading = isCreating || isUpdating;
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<StandaloneGuardianFormData | StudentContextGuardianFormData>({
    resolver: zodResolver(studentContext ? studentContextGuardianSchema : standaloneGuardianSchema),
    defaultValues: studentContext
      ? {
          firstName: '',
          lastName: '',
          middleName: '',
          email: '',
          password: '',
          phone: '',
          idNumber: '',
          relationship: '',
          occupation: '',
          employer: '',
          workPhone: '',
          isPrimary: false,
        }
      : {
          firstName: '',
          lastName: '',
          middleName: '',
          email: '',
          password: '',
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
      const baseValues = {
        firstName: guardian.user.firstName,
        lastName: guardian.user.lastName,
        middleName: guardian.user.middleName || '',
        email: guardian.user.email,
        password: '',
        phone: guardian.user.phone || '',
        idNumber: guardian.user.idNumber || '',
        relationship: guardian.relationship,
        occupation: guardian.occupation || '',
        employer: guardian.employer || '',
        workPhone: guardian.workPhone || '',
      };

      if (studentContext) {
        form.reset({
          ...baseValues,
          isPrimary: false,
        } as StudentContextGuardianFormData);
      } else {
        // For edit in standalone mode, ensure relationship is a valid enum value
        const validRelationship = RELATIONSHIPS.some(r => r.value === guardian.relationship)
          ? (guardian.relationship as any)
          : 'OTHER';
        form.reset({
          ...baseValues,
          relationship: validRelationship,
        } as StandaloneGuardianFormData);
      }
    } else if (open) {
      form.reset();
    }
  }, [guardian, mode, open, form, studentContext]);

  const onSubmit = (data: StandaloneGuardianFormData | StudentContextGuardianFormData) => {
    // If inline save callback is provided, use it
    if (onInlineSave) {
      const inlineData: InlineGuardianData = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        phone: data.phone,
        idNumber: data.idNumber,
        relationship: data.relationship,
        occupation: data.occupation,
        employer: data.employer,
        workPhone: data.workPhone,
        isPrimary: studentContext ? (data as StudentContextGuardianFormData).isPrimary : false,
      };
      onInlineSave(inlineData);
      toast.success('Guardian added to student');
      form.reset();
      onOpenChange(false);
      return;
    }

    // Otherwise use API mutations
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
              <Label htmlFor="password">
                {mode === 'create' ? 'Password *' : 'Update Password (Optional)'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'create' ? 'Secure password' : 'Leave blank to keep current'}
                  {...form.register('password')}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+254..."
                {...form.register('phone')}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="idNumber">ID Number</Label>
              <Input
                id="idNumber"
                placeholder="National ID or Passport"
                {...form.register('idNumber')}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              {studentContext ? (
                <>
                  <Label htmlFor="relationship">Relationship *</Label>
                  <Input
                    id="relationship"
                    placeholder="e.g. Father, Mother, Guardian"
                    {...form.register('relationship')}
                    disabled={isLoading}
                  />
                  {form.formState.errors.relationship && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.relationship.message}
                    </p>
                  )}
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

            {studentContext && (
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isPrimary"
                    checked={(form.watch() as StudentContextGuardianFormData).isPrimary}
                    onCheckedChange={(checked) =>
                      form.setValue('isPrimary', checked === true)}
                  />
                  <Label htmlFor="isPrimary" className="cursor-pointer text-sm font-normal">
                    Primary guardian
                  </Label>
                </div>
              </div>
            )}
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
                : onInlineSave
                ? 'Add to Student'
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