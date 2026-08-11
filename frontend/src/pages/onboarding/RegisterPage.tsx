import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { GraduationCap, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { usePlans } from '@/hooks/use-plans';
import { useFeatureRegistry } from '@/hooks/use-feature-registry';
import { onboardingApi } from '@/api/onboarding-api';
import { onboardingSchema, STEPS, type OnboardingFormData, type StepIndex } from './types';
import { StepSchool } from './StepSchool';
import { StepAdmin } from './StepAdmin';
import { StepPlan } from './StepPlan';
import { StepReview } from './StepReview';
import type { User } from '@/types';

// Fields validated on "Next" for each step — prevents advancing with errors
const STEP_FIELDS: Record<StepIndex, (keyof OnboardingFormData)[]> = {
  0: ['school'],
  1: ['admin'],
  2: ['plan'],
  3: [],
};

export function RegisterPage() {
  const [step, setStep] = useState<StepIndex>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // Fetch plans + registry once at the top so Step 3 and Step 4 both have them
  const { data: plansData, isLoading: plansLoading, isError: plansError } = usePlans({
    isActive: true,
    limit: 50,
  });
  const { data: registryData } = useFeatureRegistry();

  const plans = plansData?.data ?? [];
  const registry = (registryData as any)?.data ?? registryData ?? {};

  const methods = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      school: {
        name: '',
        type: undefined,
        county: '',
        subCounty: '',
        ownership: undefined,
        boardingStatus: undefined,
        gender: undefined,
        phone: '',
        email: '',
        address: '',
      },
      admin: {
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        password: '',
        phone: '',
        idNumber: '',
      },
      plan: {
        planId: '',
        startTrial: false,
      },
    },
    mode: 'onTouched',
  });

  const { handleSubmit, trigger } = methods;

  // Advance to the next step after validating the current step's fields
  async function handleNext() {
    const fields = STEP_FIELDS[step];
    const valid = fields.length === 0 || (await trigger(fields));
    if (valid) setStep((s) => Math.min(s + 1, 3) as StepIndex);
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0) as StepIndex);
  }

  async function onSubmit(data: OnboardingFormData) {
    setIsSubmitting(true);
    try {
      // Clean up empty optional strings → undefined so the backend doesn't
      // trip on empty-string unique constraints (registrationNo, kemisCode, etc.)
      const payload = {
        school: {
          ...data.school,
          subCounty: data.school.subCounty || undefined,
          ward: data.school.ward || undefined,
          phone: data.school.phone || undefined,
          email: data.school.email || undefined,
          address: data.school.address || undefined,
          registrationNo: data.school.registrationNo || undefined,
          knecCode: data.school.knecCode || undefined,
          kemisCode: data.school.kemisCode || undefined,
        },
        admin: {
          ...data.admin,
          middleName: data.admin.middleName || undefined,
          phone: data.admin.phone || undefined,
          idNumber: data.admin.idNumber || undefined,
        },
        plan: data.plan,
      };

      const response = await onboardingApi.register(payload);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message ?? 'Registration failed');
      }

      const { user, token, refreshToken, subscription } = response.data.data;

      // Log the user in immediately
      setAuth(user as unknown as User, token, refreshToken);

      const trialNote = subscription.trialEndsAt
        ? ' Your 14-day trial has started.'
        : '';

      toast.success('School registered!', {
        description: `Welcome to EduTrak, ${user.firstName}!${trialNote}`,
      });

      navigate('/dashboard');
    } catch (err: any) {
      const msg: string =
        err?.response?.data?.message ?? err.message ?? 'Registration failed';

      if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('exists')) {
        toast.error('Account already exists', { description: msg });
      } else {
        toast.error('Registration failed', { description: msg });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLastStep = step === 3;

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between">
        <div className="flex items-center gap-2 text-white">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <GraduationCap className="text-blue-600" size={24} />
          </div>
          <span className="text-2xl font-bold">EduTrak</span>
        </div>

        <div className="text-white space-y-6">
          <h1 className="text-4xl font-bold leading-snug">
            Set up your school
            <br />
            in minutes
          </h1>
          <p className="text-blue-100 text-lg">
            Join hundreds of Kenyan schools managing students, fees,
            academics and more — all in one place.
          </p>

          {/* Step progress sidebar */}
          <ol className="space-y-3 mt-8">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0',
                    i < step
                      ? 'bg-white text-blue-700 border-white'
                      : i === step
                      ? 'bg-blue-500 text-white border-white'
                      : 'bg-transparent text-blue-200 border-blue-400'
                  )}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span
                  className={cn(
                    'text-sm',
                    i === step
                      ? 'text-white font-semibold'
                      : i < step
                      ? 'text-blue-100'
                      : 'text-blue-300'
                  )}
                >
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-blue-200 text-xs">© 2025 EduTrak. All rights reserved.</p>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center p-6 sm:p-10 overflow-y-auto bg-gray-50">
        <div className="w-full max-w-lg py-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold text-gray-900">EduTrak</span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{STEPS[step]}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Step {step + 1} of {STEPS.length}
            </p>
            {/* Mobile progress bar */}
            <div className="mt-3 h-1.5 rounded-full bg-gray-200 lg:hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Form */}
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="bg-white rounded-2xl border shadow-sm p-6 space-y-6"
            >
              {step === 0 && <StepSchool />}
              {step === 1 && <StepAdmin />}
              {step === 2 && (
                <StepPlan
                  plans={plans}
                  registry={registry}
                  isLoading={plansLoading}
                  isError={plansError}
                />
              )}
              {step === 3 && <StepReview plans={plans} />}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-2 border-t">
                {step > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                ) : (
                  <div />
                )}

                {isLastStep ? (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-1 min-w-[160px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Registering…
                      </>
                    ) : (
                      'Register school'
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-1"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
