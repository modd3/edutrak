import { ReconciliationUpload } from '@/components/fees/ReconciliationUpload';

export function ReconciliationPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Bank Reconciliation</h1>
      <ReconciliationUpload />
    </div>
  );
}
