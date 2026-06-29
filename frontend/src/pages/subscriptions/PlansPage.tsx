import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, PlusCircle, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/shared/DataTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { usePlans, useDeletePlan } from '@/hooks/use-plans';
import { Plan } from '@/types';
import { PlanFormModal } from '@/components/subscriptions/PlanFormModal';
import { toast } from 'sonner';

// Mirrors the server-side FEATURE_REGISTRY for displaying feature labels in the table
const FEATURE_REGISTRY: Record<string, { name: string; limitType: 'BOOLEAN' | 'COUNT' }> = {
  'fees.core': { name: 'Fee Management', limitType: 'BOOLEAN' },
  'fees.mpesa': { name: 'M-PESA Integration', limitType: 'BOOLEAN' },
  'fees.report': { name: 'Fee Reports', limitType: 'BOOLEAN' },
  'fees.reconciliation': { name: 'Bank Reconciliation', limitType: 'BOOLEAN' },
  'fees.late_fees': { name: 'Late Fees', limitType: 'BOOLEAN' },
  'academic.core': { name: 'Academic Management', limitType: 'BOOLEAN' },
  'assessments.bulk': { name: 'Bulk Grade Entry', limitType: 'BOOLEAN' },
  'students.max': { name: 'Student Limit', limitType: 'COUNT' },
  'teachers.max': { name: 'Teacher Limit', limitType: 'COUNT' },
  'sms.monthly_quota': { name: 'SMS Quota', limitType: 'COUNT' },
  'lms.core': { name: 'Learning Management', limitType: 'BOOLEAN' },
};

const BILLING_INTERVAL_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Annually',
};

function formatPrice(minor: number, currency: string) {
  return `${(minor / 100).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function PlansPage() {
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const { data: response, isLoading, isError } = usePlans({
    page,
    limit: 20,
  });
  const { mutate: deletePlan, isPending: isDeleting } = useDeletePlan();

  const plans = response?.data || [];
  const pagination = response?.pagination;

  const handleEditClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowEditModal(true);
  };

  const handleDeleteClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedPlan) {
      deletePlan(selectedPlan.id, {
        onSuccess: () => {
          toast.success('Plan deleted successfully');
          setShowDeleteDialog(false);
          setSelectedPlan(null);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to delete plan');
        },
      });
    }
  };

  const columns: ColumnDef<Plan>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const plan = row.original;
        return (
          <Button
            variant="ghost"
            className="p-0 h-auto font-medium text-wrap hover:shadow hover:bg-green-50 text-left justify-start"
            onClick={() => handleEditClick(plan)}
          >
            {plan.name}
          </Button>
        );
      },
    },
    {
      accessorKey: 'key',
      header: 'Key',
      cell: ({ row }) => {
        const key = row.getValue('key') as string;
        return (
          <Badge variant="secondary" className="font-mono text-xs">
            {key}
          </Badge>
        );
      },
    },
    {
      id: 'price',
      header: 'Price',
      cell: ({ row }) => {
        const plan = row.original;
        return (
          <span className="whitespace-nowrap font-medium">
            {formatPrice(plan.priceMinor, plan.currency)}
          </span>
        );
      },
    },
    {
      id: 'billingInterval',
      header: 'Billing',
      cell: ({ row }) => {
        const interval = row.original.billingInterval;
        return (
          <span className="text-muted-foreground">
            {BILLING_INTERVAL_LABELS[interval] || interval}
          </span>
        );
      },
    },
    {
      id: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      id: 'features',
      header: 'Features',
      cell: ({ row }) => {
        const features = row.original.features;
        if (!features || features.length === 0) {
          return <span className="text-muted-foreground text-sm">None</span>;
        }
        const enabled = features.filter(f => f.enabled);
        if (enabled.length === 0) {
          return <span className="text-muted-foreground text-sm">None enabled</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {enabled.map(f => {
              const label = FEATURE_REGISTRY[f.featureKey]?.name ?? f.featureKey;
              const suffix = f.limitType === 'COUNT' && f.limitValue != null ? ` (${f.limitValue})` : '';
              return (
                <Badge key={f.id} variant="outline" className="text-xs">
                  {label}{suffix}
                </Badge>
              );
            })}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const plan = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEditClick(plan)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Plan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteClick(plan)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Plan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive text-lg mb-2">Failed to load plans</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing Plans</h1>
          <p className="text-muted-foreground">Create and manage subscription billing plans</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Plan
        </Button>
      </div>

      <DataTable columns={columns} data={plans} pageSize={20} />

      {pagination && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {plans.length} of {pagination.total} plans
        </div>
      )}

      {/* Create Plan Modal */}
      <PlanFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        isEditing={false}
      />

      {/* Edit Plan Modal */}
      {selectedPlan && (
        <PlanFormModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          initialData={selectedPlan}
          isEditing={true}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "<strong>{selectedPlan?.name}</strong>"? This action cannot
              be undone.
              {selectedPlan?.features && selectedPlan.features.length > 0 && (
                <p className="mt-2 text-sm">
                  This plan has features configured. Deleting it may affect associated data.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}