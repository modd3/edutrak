import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { useSchoolBillingAccount } from "@/hooks/use-billing-account";
import { useAllBillingInvoices } from "@/hooks/use-billing-invoices";
import { usePlans } from "@/hooks/use-plans";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/shared/DataTable";
import { Plus, Search, ArrowUpRight, Smartphone } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  invoiceStatusMeta,
  invoiceStatusLabel,
  SUBSCRIPTION_STATUS_META,
} from "@/lib/utils";
import type { Subscription, BillingInvoice, BillingAccount } from "@/types";
import { CreateBillingAccountModal } from "@/components/billing/createBillingAccountModal";
import { ChangePlanModal } from "@/components/subscriptions/ChangePlanModal";
import { ManageSubscriptionStatusModal } from "@/components/subscriptions/ManageSubscriptionStatusModal";
import { TenantPaymentModal } from "@/components/billing/TenantPaymentModal";
import { ColumnDef } from "@tanstack/react-table";
import { BillingPageHeader } from "@/components/billing/BillingPageHeader";
import { BillingInvoiceTable } from "@/components/billing/BillingInvoiceTable";
import { LimitWarningModal } from "@/components/billing/LimitWarningModal";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useChangePlan } from "@/hooks/use-subscriptions";
import { subscriptionsApi } from "@/api/subscriptions-api";

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "info";
}) {
  const toneClass =
    tone === "warning"
      ? "bg-orange-50 text-orange-900"
      : tone === "info"
        ? "bg-blue-50 text-blue-900"
        : "bg-muted text-foreground";
  return (
    <div className={`rounded-lg p-4 ${toneClass}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

export default function BillingAdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<Subscription | null>(null);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showManageStatusModal, setShowManageStatusModal] = useState(false);
  const [showPayInvoiceModal, setShowPayInvoiceModal] = useState(false);
  const [showLimitWarningModal, setShowLimitWarningModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { data: subs, isLoading: subsLoading } = useSubscriptions({
    limit: 1000,
  });
  const { data: billingAccount } = useSchoolBillingAccount(
    selected?.schoolId || "",
  );
  const { data: invoicesData } = useAllBillingInvoices({
    schoolId: selected?.schoolId,
    limit: 20,
  });
  const { data: plansData } = usePlans({ isActive: true, limit: 50 });
  const plans = plansData?.data || [];

  const { mutateAsync: changePlan, isPending } = useChangePlan();
  const queryClient = useQueryClient();

  const rows = subs?.data || [];
  const invoices = invoicesData?.data || [];

  const subscriptionColumns: ColumnDef<Subscription>[] = [
    {
      accessorKey: "school",
      header: "School",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.school?.name}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const meta =
          SUBSCRIPTION_STATUS_META[status] || SUBSCRIPTION_STATUS_META.CANCELED;
        return (
          <span
            className={`inline-flex items-center gap-1.5 border text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${meta.badge}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
            {meta.label}
          </span>
        );
      },
    },
    {
      accessorKey: "plan",
      header: "Plan",
      cell: ({ row }) => (
        <div className="text-sm">
          <p className="font-medium">{row.original.plan?.name}</p>
          <p className="text-muted-foreground">
            {formatCurrency(
              (row.original.plan?.priceMinor || 0) / 100,
              row.original.plan?.currency,
            )}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "period",
      header: "Billing Period",
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.currentPeriodStart).toLocaleDateString()} –{" "}
          {new Date(row.original.currentPeriodEnd).toLocaleDateString()}
        </div>
      ),
    },
    {
      accessorKey: "trialEndsAt",
      header: "Trial Ends",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.trialEndsAt
            ? new Date(row.original.trialEndsAt).toLocaleDateString()
            : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelected(row.original)}
          >
            Manage
          </Button>
        </div>
      ),
    },
  ];

  const invoiceColumns: ColumnDef<BillingInvoice>[] = [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice #",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.invoiceNumber}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={invoiceStatusMeta(row.original).badge}
        >
          {invoiceStatusLabel(row.original)}
        </Badge>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">
            {formatCurrency(
              row.original.totalMinor / 100,
              row.original.currency,
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.original.totalMinor - row.original.amountPaidMinor > 0
              ? `${formatCurrency((row.original.totalMinor - row.original.amountPaidMinor) / 100, row.original.currency)} due`
              : "Paid"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "dueAt",
      header: "Due Date",
      cell: ({ row }) => (
        <span className="text-sm">{formatDate(row.original.dueAt)}</span>
      ),
    },
    {
      accessorKey: "paidAt",
      header: "Paid Date",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.paidAt ? formatDate(row.original.paidAt) : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const invoice = row.original;
        const remaining = invoice.totalMinor - invoice.amountPaidMinor;
        const isPayable = invoice.status === "OPEN" && remaining > 0;
        return (
          <div className="flex gap-2">
            {isPayable && (
              <Button
                size="sm"
                onClick={() => {
                  setSelected((prev) => prev || rows[0]);
                  setShowPayInvoiceModal(true);
                }}
                className="gap-1"
              >
                <Smartphone className="h-3 w-3" />
                Collect
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const filteredRows = useMemo(() => {
    let data = rows;
    if (statusFilter !== "All") {
      data = data.filter((s) => s.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter((s) => s.school?.name?.toLowerCase().includes(q));
    }
    return data;
  }, [rows, statusFilter, search]);

  const kpis = useMemo(() => {
    const activeCount = rows.filter(
      (s) => s.status === "ACTIVE" || s.status === "GRACE",
    ).length;
    const pastDueCount = rows.filter((s) => s.status === "PAST_DUE").length;
    const outstanding = invoices.reduce(
      (sum, i) => sum + (i.totalMinor - i.amountPaidMinor),
      0,
    );
    const currency = rows[0]?.plan?.currency || "KES";
    return { activeCount, pastDueCount, outstanding, currency };
  }, [rows, invoices]);

  const handleChangePlan = async ({ planId }: { planId: string }) => {
    if (!selected) return;
    try {
      await changePlan({
        subscriptionId: selected.id,
        data: { planId, withTrial: false },
      });
      toast.success("Plan updated successfully");
      setShowChangePlanModal(false);
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["billing-overview"] });
    } catch (error) {
      // error handled by hook toast
    }
  };

  return (
    <div className="space-y-6">
      <BillingPageHeader />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="accounts">Billing Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              label="Active Schools"
              value={String(kpis.activeCount)}
              tone="info"
            />
            <KpiCard
              label="Past Due"
              value={String(kpis.pastDueCount)}
              tone="warning"
            />
            <KpiCard
              label="Outstanding"
              value={formatCurrency(kpis.outstanding / 100, kpis.currency)}
              tone="warning"
            />
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Selected School</h3>
                {selected ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelected(null)}
                  >
                    Clear
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Select a school from the table
                  </span>
                )}
              </div>

              {selected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold">
                        {selected.school?.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setShowChangePlanModal(true)}
                      >
                        Change Plan
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowManageStatusModal(true)}
                      >
                        Manage Status
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Plan</p>
                      <p className="font-medium">{selected.plan?.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-medium">
                        {formatCurrency(
                          (selected.plan?.priceMinor || 0) / 100,
                          selected.plan?.currency,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Period</p>
                      <p className="font-medium">
                        {new Date(
                          selected.currentPeriodStart,
                        ).toLocaleDateString()}{" "}
                        –{" "}
                        {new Date(
                          selected.currentPeriodEnd,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Trial Ends</p>
                      <p className="font-medium">
                        {selected.trialEndsAt
                          ? new Date(selected.trialEndsAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => setShowUpgradeModal(true)}
                      className="gap-2"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Upgrade
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select a subscription from the table to view details.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-4">
                <div className="flex-1 max-w-xs">
                  <label className="text-sm font-medium block mb-2">
                    Filter by Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Statuses</SelectItem>
                      <SelectItem value="TRIALING">Trialing</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PAST_DUE">Past Due</SelectItem>
                      <SelectItem value="GRACE">Grace Period</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      <SelectItem value="CANCELED">Canceled</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by school name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <DataTable
                columns={subscriptionColumns}
                data={filteredRows}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={invoiceColumns}
                data={invoices}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center py-8">
                Select a subscription from the Overview tab to view billing
                account details.
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
      <TenantPaymentModal
        open={showPayInvoiceModal}
        onOpenChange={setShowPayInvoiceModal}
        invoice={
          invoices.find(
            (inv) =>
              inv.status === "OPEN" && inv.totalMinor - inv.amountPaidMinor > 0,
          ) || null
        }
        schoolName={selected?.school?.name}
      />

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        plans={plans}
        currentPlanName={selected?.plan?.name || rows[0]?.plan?.name || ""}
        currentPrice={selected?.plan?.priceMinor || rows[0]?.plan?.priceMinor}
        currency={kpis.currency || "KES"}
        subscriptionId={selected?.id || rows[0]?.id}
      />
    </div>
  );
}
