import type { BillingInvoice } from '@/types';

interface BillingInvoiceTableProps {
  invoices: BillingInvoice[];
  currency?: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatAmount(invoice: BillingInvoice, currency?: string) {
  const curr = invoice.currency || currency || 'KES';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: curr,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(invoice.totalMinor / 100);
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    PAID: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Paid' },
    OPEN: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Open' },
    OVERDUE: { bg: 'bg-red-100', text: 'text-red-700', label: 'Overdue' },
    DRAFT: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Draft' },
    CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Cancelled' },
    VOID: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Void' },
    UNCOLLECTIBLE: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Uncollectible' },
  };
  const cfg = config[status] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status };
  return (
    <span className={`inline-flex items-center gap-1 ${cfg.bg} ${cfg.text} text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wider`}>
      {status === 'PAID' ? '✓' : ''} {cfg.label}
    </span>
  );
}

export function BillingInvoiceTable({ invoices, currency }: BillingInvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e8edf5] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="m-0 text-base font-semibold text-[#1e1b4b]">Billing History</h3>
            <p className="m-0 text-[13px] text-muted-foreground mt-0.5">No invoices yet</p>
          </div>
        </div>
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          No invoices to display.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e8edf5] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="m-0 text-base font-semibold text-[#1e1b4b]">Billing History</h3>
          <p className="m-0 text-[13px] text-muted-foreground mt-0.5">Last {invoices.length} invoices</p>
        </div>
        <button className="text-[13px] text-indigo-600 font-semibold bg-transparent border-none cursor-pointer hover:text-indigo-700 transition-colors">
          View all →
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {['Invoice', 'Date', 'Amount', 'Status', ''].map(h => (
                <th
                  key={h}
                  className="px-6 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr
                key={inv.id}
                className="border-t border-slate-100"
                style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafbff' }}
              >
                <td className="px-6 py-3.5 text-[13px] font-semibold text-slate-700">
                  {inv.invoiceNumber}
                </td>
                <td className="px-6 py-3.5 text-[13px] text-slate-500">
                  {formatDate(inv.issuedAt || inv.createdAt)}
                </td>
                <td className="px-6 py-3.5 text-[13px] font-semibold text-[#1e1b4b]">
                  {formatAmount(inv, currency)}
                </td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={inv.status} />
                </td>
                <td className="px-6 py-3.5">
                  <button className="text-xs text-indigo-600 font-semibold bg-transparent border-none cursor-pointer hover:text-indigo-700 transition-colors">
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}