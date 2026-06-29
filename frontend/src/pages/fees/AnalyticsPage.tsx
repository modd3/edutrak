import { AnalyticsDashboard } from '@/components/fees/AnalyticsDashboard';

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fee Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Collection performance, payment trends, and defaulter overview.
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
