import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Convert a number to KES words for receipt printing
 * e.g., 10500 → "Kenya Shillings Ten Thousand Five Hundred Only"
 */
export function amountInWords(amount: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
 
  function toWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + ' ' + toWords(n % 10);
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + toWords(n % 100);
    if (n < 1_000_000) return toWords(Math.floor(n / 1000)) + 'Thousand ' + toWords(n % 1000);
    return toWords(Math.floor(n / 1_000_000)) + 'Million ' + toWords(n % 1_000_000);
  }
 
  const result = toWords(Math.floor(Math.abs(amount))).trim();
  return `Kenya Shillings ${result} Only`.replace(/\s+/g, ' ');
}
 
/**
 * Map invoice/payment status to Tailwind badge classes
 */
export function invoiceStatusClass(status: string): string {
  const map: Record<string, string> = {
    PAID: 'bg-green-100 text-green-800 border-green-200',
    PARTIAL: 'bg-amber-100 text-amber-800 border-amber-200',
    UNPAID: 'bg-blue-100 text-blue-800 border-blue-200',
    PENDING: 'bg-blue-100 text-blue-800 border-blue-200',
    OVERDUE: 'bg-red-100 text-red-800 border-red-200',
    WAIVED: 'bg-purple-100 text-purple-800 border-purple-200',
    CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
    COMPLETED: 'bg-green-100 text-green-800 border-green-200',
    REVERSED: 'bg-red-100 text-red-800 border-red-200',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
}
