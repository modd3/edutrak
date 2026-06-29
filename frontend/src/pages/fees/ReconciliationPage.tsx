import { ReconciliationUpload } from '@/components/fees/ReconciliationUpload';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

export function ReconciliationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bank Reconciliation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a bank statement CSV to auto-match deposits to student invoices.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Building2 className="h-3.5 w-3.5" />
          Equity · KCB · Co-op
        </Badge>
      </div>

      <ReconciliationUpload />
    </div>
  );
}
