import { AnalyticsDashboard } from '@/components/fees/AnalyticsDashboard';

export function AnalyticsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Fee Analytics</h1>
      <AnalyticsDashboard />
    </div>
  );
}
