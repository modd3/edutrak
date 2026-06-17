import { useState } from 'react';
import { usePlans, useDeletePlan } from '@/hooks/use-plans';
import { PlanFormModal } from '@/components/subscriptions/PlanFormModal';
import { Plan } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export function PlansPage() {
  const [page, setPage] = useState(1);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | undefined>();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | undefined>();

  const { data, isLoading, isError } = usePlans({
    page,
    limit: 20,
  });
  const deleteMutation = useDeletePlan();

  const plans = data?.data || [];
  const pagination = data?.pagination;

  const handleCreateClick = () => {
    setSelectedPlan(undefined);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEditClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleDeleteClick = (plan: Plan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    try {
      await deleteMutation.mutateAsync(planToDelete.id);
      toast.success('Plan deleted successfully');
      setDeleteDialogOpen(false);
      setPlanToDelete(undefined);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete plan');
    }
  };

  const formatPrice = (priceMinor: number, currency: string) => {
    return `${(priceMinor / 100).toFixed(2)} ${currency}`;
  };

  const formatBillingInterval = (interval: string) => {
    const map: Record<string, string> = {
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      ANNUALLY: 'Annually',
    };
    return map[interval] || interval;
  };

  if (isError) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Billing Plans</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Failed to load plans. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing Plans</h1>
          <p className="text-gray-600">Create and manage subscription billing plans</p>
        </div>
        <Button onClick={handleCreateClick} className="gap-2">
          <Plus className="h-4 w-4" />
          New Plan
        </Button>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? 'Loading...' : `Plans (${pagination?.total || 0})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Billing Interval</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Loading plans...
                    </TableCell>
                  </TableRow>
                ) : plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No plans found. Create your first plan to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell className="font-mono text-sm">{plan.key}</TableCell>
                      <TableCell>{formatPrice(plan.priceMinor, plan.currency)}</TableCell>
                      <TableCell>{formatBillingInterval(plan.billingInterval)}</TableCell>
                      <TableCell>
                        <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(plan)}
                          className="gap-1"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(plan)}
                          className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <PlanFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        initialData={selectedPlan}
        isEditing={isEditing}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the plan <strong>{planToDelete?.name}</strong>? This action cannot be undone.
              {planToDelete?.features && planToDelete.features.length > 0 && (
                <p className="mt-2 text-sm">This plan has features configured. Deleting it may affect associated data.</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </AlertDialogAction>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
