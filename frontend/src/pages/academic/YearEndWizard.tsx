// src/pages/academic/YearEndWizard.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSchoolContext } from '@/hooks/use-school-context';
import {
  useAcademicYears,
  useClasses,
  useCreateAcademicYear,
  useSetActiveAcademicYear,
  useCloneYearStructure,
  useBulkPromoteClass,
  useGraduateClass,
} from '@/hooks/use-academic';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  School,
  Users,
  AlertCircle,
} from 'lucide-react';

type WizardStep = 'clone' | 'promote' | 'graduate' | 'summary';

const steps: { key: WizardStep; label: string; icon: typeof Calendar }[] = [
  { key: 'clone', label: 'Clone Structure', icon: Calendar },
  { key: 'promote', label: 'Promote Students', icon: Users },
  { key: 'graduate', label: 'Graduate Classes', icon: GraduationCap },
  { key: 'summary', label: 'Summary', icon: CheckCircle2 },
];

const promoteSchema = z.object({
  fromClassId: z.string().min(1, 'Source class is required'),
  toClassId: z.string().min(1, 'Target class is required'),
});

type PromoteFormData = z.infer<typeof promoteSchema>;

export function YearEndWizard() {
  const navigate = useNavigate();
  const { schoolId } = useSchoolContext();

  // State
  const [currentStep, setCurrentStep] = useState<WizardStep>('clone');
  const [fromYearId, setFromYearId] = useState('');
  const [newYearId, setNewYearId] = useState('');
  const [newYearActive, setNewYearActive] = useState(false);
  const [cloneResult, setCloneResult] = useState<any>(null);
  const [graduateResult, setGraduateResult] = useState<{ classId: string; name: string; graduated: number }[]>([]);
  const [promoteResults, setPromoteResults] = useState<{ from: string; to: string; result: any }[]>([]);

  // Queries
  const { data: yearsData } = useAcademicYears();
  const academicYears = yearsData?.data || [];

  const fromYearClasses = useClasses(fromYearId);
  const newYearClasses = useClasses(newYearId);

  const allClasses = fromYearClasses.data || [];

  // Mutations
  const { mutateAsync: createAcademicYear, isPending: isCreatingYear } = useCreateAcademicYear();
  const { mutateAsync: setActiveYear } = useSetActiveAcademicYear();
  const { mutateAsync: cloneStructure, isPending: isCloning } = useCloneYearStructure();
  const { mutateAsync: bulkPromote, isPending: isPromoting } = useBulkPromoteClass();
  const { mutateAsync: graduateClass, isPending: isGraduating } = useGraduateClass();

  const promoteForm = useForm<PromoteFormData>({
    resolver: zodResolver(promoteSchema),
  });

  // Get classes marked as final
  const finalClasses = allClasses.filter((c: any) => c.isFinal);

  // Step navigation
  const stepIndex = steps.findIndex(s => s.key === currentStep);
  const goNext = () => {
    const idx = Math.min(stepIndex + 1, steps.length - 1);
    setCurrentStep(steps[idx].key as WizardStep);
  };
  const goPrev = () => {
    const idx = Math.max(stepIndex - 1, 0);
    setCurrentStep(steps[idx].key as WizardStep);
  };

  // ── Step 1: Clone Structure ──────────────────────────────────────────
  const handleCreateAndClone = async () => {
    const selectedYear = academicYears.find((y: any) => y.id === fromYearId);
    if (!selectedYear) return;

    const newYear = selectedYear.year + 1;
    const startDate = new Date(`${newYear}-01-06`);
    const endDate = new Date(`${newYear}-11-28`);

    const created = await createAcademicYear({
      year: newYear,
      startDate,
      endDate,
      isActive: false,
      terms: [
        { name: 'TERM_1', termNumber: 1, startDate: new Date(`${newYear}-01-06`), endDate: new Date(`${newYear}-04-04`) },
        { name: 'TERM_2', termNumber: 2, startDate: new Date(`${newYear}-05-05`), endDate: new Date(`${newYear}-08-08`) },
        { name: 'TERM_3', termNumber: 3, startDate: new Date(`${newYear}-08-25`), endDate: new Date(`${newYear}-11-28`) },
      ],
    });

    const newYearCreated = created.data;
    setNewYearId(newYearCreated.id);

    const result = await cloneStructure({
      fromAcademicYearId: fromYearId,
      toAcademicYearId: newYearCreated.id,
    });

    setCloneResult(result.data || result);
    goNext();
  };

  // ── Step 2: Promote ──────────────────────────────────────────────────
  const handlePromote = async (data: PromoteFormData) => {
    if (!newYearId) return;
    const result = await bulkPromote({
      fromClassId: data.fromClassId,
      toClassId: data.toClassId,
      toAcademicYearId: newYearId,
    });
    setPromoteResults(prev => [...prev, { from: data.fromClassId, to: data.toClassId, result: result.data || result }]);
    promoteForm.reset();
  };

  // ── Step 3: Graduate ─────────────────────────────────────────────────
  const handleGraduate = async (classId: string, className: string) => {
    const result = await graduateClass(classId);
    const data = result.data || result;
    setGraduateResult(prev => [...prev, { classId, name: className, graduated: data.graduated || 0 }]);
  };

  // ── Step 4: Finish ────────────────────────────────────────────────────
  const handleFinish = async () => {
    if (newYearId) {
      await setActiveYear(newYearId);
    }
    navigate('/dashboard');
  };

  // ── Render current step ──────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 'clone':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Step 1: Select Source Year & Clone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the current academic year to clone. A new year will be created with the same class structure, streams, and subject assignments.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Source Academic Year *</Label>
              <Select value={fromYearId} onValueChange={setFromYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year to clone from" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year: any) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.year} {year.isActive ? '(Active)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {fromYearId && (
              <Alert>
                <School className="h-4 w-4" />
                <AlertTitle>What will be cloned</AlertTitle>
                <AlertDescription>
                  A new academic year (one year ahead) will be created with:
                  <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
                    <li>All classes from the source year</li>
                    <li>Stream assignments for each class</li>
                    <li>Subject-to-class assignments</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button onClick={handleCreateAndClone} disabled={!fromYearId || isCreatingYear || isCloning}>
                {(isCreatingYear || isCloning) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Clone Structure & Continue
              </Button>
            </div>
          </div>
        );

      case 'promote':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Step 2: Promote Students</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Move students from their current class to the next level in the new academic year.
              </p>
            </div>

            {!newYearId && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No target academic year</AlertTitle>
                <AlertDescription>Please complete Step 1 (Clone Structure) first.</AlertDescription>
              </Alert>
            )}

            {newYearId && (
              <form onSubmit={promoteForm.handleSubmit(handlePromote)} className="space-y-4 border p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Class (source) *</Label>
                    <Controller
                      name="fromClassId"
                      control={promoteForm.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source class" />
                          </SelectTrigger>
                          <SelectContent>
                            {allClasses.map((cls: any) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name} ({cls._count?.students || 0} students)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>To Class (target in new year) *</Label>
                    <Controller
                      name="toClassId"
                      control={promoteForm.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target class" />
                          </SelectTrigger>
                          <SelectContent>
                            {(newYearClasses.data || []).map((cls: any) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isPromoting}>
                  {isPromoting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Promote Students
                </Button>
              </form>
            )}

            {/* Promotion results */}
            {promoteResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Recent Promotions</h4>
                {promoteResults.map((pr, i) => (
                  <Alert key={i} variant="default" className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Promoted</AlertTitle>
                    <AlertDescription className="text-green-700">
                      {pr.result?.promoted || 0} students moved ({pr.result?.skipped || 0} skipped)
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={goPrev}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button onClick={goNext}>
                Next Step <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'graduate':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Step 3: Graduate Final Classes</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Mark students in final/graduating classes (marked with isFinal) as graduated. These students will be removed from the active roster.
              </p>
            </div>

            {finalClasses.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No final classes found</AlertTitle>
                <AlertDescription>
                  No classes are marked as final/graduating. Edit a class and enable the "Final/Graduating Class" option first.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {finalClasses.map((cls: any) => {
                  const alreadyGraduated = graduateResult.find(r => r.classId === cls.id);
                  return (
                    <Card key={cls.id} className={alreadyGraduated ? 'bg-green-50 border-green-300' : ''}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{cls.name}</span>
                          <span className="text-sm font-normal text-muted-foreground">
                            {cls._count?.students || 0} students
                          </span>
                        </CardTitle>
                        <CardDescription>
                          {cls.streams?.map((s: any) => s.name).join(', ') || 'No streams'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {alreadyGraduated ? (
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">{alreadyGraduated.graduated} students graduated</span>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="border-amber-400 text-amber-700 hover:bg-amber-50"
                            onClick={() => handleGraduate(cls.id, cls.name)}
                            disabled={isGraduating}
                          >
                            <GraduationCap className="mr-2 h-4 w-4" />
                            Graduate Class
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={goPrev}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button onClick={goNext}>
                Next: Summary <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Year-End Transition Complete</h3>
              <p className="text-sm text-muted-foreground">
                Review what was done and activate the new academic year.
              </p>
            </div>

            <div className="space-y-3">
              {cloneResult && (
                <Alert className="bg-blue-50 border-blue-200">
                  <School className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Structure Cloned</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    {cloneResult.classes || 'All'} classes, {cloneResult.streams || 'All'} streams, and {cloneResult.classSubjects || 'All'} subject assignments cloned.
                  </AlertDescription>
                </Alert>
              )}

              {promoteResults.length > 0 && (
                <Alert className="bg-green-50 border-green-200">
                  <Users className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Students Promoted</AlertTitle>
                  <AlertDescription className="text-green-700">
                    {promoteResults.reduce((sum, r) => sum + (r.result?.promoted || 0), 0)} total students promoted across {promoteResults.length} classes.
                  </AlertDescription>
                </Alert>
              )}

              {graduateResult.length > 0 && (
                <Alert className="bg-amber-50 border-amber-200">
                  <GraduationCap className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Classes Graduated</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    {graduateResult.reduce((sum, r) => sum + r.graduated, 0)} students graduated from {graduateResult.length} classes.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={goPrev}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button onClick={handleFinish}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Activate New Year & Finish
              </Button>
            </div>
          </div>
        );
    }
  };

  const stepIdx = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Year-End Transition Wizard</h1>
        <p className="text-muted-foreground">
          Clone academic structure, promote students, and graduate final classes for the new year.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, idx) => (
          <div key={step.key} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${idx <= stepIdx ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                idx < stepIdx
                  ? 'bg-primary text-primary-foreground'
                  : idx === stepIdx
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {idx < stepIdx ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
              </div>
              <span className="text-sm font-medium hidden md:inline">{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 ${idx < stepIdx ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Active Step Content */}
      <Card>
        <CardContent className="pt-6">
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
}