import { usePlans } from "@/hooks/use-plans";
import { useFeatureRegistry } from "@/hooks/use-feature-registry";
import { useSchoolContext } from "@/hooks/use-school-context";
import { useNavigate } from "react-router-dom";
import { PlanCard } from "@/components/subscriptions/PlanCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="space-y-6">
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
      <div className="space-y-6">
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
      <div className="space-y-6">
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plans & Pricing</h1>
        <p className="text-muted-foreground">
          Compare subscription plans and choose what fits your school
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="relative">
            {plan.id === currentPlanId && (
              <Badge
                className="absolute -top-3 right-4 z-10"
                variant="secondary"
              >
                Current Plan
              </Badge>
            )}
            <div className="h-full flex flex-col">
              <PlanCard plan={plan} registry={registry} />
              <div className="mt-4">
                {plan.id === currentPlanId ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/subscriptions")}
                  >
                    Manage Subscription
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => navigate("/subscriptions")}
                    disabled={isActive}
                  >
                    {isActive ? "Switch from Subscriptions" : "Choose Plan"}
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
