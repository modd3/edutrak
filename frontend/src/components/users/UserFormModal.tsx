// src/components/users/UserFormModal.tsx
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
import { useSchoolContext, isSuperAdmin } from '@/hooks/use-school-context';
import { toast } from 'sonner';
import { UserIcon, Eye, EyeOff, GraduationCap, BookOpen, Users, Sparkles, RefreshCw, Building2 } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { usePreviewSequence } from '@/hooks/use-sequences';

// Base user schema
const baseUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  phone: z.string().optional(),
  idNumber: z.string().nullable().optional().transform(e => e === "" ? null : e),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPPORT_STAFF']),
  schoolId: z.string().optional(),
});

// Student profile schema
const studentProfileSchema = z.object({
  admissionNo: z.string().min(1, 'Admission number is required'),
  gender: z.enum(['MALE', 'FEMALE']),
  dob: z.string().optional().or(z.date().optional()),
  upiNumber: z.string().optional(),
  kemisUpi: z.string().optional(),
  birthCertNo: z.string().optional(),
  nationality: z.string().optional().default('Kenyan'),
  county: z.string().optional(),
  subCounty: z.string().optional(),
  hasSpecialNeeds: z.boolean().default(false),
  specialNeedsType: z.string().optional(),
  medicalCondition: z.string().optional(),
  allergies: z.string().optional(),
});

// Teacher profile schema - employeeNumber is REQUIRED
const teacherProfileSchema = z.object({
  tscNumber: z.string().min(1, 'TSC number is required'),
  employeeNumber: z.string().min(1, 'Employee number is required'),
  employmentType: z.enum(['PERMANENT', 'CONTRACT', 'TEMPORARY', 'BOM', 'PTA']),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  dateJoined: z.string().optional().or(z.date().optional()),
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

const getRoleOptions = (isSuperAdmin: boolean) => {
  const allRoles = ROLE_OPTIONS;

  if (!isSuperAdmin) {
    return allRoles.filter(role => role.value !== 'SUPER_ADMIN');
  }
  return allRoles;
}

const EMPLOYMENT_TYPES = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'BOM', label: 'BOM' },
  { value: 'PTA', label: 'PTA' },
];

export function UserFormModal({ open, onOpenChange, mode, user }: UserFormModalProps) {
  const [autoGenerateAdmission, setAutoGenerateAdmission] = useState(mode === 'create');
  const [autoGenerateEmployee, setAutoGenerateEmployee] = useState(mode === 'create');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(user?.role as Role || 'STUDENT');
  
  const { mutate: createUser, isPending: isCreating } = useCreateUserWithProfile();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUserWithProfile();
  const { data: schoolsResponse } = useSchools({ limit: 100 });
  const { schoolId, schoolName, isSuperAdmin } = useSchoolContext();
  const roleOptions = getRoleOptions(isSuperAdmin);
  const isLoading = isCreating || isUpdating;

  // Base user form - DEFINED FIRST
  const userForm = useForm<BaseUserFormData>({
    resolver: zodResolver(baseUserSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      middleName: '',
      phone: '',
      idNumber: '',
      role: 'STUDENT',
      schoolId: schoolId || '',
    },
  });

  // Student profile form
  const studentForm = useForm<StudentProfileFormData>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      admissionNo: '',
      gender: 'MALE',
      nationality: 'Kenyan',
      hasSpecialNeeds: false,
      specialNeedsType: '',
      medicalCondition: '',
      allergies: '',
    },
  });

  // Teacher profile form
  const teacherForm = useForm<TeacherProfileFormData>({
    resolver: zodResolver(teacherProfileSchema),
    defaultValues: {
      tscNumber: '',
      employeeNumber: '',
      employmentType: 'PERMANENT',
    },
  });

  // Guardian profile form
  const guardianForm = useForm<GuardianProfileFormData>({
    resolver: zodResolver(guardianProfileSchema),
    defaultValues: {
      relationship: '',
      occupation: '',
      employer: '',
      workPhone: '',
    },
  });

  // Get schoolId from form
  const watchedSchoolId = userForm.watch('schoolId');

  // Get previews for auto-generated numbers - AFTER forms are defined
  const { data: previewAdmission, refetch: refreshAdmissionPreview } = usePreviewSequence(
    'ADMISSION_NUMBER',
    watchedSchoolId,
    { enabled: autoGenerateAdmission && mode === 'create' && open }
  );

  const { data: previewEmployee, refetch: refreshEmployeePreview } = usePreviewSequence(
    'EMPLOYEE_NUMBER',
    watchedSchoolId,
    { enabled: autoGenerateEmployee && mode === 'create' && open }
  );

  // Watch role changes
  const watchedRole = userForm.watch('role');

  useEffect(() => {
    setSelectedRole(watchedRole as Role);
  }, [watchedRole]);

  // Set schoolId when modal opens for non-super-admins
  useEffect(() => {
    if (open && !isSuperAdmin && schoolId && mode === 'create') {
      userForm.setValue('schoolId', schoolId);
    }
  }, [open, isSuperAdmin, schoolId, mode, userForm]);

  // Reset forms when opening in create mode
  useEffect(() => {
    if (open && mode === 'create') {
      resetAllForms();
    }
  }, [open, mode]);

  // Populate forms when user data changes (edit mode)
  useEffect(() => {
    if (mode === 'edit' && user && open) {
      userForm.reset({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName || '',
        phone: user.phone || '',
        idNumber: user.idNumber || '',
        role: user.role as Role,
        schoolId: user.schoolId || '',
        password: '',
      });

      if (user.role === 'STUDENT' && user.student) {
        studentForm.reset({
          admissionNo: user.student.admissionNo,
          gender: user.student.gender,
          dob: user.student.dob ? new Date(user.student.dob).toISOString().split('T')[0] : '',
          upiNumber: user.student.upiNumber || '',
          kemisUpi: user.student.kemisUpi || '',
          birthCertNo: user.student.birthCertNo || '',
          nationality: user.student.nationality || 'Kenyan',
          county: user.student.county || '',
          subCounty: user.student.subCounty || '',
          hasSpecialNeeds: user.student.hasSpecialNeeds || false,
          specialNeedsType: user.student.specialNeedsType || '',
          medicalCondition: user.student.medicalCondition || '',
          allergies: user.student.allergies || '',
        });
        setAutoGenerateAdmission(false);
      }

      if (user.role === 'TEACHER' && user.teacher) {
        teacherForm.reset({
          tscNumber: user.teacher.tscNumber,
          employeeNumber: user.teacher.employeeNumber,
          employmentType: user.teacher.employmentType,
          qualification: user.teacher.qualification || '',
          specialization: user.teacher.specialization || '',
          dateJoined: user.teacher.dateJoined ? new Date(user.teacher.dateJoined).toISOString().split('T')[0] : '',
        });
        setAutoGenerateEmployee(false);
      }

      if (user.role === 'PARENT' && user.guardian) {
        guardianForm.reset({
          relationship: user.guardian.relationship,
          occupation: user.guardian.occupation || '',
          employer: user.guardian.employer || '',
          workPhone: user.guardian.workPhone || '',
        });
      }
    }
  }, [mode, user, open, userForm, studentForm, teacherForm, guardianForm]);

  // Set admission number when preview changes
  useEffect(() => {
    if (autoGenerateAdmission && mode === 'create' && previewAdmission?.preview) {
      studentForm.setValue('admissionNo', previewAdmission.preview, {
        shouldValidate: true
      });
    }
  }, [previewAdmission, autoGenerateAdmission, mode, studentForm]);

  // Set employee number when preview changes
  useEffect(() => {
    if (autoGenerateEmployee && mode === 'create' && previewEmployee?.preview) {
      teacherForm.setValue('employeeNumber', previewEmployee.preview, {
        shouldValidate: true
      });
    }
  }, [previewEmployee, autoGenerateEmployee, mode, teacherForm]);

  const onSubmit = async () => {
    if (!isSuperAdmin && userForm.getValues().role === 'SUPER_ADMIN') {
      toast.error("Cannot create Super Admin. Limited privileges!");
      return;
    }

    // Ensure non-super-admins can't change school
    if (!isSuperAdmin && schoolId) {
      userForm.setValue('schoolId', schoolId);
    }

    // Validate base user form
    const isUserValid = await userForm.trigger();
    if (!isUserValid) {
      const userErrors = Object.values(userForm.formState.errors);
      if (userErrors.length > 0) {
        toast.error(`User error: ${userErrors[0].message}`);
      } else {
        toast.error('Please fill in all required user fields');
      }
      return;
    }

    const userData = userForm.getValues();
    let profileData: any = null;

    // For edit mode, remove password if it's empty
    if (mode === 'edit' && !userData.password) {
      delete userData.password;
    }

    // Validate and get profile data based on role
    if (selectedRole === 'STUDENT') {
      const isProfileValid = await studentForm.trigger();
      if (!isProfileValid) {
        const studentErrors = Object.values(studentForm.formState.errors);
        if (studentErrors.length > 0) {
          toast.error(`Student error: ${studentErrors[0].message}`);
        } else {
          toast.error('Please fill in all required student fields');
        }
        return;
      }
      profileData = studentForm.getValues();
      
      // Ensure admission number is set
      if (!profileData.admissionNo) {
        if (autoGenerateAdmission && previewAdmission?.preview) {
          profileData.admissionNo = previewAdmission.preview;
        } else {
          toast.error('Admission number is required');
          return;
        }
      }
      
      if (profileData.dob) {
        profileData.dob = new Date(profileData.dob);
      }
    } else if (selectedRole === 'TEACHER') {
      // Validate teacher form
      const isProfileValid = await teacherForm.trigger();
      if (!isProfileValid) {
        const teacherErrors = Object.values(teacherForm.formState.errors);
        if (teacherErrors.length > 0) {
          toast.error(`Teacher error: ${teacherErrors[0].message}`);
        } else {
          toast.error('Please fill in all required teacher fields');
        }
        return;
      }
      profileData = teacherForm.getValues();
      
      // Ensure employee number is set (either auto-generated or manual)
      if (!profileData.employeeNumber) {
        if (autoGenerateEmployee && previewEmployee?.preview) {
          profileData.employeeNumber = previewEmployee.preview;
        } else {
          toast.error('Employee number is required');
          return;
        }
      }
      
      if (profileData.dateJoined) {
        profileData.dateJoined = new Date(profileData.dateJoined);
      }
    } else if (selectedRole === 'PARENT') {
      const isProfileValid = await guardianForm.trigger();
      if (!isProfileValid) {
        const guardianErrors = Object.values(guardianForm.formState.errors);
        if (guardianErrors.length > 0) {
          toast.error(`Guardian error: ${guardianErrors[0].message}`);
        } else {
          toast.error('Please fill in all required guardian fields');
        }
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
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Failed to create user');
        },
      });
    } else if (user) {
      updateUser({ id: user.id, data: requestBody }, {
        onSuccess: () => {
          toast.success('User updated successfully');
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Failed to update user');
        },
      });
    }
  };

  const resetAllForms = () => {
    userForm.reset({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      middleName: '',
      phone: '',
      idNumber: '',
      role: 'STUDENT',
      schoolId: schoolId || '',
    });
    studentForm.reset({
      admissionNo: '',
      gender: 'MALE',
      nationality: 'Kenyan',
      hasSpecialNeeds: false,
      specialNeedsType: '',
      medicalCondition: '',
      allergies: '',
    });
    teacherForm.reset({
      tscNumber: '',
      employeeNumber: '',
      employmentType: 'PERMANENT',
    });
    guardianForm.reset({
      relationship: '',
      occupation: '',
      employer: '',
      workPhone: '',
    });
    setShowPassword(false);
    setAutoGenerateAdmission(mode === 'create');
    setAutoGenerateEmployee(mode === 'create');
    setSelectedRole('STUDENT');
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
                          {roleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* School Selection - Conditional based on user role */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    School {!isSuperAdmin && <span className="text-xs text-muted-foreground">(Auto-assigned)</span>}
                  </Label>
                  
                  {isSuperAdmin ? (
                    // Super Admin can select any school
                    <Controller
                      name="schoolId"
                      control={userForm.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select school" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="select-school">-- Select School --</SelectItem>
                            {schools.map((school: any) => (
                              <SelectItem key={school.id} value={school.id}>
                                {school.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  ) : (
                    // Non-super-admin: Display current school (read-only)
                    <div className="relative">
                      <Input
                        value={schoolName || 'No School Assigned'}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  
                  {!isSuperAdmin && (
                    <p className="text-xs text-muted-foreground">
                      Users will be automatically assigned to your school: <strong>{schoolName}</strong>
                    </p>
                  )}
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
                    {userForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{userForm.formState.errors.password.message}</p>
                    )}
                  </div>
                )}

                {mode === 'edit' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Update Password (Optional)</Label>
                    <div className="relative">
                      <Input
                        {...userForm.register('password')}
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
                    {userForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{userForm.formState.errors.password.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* School Assignment Notice */}
            {!isSuperAdmin && mode === 'create' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">School Assignment</p>
                    <p className="text-xs text-blue-700 mt-1">
                      This user will be automatically assigned to <strong>{schoolName}</strong>. 
                      Only super administrators can assign users to different schools.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                      <div className="flex items-center justify-between">
                        <Label>Admission Number *</Label>
                        {mode === 'create' && (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="autoAdmission"
                              checked={autoGenerateAdmission}
                              onCheckedChange={(checked) => {
                                setAutoGenerateAdmission(!!checked);
                                if (checked) {
                                  studentForm.setValue('admissionNo', '');
                                } else {
                                  studentForm.setValue('admissionNo', '');
                                }
                              }}
                            />
                            <Label htmlFor="autoAdmission" className="text-xs font-normal cursor-pointer">
                              Auto-generate
                            </Label>
                          </div>
                        )}
                      </div>

                      {autoGenerateAdmission && mode === 'create' ? (
                        <div className="relative">
                          <Input
                            value={previewAdmission?.preview || 'Generating...'}
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
                              onClick={() => refreshAdmissionPreview()}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Input
                          {...studentForm.register('admissionNo')}
                          placeholder="Enter admission number manually"
                          disabled={mode === 'edit'}
                        />
                      )}
                      
                      {previewAdmission && autoGenerateAdmission && (
                        <p className="text-xs text-muted-foreground">
                          Next available: {previewAdmission.preview}
                        </p>
                      )}
                      
                      {studentForm.formState.errors.admissionNo && !autoGenerateAdmission && (
                        <p className="text-sm text-destructive">
                          {studentForm.formState.errors.admissionNo.message}
                        </p>
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
                      <Input 
                        {...studentForm.register('dob')} 
                        type="date" 
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Birth Certificate No</Label>
                      <Input {...studentForm.register('birthCertNo')} placeholder="123456" />
                    </div>

                    <div className="space-y-2">
                      <Label>Nationality</Label>
                      <Input {...studentForm.register('nationality')} placeholder="Kenyan" defaultValue="Kenyan" />
                    </div>

                    <div className="space-y-2">
                      <Label>UPI Number</Label>
                      <Input {...studentForm.register('upiNumber')} placeholder="UPI Number" />
                    </div>

                    <div className="space-y-2">
                      <Label>KEMIS UPI</Label>
                      <Input {...studentForm.register('kemisUpi')} placeholder="KEMIS UPI" />
                    </div>

                    <div className="space-y-2">
                      <Label>County</Label>
                      <Input {...studentForm.register('county')} placeholder="Nairobi" />
                    </div>

                    <div className="space-y-2">
                      <Label>Sub County</Label>
                      <Input {...studentForm.register('subCounty')} placeholder="Kilimani" />
                    </div>

                    {/* Special Needs Section */}
                    <div className="space-y-2 md:col-span-2">
                      <Controller
                        name="hasSpecialNeeds"
                        control={studentForm.control}
                        render={({ field }) => (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="hasSpecialNeeds"
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (!checked) {
                                  studentForm.setValue('specialNeedsType', '');
                                }
                              }}
                            />
                            <Label 
                              htmlFor="hasSpecialNeeds" 
                              className="cursor-pointer select-none font-medium"
                            >
                              Has Special Needs?
                            </Label>
                          </div>
                        )}
                      />
                      <p className="text-xs text-muted-foreground">
                        Check this if the student requires special accommodations
                      </p>
                    </div>

                    {/* Special Needs Type - Conditional */}
                    {studentForm.watch('hasSpecialNeeds') && (
                      <div className="space-y-2 md:col-span-2">
                        <Label>Special Needs Type</Label>
                        <Input
                          {...studentForm.register('specialNeedsType')}
                          placeholder="e.g., Visual impairment, Hearing impairment, Learning disability"
                        />
                        <p className="text-xs text-muted-foreground">
                          Examples: Visual, Hearing, Physical, Learning disabilities, Autism, etc.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Medical Conditions</Label>
                      <Input
                        {...studentForm.register('medicalCondition')}
                        placeholder="e.g., Asthmatic, Diabetic, Epileptic"
                      />
                      <p className="text-xs text-muted-foreground">
                        List any known medical conditions
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Allergies</Label>
                      <Input
                        {...studentForm.register('allergies')}
                        placeholder="e.g., Peanuts, Dairy, Pollen"
                      />
                      <p className="text-xs text-muted-foreground">
                        List any known allergies
                      </p>
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
                      <Input 
                        {...teacherForm.register('tscNumber')} 
                        placeholder="TSC123456" 
                      />
                      {teacherForm.formState.errors.tscNumber && (
                        <p className="text-sm text-destructive">{teacherForm.formState.errors.tscNumber.message}</p>
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
                                if (checked) {
                                  teacherForm.setValue('employeeNumber', '');
                                } else {
                                  teacherForm.setValue('employeeNumber', '');
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
                          {/* Hidden input to satisfy form validation */}
                          <input
                            type="hidden"
                            {...teacherForm.register('employeeNumber')}
                            value={previewEmployee?.preview || ''}
                          />
                        </div>
                      ) : (
                        <Input
                          {...teacherForm.register('employeeNumber')}
                          placeholder="Enter employee number manually"
                          disabled={mode === 'edit'}
                          className={mode === 'edit' ? "bg-muted" : ""}
                        />
                      )}
                      
                      {previewEmployee && autoGenerateEmployee && (
                        <p className="text-xs text-muted-foreground">
                          Next available: {previewEmployee.preview}
                        </p>
                      )}
                      
                      {teacherForm.formState.errors.employeeNumber && !autoGenerateEmployee && (
                        <p className="text-sm text-destructive">
                          {teacherForm.formState.errors.employeeNumber.message}
                        </p>
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
