import { usePlans } from "@/hooks/use-plans";
import { useFeatureRegistry } from "@/hooks/use-feature-registry";
import { useNavigate } from "react-router-dom";
import { PlanCard } from "@/components/subscriptions/PlanCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { SubscriptionStatus } from "@/types";
import { useBillingOverview } from "@/hooks/use-billing-overview";

export function PricingPage() {
  const navigate = useNavigate();
  const { data: overview } = useBillingOverview();
  const currentPlanId = overview?.subscription?.planId;
  const status = overview?.subscription?.status as
    | SubscriptionStatus
    | undefined;
  const isActive = status === "ACTIVE" || status === "TRIALING";

  const {
    data: plansData,
    isLoading: isPlansLoading,
    isError: isPlansError,
  } = usePlans({ isActive: true, limit: 50 });
  const { data: registryData } = useFeatureRegistry();
  const registry = registryData?.data || {};

  const plans = plansData?.data || [];

  if (isPlansLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Plans & Pricing</h1>
          <p className="text-muted-foreground">
            Compare subscription plans and choose what fits your school
          </p>
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isPlansError) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Plans & Pricing</h1>
          <p className="text-muted-foreground">
            Compare subscription plans and choose what fits your school
          </p>
        </div>
        <p className="text-sm text-red-600">
          Failed to load plans. Please try again later.
        </p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Plans & Pricing</h1>
          <p className="text-muted-foreground">
            Compare subscription plans and choose what fits your school
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          No plans available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700 px-6 py-10 text-white shadow-[0_18px_50px_rgba(49,46,129,0.22)] sm:px-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-400/25 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200"><Sparkles className="h-4 w-4" /> Plans that grow with your school</div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple plans. Clear capacity. No surprises.</h1>
          <p className="mt-3 text-base leading-7 text-indigo-100">Compare what each plan includes, choose the capacity you need, and manage renewal from one secure billing space.</p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-indigo-100"><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Card & M-Pesa payments</span><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Secure hosted checkout</span></div>
        </div>
      </section>

      {currentPlanId && (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-semibold text-emerald-950">You&apos;re currently subscribed</p><p className="text-sm text-emerald-800">Review your plan details or compare available capacity below.</p></div>
          <Button variant="outline" className="border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100" onClick={() => navigate("/billing/my-subscription")}>Manage billing</Button>
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className={`relative rounded-2xl ${plan.id === currentPlanId ? "ring-2 ring-indigo-500 ring-offset-2" : ""}`}>
            {plan.id === currentPlanId && (
              <Badge
                className="absolute -top-3 left-5 z-10 bg-indigo-600 text-white hover:bg-indigo-600"
              >
                Current Plan
              </Badge>
            )}
            <div className="h-full rounded-2xl bg-white shadow-sm">
              <PlanCard plan={plan} registry={registry} />
              <div className="px-6 pb-6">
                {plan.id === currentPlanId ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/billing/my-subscription")}
                  >
                    Manage Subscription
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => navigate("/billing/my-subscription")}
                  >
                    {isActive ? "Compare upgrade options" : "Choose Plan"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PricingPage;
