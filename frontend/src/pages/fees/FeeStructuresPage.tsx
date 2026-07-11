/**
 * Fee Structures Management Page
 * Complete fee structure lifecycle: create, view, edit, generate invoices
 * Uses the shared DataTable component with TanStack columns.
 */

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import {
  Plus,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  FileText,
  Settings,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Combobox } from '@/components/ui/combobox';
import { DataTable } from '@/components/shared/DataTable';
import { useGetFeeStructures } from '@/hooks/use-fees';
import { usePermission } from '@/hooks/use-permission';
import { useAcademicYears, useActiveAcademicYear, useClasses } from '@/hooks/use-academic';
import { RoleGuard } from '@/components/RoleGuard';
import { formatCurrency } from '@/lib/utils';
import { FeeStructureViewerModal } from '@/components/fees/FeeStructureViewerModal';
import FeeStructureFormModal from '@/components/fees/FeeStructureFormModal';
import { BulkGenerateInvoicesModal } from '@/components/fees/BulkGenerateInvoicesModal';
import { toast } from 'sonner';
import { useSchoolContext } from '@/hooks/use-school-context';
import { useSchools } from '@/hooks/use-schools';
import { useDebounce } from '@/hooks/use-debounce';
import { School } from '@/types';

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
  academicYear?: { year: number };
}

export function FeeStructuresPage() {
  const { can } = usePermission();
  const { schoolId, isSuperAdmin } = useSchoolContext();
  const queryClient = useQueryClient();

  // State management
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBulkGenerateModal, setShowBulkGenerateModal] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<StructureWithActions | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');

  // Fetch all schools (super-admin only)
  const { data: schoolsData, isFetching } = useSchools(
    { search: debouncedSearch },
    { enabled: isSuperAdmin }
  );
  const allSchools = schoolsData?.data;
  const schoolOptions = (allSchools || []).map((school: School) => ({
    value: school.id,
    label: school.name,
    description: school.county ? `${school.county} County` : 'Unassigned Region',
  }));
  const activeSchool = allSchools?.find((s: School) => s.id === selectedSchoolId);

  const effectiveSchoolId = schoolId || activeSchool?.id || '';

  // Structures data fetching
  const { data: structuresData, isLoading } = useGetFeeStructures({
    schoolId: effectiveSchoolId,
    page: 1,
    limit: 100,
  });

  const structures: StructureWithActions[] = structuresData?.data || [];
  const { data: academicYearsData } = useAcademicYears();
  const academicYears = academicYearsData?.data || [];
  const { data: activeAcademicYear } = useActiveAcademicYear();
  const classesQuery = useClasses(activeAcademicYear?.id);
  const classesData = classesQuery.data?.data || [];
  const classLevels = Array.from(
    new Set(classesData.map((c: any) => String(c.level)))
  ).sort() as string[];

  // Client-side search filter
  const filteredStructures = useMemo(
    () =>
      structures.filter((s) =>
        search === ''
          ? true
          : s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.classLevel?.toLowerCase().includes(search.toLowerCase()) ||
            s.academicYear?.year.toString() === search
      ),
    [structures, search]
  );

  // Helpers
  const getStructureTotal = (items: StructureWithActions['items']) =>
    items.reduce((sum, item) => Number(sum) + Number(item.amount), 0);
  const getMandatoryTotal = (items: StructureWithActions['items']) =>
    items.filter((item) => !item.isOptional).reduce((sum, item) => sum + item.amount, 0);

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
      toast.success(`Fee structure "${selectedStructure.name}" deleted`);
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      setShowDeleteDialog(false);
      setSelectedStructure(null);
    } catch {
      toast.error('Failed to delete fee structure');
    }
  };

  // ── TanStack column definitions ──────────────────────────────────────────
  const columns = useMemo<ColumnDef<StructureWithActions>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.name}</span>
        ),
      },
      {
        id: 'academicYear',
        header: 'Academic Year',
        accessorFn: (row) => row.academicYear?.year ?? '',
        cell: ({ row }) => row.original.academicYear?.year ?? '—',
      },
      {
        accessorKey: 'classLevel',
        header: 'Class Level',
        cell: ({ row }) => row.original.classLevel ?? '—',
      },
      {
        accessorKey: 'boardingStatus',
        header: 'Type',
        cell: ({ row }) =>
          row.original.boardingStatus ? (
            <Badge
              variant={row.original.boardingStatus === 'BOARDING' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {row.original.boardingStatus}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
      },
      {
        id: 'items',
        header: 'Items',
        accessorFn: (row) => row.items.length,
        cell: ({ row }) => (
          <span className="font-medium text-right block">{row.original.items.length}</span>
        ),
      },
      {
        id: 'mandatory',
        header: 'Mandatory',
        accessorFn: (row) => getMandatoryTotal(row.items),
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 text-right block">
            {formatCurrency(getMandatoryTotal(row.original.items))}
          </span>
        ),
      },
      {
        id: 'total',
        header: 'Total',
        accessorFn: (row) => getStructureTotal(row.items),
        cell: ({ row }) => (
          <span className="font-mono font-bold text-green-600 dark:text-green-400 text-right block">
            {formatCurrency(getStructureTotal(row.original.items))}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'default' : 'outline'} className="text-xs">
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'invoices',
        header: 'Invoices',
        accessorFn: (row) => row._count?.invoices ?? 0,
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-xs">
            {row.original._count?.invoices ?? 0}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const structure = row.original;
          return (
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
                    <DropdownMenuItem onClick={() => handleGenerateInvoices(structure)}>
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
          );
        },
      },
    ],
    [can, structures]
  );

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

          {isSuperAdmin && (
            <div className="space-y-2 max-w-md">
              <label className="text-sm font-medium text-foreground">
                Switch Managed Institution
              </label>
              <Combobox
                options={schoolOptions}
                value={selectedSchoolId}
                onChange={setSelectedSchoolId}
                placeholder="Type to find a school..."
                searchPlaceholder="Search by name or county location..."
                emptyMessage="No matching institutions registered."
                isLoading={isFetching}
              />
            </div>
          )}

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
                  {filteredStructures.length} structure
                  {filteredStructures.length !== 1 ? 's' : ''}
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
              <DataTable columns={columns} data={filteredStructures} pageSize={15} />
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
            academicYears={academicYears}
            classLevels={classLevels}
          />
        )}

        {showEditModal && selectedStructure && (
          <FeeStructureFormModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            mode="edit"
            structureId={selectedStructure.id}
            academicYears={academicYears}
            classLevels={classLevels}
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
