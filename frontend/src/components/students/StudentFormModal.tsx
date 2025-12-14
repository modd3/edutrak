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
import { useCreateStudent, useUpdateStudent } from '@/hooks/use-students';
import { useSchoolContext } from '@/hooks/use-school-context';
import { usePreviewSequence } from '@/hooks/use-sequences';
import { GraduationCap, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const studentSchema = z.object({
  admissionNo: z.string().min(1, 'Admission number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
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

type StudentFormData = z.infer<typeof studentSchema>;

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
  const { schoolId } = useSchoolContext();
  const [autoGenerateAdmission, setAutoGenerateAdmission] = useState(mode === 'create');
  
  const { mutate: createStudent, isPending: isCreating } = useCreateStudent();
  const { mutate: updateStudent, isPending: isUpdating } = useUpdateStudent();
  
  const isLoading = isCreating || isUpdating;

  // Preview admission number
  const { data: previewAdmission, refetch: refreshAdmissionPreview } = usePreviewSequence(
    'ADMISSION_NUMBER',
    schoolId,
    { enabled: autoGenerateAdmission && mode === 'create' && open }
  );

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      admissionNo: '',
      firstName: '',
      lastName: '',
      middleName: '',
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

  const watchHasSpecialNeeds = form.watch('hasSpecialNeeds');

  // Reset form on create mode
  useEffect(() => {
    if (open && mode === 'create') {
      form.reset({
        admissionNo: '',
        firstName: '',
        lastName: '',
        middleName: '',
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
      setAutoGenerateAdmission(true);
    }
  }, [open, mode, form]);

  // Populate form in edit mode
  useEffect(() => {
    if (mode === 'edit' && student && open) {
      form.reset({
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: student.middleName || '',
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

  // Auto-fill admission number
  useEffect(() => {
    if (autoGenerateAdmission && mode === 'create' && previewAdmission?.preview) {
      form.setValue('admissionNo', previewAdmission.preview, {
        shouldValidate: true
      });
    }
  }, [previewAdmission, autoGenerateAdmission, mode, form]);

  const onSubmit = async (data: StudentFormData) => {
    // Validate admission number
    if (!data.admissionNo) {
      if (autoGenerateAdmission && previewAdmission?.preview) {
        data.admissionNo = previewAdmission.preview;
      } else {
        toast.error('Admission number is required');
        return;
      }
    }

    const requestBody = {
      ...data,
      schoolId,
      dob: data.dob ? new Date(data.dob) : undefined,
      nationality: data.nationality || 'Kenyan',
    };

    if (mode === 'create') {
      createStudent(requestBody, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    } else if (student) {
      updateStudent({ id: student.id, data: requestBody }, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
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
              ? 'Fill in the student details below to register.'
              : 'Update student information.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Basic Information</h3>
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
                  
                  {form.formState.errors.admissionNo && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.admissionNo.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input {...form.register('firstName')} placeholder="John" />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input {...form.register('middleName')} placeholder="Optional" />
                </div>

                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input {...form.register('lastName')} placeholder="Doe" />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
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

                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input 
                    {...form.register('dob')} 
                    type="date" 
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Birth Certificate No.</Label>
                  <Input {...form.register('birthCertNo')} placeholder="123456" />
                </div>

                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input {...form.register('nationality')} placeholder="Kenyan" defaultValue="Kenyan" />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select county" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Select County --</SelectItem>
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

            {/* Special Needs */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Special Needs & Medical</h3>
              
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
                <div className="space-y-2 ml-6">
                  <Label>Special Needs Type *</Label>
                  <Input
                    {...form.register('specialNeedsType')}
                    placeholder="e.g., Visual impairment, Hearing impairment, Learning disability"
                  />
                  <p className="text-xs text-muted-foreground">
                    Examples: Visual, Hearing, Physical, Learning disabilities, Autism, ADHD, etc.
                  </p>
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

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? 'Saving...' : mode === 'create' ? 'Register Student' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}