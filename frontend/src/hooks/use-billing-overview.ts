import { useMemo } from 'react';
import { useSubscriptions } from './use-subscriptions';
import type { Subscription } from '@/types';

// KPI cards need a true count across ALL schools, not just the current
// table page. There's no aggregate endpoint yet (see note below), so we
// pull a wide, unpaginated slice just for the KPI math. This is fine at
// EduTrak's current scale (low hundreds of schools) — if that grows,
// replace this with a dedicated GET /subscriptions/stats endpoint that
// does the aggregation in Postgres instead of in the browser.
const KPI_FETCH_LIMIT = 1000;
const TRIAL_ENDING_WINDOW_DAYS = 7;

export interface BillingKpis {
  mrrMinor: number;
  currency: string;
  activeSchoolCount: number;
  pastDueCount: number;
  trialsEndingSoonCount: number;
}

function computeKpis(subscriptions: Subscription[]): BillingKpis {
  const now = Date.now();
  const trialWindowMs = TRIAL_ENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  let mrrMinor = 0;
  let currency = 'KES';
  let activeSchoolCount = 0;
  let pastDueCount = 0;
  let trialsEndingSoonCount = 0;

  for (const sub of subscriptions) {
    if (sub.status === 'ACTIVE' || sub.status === 'GRACE') {
      activeSchoolCount += 1;
      if (sub.plan) {
        mrrMinor += sub.plan.priceMinor;
        currency = sub.plan.currency || currency;
      }
    }
    if (sub.status === 'PAST_DUE' || sub.status === 'GRACE') {
      pastDueCount += 1;
    }
    if (sub.status === 'TRIALING' && sub.trialEndsAt) {
      const endsAt = new Date(sub.trialEndsAt).getTime();
      if (endsAt - now <= trialWindowMs && endsAt - now >= 0) {
        trialsEndingSoonCount += 1;
      }
    }
  }

  return { mrrMinor, currency, activeSchoolCount, pastDueCount, trialsEndingSoonCount };
}

/**
 * Data source for the billing admin overview: the table rows and the KPI
 * strip both derive from the subscriptions list, since it's the only
 * endpoint that already joins plan + school. Billing account and invoice
 * detail are fetched separately, lazily, once a row is selected — see
 * useSchoolBillingAccount and useAllBillingInvoices.
 */
export function useBillingOverview(params?: { status?: string; search?: string }) {
  const kpiQuery = useSubscriptions({ limit: KPI_FETCH_LIMIT });

  const allSubscriptions = kpiQuery.data?.data ?? [];

  const kpis = useMemo(() => computeKpis(allSubscriptions), [allSubscriptions]);

  const filtered = useMemo(() => {
    let rows = allSubscriptions;
    if (params?.status && params.status !== 'All') {
      rows = rows.filter((s) => s.status === params.status);
    }
    if (params?.search) {
      const q = params.search.trim().toLowerCase();
      if (q) rows = rows.filter((s) => s.school?.name?.toLowerCase().includes(q));
    }
    return rows;
  }, [allSubscriptions, params?.status, params?.search]);

  return {
    kpis,
    rows: filtered,
    isLoading: kpiQuery.isLoading,
    isError: kpiQuery.isError,
  };
}