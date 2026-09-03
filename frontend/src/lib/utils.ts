import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  if (!date) return "Not provided";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

export function formatCurrency(
  amount: number,
  currency: string = "KES",
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function amountInWords(amount: number): string {
  if (
    isNaN(amount) ||
    amount === null ||
    amount === undefined ||
    amount === 0
  ) {
    return "Zero Shillings Only";
  }

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const scales = ["", "Thousand", "Million", "Billion"];

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) {
    return "Zero Shillings Only";
  }

  const convertChunk = (num: number): string => {
    if (num === 0) return "";
    if (num < 20) return ones[num] + " ";
    if (num < 100)
      return tens[Math.floor(num / 10)] + " " + ones[num % 10] + " ";
    return ones[Math.floor(num / 100)] + " Hundred " + convertChunk(num % 100);
  };

  const convertGroup = (num: number): string => {
    if (num === 0) return "";
    const groups: string[] = [];
    let remaining = num;
    let scaleIndex = 0;

    while (remaining > 0) {
      const chunk = remaining % 1000;
      if (chunk > 0) {
        groups.unshift(
          convertChunk(chunk).trim() +
            (scaleIndex > 0 ? " " + scales[scaleIndex] : ""),
        );
      }
      remaining = Math.floor(remaining / 1000);
      scaleIndex++;
    }

    return groups.join(" ") + " ";
  };

  let result = "";
  if (integerPart > 0) {
    result += convertGroup(integerPart).trim() + " Shillings";
  }

  if (decimalPart > 0) {
    result += " and " + convertGroup(decimalPart).trim() + " Cents";
  }

  return result + " Only";
}

export function invoiceStatusClass(status: string): string {
  switch (status.toUpperCase()) {
    case "PAID":
      return "bg-green-100 text-green-800 border-green-300";
    case "OPEN":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "OVERDUE":
      return "bg-red-100 text-red-800 border-red-300";
    case "CANCELLED":
      return "bg-gray-100 text-gray-800 border-gray-300";
    case "DRAFT":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

export function paymentStatusClass(status: string): string {
  return (
    PAYMENT_STATUS_META[(status || "").toUpperCase()]?.badge ??
    "bg-gray-100 text-gray-800 border-gray-300"
  );
}

export const PAYMENT_STATUS_META: Record<
  string,
  {
    label: string;
    badge: string;
    icon: "success" | "info" | "warning" | "danger" | "neutral";
  }
> = {
  PENDING: {
    label: "Pending",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
    icon: "info",
  },
  COMPLETED: {
    label: "Completed",
    badge: "bg-green-100 text-green-800 border-green-300",
    icon: "success",
  },
  FAILED: {
    label: "Failed",
    badge: "bg-red-100 text-red-800 border-red-300",
    icon: "danger",
  },
  REFUNDED: {
    label: "Refunded",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
    icon: "warning",
  },
  PARTIALLY_REFUNDED: {
    label: "Partially refunded",
    badge: "bg-orange-100 text-orange-800 border-orange-300",
    icon: "warning",
  },
};

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_META[(status || "").toUpperCase()]?.label ?? "Unknown";
}

export const INVOICE_STATUS_META: Record<
  string,
  {
    label: string;
    badge: string;
    icon: "success" | "info" | "warning" | "danger" | "neutral";
  }
> = {
  DRAFT: {
    label: "Draft",
    badge: "bg-gray-100 text-gray-800 border-gray-300",
    icon: "neutral",
  },
  OPEN: {
    label: "Open",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
    icon: "info",
  },
  PAID: {
    label: "Paid",
    badge: "bg-green-100 text-green-800 border-green-300",
    icon: "success",
  },
  OVERDUE: {
    label: "Overdue",
    badge: "bg-red-100 text-red-800 border-red-300",
    icon: "warning",
  },
  VOID: {
    label: "Void",
    badge: "bg-gray-100 text-gray-800 border-gray-300",
    icon: "neutral",
  },
  UNCOLLECTIBLE: {
    label: "Uncollectible",
    badge: "bg-gray-100 text-gray-800 border-gray-300",
    icon: "neutral",
  },
};

/**
 * Resolve the canonical display status for a billing invoice.
 *
 * Overdue is derived (a past-due, unpaid `OPEN` invoice) because the database
 * status enum never stores `OVERDUE` — it is a read-time calculation. This keeps
 * a single source of truth for invoice rendering across school-facing and
 * SUPER_ADMIN surfaces.
 */
export function invoiceStatusMeta(
  invoice:
    | {
        status: string;
        dueAt?: string;
        totalMinor?: number;
        amountPaidMinor?: number;
      }
    | undefined,
): (typeof INVOICE_STATUS_META)[string] {
  const status = (invoice?.status || "DRAFT").toUpperCase();
  if (status === "OPEN") {
    const remaining =
      (invoice?.totalMinor ?? 0) - (invoice?.amountPaidMinor ?? 0);
    if (
      remaining > 0 &&
      invoice?.dueAt &&
      new Date(invoice.dueAt) < new Date()
    ) {
      return INVOICE_STATUS_META.OVERDUE;
    }
  }
  return INVOICE_STATUS_META[status] ?? INVOICE_STATUS_META.DRAFT;
}

export function invoiceStatusLabel(
  invoice:
    | {
        status: string;
        dueAt?: string;
        totalMinor?: number;
        amountPaidMinor?: number;
      }
    | undefined,
): string {
  return invoiceStatusMeta(invoice).label;
}

export const SUBSCRIPTION_STATUS_META: Record<
  string,
  {
    label: string;
    badge: string;
    banner: string;
    icon: "success" | "info" | "warning" | "danger" | "neutral";
  }
> = {
  TRIALING: {
    label: "Trial",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
    banner: "bg-blue-50 border-blue-200",
    icon: "info",
  },
  ACTIVE: {
    label: "Active",
    badge: "bg-green-100 text-green-800 border-green-300",
    banner: "bg-green-50 border-green-200",
    icon: "success",
  },
  PAST_DUE: {
    label: "Past due",
    badge: "bg-orange-100 text-orange-800 border-orange-300",
    banner: "bg-orange-50 border-orange-200",
    icon: "warning",
  },
  GRACE: {
    label: "Grace period",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
    banner: "bg-yellow-50 border-yellow-200",
    icon: "warning",
  },
  SUSPENDED: {
    label: "Suspended",
    badge: "bg-red-100 text-red-800 border-red-300",
    banner: "bg-red-50 border-red-200",
    icon: "danger",
  },
  CANCELED: {
    label: "Canceled",
    badge: "bg-gray-100 text-gray-800 border-gray-300",
    banner: "bg-gray-50 border-gray-200",
    icon: "neutral",
  },
  EXPIRED: {
    label: "Expired",
    badge: "bg-gray-100 text-gray-800 border-gray-300",
    banner: "bg-gray-50 border-gray-200",
    icon: "neutral",
  },
};

export function getPlanFeatureLimit(
  plan:
    | { features?: Array<{ featureKey: string; limitValue?: number | null }> }
    | undefined,
  key: string,
  fallback: number,
): number {
  if (!plan?.features) return fallback;
  const feature = plan.features.find((f) => f.featureKey === key);
  const value = feature?.limitValue;
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

export function formatPlanPrice(
  minor: number,
  currency: string = "KES",
): string {
  if (isNaN(minor) || minor === null || minor === undefined) return "0.00";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

export function generateIdempotencyKey(namespace: string = "billing"): string {
  return `${namespace}:${crypto.randomUUID()}`;
}

export function intervalLabel(interval: string): string {
  return (
    { MONTHLY: "/mo", QUARTERLY: "/quarter", YEARLY: "/yr" }[interval] ?? ""
  );
}
