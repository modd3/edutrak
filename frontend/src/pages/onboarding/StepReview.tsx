import { useFormContext } from 'react-hook-form';
import { Separator } from '@/components/ui/separator';
import type { Plan } from '@/types';
import type { OnboardingFormData } from './types';

interface StepReviewProps {
  plans: Plan[];
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

const TYPE_LABELS: Record<string, string> = {
  PRIMARY: 'Primary',
  SECONDARY: 'Secondary',
  TVET: 'TVET',
  SPECIAL_NEEDS: 'Special Needs',
  PRE_PRIMARY: 'Pre-Primary',
};
const OWNERSHIP_LABELS: Record<string, string> = {
  PUBLIC: 'Public',
  PRIVATE: 'Private',
  FAITH_BASED: 'Faith-based',
  NGO: 'NGO',
};
const BOARDING_LABELS: Record<string, string> = {
  DAY: 'Day school',
  BOARDING: 'Boarding',
  BOTH: 'Day & Boarding',
};
const GENDER_LABELS: Record<string, string> = {
  BOYS: 'Boys',
  GIRLS: 'Girls',
  MIXED: 'Mixed',
};

function formatPrice(minor: number, currency: string) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency }).format(
    minor / 100
  );
}
function billingLabel(interval: string) {
  return (
    { MONTHLY: '/month', QUARTERLY: '/quarter', YEARLY: '/year' }[interval] ?? ''
  );
}

export function StepReview({ plans }: StepReviewProps) {
  const { watch } = useFormContext<OnboardingFormData>();
  const { school, admin, plan } = watch();

  const selectedPlan = plans.find((p) => p.id === plan.planId);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Review your details before submitting. You can go back to make changes.
      </p>

      {/* School */}
      <div>
        <h3 className="text-sm font-semibold mb-2">School details</h3>
        <div className="rounded-lg border px-4 py-2 space-y-0.5 bg-muted/20">
          <Row label="Name" value={school.name} />
          <Row label="Type" value={TYPE_LABELS[school.type] ?? school.type} />
          <Row
            label="Ownership"
            value={OWNERSHIP_LABELS[school.ownership] ?? school.ownership}
          />
          <Row
            label="Boarding"
            value={BOARDING_LABELS[school.boardingStatus] ?? school.boardingStatus}
          />
          <Row
            label="Gender"
            value={GENDER_LABELS[school.gender] ?? school.gender}
          />
          <Row label="County" value={school.county} />
          <Row label="Sub-county" value={school.subCounty} />
          <Row label="Phone" value={school.phone} />
          <Row label="Email" value={school.email} />
        </div>
      </div>

      <Separator />

      {/* Admin */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Administrator account</h3>
        <div className="rounded-lg border px-4 py-2 space-y-0.5 bg-muted/20">
          <Row
            label="Name"
            value={[admin.firstName, admin.middleName, admin.lastName]
              .filter(Boolean)
              .join(' ')}
          />
          <Row label="Email" value={admin.email} />
          <Row label="Phone" value={admin.phone} />
          <Row label="ID / Passport" value={admin.idNumber} />
          <div className="flex justify-between text-sm py-1">
            <span className="text-muted-foreground">Password</span>
            <span className="font-medium tracking-widest text-muted-foreground">
              {'•'.repeat(Math.min(admin.password?.length ?? 0, 12))}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Plan */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Subscription plan</h3>
        <div className="rounded-lg border px-4 py-2 space-y-0.5 bg-muted/20">
          {selectedPlan ? (
            <>
              <Row label="Plan" value={selectedPlan.name} />
              <Row
                label="Price"
                value={`${formatPrice(selectedPlan.priceMinor, selectedPlan.currency)}${billingLabel(selectedPlan.billingInterval)}`}
              />
              <Row
                label="Start"
                value={plan.startTrial ? '14-day free trial' : 'Active immediately'}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-1">No plan selected</p>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground border rounded-lg p-3 bg-blue-50 border-blue-100 text-blue-700">
        By clicking <strong>Register school</strong>, you agree to EduTrak's Terms
        of Service and Privacy Policy.
      </p>
    </div>
  );
}
