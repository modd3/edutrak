/**
 * Fee Structure Viewer Modal
 * Print-ready view of a fee structure with school header, itemised table, and totals.
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Printer, Download, CheckCircle2, XCircle } from 'lucide-react';
import { useGetFeeStructureById } from '@/hooks/use-fees';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

interface FeeStructureViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  structureId: string;
}

// ─── School header (mirrors the one in ProfessionalInvoiceViewer) ────────────
function SchoolHeader({ school }: { school: any }) {
  return (
    <div className="flex items-start gap-4 pb-4 border-b-2 border-gray-800">
      <div className="w-16 h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center bg-gray-50 shrink-0 text-xs text-gray-400 font-bold text-center leading-tight">
        LOGO
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-extrabold uppercase tracking-wide text-gray-900">
          {school?.name ?? 'School Name'}
        </h1>
        {school?.address && (
          <p className="text-xs text-gray-600 mt-0.5">{school.address}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-0 mt-0.5 text-xs text-gray-600">
          {school?.phone    && <span>Tel: {school.phone}</span>}
          {school?.email    && <span>Email: {school.email}</span>}
          {school?.county   && <span>{school.county} County</span>}
          {school?.knecCode && <span>KNEC: {school.knecCode}</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-2xl font-black uppercase tracking-widest text-gray-800">FEE STRUCTURE</p>
        <p className="text-xs text-gray-500 mt-0.5">School Management System</p>
      </div>
    </div>
  );
}

// ─── Structure body ───────────────────────────────────────────────────────────
function StructureBody({ structure }: { structure: any }) {
  const totalAmount = (structure.items ?? []).reduce(
    (s: number, i: any) => s + Number(i.amount), 0
  );
  const mandatoryTotal = (structure.items ?? [])
    .filter((i: any) => !i.isOptional)
    .reduce((s: number, i: any) => s + Number(i.amount), 0);
  const optionalTotal = totalAmount - mandatoryTotal;
  const mandatoryItems = (structure.items ?? []).filter((i: any) => !i.isOptional);
  const optionalItems  = (structure.items ?? []).filter((i: any) =>  i.isOptional);

  return (
    <div className="space-y-5 mt-4">
      {/* Structure meta */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase text-gray-500">Name</p>
          <p className="font-semibold text-sm">{structure.name}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-gray-500">Academic Year</p>
          <p className="text-sm font-medium">{structure.academicYear?.year ?? '—'}</p>
        </div>
        {structure.classLevel && (
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-500">Class Level</p>
            <p className="text-sm font-medium">{structure.classLevel}</p>
          </div>
        )}
        {structure.boardingStatus && (
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-500">Boarding</p>
            <Badge
              variant={structure.boardingStatus === 'BOARDING' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {structure.boardingStatus}
            </Badge>
          </div>
        )}
        <div>
          <p className="text-[10px] font-semibold uppercase text-gray-500">Status</p>
          <Badge variant={structure.isActive ? 'default' : 'destructive'} className="text-xs">
            {structure.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        {structure.currency && (
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-500">Currency</p>
            <p className="text-sm font-medium">{structure.currency}</p>
          </div>
        )}
        {structure.term && (
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-500">Term</p>
            <p className="text-sm font-medium">{structure.term.name}</p>
          </div>
        )}
        {structure.description && (
          <div className="col-span-2">
            <p className="text-[10px] font-semibold uppercase text-gray-500">Description</p>
            <p className="text-xs text-gray-600">{structure.description}</p>
          </div>
        )}
      </div>

      {/* Mandatory items */}
      {mandatoryItems.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-indigo-500" />
            Mandatory Fees ({mandatoryItems.length})
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-y border-gray-300 bg-indigo-50">
                <th className="text-left py-1.5 px-2 font-semibold text-xs">Description</th>
                <th className="text-left py-1.5 px-2 font-semibold text-xs">Category</th>
                <th className="text-right py-1.5 px-2 font-semibold text-xs">Amount</th>
              </tr>
            </thead>
            <tbody>
              {mandatoryItems.map((item: any, idx: number) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-1 px-2">{item.name}</td>
                  <td className="py-1 px-2 text-xs text-gray-500">{item.category}</td>
                  <td className="py-1 px-2 text-right font-medium">{formatCurrency(Number(item.amount))}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-indigo-300 font-bold bg-indigo-50">
                <td className="py-1.5 px-2 text-indigo-800" colSpan={2}>Mandatory Sub-total</td>
                <td className="py-1.5 px-2 text-right text-indigo-800">{formatCurrency(mandatoryTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Optional items */}
      {optionalItems.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
            <XCircle className="h-3 w-3 text-amber-500" />
            Optional Fees ({optionalItems.length})
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-y border-gray-300 bg-amber-50">
                <th className="text-left py-1.5 px-2 font-semibold text-xs">Description</th>
                <th className="text-left py-1.5 px-2 font-semibold text-xs">Category</th>
                <th className="text-right py-1.5 px-2 font-semibold text-xs">Amount</th>
              </tr>
            </thead>
            <tbody>
              {optionalItems.map((item: any, idx: number) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-1 px-2">{item.name}</td>
                  <td className="py-1 px-2 text-xs text-gray-500">{item.category}</td>
                  <td className="py-1 px-2 text-right font-medium">{formatCurrency(Number(item.amount))}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-amber-300 font-bold bg-amber-50">
                <td className="py-1.5 px-2 text-amber-800" colSpan={2}>Optional Sub-total</td>
                <td className="py-1.5 px-2 text-right text-amber-800">{formatCurrency(optionalTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Grand total */}
      <div className="flex justify-end">
        <div className="w-72 border-2 border-gray-800 rounded-lg overflow-hidden">
          <div className="flex justify-between px-4 py-2 bg-gray-800 text-white font-bold text-sm">
            <span>GRAND TOTAL</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between px-4 py-1.5 text-xs text-gray-600">
            <span>Mandatory</span>
            <span>{formatCurrency(mandatoryTotal)}</span>
          </div>
          {optionalTotal > 0 && (
            <div className="flex justify-between px-4 py-1.5 text-xs text-gray-600 border-t">
              <span>Optional</span>
              <span>{formatCurrency(optionalTotal)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="text-xs text-gray-500 border-t pt-3 space-y-0.5">
        <p>Invoice count: {structure._count?.invoices ?? 0}</p>
        <p>Created: {formatDate(structure.createdAt)}</p>
        {structure.updatedAt && <p>Last Updated: {formatDate(structure.updatedAt)}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function FeeStructureViewerModal({
  open,
  onOpenChange,
  structureId,
}: FeeStructureViewerModalProps) {
  const { data: structureData, isLoading } = useGetFeeStructureById(structureId);
  const [isPrinting, setIsPrinting] = useState(false);
  const user = useAuthStore((s) => s.user);
  const school = user?.school;

  const structure = structureData?.data?.data ?? structureData?.data;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><Skeleton className="h-6 w-40" /></DialogHeader>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
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

  return (
    <>
      {/* ── Screen dialog ─────────────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto print:hidden">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DialogTitle>Fee Structure — {structure.name}</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={isPrinting}>
                <Printer className="h-4 w-4 mr-1.5" />
                Print
              </Button>
              <Button variant="outline" size="sm" disabled title="PDF download coming soon">
                <Download className="h-4 w-4 mr-1.5" />
                PDF
              </Button>
            </div>
          </DialogHeader>

          <div className="mt-2 border rounded-xl p-6 bg-white dark:bg-background">
            <SchoolHeader school={school} />
            <StructureBody structure={structure} />
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Printable document ────────────────────────────────────────────── */}
      <div className="hidden print:block" id="structure-print-root">
        <SchoolHeader school={school} />
        <StructureBody structure={structure} />
        <div className="structure-footer">
          <p>Printed: {formatDate(new Date())} | EduTrak School Management System</p>
          <p>This is an official fee schedule. Please retain for your records.</p>
        </div>
      </div>

      {/* ── Print CSS ─────────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #structure-print-root { display: block !important; }

          @page { size: A4; margin: 14mm 16mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #111; }

          table { width: 100%; border-collapse: collapse; }
          td, th { text-align: left; }

          .structure-footer {
            margin-top: 8mm;
            font-size: 9px;
            color: #777;
            border-top: 1px solid #ddd;
            padding-top: 4px;
          }
          .hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
        @media screen {
          #structure-print-root { display: none; }
        }
      `}</style>
    </>
  );
}
