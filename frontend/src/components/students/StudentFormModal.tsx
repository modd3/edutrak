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
import { usePreviewSequence } from '@/hooks/use-sequences';
import { GraduationCap, Sparkles, RefreshCw, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api';

// Student form schema
const studentFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  idNumber: z.string().nullable().optional().transform(e => e === "" ? null : e),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  admissionNo: z.string().min(1, 'Admission number is required'),
  gender: z.enum(['MALE', 'FEMALE']),
  dob: z.string().optional(),
  birthCertNo: z.string().optional(),
  upiNumber: z.string().optional(),
  kemisUpi: z.string().optional(),
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
  const { schoolId, schoolName } = useSchoolContext();
  const [isLoading, setIsLoading] = useState(false);
  const [watchHasSpecialNeeds, setWatchHasSpecialNeeds] = useState(false);

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

  // Get preview for auto-generated admission number
  const { data: previewAdmission, refetch: refreshAdmissionPreview } = usePreviewSequence(
    'ADMISSION_NUMBER',
    schoolId,
    { enabled: autoGenerateAdmission && mode === 'create' && open }
  );

  // Watch special needs checkbox
  const hasSpecialNeedsValue = form.watch('hasSpecialNeeds');
  useEffect(() => {
    setWatchHasSpecialNeeds(hasSpecialNeedsValue);
  }, [hasSpecialNeedsValue]);

  // Reset form when opening in create mode
  useEffect(() => {
    if (open && mode === 'create') {
      resetForm();
    }
  }, [open, mode]);

  // Populate form when student data changes (edit mode)
  useEffect(() => {
    if (mode === 'edit' && student && open) {
      form.reset({
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        middleName: student.middleName || '',
        email: student.user?.email || '',
        phone: student.user?.phone || '',
        idNumber: student.user?.idNumber || '',
        password: '',
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
  }, [mode, student, open, form]);

  // Set admission number when preview changes
  useEffect(() => {
    if (autoGenerateAdmission && mode === 'create' && previewAdmission?.preview) {
      form.setValue('admissionNo', previewAdmission.preview, {
        shouldValidate: true
      });
    }
  }, [previewAdmission, autoGenerateAdmission, mode, form]);

  const resetForm = () => {
    form.reset({
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      phone: '',
      idNumber: '',
      password: '',
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
    });
    setShowPassword(false);
    setAutoGenerateAdmission(mode === 'create');
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const onSubmit = async (data: StudentFormData) => {
    try {
      setIsLoading(true);

      // Validate student form
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

      // Ensure admission number is set
      if (!data.admissionNo) {
        if (autoGenerateAdmission && previewAdmission?.preview) {
          data.admissionNo = previewAdmission.preview;
        } else {
          toast.error('Admission number is required');
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
        role: 'STUDENT',
        schoolId,
        password: data.password || undefined,
        admissionNo: data.admissionNo,
        gender: data.gender,
        dob: data.dob ? new Date(data.dob) : undefined,
        birthCertNo: data.birthCertNo,
        upiNumber: data.upiNumber,
        kemisUpi: data.kemisUpi,
        nationality: data.nationality || 'Kenyan',
        county: data.county && data.county !== '' ? data.county : undefined,
        subCounty: data.subCounty,
        hasSpecialNeeds: data.hasSpecialNeeds,
        specialNeedsType: data.specialNeedsType,
        medicalCondition: data.medicalCondition,
        allergies: data.allergies,
      };

      if (mode === 'create') {
        await api.post('/users', requestBody);
        toast.success('Student created successfully');
        onOpenChange(false);
        resetForm();
        // Optionally refresh the list
        window.location.reload();
      } else if (student) {
        // For edit, update user and student separately
        if (student.user) {
          await api.put(`/users/${student.user.id}`, {
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName,
            email: data.email,
            phone: data.phone,
            idNumber: data.idNumber === '' ? null : data.idNumber,
            ...(data.password && { password: data.password }),
          });
        }

        await api.put(`/students/${student.id}`, {
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          admissionNo: data.admissionNo,
          gender: data.gender,
          dob: data.dob ? new Date(data.dob) : undefined,
          birthCertNo: data.birthCertNo,
          upiNumber: data.upiNumber,
          kemisUpi: data.kemisUpi,
          nationality: data.nationality || 'Kenyan',
          county: data.county && data.county !== '' ? data.county : undefined,
          subCounty: data.subCounty,
          hasSpecialNeeds: data.hasSpecialNeeds,
          specialNeedsType: data.specialNeedsType,
          medicalCondition: data.medicalCondition,
          allergies: data.allergies,
        });

        toast.success('Student updated successfully');
        onOpenChange(false);
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save student');
      console.error('Error:', error);
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
            {/* Personal Information */}
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
                  <Input {...form.register('email')} type="email" placeholder="student@example.com" />
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
                  {form.formState.errors.gender && (
                    <p className="text-sm text-destructive">{form.formState.errors.gender.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input 
                    {...form.register('dob')} 
                    type="date" 
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Birth Certificate Number</Label>
                  <Input {...form.register('birthCertNo')} placeholder="123456" />
                </div>

                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input {...form.register('nationality')} placeholder="Kenyan" defaultValue="Kenyan" />
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

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Academic Information
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
                            if (!checked) {
                              form.setValue('admissionNo', '');
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
                      {...form.register('admissionNo')}
                      placeholder="Enter admission number"
                      disabled={mode === 'edit'}
                      className={mode === 'edit' ? "bg-muted" : ""}
                    />
                  )}
                  
                  {previewAdmission && autoGenerateAdmission && (
                    <p className="text-xs text-muted-foreground">
                      Next available: {previewAdmission.preview}
                    </p>
                  )}
                  
                  {form.formState.errors.admissionNo && !autoGenerateAdmission && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.admissionNo.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Government IDs */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Government Identification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>UPI Number</Label>
                  <Input {...form.register('upiNumber')} placeholder="Unique Personal Identifier" />
                  <p className="text-xs text-muted-foreground">
                    Ministry of Education UPI number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>KEMIS UPI</Label>
                  <Input {...form.register('kemisUpi')} placeholder="KEMIS UPI" />
                  <p className="text-xs text-muted-foreground">
                    Kenya Education Management Information System UPI
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Location Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>County</Label>
                  <Controller
                    name="county"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select county" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">-- Select County --</SelectItem>
                          {KENYAN_COUNTIES.map((county) => (
                            <SelectItem key={county} value={county}>
                              {county}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sub County</Label>
                  <Input {...form.register('subCounty')} placeholder="e.g., Kilimani" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Special Needs & Medical */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Special Needs & Medical Information</h3>
              
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
                          if (!checked) {
                            form.setValue('specialNeedsType', '');
                          }
                        }}
                      />
                      <Label 
                        htmlFor="hasSpecialNeeds" 
                        className="cursor-pointer select-none font-medium"
                      >
                        Student has special needs?
                      </Label>
                    </div>
                  )}
                />
                <p className="text-xs text-muted-foreground ml-6">
                  Check this if the student requires special accommodations or support
                </p>
              </div>

              {watchHasSpecialNeeds && (
                <div className="space-y-2 ml-6 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <Label>Special Needs Type *</Label>
                      <Input
                        {...form.register('specialNeedsType')}
                        placeholder="e.g., Visual impairment, Hearing impairment, Learning disability"
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Examples: Visual, Hearing, Physical, Learning disabilities, Autism, ADHD, etc.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Medical Conditions</Label>
                  <Input
                    {...form.register('medicalCondition')}
                    placeholder="e.g., Asthmatic, Diabetic, Epileptic"
                  />
                  <p className="text-xs text-muted-foreground">
                    List any chronic or important medical conditions
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Allergies</Label>
                  <Input
                    {...form.register('allergies')}
                    placeholder="e.g., Peanuts, Dairy, Pollen"
                  />
                  <p className="text-xs text-muted-foreground">
                    List any known allergies (food, medicine, environmental)
                  </p>
                </div>
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="space-x-2">
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