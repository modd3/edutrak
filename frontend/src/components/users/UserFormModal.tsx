// Enhanced UserFormModal with conditional profile fields
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
import { User, Role } from '@/types';
import { useCreateUserWithProfile, useUpdateUserWithProfile } from '@/hooks/use-users';
import { useSchools } from '@/hooks/use-schools';
import { toast } from 'sonner';
import { UserIcon, Eye, EyeOff, GraduationCap, BookOpen, Users } from 'lucide-react';

// Base user schema
const baseUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  phone: z.string().optional(),
  idNumber: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPPORT_STAFF']),
  schoolId: z.string().optional(),
});

// Student profile schema
const studentProfileSchema = z.object({
  admissionNo: z.string().min(1, 'Admission number is required'),
  gender: z.enum(['MALE', 'FEMALE']),
  dob: z.string().optional(),
  upiNumber: z.string().optional(),
  kemisUpi: z.string().optional(),
  birthCertNo: z.string().optional(),
  county: z.string().optional(),
  subCounty: z.string().optional(),
  hasSpecialNeeds: z.boolean().default(false),
  specialNeedsType: z.string().optional(),
  medicalCondition: z.string().optional(),
  allergies: z.string().optional(),
});

// Teacher profile schema
const teacherProfileSchema = z.object({
  tscNumber: z.string().min(1, 'TSC number is required'),
  employmentType: z.enum(['PERMANENT', 'CONTRACT', 'TEMPORARY', 'BOM', 'PTA']),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  dateJoined: z.string().optional(),
});

// Guardian profile schema
const guardianProfileSchema = z.object({
  relationship: z.string().min(1, 'Relationship is required'),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  workPhone: z.string().optional(),
});

type BaseUserFormData = z.infer<typeof baseUserSchema>;
type StudentProfileFormData = z.infer<typeof studentProfileSchema>;
type TeacherProfileFormData = z.infer<typeof teacherProfileSchema>;
type GuardianProfileFormData = z.infer<typeof guardianProfileSchema>;

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  user?: User;
}

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'SUPPORT_STAFF', label: 'Support Staff' },
];

const EMPLOYMENT_TYPES = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'BOM', label: 'BOM' },
  { value: 'PTA', label: 'PTA' },
];

export function UserFormModal({ open, onOpenChange, mode, user }: UserFormModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('STUDENT');

  const { mutate: createUser, isPending: isCreating } = useCreateUserWithProfile();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUserWithProfile();
  const { data: schoolsResponse } = useSchools({ limit: 100 });
  const isLoading = isCreating || isUpdating;

  // Base user form
  const userForm = useForm<BaseUserFormData>({
    resolver: zodResolver(baseUserSchema),
    defaultValues: user ? {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName || '',
      phone: user.phone || '',
      idNumber: user.idNumber || '',
      role: user.role as Role,
      schoolId: user.schoolId || '',
    } : {
      role: 'STUDENT',
    },
  });

  // Student profile form
  const studentForm = useForm<StudentProfileFormData>({
    resolver: zodResolver(studentProfileSchema),
  });

  // Teacher profile form
  const teacherForm = useForm<TeacherProfileFormData>({
    resolver: zodResolver(teacherProfileSchema),
  });

  // Guardian profile form
  const guardianForm = useForm<GuardianProfileFormData>({
    resolver: zodResolver(guardianProfileSchema),
  });

  // Watch role changes
  const watchedRole = userForm.watch('role');

  useEffect(() => {
    setSelectedRole(watchedRole as Role);
  }, [watchedRole]);

  const onSubmit = async () => {
    // Validate base user form
    const isUserValid = await userForm.trigger();
    if (!isUserValid) {
      toast.error('Please fill in all required user fields');
      return;
    }

    const userData = userForm.getValues();
    let profileData: any = null;

    // Validate and get profile data based on role
    if (selectedRole === 'STUDENT') {
      const isProfileValid = await studentForm.trigger();
      if (!isProfileValid) {
        toast.error('Please fill in all required student fields');
        return;
      }
      profileData = studentForm.getValues();
    } else if (selectedRole === 'TEACHER') {
      const isProfileValid = await teacherForm.trigger();
      if (!isProfileValid) {
        toast.error('Please fill in all required teacher fields');
        return;
      }
      profileData = teacherForm.getValues();
    } else if (selectedRole === 'PARENT') {
      const isProfileValid = await guardianForm.trigger();
      if (!isProfileValid) {
        toast.error('Please fill in all required guardian fields');
        return;
      }
      profileData = guardianForm.getValues();
    }

    // Prepare request body
    const requestBody = {
      user: userData,
      profile: profileData,
    };

    if (mode === 'create') {
      createUser(requestBody, {
        onSuccess: () => {
          toast.success('User created successfully');
          onOpenChange(false);
          resetAllForms();
        },
      });
    } else if (user) {
      updateUser({ id: user.id, data: requestBody }, {
        onSuccess: () => {
          toast.success('User updated successfully');
          onOpenChange(false);
        },
      });
    }
  };

  const resetAllForms = () => {
    userForm.reset();
    studentForm.reset();
    teacherForm.reset();
    guardianForm.reset();
    setShowPassword(false);
  };

  useEffect(() => {
    if (!open) {
      resetAllForms();
    }
  }, [open]);

  const schools = schoolsResponse?.data?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-6 w-6" />
            {mode === 'create' ? 'Create New User' : 'Edit User'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the user details and role-specific information.'
              : 'Update user information and profile.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Base User Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input {...userForm.register('firstName')} placeholder="John" />
                  {userForm.formState.errors.firstName && (
                    <p className="text-sm text-destructive">{userForm.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input {...userForm.register('lastName')} placeholder="Doe" />
                  {userForm.formState.errors.lastName && (
                    <p className="text-sm text-destructive">{userForm.formState.errors.lastName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input {...userForm.register('middleName')} placeholder="Optional" />
                </div>

                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input {...userForm.register('email')} type="email" placeholder="user@example.com" />
                  {userForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{userForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...userForm.register('phone')} placeholder="+254712345678" />
                </div>

                <div className="space-y-2">
                  <Label>ID Number</Label>
                  <Input {...userForm.register('idNumber')} placeholder="12345678" />
                </div>

                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Controller
                    name="role"
                    control={userForm.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>School</Label>
                  <Controller
                    name="schoolId"
                    control={userForm.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select school" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No School</SelectItem>
                          {schools.map((school) => (
                            <SelectItem key={school.id} value={school.id}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {mode === 'create' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Password *</Label>
                    <div className="relative">
                      <Input
                        {...userForm.register('password')}
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
                  </div>
                )}
              </div>
            </div>

            {/* Role-Specific Profile Fields */}
            {selectedRole === 'STUDENT' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Student Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Admission Number *</Label>
                      <Input {...studentForm.register('admissionNo')} placeholder="STU2024001" />
                      {studentForm.formState.errors.admissionNo && (
                        <p className="text-sm text-destructive">{studentForm.formState.errors.admissionNo.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Gender *</Label>
                      <Controller
                        name="gender"
                        control={studentForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MALE">Male</SelectItem>
                              <SelectItem value="FEMALE">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input {...studentForm.register('dob')} type="date" />
                    </div>

                    <div className="space-y-2">
                      <Label>Birth Certificate No</Label>
                      <Input {...studentForm.register('birthCertNo')} placeholder="123456" />
                    </div>

                    <div className="space-y-2">
                      <Label>UPI Number</Label>
                      <Input {...studentForm.register('upiNumber')} placeholder="UPI Number" />
                    </div>

                    <div className="space-y-2">
                      <Label>County</Label>
                      <Input {...studentForm.register('county')} placeholder="Nairobi" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedRole === 'TEACHER' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Teacher Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>TSC Number *</Label>
                      <Input {...teacherForm.register('tscNumber')} placeholder="TSC123456" />
                      {teacherForm.formState.errors.tscNumber && (
                        <p className="text-sm text-destructive">{teacherForm.formState.errors.tscNumber.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Employment Type *</Label>
                      <Controller
                        name="employmentType"
                        control={teacherForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
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
                    </div>

                    <div className="space-y-2">
                      <Label>Qualification</Label>
                      <Input {...teacherForm.register('qualification')} placeholder="Bachelor of Education" />
                    </div>

                    <div className="space-y-2">
                      <Label>Specialization</Label>
                      <Input {...teacherForm.register('specialization')} placeholder="Mathematics" />
                    </div>

                    <div className="space-y-2">
                      <Label>Date Joined</Label>
                      <Input {...teacherForm.register('dateJoined')} type="date" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedRole === 'PARENT' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Guardian Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Relationship *</Label>
                      <Input {...guardianForm.register('relationship')} placeholder="Father, Mother, Guardian..." />
                      {guardianForm.formState.errors.relationship && (
                        <p className="text-sm text-destructive">{guardianForm.formState.errors.relationship.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Occupation</Label>
                      <Input {...guardianForm.register('occupation')} placeholder="Doctor, Teacher..." />
                    </div>

                    <div className="space-y-2">
                      <Label>Employer</Label>
                      <Input {...guardianForm.register('employer')} placeholder="Company name" />
                    </div>

                    <div className="space-y-2">
                      <Label>Work Phone</Label>
                      <Input {...guardianForm.register('workPhone')} placeholder="+254712345678" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}