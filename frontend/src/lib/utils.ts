import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  if (!date) return 'Not provided';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

export function formatCurrency(amount: number, currency: string = 'KES'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function amountInWords(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined || amount === 0) {
    return 'Zero Shillings Only';
  }

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Million', 'Billion'];

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) {
    return 'Zero Shillings Only';
  }

  const convertChunk = (num: number): string => {
    if (num === 0) return '';
    if (num < 20) return ones[num] + ' ';
    if (num < 100) return tens[Math.floor(num / 10)] + ' ' + ones[num % 10] + ' ';
    return ones[Math.floor(num / 100)] + ' Hundred ' + convertChunk(num % 100);
  };

  const convertGroup = (num: number): string => {
    if (num === 0) return '';
    const groups: string[] = [];
    let remaining = num;
    let scaleIndex = 0;

    while (remaining > 0) {
      const chunk = remaining % 1000;
      if (chunk > 0) {
        groups.unshift(convertChunk(chunk).trim() + (scaleIndex > 0 ? ' ' + scales[scaleIndex] : ''));
      }
      remaining = Math.floor(remaining / 1000);
      scaleIndex++;
    }

    return groups.join(' ') + ' ';
  };

  let result = '';
  if (integerPart > 0) {
    result += convertGroup(integerPart).trim() + ' Shillings';
  }

  if (decimalPart > 0) {
    result += ' and ' + convertGroup(decimalPart).trim() + ' Cents';
  }

  return result + ' Only';
}

export function invoiceStatusClass(status: string): string {
  switch (status.toUpperCase()) {
    case 'PAID':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'OPEN':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'OVERDUE':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'DRAFT':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}
