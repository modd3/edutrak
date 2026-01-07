// src/components/teachers/TeacherFormModal.tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Teacher } from '@/types';
import { useSchoolContext } from '@/hooks/use-school-context';
import { usePreviewSequence } from '@/hooks/use-sequences';
import { Briefcase, Sparkles, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api';

// Teacher form schema
const teacherFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  idNumber: z.string().nullable().optional().transform(e => e === "" ? null : e),
  tscNumber: z.string().min(1, 'TSC number is required'),
  employeeNumber: z.string().min(1, 'Employee number is required'),
  employmentType: z.enum(['PERMANENT', 'CONTRACT', 'TEMPORARY', 'BOM', 'PTA']),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  dateJoined: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
});

type TeacherFormData = z.infer<typeof teacherFormSchema>;

interface TeacherFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  teacher?: Teacher;
}

const EMPLOYMENT_TYPES = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'BOM', label: 'BOM' },
  { value: 'PTA', label: 'PTA' },
];

export function TeacherFormModal({ open, onOpenChange, mode, teacher }: TeacherFormModalProps) {
  const [autoGenerateEmployee, setAutoGenerateEmployee] = useState(mode === 'create');
  const [showPassword, setShowPassword] = useState(false);
  const { schoolId } = useSchoolContext();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      phone: '',
      idNumber: '',
      tscNumber: '',
      employeeNumber: '',
      employmentType: 'PERMANENT',
      qualification: '',
      specialization: '',
      dateJoined: '',
      password: '',
    },
  });

  // Get preview for auto-generated employee number
  const { data: previewEmployee, refetch: refreshEmployeePreview } = usePreviewSequence(
    'EMPLOYEE_NUMBER',
    schoolId,
    { enabled: autoGenerateEmployee && mode === 'create' && open }
  );

  // Reset form when opening in create mode
  useEffect(() => {
    if (open && mode === 'create') {
      resetForm();
    }
  }, [open, mode]);

  // Populate form when teacher data changes (edit mode)
  useEffect(() => {
    if (mode === 'edit' && teacher && open) {
      form.reset({
        firstName: teacher.user?.firstName || '',
        lastName: teacher.user?.lastName || '',
        middleName: teacher.user?.middleName || '',
        email: teacher.user?.email || '',
        phone: teacher.user?.phone || '',
        idNumber: teacher.user?.idNumber || '',
        tscNumber: teacher.tscNumber,
        employeeNumber: teacher.employeeNumber || '',
        employmentType: teacher.employmentType,
        qualification: teacher.qualification || '',
        specialization: teacher.specialization || '',
        dateJoined: teacher.dateJoined ? new Date(teacher.dateJoined).toISOString().split('T')[0] : '',
        password: '',
      });
      setAutoGenerateEmployee(false);
    }
  }, [mode, teacher, open, form]);

  // Set employee number when preview changes
  useEffect(() => {
    if (autoGenerateEmployee && mode === 'create' && previewEmployee?.preview) {
      form.setValue('employeeNumber', previewEmployee.preview, {
        shouldValidate: true
      });
    }
  }, [previewEmployee, autoGenerateEmployee, mode, form]);

  const resetForm = () => {
    form.reset({
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      phone: '',
      idNumber: '',
      tscNumber: '',
      employeeNumber: '',
      employmentType: 'PERMANENT',
      qualification: '',
      specialization: '',
      dateJoined: '',
      password: '',
    });
    setShowPassword(false);
    setAutoGenerateEmployee(mode === 'create');
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const onSubmit = async (data: TeacherFormData) => {
    try {
      setIsLoading(true);

      // Validate teacher form
      const isValid = await form.trigger();
      if (!isValid) {
        const errors = Object.values(form.formState.errors);
        if (errors.length > 0) {
          toast.error(`${errors[0].message}`);
        } else {
          toast.error('Please fill in all required fields');
        }
        return;
      }

      // Ensure employee number is set
      if (!data.employeeNumber) {
        if (autoGenerateEmployee && previewEmployee?.preview) {
          data.employeeNumber = previewEmployee.preview;
        } else {
          toast.error('Employee number is required');
          return;
        }
      }

      // Prepare request body
      const requestBody = {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        email: data.email,
        phone: data.phone,
        idNumber: data.idNumber === '' ? null : data.idNumber,
        role: 'TEACHER',
        schoolId,
        password: data.password || undefined,
        tscNumber: data.tscNumber,
        employeeNumber: data.employeeNumber,
        employmentType: data.employmentType,
        qualification: data.qualification,
        specialization: data.specialization,
        dateJoined: data.dateJoined ? new Date(data.dateJoined) : undefined,
      };

      if (mode === 'create') {
        await api.post('/teachers/with-user', requestBody);
        toast.success('Teacher created successfully');
        onOpenChange(false);
        resetForm();
        // Optionally refresh the list
        window.location.reload();
      } else if (teacher) {
        // For edit, update user and teacher separately
        await api.put(`/users/${teacher.userId}`, {
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          email: data.email,
          phone: data.phone,
          idNumber: data.idNumber === '' ? null : data.idNumber,
          ...(data.password && { password: data.password }),
        });

        await api.put(`/teachers/${teacher.id}`, {
          tscNumber: data.tscNumber,
          employeeNumber: data.employeeNumber,
          employmentType: data.employmentType,
          qualification: data.qualification,
          specialization: data.specialization,
          dateJoined: data.dateJoined ? new Date(data.dateJoined) : undefined,
        });

        toast.success('Teacher updated successfully');
        onOpenChange(false);
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save teacher');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            {mode === 'create' ? 'Create New Teacher' : 'Edit Teacher'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the teacher details and professional information.'
              : 'Update teacher information and profile.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input {...form.register('firstName')} placeholder="John" />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input {...form.register('lastName')} placeholder="Doe" />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input {...form.register('middleName')} placeholder="Optional" />
                </div>

                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input {...form.register('email')} type="email" placeholder="teacher@example.com" />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...form.register('phone')} placeholder="+254712345678" />
                </div>

                <div className="space-y-2">
                  <Label>ID Number</Label>
                  <Input {...form.register('idNumber')} placeholder="12345678" />
                </div>

                {mode === 'create' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Password *</Label>
                    <div className="relative">
                      <Input
                        {...form.register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter secure password"
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
                      <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                    )}
                  </div>
                )}

                {mode === 'edit' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Update Password (Optional)</Label>
                    <div className="relative">
                      <Input
                        {...form.register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Leave blank to keep current password"
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
                      <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Teacher Profile Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>TSC Number *</Label>
                  <Input {...form.register('tscNumber')} placeholder="e.g., ABC123456" />
                  {form.formState.errors.tscNumber && (
                    <p className="text-sm text-destructive">{form.formState.errors.tscNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Employee Number *</Label>
                    {mode === 'create' && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="autoEmployee"
                          checked={autoGenerateEmployee}
                          onCheckedChange={(checked) => {
                            setAutoGenerateEmployee(!!checked);
                            if (!checked) {
                              form.setValue('employeeNumber', '');
                            }
                          }}
                        />
                        <Label htmlFor="autoEmployee" className="text-xs font-normal cursor-pointer">
                          Auto-generate
                        </Label>
                      </div>
                    )}
                  </div>

                  {autoGenerateEmployee && mode === 'create' ? (
                    <div className="relative">
                      <Input
                        value={previewEmployee?.preview || 'Generating...'}
                        disabled
                        className="bg-muted"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => refreshEmployeePreview()}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Input
                      {...form.register('employeeNumber')}
                      placeholder="Enter employee number manually"
                      disabled={mode === 'edit'}
                    />
                  )}
                  
                  {previewEmployee && autoGenerateEmployee && (
                    <p className="text-xs text-muted-foreground">
                      Next available: {previewEmployee.preview}
                    </p>
                  )}
                  
                  {form.formState.errors.employeeNumber && !autoGenerateEmployee && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.employeeNumber.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Employment Type *</Label>
                  <Controller
                    name="employmentType"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.employmentType && (
                    <p className="text-sm text-destructive">{form.formState.errors.employmentType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Date Joined</Label>
                  <Input {...form.register('dateJoined')} type="date" />
                </div>

                <div className="space-y-2">
                  <Label>Qualification</Label>
                  <Input
                    {...form.register('qualification')}
                    placeholder="e.g., Bachelor of Education"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <Input
                    {...form.register('specialization')}
                    placeholder="e.g., Mathematics, Science"
                  />
                </div>
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Teacher' : 'Update Teacher'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
