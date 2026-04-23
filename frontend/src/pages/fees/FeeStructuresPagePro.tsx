/**
 * Professional Fee Structures Management Page
 * Complete fee structure lifecycle: create, view, edit, generate invoices
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button,
} from '@/components/ui/button';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Input,
} from '@/components/ui/input';
import {
  Plus,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  FileText,
  Printer,
  Settings,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetFeeStructures } from '@/hooks/use-fees';
import { usePermission } from '@/hooks/use-permission';
import { RoleGuard } from '@/components/RoleGuard';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FeeStructureViewerModal } from '@/components/fees/FeeStructureViewerModal';
import { FeeStructureFormModal } from '@/components/fees/FeeStructureFormModal';
import { BulkGenerateInvoicesModal } from '@/components/fees/BulkGenerateInvoicesModal';
import { toast } from 'sonner';

interface StructureWithActions {
  id: string;
  name: string;
  description?: string;
  classLevel?: string;
  boardingStatus?: string;
  isActive: boolean;
  items: Array<{ id: string; name: string; amount: number; isOptional: boolean }>;
  _count?: { invoices: number };
  createdAt: string;
  academicYear?: { year: string };
}

export function FeeStructuresPage() {
  const { can } = usePermission();
  const queryClient = useQueryClient();

  // State management
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBulkGenerateModal, setShowBulkGenerateModal] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<StructureWithActions | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Data fetching
  const { data: structuresData, isLoading } = useGetFeeStructures({
    page: 1,
    limit: 100,
  });

  const structures: StructureWithActions[] =
    structuresData?.data?.data || structuresData?.data || [];

  // Filter structures by search
  const filteredStructures = structures.filter((s) =>
    search === ''
      ? true
      : s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.classLevel?.toLowerCase().includes(search.toLowerCase()) ||
        s.academicYear?.year.includes(search)
  );

  // Handlers
  const handleView = (structure: StructureWithActions) => {
    setSelectedStructure(structure);
    setShowViewModal(true);
  };

  const handleEdit = (structure: StructureWithActions) => {
    setSelectedStructure(structure);
    setShowEditModal(true);
  };

  const handleDelete = (structure: StructureWithActions) => {
    setSelectedStructure(structure);
    setShowDeleteDialog(true);
  };

  const handleGenerateInvoices = (structure: StructureWithActions) => {
    setSelectedStructure(structure);
    setShowBulkGenerateModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedStructure) return;

    try {
      // Delete API call would go here
      toast.success(`Fee structure "${selectedStructure.name}" deleted`);
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      setShowDeleteDialog(false);
      setSelectedStructure(null);
    } catch (error) {
      toast.error('Failed to delete fee structure');
    }
  };

  // Calculate totals for each structure
  const getStructureTotal = (items: StructureWithActions['items']) =>
    items.reduce((sum, item) => Number(sum) + Number(item.amount), 0);

  const getMandatoryTotal = (items: StructureWithActions['items']) =>
    items
      .filter((item) => !item.isOptional)
      .reduce((sum, item) => sum + item.amount, 0);

  return (
    <RoleGuard roles={['ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Fee Structures</h1>
          <p className="text-muted-foreground">
            Manage fee structures and generate invoices for students
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search structures..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10"
            />
          </div>
          {can('manage_fees') && (
            <Button
              onClick={() => {
                setSelectedStructure(null);
                setShowCreateModal(true);
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Structure
            </Button>
          )}
        </div>

        {/* Structures Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fee Structures</CardTitle>
                <CardDescription>
                  {filteredStructures.length} structure{filteredStructures.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              {filteredStructures.length > 0 && (
                <Badge variant="outline">{structures.length} total</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : filteredStructures.length === 0 ? (
              <div className="py-12 text-center">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-muted-foreground mb-4">No fee structures found</p>
                {can('manage_fees') && (
                  <Button
                    onClick={() => {
                      setSelectedStructure(null);
                      setShowCreateModal(true);
                    }}
                  >
                    Create First Structure
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Class Level</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Mandatory</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Invoices</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStructures.map((structure) => (
                      <TableRow key={structure.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        <TableCell className="font-semibold">{structure.name}</TableCell>
                        <TableCell>{structure.academicYear?.year || '—'}</TableCell>
                        <TableCell>{structure.classLevel || '—'}</TableCell>
                        <TableCell>
                          {structure.boardingStatus ? (
                            <Badge
                              variant={
                                structure.boardingStatus === 'BOARDING'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="text-xs"
                            >
                              {structure.boardingStatus}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {structure.items.length}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(getMandatoryTotal(structure.items))}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(getStructureTotal(structure.items))}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={structure.isActive ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {structure.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-xs">
                            {structure._count?.invoices || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleView(structure)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {can('manage_fees') && (
                                <DropdownMenuItem onClick={() => handleEdit(structure)}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {can('manage_fees') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleGenerateInvoices(structure)}
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Generate Invoices
                                  </DropdownMenuItem>
                                </>
                              )}
                              {can('manage_fees') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(structure)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {filteredStructures.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase">
                    Total Structures
                  </p>
                  <p className="text-3xl font-bold">{structures.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase">
                    Active Structures
                  </p>
                  <p className="text-3xl font-bold">
                    {structures.filter((s) => s.isActive).length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase">
                    Total Invoices
                  </p>
                  <p className="text-3xl font-bold">
                    {structures.reduce((sum, s) => sum + (s._count?.invoices || 0), 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <FeeStructureFormModal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            mode="create"
          />
        )}

        {showEditModal && selectedStructure && (
          <FeeStructureFormModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            mode="edit"
            structureId={selectedStructure.id}
          />
        )}

        {showViewModal && selectedStructure && (
          <FeeStructureViewerModal
            open={showViewModal}
            onOpenChange={setShowViewModal}
            structureId={selectedStructure.id}
          />
        )}

        {showBulkGenerateModal && selectedStructure && (
          <BulkGenerateInvoicesModal
            open={showBulkGenerateModal}
            onOpenChange={setShowBulkGenerateModal}
            feeStructureId={selectedStructure.id}
          />
        )}

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Fee Structure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the fee structure "{selectedStructure?.name}".
                {selectedStructure?._count?.invoices ? (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900 rounded text-sm">
                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                      ⚠️ This structure has {selectedStructure._count.invoices} associated
                      invoice(s)
                    </p>
                  </div>
                ) : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RoleGuard>
  );
}

export default FeeStructuresPage;
