/**
 * Professional Fees Management Dashboard
 * Main fee management hub with tabbed interface for all fee operations
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  Settings,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useActiveAcademicYear } from '@/hooks/use-academic';
import { useSchoolContext } from '@/hooks/use-school-context';
import { usePermission } from '@/hooks/use-permission';
import { useGetDefaultersReport } from '@/hooks/use-fees';
import { RoleGuard } from '@/components/RoleGuard';

// Import professional page components
import FeeStructuresPagePro from './FeeStructuresPagePro';
import InvoicesPagePro from './InvoicesPagePro';
import ReportsPagePro from './ReportsPagePro';
import PaymentsPagePro from './PaymentsPagePro';
import { FeeDashboardCards } from '@/components/fees/FeeDashboardCards';
import { FeeArrearsTable } from '@/components/fees/FeeArrearsTable';
import { CollectionsChart } from '@/components/fees/CollectionsChart';

type FeeTab = 'dashboard' | 'structures' | 'invoices' | 'payments' | 'reports';

export default function FeesPagePro() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as FeeTab) ?? 'dashboard';
  const { can } = usePermission();
  const { schoolId } = useSchoolContext();

  // Get active term
  const { data: activeYearData } = useActiveAcademicYear();
  const activeYear = activeYearData?.data ?? activeYearData;
  const terms = activeYear?.terms ?? [];

  const [selectedTermId, setSelectedTermId] = useState<string>('');

  const filterTerm = selectedTermId === 'All' || !selectedTermId ? undefined : selectedTermId;

  // Fetch defaulters for alerts
  const { data: defaultersData } = useGetDefaultersReport({
    academicYearId: activeYear?.id,
    termId: filterTerm,
  });

  const defaulters = defaultersData?.data?.data || defaultersData?.data || [];

  // Calculate critical defaulters
  const criticalCount = defaulters.filter((d: any) => {
    const days = d.dueDate
      ? Math.floor((Date.now() - new Date(d.dueDate).getTime()) / 86400000)
      : 0;
    return days > 60;
  }).length;

  const overdueCount = defaulters.filter((d: any) => {
    const days = d.dueDate
      ? Math.floor((Date.now() - new Date(d.dueDate).getTime()) / 86400000)
      : 0;
    return days > 0 && days <= 60;
  }).length;

  function setTab(tab: FeeTab) {
    setSearchParams({ tab });
  }

  return (
    <RoleGuard roles={['ADMIN', 'SUPER_ADMIN', 'TEACHER']}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Fee Management</h1>
            <p className="text-muted-foreground">
              {activeYear ? `Academic Year ${activeYear.year}` : 'Loading...'}
            </p>
          </div>

          {/* Term Filter */}
          {terms.length > 0 && (
            <Select value={selectedTermId} onValueChange={setSelectedTermId}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Terms</SelectItem>
                {terms.map((term: any) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Critical Alerts */}
        {criticalCount > 0 && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200 ml-3">
              <strong>{criticalCount} critical defaulter{criticalCount !== 1 ? 's' : ''}</strong> with invoices overdue by more than 60 days. Immediate collection action required.
              {overdueCount > 0 && (
                <>
                  {' '}
                  <strong className="ml-2">+{overdueCount} overdue</strong> (30-60 days)
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setTab(v as FeeTab)}>
          <TabsList className="w-full justify-start border-b bg-transparent p-0 h-auto rounded-none">
            <TabsTrigger
              value="dashboard"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            {can('manage_fees') && (
              <TabsTrigger
                value="structures"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Settings className="h-4 w-4 mr-2" />
                Structures
              </TabsTrigger>
            )}
            {can('manage_fees') && (
              <TabsTrigger
                value="invoices"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <FileText className="h-4 w-4 mr-2" />
                Invoices
                {defaulters.length > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {defaulters.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {can('manage_fees') && (
              <TabsTrigger
                value="payments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Payments
              </TabsTrigger>
            )}
            {can('manage_fees') && (
              <TabsTrigger
                value="reports"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <div className="space-y-4">
              {/* Summary Cards */}
              <FeeDashboardCards
                academicYearId={activeYear?.id}
                termId={filterTerm}
              />

              {/* Collections Chart */}
              <CollectionsChart
                academicYearId={activeYear?.id}
                termId={filterTerm}
              />

              {/* Arrears/Defaulters Preview */}
              {defaulters.length > 0 && (
                <FeeArrearsTable
                  academicYearId={activeYear?.id}
                  termId={filterTerm}
                  limit={10}
                  onViewInvoice={(invoiceId) => {
                    setTab('invoices');
                  }}
                  onRecordPayment={(invoiceId) => {
                    setTab('payments');
                  }}
                />
              )}
            </div>
          </TabsContent>

          {/* Fee Structures Tab */}
          {can('manage_fees') && (
            <TabsContent value="structures" className="mt-6">
              <FeeStructuresPagePro />
            </TabsContent>
          )}

          {/* Invoices Tab */}
          {can('manage_fees') && (
            <TabsContent value="invoices" className="mt-6">
              <InvoicesPagePro />
            </TabsContent>
          )}

          {/* Payments Tab */}
          {can('manage_fees') && (
            <TabsContent value="payments" className="mt-6">
              <PaymentsPagePro />
            </TabsContent>
          )}

          {/* Reports Tab */}
          {can('manage_fees') && (
            <TabsContent value="reports" className="mt-6">
              <ReportsPagePro />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </RoleGuard>
  );
}
