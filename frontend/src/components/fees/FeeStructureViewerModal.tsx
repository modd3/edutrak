/**
 * Professional Fee Structure Viewer with Print Support
 * Displays fee structure details in a clear, professional format suitable for printing
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Button,
} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Badge,
  Printer,
  Download,
  X,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetFeeStructureById } from '@/hooks/use-fees';
import { formatCurrency, formatDate } from '@/lib/utils';

interface FeeStructureViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  structureId: string;
}

export function FeeStructureViewerModal({
  open,
  onOpenChange,
  structureId,
}: FeeStructureViewerModalProps) {
  const { data: structureData, isLoading } = useGetFeeStructureById(structureId);
  const [isPrinting, setIsPrinting] = useState(false);

  const structure = structureData?.data?.data || structureData?.data;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleDownloadPDF = async () => {
    // Implementation for PDF download would use libraries like pdfkit or print-to-pdf
    console.log('Download as PDF');
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <Skeleton className="h-6 w-40" />
          </DialogHeader>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!structure) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fee Structure Not Found</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">The requested fee structure could not be found.</p>
        </DialogContent>
      </Dialog>
    );
  }

  const totalAmount = structure.items?.reduce(
    (sum: number, item: any) => sum + Number(item.amount),
    0
  ) || 0;

  const mandatoryTotal = structure.items
    ?.filter((item: any) => !item.isOptional)
    .reduce((sum: number, item: any) => sum + Number(item.amount), 0) || 0;

  const optionalTotal = structure.items
    ?.filter((item: any) => item.isOptional)
    .reduce((sum: number, item: any) => sum + Number(item.amount), 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto print:max-h-none print:overflow-visible">
        {/* Print-only header */}
        <div className="hidden print:block mb-8 border-b-2 pb-4">
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-2xl font-bold">FEE STRUCTURE</h1>
            <p className="text-gray-600">School Management System</p>
          </div>
        </div>

        {/* Screen-only header */}
        <div className="print:hidden">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pr-8">
            <div>
              <DialogTitle>Fee Structure Details</DialogTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={isPrinting}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-6 print:space-y-4">
          {/* Structure Overview Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Structure Name</label>
                <p className="text-lg font-semibold">{structure.name}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
                <p className="text-sm text-muted-foreground">{structure.description || 'No description'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Academic Year</label>
                <p className="text-sm font-medium">{structure.academicYear?.year}</p>
              </div>
              {structure.term && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Term</label>
                  <p className="text-sm font-medium">{structure.term?.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Key Details Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4 px-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            {structure.classLevel && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Class Level</label>
                <p className="text-sm font-medium">{structure.classLevel}</p>
              </div>
            )}
            {structure.boardingStatus && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Boarding Status</label>
                <Badge variant={structure.boardingStatus === 'BOARDING' ? 'default' : 'secondary'}>
                  {structure.boardingStatus}
                </Badge>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Currency</label>
              <p className="text-sm font-medium">{structure.currency}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
              <Badge variant={structure.isActive ? 'default' : 'destructive'}>
                {structure.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          {/* Fee Items Table */}
          <Card className="print:border-0 print:shadow-none">
            <CardHeader className="print:pb-2">
              <CardTitle className="text-lg">Fee Items</CardTitle>
              <CardDescription>
                Total of {structure.items?.length || 0} items
              </CardDescription>
            </CardHeader>
            <CardContent className="print:p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="print:border-t print:border-gray-400">
                      <TableHead className="print:px-2 print:py-1">Item</TableHead>
                      <TableHead className="print:px-2 print:py-1">Category</TableHead>
                      <TableHead className="text-right print:px-2 print:py-1">Amount</TableHead>
                      <TableHead className="text-center print:px-2 print:py-1">Type</TableHead>
                      <TableHead className="print:px-2 print:py-1">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {structure.items?.map((item: any, idx: number) => (
                      <TableRow
                        key={item.id}
                        className={idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50 dark:bg-slate-900 print:bg-transparent'}
                      >
                        <TableCell className="font-medium print:px-2 print:py-1">{item.name}</TableCell>
                        <TableCell className="text-sm print:px-2 print:py-1">{item.category}</TableCell>
                        <TableCell className="text-right font-semibold print:px-2 print:py-1">
                          {formatCurrency(Number(item.amount))}
                        </TableCell>
                        <TableCell className="text-center print:px-2 print:py-1">
                          <Badge variant={item.isOptional ? 'outline' : 'secondary'} className="text-xs">
                            {item.isOptional ? 'Optional' : 'Mandatory'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground print:px-2 print:py-1">
                          {item.description || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
            <Card className="bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase">Mandatory Total</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(mandatoryTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground">{structure.items?.filter((i: any) => !i.isOptional).length} items</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 dark:bg-amber-900 border-amber-200 dark:border-amber-800">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase">Optional Total</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(optionalTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground">{structure.items?.filter((i: any) => i.isOptional).length} items</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase">Grand Total</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(totalAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground">All items</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t print:border-gray-300">
            <p>Active Invoices: {structure._count?.invoices || 0}</p>
            <p>Created: {formatDate(structure.createdAt)}</p>
            {structure.updatedAt && <p>Last Updated: {formatDate(structure.updatedAt)}</p>}
          </div>
        </div>

        {/* Print stylesheet */}
        <style>{`
          @media print {
            .print\\:hidden { display: none !important; }
            .print\\:block { display: block !important; }
            .print\\:grid { display: grid !important; }
            .print\\:max-h-none { max-height: none !important; }
            .print\\:overflow-visible { overflow: visible !important; }
            body { margin: 0; padding: 20px; }
            .dialog { margin: 0; padding: 0; }
            table { width: 100%; border-collapse: collapse; }
            td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
