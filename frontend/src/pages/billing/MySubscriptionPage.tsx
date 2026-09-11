import { useMemo, useState } from "react";
import { useFeatureRegistry } from "@/hooks/use-feature-registry";
import { usePlans } from "@/hooks/use-plans";
import { useBillingOverview } from "@/hooks/use-billing-overview";
import { FeatureRow } from "@/components/subscriptions/FeatureRow";
import { InvoiceHistoryTable } from "@/components/billing/InvoiceHistoryTable";
import { PaymentHistoryTable } from "@/components/billing/PaymentHistoryTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowUpRight, CheckCircle2, CreditCard, ReceiptText, ShieldCheck } from "lucide-react";
import { BillingInvoice } from "@/types";
import { formatCurrency, getPlanFeatureLimit } from "@/lib/utils";
import { CurrentPlanCard } from "@/components/billing/CurrentPlanCard";
import { CapacityCard } from "@/components/billing/CapacityCard";
import { UpgradeBanner } from "@/components/billing/UpgradeBanner";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { LimitWarningModal } from "@/components/billing/LimitWarningModal";
import { PayInvoiceModal } from "@/components/billing/PayInvoiceModal";
import { useSchoolStatistics } from "@/hooks/use-schools";
import { BillingPageHeader } from "@/components/billing/BillingPageHeader";

export function MySubscriptionPage() {
  const [showLimitWarningModal, setShowLimitWarningModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState<BillingInvoice | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);

  const { data: overview, isLoading: overviewLoading } = useBillingOverview();
  const { data: plansData } = usePlans({ isActive: true, limit: 50 });
  const plans = plansData?.data || [];

  const subscription = overview?.subscription;
  const invoices = overview?.recentInvoices || [];
  const outstandingMinor = overview?.outstandingBalanceMinor || 0;
  const openInvoices = invoices.filter((invoice) => invoice.status === "OPEN");

  const registryData = useFeatureRegistry();
  const registry = registryData.data?.data || {};

  const plan = subscription?.plan;
  const sortedFeatures = useMemo(() => {
    if (!plan?.features) return [];
    return [...plan.features].sort((a, b) =>
      a.featureKey.localeCompare(b.featureKey),
    );
  }, [plan?.features]);

  const schoolStatistics = useSchoolStatistics(subscription?.schoolId);
  const schoolStats = (schoolStatistics?.data?.data?.data ||
    schoolStatistics?.data?.data ||
    schoolStatistics?.data ||
    {}) as Record<string, any>;

  const studentCount = schoolStats?.usersByRole?.STUDENT || 0;
  const teacherCount = schoolStats?.usersByRole?.TEACHER || 0;

  const studentsLimit = getPlanFeatureLimit(plan, "students.max", 0);
  const teachersLimit = getPlanFeatureLimit(plan, "teachers.max", 0);

  const atStudentLimit = studentsLimit > 0 && studentCount >= studentsLimit;
  const atTeacherLimit = teachersLimit > 0 && teacherCount >= teachersLimit;

  // Flatten payment history from all invoices (server now includes payments)
  const payments = useMemo(
    () => (invoices || []).flatMap((inv) => inv.payments || []),
    [invoices],
  );

  const handlePayInvoice = (invoice: BillingInvoice) => {
    setInvoiceToPay(invoice);
    setShowPayModal(true);
  };

  const handlePayOutstanding = () => {
    const firstOpen = invoices.find(
      (inv) =>
        inv.status === "OPEN" && inv.totalMinor - inv.amountPaidMinor > 0,
    );
    if (firstOpen) {
      handlePayInvoice(firstOpen);
    }
  };

  if (overviewLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <BillingPageHeader />
        {subscription && (
          <Button variant="outline" className="shrink-0 gap-2" onClick={() => setShowUpgradeModal(true)}>
            Explore plans <ArrowUpRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      {!subscription && (
        <Alert className="border-indigo-200 bg-indigo-50">
          <AlertDescription>
            No active subscription found. Choose a plan to get started.
          </AlertDescription>
        </Alert>
      )}

      {subscription && (
        <>
          <CurrentPlanCard subscription={subscription} />

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Plan status</div>
              <p className="font-semibold text-slate-900">Your school is covered</p>
              <p className="mt-1 text-sm text-slate-500">Access is managed from this billing space.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><ReceiptText className="h-4 w-4 text-indigo-600" /> Invoices</div>
              <p className="font-semibold text-slate-900">{openInvoices.length === 0 ? "Nothing due" : `${openInvoices.length} invoice${openInvoices.length > 1 ? "s" : ""} open`}</p>
              <p className="mt-1 text-sm text-slate-500">{openInvoices.length === 0 ? "Your recent billing is up to date." : "Review and pay before service is affected."}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><CreditCard className="h-4 w-4 text-indigo-600" /> Payment methods</div>
              <p className="font-semibold text-slate-900">Card & M-Pesa supported</p>
              <p className="mt-1 text-sm text-slate-500">Choose a secure method whenever you pay.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <CapacityCard
              title="Student Capacity"
              used={studentCount}
              total={studentsLimit}
              color="#10b981"
              trackColor="#d1fae5"
              icon="🎓"
              unit="students"
            />
            <CapacityCard
              title="Teacher Capacity"
              used={teacherCount}
              total={teachersLimit}
              color="#ef4444"
              trackColor="#fee2e2"
              icon="👩‍🏫"
              unit="teachers"
            />
          </div>

          {(atTeacherLimit || atStudentLimit) && (
            <UpgradeBanner
              onUpgrade={() => setShowUpgradeModal(true)}
              title="Plan capacity limit"
              description="To add more users and storage, your school can upgrade to the next tier."
              buttonLabel="Upgrade Plan"
              used={atTeacherLimit ? teachersLimit : studentsLimit}
              total={atTeacherLimit ? teachersLimit : studentsLimit}
              metricLabel={atTeacherLimit ? "teachers" : "students"}
            />
          )}
        </>
      )}

      <LimitWarningModal
        open={showLimitWarningModal}
        onClose={() => setShowLimitWarningModal(false)}
        onUpgrade={() => {
          setShowLimitWarningModal(false);
          setShowUpgradeModal(true);
        }}
        currentPlanName={plan?.name || "Current Plan"}
        currentLimit={teachersLimit}
        newPlanName={plans.length > 1 ? plans[1].name : "Next Plan"}
        newLimit={
          plans.length > 1
            ? getPlanFeatureLimit(plans[1], "teachers.max", teachersLimit)
            : teachersLimit
        }
        priceMinor={
          plans.length > 1 ? plans[1].priceMinor : plan?.priceMinor || 0
        }
        currency={plan?.currency || "KES"}
        metricLabel="teachers"
      />

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        plans={plans}
        currentPlanName={plan?.name}
        currentPrice={plan?.priceMinor}
        currency={plan?.currency || "KES"}
        subscriptionId={subscription?.id}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">What&apos;s included</CardTitle>
          <p className="text-sm text-muted-foreground">Your current plan&apos;s features and allowances.</p>
        </CardHeader>
        <CardContent>
          {sortedFeatures.length > 0 ? (
            <div className="divide-y">
              {sortedFeatures.map((f) => (
                <FeatureRow key={f.id} feature={f} registry={registry} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No features configured for this plan.
            </p>
          )}
        </CardContent>
      </Card>

      {outstandingMinor > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-950">
              Payment needed
            </p>
            <p className="mt-1 text-sm text-amber-800">
              {formatCurrency(outstandingMinor / 100, overview?.currency)} is due. Pay securely to keep your service uninterrupted.
            </p>
          </div>
          <Button size="sm" className="gap-1 self-start sm:self-auto" onClick={handlePayOutstanding}>
            <CreditCard className="h-4 w-4" />
            Pay Now
          </Button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.75fr)]">
        <InvoiceHistoryTable invoices={invoices} onPayInvoice={handlePayInvoice} />
        <Card className="h-fit border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Billing confidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>Every payment is linked to an invoice and appears in your history.</span></div>
            <div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>Card payments complete through a secure hosted checkout.</span></div>
            <div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>Need help? Contact billing support before your renewal date.</span></div>
          </CardContent>
        </Card>
      </div>

      <PaymentHistoryTable payments={payments} />

      {invoiceToPay && (
        <PayInvoiceModal
          open={showPayModal}
          onOpenChange={setShowPayModal}
          invoice={invoiceToPay}
        />
      )}
    </div>
  );
}

export default MySubscriptionPage;
