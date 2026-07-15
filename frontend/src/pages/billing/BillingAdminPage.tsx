import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBillingOverview } from '@/hooks/use-billing-overview';
import { useSchoolBillingAccount } from '@/hooks/use-billing-account';
import { useAllBillingInvoices } from '@/hooks/use-billing-invoices';
import { usePlans } from '@/hooks/use-plans';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/shared/DataTable';
import { Plus, Search, ArrowUpRight, Smartphone } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Subscription, BillingInvoice, BillingAccount } from '@/types';
import { CreateBillingAccountModal } from '@/components/billing/createBillingAccountModal';
import { ChangePlanModal } from '@/components/subscriptions/ChangePlanModal';
import { ManageSubscriptionStatusModal } from '@/components/subscriptions/ManageSubscriptionStatusModal';
import { PayInvoiceModal } from '@/components/billing/PayInvoiceModal';
import { ColumnDef } from '@tanstack/react-table';
import { BillingPageHeader } from '@/components/billing/BillingPageHeader';
import { BillingInvoiceTable } from '@/components/billing/BillingInvoiceTable';
import { LimitWarningModal } from '@/components/billing/LimitWarningModal';
import { UpgradeModal } from '@/components/billing/UpgradeModal';

const STATUS_COLORS: Record<string, string> = {
  TRIALING: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  PAST_DUE: 'bg-orange-100 text-orange-800',
  GRACE: 'bg-yellow-100 text-yellow-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  CANCELED: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800',
  OPEN: 'bg-blue-100 text-blue-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  DRAFT: 'bg-yellow-100 text-yellow-800',
};

function KpiCard({ label, value, tone }: { label: string; value: string; tone?: 'default' | 'warning' | 'info' }) {
  const toneClass =
    tone === 'warning'
      ? 'bg-orange-50 text-orange-900'
      : tone === 'info'
      ? 'bg-blue-50 text-blue-900'
      : 'bg-muted text-foreground';
  return (
    <div className={`rounded-lg p-4 ${toneClass}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

export default function BillingAdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState<Subscription | null>(null);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showManageStatusModal, setShowManageStatusModal] = useState(false);
  const [showPayInvoiceModal, setShowPayInvoiceModal] = useState(false);
  const [showLimitWarningModal, setShowLimitWarningModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { kpis, rows, isLoading } = useBillingOverview({ status: statusFilter, search });

  const planQuery = usePlans({ isActive: true, limit: 50 });
  const plans = planQuery.data?.data || [];

  const accountQuery = useSchoolBillingAccount(selected?.schoolId ?? '');
  const account = accountQuery.data?.data;

  const invoicesQuery = useAllBillingInvoices({ schoolId: selected?.schoolId, limit: 5 });
  const invoices = invoicesQuery.data?.data ?? [];
  const latestOpenInvoice = invoices.find((inv) => inv.status === 'OPEN');

  const currencyMajor = (minor: number) => formatCurrency(minor / 100, kpis.currency);

  // Subscription columns for DataTable
  const subscriptionColumns: ColumnDef<Subscription>[] = useMemo(() => [
    {
      accessorKey: 'school.name',
      header: 'School',
      cell: ({ row }) => <span className="font-medium">{row.original.school?.name || 'N/A'}</span>,
    },
    {
      accessorKey: 'plan.name',
      header: 'Plan',
      cell: ({ row }) => (
        <div className="text-sm">
          <p className="font-medium">{row.original.plan?.name}</p>
          <p className="text-gray-500">{row.original.plan ? currencyMajor(row.original.plan.priceMinor) : '—'}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={STATUS_COLORS[row.original.status] || 'bg-gray-100'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'currentPeriodStart',
      header: 'Period',
      cell: ({ row }) => (
        <span className="text-sm">
          {formatDate(row.original.currentPeriodStart)} to {formatDate(row.original.currentPeriodEnd)}
        </span>
      ),
    },
    {
      accessorKey: 'trialEndsAt',
      header: 'Trial ends',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.trialEndsAt ? formatDate(row.original.trialEndsAt) : '—'}</span>
      ),
    },
  ], [currencyMajor]);

  // Invoice columns for DataTable
  const invoiceColumns: ColumnDef<BillingInvoice>[] = useMemo(() => [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
    },
    {
      accessorKey: 'school.name',
      header: 'School',
      cell: ({ row }) => <span className="font-medium">{(row.original as any).school?.name || 'N/A'}</span>,
    },
    {
      accessorKey: 'totalMinor',
      header: 'Amount',
      cell: ({ row }) => <span>{currencyMajor(row.original.totalMinor)}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={INVOICE_STATUS_COLORS[row.original.status] || 'bg-gray-100'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'dueAt',
      header: 'Due date',
      cell: ({ row }) => <span className="text-sm">{row.original.dueAt ? formatDate(row.original.dueAt) : '—'}</span>,
    },
  ], [currencyMajor]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing and subscriptions</h1>
          <p className="text-gray-600">Manage school billing accounts, plans and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/subscriptions/plans">
              Manage plans
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
          <Button onClick={() => setShowCreateAccountModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Subscription
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="accounts">Billing Accounts</TabsTrigger>
        </TabsList>

         {/* Overview Tab */}
         <TabsContent value="overview" className="space-y-6">
          {/* ── Visual Billing Dashboard (from design reference) ── */}
          <BillingPageHeader />

          {/* Invoice History */}
          <BillingInvoiceTable invoices={invoices} currency={kpis.currency} />

          {/* ── Admin KPI Section ── */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <KpiCard label="MRR" value={currencyMajor(kpis.mrrMinor)} />
            <KpiCard label="Active schools" value={String(kpis.activeSchoolCount)} />
            <KpiCard label="Past due" value={`${kpis.pastDueCount} schools`} tone={kpis.pastDueCount > 0 ? 'warning' : 'default'} />
            <KpiCard
              label="Trials ending in 7 days"
              value={`${kpis.trialsEndingSoonCount} schools`}
              tone={kpis.trialsEndingSoonCount > 0 ? 'info' : 'default'}
            />
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by school name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="w-56">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All statuses</SelectItem>
                      <SelectItem value="TRIALING">Trialing</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PAST_DUE">Past due</SelectItem>
                      <SelectItem value="GRACE">Grace period</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      <SelectItem value="CANCELED">Canceled</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DataTable columns={subscriptionColumns} data={rows} pageSize={10} />
            </CardContent>
          </Card>

          {selected && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg">{selected.school?.name}</p>
                    <Badge className={STATUS_COLORS[selected.status] || 'bg-gray-100'}>{selected.status}</Badge>
                  </div>
                  <div className="flex gap-2">
                    {latestOpenInvoice && (
                      <Button variant="outline" size="sm" onClick={() => setShowPayInvoiceModal(true)}>
                        Record payment
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setShowChangePlanModal(true)}>
                      Change plan
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowManageStatusModal(true)}>
                      Manage status
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm pt-4 border-t">
                  <div>
                    <p className="text-muted-foreground mb-1">Legal name</p>
                    <p>{accountQuery.isLoading ? 'Loading…' : account?.legalName ?? 'No billing account on file'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Billing email</p>
                    <p>{accountQuery.isLoading ? 'Loading…' : account?.email ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Currency</p>
                    <p>{account?.prefferedCurrency ?? selected.plan?.currency ?? 'KES'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Latest invoice</p>
                    <p>
                      {invoicesQuery.isLoading
                        ? 'Loading…'
                        : invoices[0]
                        ? `${invoices[0].invoiceNumber} · ${currencyMajor(invoices[0].totalMinor)}`
                        : 'No invoices yet'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Payment method</p>
                    <p className="flex items-center gap-1">
                      <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                      M-Pesa
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Renewals</p>
                    <p>{selected.renewalCount ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by school name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="w-56">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All statuses</SelectItem>
                      <SelectItem value="TRIALING">Trialing</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PAST_DUE">Past due</SelectItem>
                      <SelectItem value="GRACE">Grace period</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      <SelectItem value="CANCELED">Canceled</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DataTable columns={subscriptionColumns} data={rows} pageSize={10} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <DataTable columns={invoiceColumns} data={invoices} pageSize={10} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Accounts Tab */}
        <TabsContent value="accounts" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center py-8">
                Select a subscription from the Overview tab to view billing account details.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateBillingAccountModal
        open={showCreateAccountModal}
        onOpenChange={setShowCreateAccountModal}
      />
      <ChangePlanModal
        open={showChangePlanModal}
        onOpenChange={setShowChangePlanModal}
        subscription={selected}
        plans={plans}
      />
      <ManageSubscriptionStatusModal
        open={showManageStatusModal}
        onOpenChange={setShowManageStatusModal}
        subscription={selected}
      />
      <PayInvoiceModal
        open={showPayInvoiceModal}
        onOpenChange={setShowPayInvoiceModal}
        invoice={latestOpenInvoice ?? null}
      />

      {/* Upgrade Modal — full plan selector */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        plans={plans}
        currentPlanName={selected?.plan?.name || rows[0]?.plan?.name || 'Starter Plan'}
        currentPrice={selected?.plan?.priceMinor || rows[0]?.plan?.priceMinor || 20000}
        currency={kpis.currency || 'KES'}
        onConfirm={(planId, billing) => {
          console.log('Upgrade confirmed:', { planId, billing });
          setShowUpgradeModal(false);
        }}
      />
    </div>
  );
}