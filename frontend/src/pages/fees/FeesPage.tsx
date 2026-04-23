// frontend/src/pages/fees/FeesPage.tsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  Settings,
  BarChart3,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
 
// Hooks
import { useActiveAcademicYear } from '@/hooks/use-academic';
import { useSchoolContext } from '@/hooks/use-school-context';
import { usePermission } from '@/hooks/use-permission';
import { useGetDefaultersReport } from '@/hooks/use-fees';
 
// Sub-components (already existing in codebase)
import { FeeDashboardCards } from '@/components/fees/FeeDashboardCards';
import { CollectionsChart } from '@/components/fees/CollectionsChart';
import { FeeArrearsTable } from '@/components/fees/FeeArrearsTable';
import FeeStructuresPage from '@/pages/fees/FeeStructuresPage';
import InvoicesPage from '@/pages/fees/InvoicesPage';
import PaymentsPage from '@/pages/fees/PaymentsPage';
import { InvoiceDetailsModal } from '@/components/fees/InvoiceDetailsModal';
import { PaymentRecordingModal } from '@/components/fees/PaymentRecordingModal';
 
// ─────────────────────────────────────────────────────────────────────────────
 
type FeeTab = 'dashboard' | 'invoices' | 'payments' | 'structures' | 'reports';
 
export default function FeesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as FeeTab) ?? 'dashboard';
  const { can } = usePermission();
  const { schoolId } = useSchoolContext();
 
  const { data: activeYearData } = useActiveAcademicYear();
  const activeYear = activeYearData?.data ?? activeYearData;
  const terms = activeYear?.terms ?? [];
 
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const [recordingPaymentInvoiceId, setRecordingPaymentInvoiceId] = useState<string | null>(null);
 
  const { data: defaultersData } = useGetDefaultersReport({
    academicYearId: activeYear?.id,
    termId: selectedTermId || undefined,
  });
  const defaulters: any[] = defaultersData?.data?.data ?? defaultersData?.data ?? [];
  const criticalCount = defaulters.filter((d: any) => {
    const days = d.dueDate
      ? Math.floor((Date.now() - new Date(d.dueDate).getTime()) / 86_400_000)
      : 0;
    return days > 30;
  }).length;
 
  function setTab(tab: FeeTab) {
    setSearchParams({ tab });
  }
 
  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Fee Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {activeYear ? `Academic Year ${activeYear.year}` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Term filter — shared across dashboard + reports */}
          {terms.length > 0 && (
            <Select value={selectedTermId} onValueChange={setSelectedTermId}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="All terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Terms</SelectItem>
                {terms.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    Term {t.termNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
 
          {can('manage_fees') && (
            <Button size="sm" onClick={() => setTab('structures')}>
              <Plus className="h-4 w-4 mr-1" />
              New Structure
            </Button>
          )}
        </div>
      </div>
 
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setTab(v as FeeTab)}>
        <TabsList className="h-10">
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs sm:text-sm">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
 
          <TabsTrigger value="invoices" className="gap-1.5 text-xs sm:text-sm">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Invoices</span>
          </TabsTrigger>
 
          <TabsTrigger value="payments" className="gap-1.5 text-xs sm:text-sm">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
 
          <TabsTrigger value="structures" className="gap-1.5 text-xs sm:text-sm">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Structures</span>
          </TabsTrigger>
 
          <TabsTrigger value="reports" className="gap-1.5 text-xs sm:text-sm relative">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
            {criticalCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                {criticalCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
 
        {/* ── DASHBOARD ──────────────────────────────────────────────── */}
        <TabsContent value="dashboard" className="space-y-5 mt-4">
          <FeeDashboardCards
            academicYearId={activeYear?.id}
            termId={selectedTermId || undefined}
          />
 
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <CollectionsChart
                academicYearId={activeYear?.id}
                termId={selectedTermId || undefined}
              />
            </div>
 
            {/* Quick stats sidebar */}
            <div className="space-y-4">
              <div className="bg-white border rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Quick Actions</p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setTab('invoices')}
                  >
                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                    View All Invoices
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setTab('payments')}
                  >
                    <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                    View Payments
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setTab('reports')}
                  >
                    <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                    Fee Arrears
                    {criticalCount > 0 && (
                      <Badge variant="destructive" className="ml-auto h-4 px-1.5 text-[10px]">
                        {criticalCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
 
          {/* Arrears preview */}
          <FeeArrearsTable
            academicYearId={activeYear?.id}
            termId={selectedTermId || undefined}
            limit={5}
            onViewInvoice={(id) => setViewingInvoiceId(id)}
            onRecordPayment={(id) => setRecordingPaymentInvoiceId(id)}
          />
        </TabsContent>
 
        {/* ── INVOICES ───────────────────────────────────────────────── */}
        <TabsContent value="invoices" className="mt-4">
          <InvoicesPage />
        </TabsContent>
 
        {/* ── PAYMENTS ───────────────────────────────────────────────── */}
        <TabsContent value="payments" className="mt-4">
          <PaymentsPage />
        </TabsContent>
 
        {/* ── FEE STRUCTURES ─────────────────────────────────────────── */}
        <TabsContent value="structures" className="mt-4">
          <FeeStructuresPage />
        </TabsContent>
 
        {/* ── REPORTS / ARREARS ──────────────────────────────────────── */}
        <TabsContent value="reports" className="space-y-5 mt-4">
          <CollectionsChart
            academicYearId={activeYear?.id}
            termId={selectedTermId || undefined}
          />
          <FeeArrearsTable
            academicYearId={activeYear?.id}
            termId={selectedTermId || undefined}
            onViewInvoice={(id) => setViewingInvoiceId(id)}
            onRecordPayment={(id) => setRecordingPaymentInvoiceId(id)}
          />
        </TabsContent>
      </Tabs>
 
      {/* Global modals */}
      {viewingInvoiceId && (
        <InvoiceDetailsModal
          open={!!viewingInvoiceId}
          onOpenChange={(o) => !o && setViewingInvoiceId(null)}
          invoiceId={viewingInvoiceId}
        />
      )}
 
      {recordingPaymentInvoiceId && (
        <PaymentRecordingModal
          open={!!recordingPaymentInvoiceId}
          onOpenChange={(o) => !o && setRecordingPaymentInvoiceId(null)}
          invoiceId={recordingPaymentInvoiceId}
        />
      )}
    </div>
  );
}
 
