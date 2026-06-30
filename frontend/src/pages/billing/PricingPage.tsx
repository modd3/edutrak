import { usePlans } from '@/hooks/use-plans';
import { useFeatureRegistry } from '@/hooks/use-feature-registry';
import { PlanCard } from '@/components/subscriptions/PlanCard';

export function PricingPage() {
  const { 
    data: plansData, 
    isLoading: isPlansLoading, 
    isError: isPlansError 
  } = usePlans({ isActive: true, limit: 50 });
  const { 
    data: registryData,
  } = useFeatureRegistry();

  const registry = registryData?.data || {};
  
  const plans = plansData?.data || [];
 
  if (isPlansLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Plans & Pricing</h1>
          <p className="text-muted-foreground">Compare subscription plans and choose what fits your school</p>
        </div>
        <div className="text-sm text-muted-foreground">Loading plans…</div>
      </div>
    );
  }

  if (isPlansError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Plans & Pricing</h1>
          <p className="text-muted-foreground">Compare subscription plans and choose what fits your school</p>
        </div>
        <div className="text-sm text-red-600">Failed to load plans. Please try again later.</div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Plans & Pricing</h1>
          <p className="text-muted-foreground">Compare subscription plans and choose what fits your school</p>
        </div>
        <div className="text-sm text-muted-foreground">No plans available at the moment.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plans & Pricing</h1>
        <p className="text-muted-foreground">Compare subscription plans and choose what fits your school</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {plans.map(plan => (
          <PlanCard key={plan.id} plan={plan} registry={registry} />
        ))}
      </div>
    </div>
  );
}

export default PricingPage;