// src/components/students/StudentFormModal.tsx
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
import { Student } from '@/types';
import { useSchoolContext } from '@/hooks/use-school-context';
import { useSchools } from '@/hooks/use-schools';
import { usePreviewSequence } from '@/hooks/use-sequences';
import { GraduationCap, Sparkles, RefreshCw, Eye, EyeOff, AlertCircle, Building2, UserIcon, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api';

// Combined Schema: Base User + Student Profile
const studentFormSchema = z.object({
  // Base User Fields
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  idNumber: z.string().nullable().optional().transform(e => e === "" ? null : e),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  schoolId: z.string().optional(),
  
  // Student Profile Fields
  admissionNo: z.string().min(1, 'Admission number is required'),
  gender: z.enum(['MALE', 'FEMALE']),
  dob: z.string().optional().or(z.date().optional()),
  birthCertNo: z.string().optional().transform(e => e === "" ? undefined : e),
  upiNumber: z.string().optional().transform(e => e === "" ? undefined : e),
  kemisUpi: z.string().optional().transform(e => e === "" ? undefined : e),
  nationality: z.string().optional().default('Kenyan'),
  county: z.string().optional(),
  subCounty: z.string().optional(),
  hasSpecialNeeds: z.boolean().default(false),
  specialNeedsType: z.string().optional(),
  medicalCondition: z.string().optional(),
  allergies: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentFormSchema>;

interface StudentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  student?: Student;
}

const KENYAN_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu',
  'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa',
  'Murang\'a', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita Taveta', 'Tana River', 'Tharaka Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

export function StudentFormModal({ open, onOpenChange, mode, student }: StudentFormModalProps) {
  const [autoGenerateAdmission, setAutoGenerateAdmission] = useState(mode === 'create');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Context & Hooks
  const { schoolId: contextSchoolId, schoolName: contextSchoolName, isSuperAdmin } = useSchoolContext();
  const { data: schoolsResponse } = useSchools({limit: 100, page: 1 });
  const schools = schoolsResponse?.data?.data || [];

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      phone: '',
      idNumber: '',
      password: '',
      schoolId: contextSchoolId || '',
      admissionNo: '',
      gender: 'MALE',
      dob: '',
      birthCertNo: '',
      upiNumber: '',
      kemisUpi: '',
      nationality: 'Kenyan',
      county: '',
      subCounty: '',
      hasSpecialNeeds: false,
      specialNeedsType: '',
      medicalCondition: '',
      allergies: '',
    },
  });

  // Watch school ID to trigger preview updates
  const watchedSchoolId = form.watch('schoolId') || contextSchoolId;

  // Auto-generate Admission Number Preview
  const { data: previewAdmission, refetch: refreshAdmissionPreview } = usePreviewSequence(
    'ADMISSION_NUMBER',
    watchedSchoolId,
    { enabled: autoGenerateAdmission && mode === 'create' && open && !!watchedSchoolId }
  );

  // Set default school for non-super admins on open
  useEffect(() => {
    if (open && !isSuperAdmin && contextSchoolId && mode === 'create') {
      form.setValue('schoolId', contextSchoolId);
    }
  }, [open, isSuperAdmin, contextSchoolId, mode, form]);

  // Update form with preview value
  useEffect(() => {
    if (autoGenerateAdmission && mode === 'create' && previewAdmission?.preview) {
      form.setValue('admissionNo', previewAdmission.preview, { shouldValidate: true });
    }
  }, [previewAdmission, autoGenerateAdmission, mode, form]);

  // Populate form in Edit Mode
  useEffect(() => {
    if (mode === 'edit' && student && open) {
      form.reset({
        // User Fields
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        middleName: student.middleName || '',
        email: student.user?.email || '',
        phone: student.user?.phone || '',
        idNumber: student.user?.idNumber || '',
        schoolId: student.schoolId || student.user?.schoolId || contextSchoolId || '',
        password: '',
        
        // Student Profile Fields
        admissionNo: student.admissionNo,
        gender: student.gender,
        dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
        birthCertNo: student.birthCertNo || '',
        upiNumber: student.upiNumber || '',
        kemisUpi: student.kemisUpi || '',
        nationality: student.nationality || 'Kenyan',
        county: student.county || '',
        subCounty: student.subCounty || '',
        hasSpecialNeeds: student.hasSpecialNeeds || false,
        specialNeedsType: student.specialNeedsType || '',
        medicalCondition: student.medicalCondition || '',
        allergies: student.allergies || '',
      });
      setAutoGenerateAdmission(false);
    }
  }, [mode, student, open, form, contextSchoolId]);

  // Reset form on close/open create
  useEffect(() => {
    if (!open) {
      form.reset();
      setShowPassword(false);
      setAutoGenerateAdmission(mode === 'create');
    }
  }, [open, mode, form]);

  const onSubmit = async (data: StudentFormData) => {
    try {
      setIsLoading(true);

      // 1. Prepare User Data
      const userData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        email: data.email,
        phone: data.phone,
        idNumber: data.idNumber,
        role: 'STUDENT',
        schoolId: data.schoolId || contextSchoolId,
      };

      if (data.password) userData.password = data.password;

      // 2. Prepare Profile Data
      const profileData: any = {
        admissionNo: autoGenerateAdmission ? undefined : data.admissionNo, // Undefined triggers auto-gen backend
        gender: data.gender,
        dob: data.dob ? new Date(data.dob) : undefined,
        birthCertNo: data.birthCertNo,
        upiNumber: data.upiNumber,
        kemisUpi: data.kemisUpi,
        nationality: data.nationality,
        county: data.county,
        subCounty: data.subCounty,
        hasSpecialNeeds: data.hasSpecialNeeds,
        specialNeedsType: data.hasSpecialNeeds ? data.specialNeedsType : null,
        medicalCondition: data.medicalCondition,
        allergies: data.allergies,
      };

      // 3. Construct Payload
      const payload = {
        user: userData,
        profile: profileData
      };

      if (mode === 'create') {
        // Use the centralized user creation endpoint
        await api.post('/users', payload);
        toast.success('Student created successfully');
        onOpenChange(false);
        window.location.reload();
      } else if (student && student.userId) {
        // For update, we might need a different structure depending on your API
        // Assuming the generic update endpoint works similarly:
        await api.put(`/users/${student.userId}`, payload);
        toast.success('Student updated successfully');
        onOpenChange(false);
        window.location.reload();
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save student');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            {mode === 'create' ? 'Register New Student' : 'Edit Student'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the student details and personal information.'
              : 'Update student information and profile.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* --- BASIC INFORMATION --- */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Basic Information
              </h3>
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
                  <Input {...form.register('email')} type="email" placeholder="student@example.com" />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...form.register('phone')} placeholder="+2547..." />
                </div>

                <div className="space-y-2">
                  <Label>ID Number</Label>
                  <Input {...form.register('idNumber')} placeholder="National ID (Optional)" />
                </div>

                {/* School Selection Logic */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    School {!isSuperAdmin && <span className="text-xs text-muted-foreground">(Auto-assigned)</span>}
                  </Label>

                  {isSuperAdmin ? (
                    <Controller
                      name="schoolId"
                      control={form.control}
                      render={({ field }) => (
                        <Select 
                          onValueChange={(val) => {
                            field.onChange(val);
                            // Refresh preview if creating
                            if (mode === 'create' && autoGenerateAdmission) {
                              setTimeout(() => refreshAdmissionPreview(), 100);
                            }
                          }} 
                          value={field.value}
                          disabled={mode === 'edit'} 
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select School" />
                          </SelectTrigger>
                          <SelectContent>
                            <ScrollArea className="h-48">
                              {schools.map((school: any) => (
                                <SelectItem key={school.id} value={school.id}>
                                  {school.name}
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  ) : (
                    <div className="relative">
                      <Input
                        value={contextSchoolName || 'No School Assigned'}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>

                {/* Password Field */}
                {(mode === 'create' || mode === 'edit') && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>{mode === 'create' ? 'Password *' : 'Update Password (Optional)'}</Label>
                    <div className="relative">
                      <Input
                        {...form.register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder={mode === 'create' ? "Enter secure password" : "Leave blank to keep current"}
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

            {/* --- ACADEMIC INFORMATION --- */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Academic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Admission Number with Auto-Gen */}
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
                            // Clear value to allow preview to take over
                            form.setValue('admissionNo', ''); 
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
                      {...form.register('admissionNo')}
                      placeholder="Enter admission number"
                      disabled={mode === 'edit'}
                    />
                  )}
                  
                  {form.formState.errors.admissionNo && !autoGenerateAdmission && (
                    <p className="text-sm text-destructive">{form.formState.errors.admissionNo.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Controller
                    name="gender"
                    control={form.control}
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

                {/* Date of Birth Field */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date of Birth
                  </Label>
                  <Input 
                    {...form.register('dob')} 
                    type="date" 
                    max={new Date().toISOString().split('T')[0]} // Restrict to past dates
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* --- GOVERNMENT IDs --- */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Government Identification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>UPI Number</Label>
                  <Input {...form.register('upiNumber')} placeholder="NEMIS UPI" />
                </div>
                <div className="space-y-2">
                  <Label>KEMIS UPI</Label>
                  <Input {...form.register('kemisUpi')} placeholder="KEMIS ID" />
                </div>
                <div className="space-y-2">
                  <Label>Birth Certificate No</Label>
                  <Input {...form.register('birthCertNo')} placeholder="Entry Number" />
                </div>
                 <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input {...form.register('nationality')} />
                </div>
              </div>
            </div>

            <Separator />

            {/* --- LOCATION --- */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>County</Label>
                  <Controller
                    name="county"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select County" />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-48">
                            {KENYAN_COUNTIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sub County</Label>
                  <Input {...form.register('subCounty')} />
                </div>
              </div>
            </div>

            <Separator />

            {/* --- MEDICAL / SPECIAL NEEDS --- */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Medical & Special Needs</h3>
              
              <div className="space-y-2">
                <Controller
                  name="hasSpecialNeeds"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="hasSpecialNeeds"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (!checked) form.setValue('specialNeedsType', '');
                        }}
                      />
                      <Label htmlFor="hasSpecialNeeds" className="cursor-pointer">Student has special needs?</Label>
                    </div>
                  )}
                />
              </div>

              {form.watch('hasSpecialNeeds') && (
                <div className="space-y-2 ml-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <Label>Special Needs Type</Label>
                      <Input {...form.register('specialNeedsType')} placeholder="e.g. Visual Impairment" className="mt-2" />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Medical Conditions</Label>
                  <Input {...form.register('medicalCondition')} placeholder="e.g. Asthma" />
                </div>
                <div className="space-y-2">
                  <Label>Allergies</Label>
                  <Input {...form.register('allergies')} placeholder="e.g. Peanuts" />
                </div>
              </div>
            </div>

          </form>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? 'Saving...' : mode === 'create' ? 'Register Student' : 'Update Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}