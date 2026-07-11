import { Home } from 'lucide-react';

export function BillingPageHeader() {
  return (
    <div className="mb-9">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Settings
        </span>
        <span className="text-xs text-slate-300">/</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Billing
        </span>
      </div>

      {/* Title */}
      <h1 className="text-[28px] font-bold text-[#1e1b4b] tracking-tight m-0">
        Billing & Subscription
      </h1>
      <p className="text-sm text-muted-foreground mt-1.5 font-normal">
        Manage your plan, capacity, and payment details.
      </p>
    </div>
  );
}