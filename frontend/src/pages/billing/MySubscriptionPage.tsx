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
import { CreditCard } from "lucide-react";
import { BillingInvoice } from "@/types";
import { formatCurrency, getPlanFeatureLimit } from "@/lib/utils";
import { CurrentPlanCard } from "@/components/billing/CurrentPlanCard";
import { CapacityCard } from "@/components/billing/CapacityCard";
import { UpgradeBanner } from "@/components/billing/UpgradeBanner";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { LimitWarningModal } from "@/components/billing/LimitWarningModal";
import { PayInvoiceModal } from "@/components/billing/PayInvoiceModal";
import { useSchoolStatistics } from "@/hooks/use-schools";

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
    <div className="space-y-6">
      {!subscription && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription>
            No active subscription found. Choose a plan to get started.
          </AlertDescription>
        </Alert>
      )}

      {subscription && (
        <>
          <CurrentPlanCard subscription={subscription} />

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

      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
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
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-900">
              Outstanding Balance
            </p>
            <p className="text-xs text-orange-700">
              {formatCurrency(outstandingMinor / 100, overview?.currency)} due —
              pay now to avoid service interruption.
            </p>
          </div>
          <Button size="sm" className="gap-1" onClick={handlePayOutstanding}>
            <CreditCard className="h-4 w-4" />
            Pay Now
          </Button>
        </div>
      )}

      <InvoiceHistoryTable
        invoices={invoices}
        onPayInvoice={handlePayInvoice}
      />

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
