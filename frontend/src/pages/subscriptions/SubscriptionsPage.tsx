import { useState } from 'react';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { usePlans } from '@/hooks/use-plans';
import { useSchoolContext } from '@/hooks/use-school-context';
import { CreateSubscriptionModal } from '@/components/subscriptions/CreateSubscriptionModal';
import { ManageSubscriptionStatusModal } from '@/components/subscriptions/ManageSubscriptionStatusModal';
import { Subscription } from '@/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Settings2, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STATUS_COLORS: Record<string, string> = {
  TRIALING: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  PAST_DUE: 'bg-orange-100 text-orange-800',
  GRACE: 'bg-yellow-100 text-yellow-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  CANCELED: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
};

export function SubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | undefined>();
  const [showStatusModal, setShowStatusModal] = useState(false);

  const planQuery = usePlans({ isActive: true, limit: 50 });
  const plans = planQuery.data?.data || [];
  const isLoadingPlans = planQuery.isLoading;
  const {isSuperAdmin} = useSchoolContext()

  const { data, isLoading, isError } = useSubscriptions({
    page,
    limit: 10,
    status: statusFilter || undefined,
  });

  const subscriptions = data?.data || [];
  const pagination = data?.pagination;

  if (isError) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Failed to load subscriptions. Please try again.</p>
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
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-gray-600">Manage school subscription plans and billing periods</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Subscription
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 max-w-xs">
              <label className="text-sm font-medium block mb-2">Filter by Status</label>
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
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? 'Loading...' : `Subscriptions (${pagination?.total || 0})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Period
                  </TableHead>
                  <TableHead>Trial Ends</TableHead>
                  {isSuperAdmin && 
                  <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Loading subscriptions...
                    </TableCell>
                  </TableRow>
                ) : subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">
                        {subscription.school?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{subscription.plan?.name}</p>
                          <p className="text-gray-500">
                            {(subscription.plan?.priceMinor || 0) / 100} {subscription.plan?.currency}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[subscription.status] || 'bg-gray-100'}>
                          {subscription.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(subscription.currentPeriodStart).toLocaleDateString()} to{' '}
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {subscription.trialEndsAt
                          ? new Date(subscription.trialEndsAt).toLocaleDateString()
                          : '—'}
                      </TableCell>
                     {isSuperAdmin && <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setShowStatusModal(true);
                          }}
                          className="gap-1"
                        >
                          <Settings2 className="h-4 w-4" />
                          Manage
                        </Button>
                      </TableCell>}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-6 border-t pt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateSubscriptionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        plans={plans}
        isLoadingPlans={isLoadingPlans}
      />
      <ManageSubscriptionStatusModal
        open={showStatusModal}
        onOpenChange={setShowStatusModal}
        subscription={selectedSubscription}
      />
    </div>
  );
}

export default SubscriptionsPage;
