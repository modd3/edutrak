import { useQuery } from '@tanstack/react-query';
import { auditApi, AuditLog, AuditLogFilters } from '@/api/audit-api';
import {
  GraduationCap,
  UserCog,
  Users,
  School,
  Home,
  ClipboardCheck,
  Trophy,
  Receipt,
  DollarSign,
  FileText,
  CreditCard,
  Calendar,
  BarChart3,
  Activity,
  type LucideIcon,
} from 'lucide-react';

// Map entityType to a Lucide icon
const entityIcons: Record<string, LucideIcon> = {
  Student: GraduationCap,
  Teacher: UserCog,
  User: Users,
  School: School,
  Class: Home,
  AssessmentDefinition: ClipboardCheck,
  AssessmentResult: Trophy,
  FeeInvoice: Receipt,
  FeePayment: DollarSign,
  FeeStructure: FileText,
  TenantSubscription: CreditCard,
  TimetableEntry: Calendar,
  Report: BarChart3,
};

const entityColors: Record<string, string> = {
  Student: 'bg-blue-500',
  Teacher: 'bg-green-500',
  User: 'bg-indigo-500',
  School: 'bg-purple-500',
  Class: 'bg-teal-500',
  AssessmentDefinition: 'bg-orange-500',
  AssessmentResult: 'bg-yellow-500',
  FeeInvoice: 'bg-pink-500',
  FeePayment: 'bg-emerald-500',
  FeeStructure: 'bg-cyan-500',
  TenantSubscription: 'bg-rose-500',
  TimetableEntry: 'bg-violet-500',
  Report: 'bg-gray-500',
};

const entityLinks: Record<string, string> = {
  Student: '/students',
  Teacher: '/teachers',
  User: '/users',
  School: '/schools',
  Class: '/classes',
  AssessmentDefinition: '/assessments',
  FeeInvoice: '/fees',
  FeePayment: '/fees',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export interface ActivityItem {
  id: string;
  icon: LucideIcon;
  color: string;
  title: string;
  description: string;
  time: string;
  link?: string;
}

/**
 * Convert raw audit logs from the API into ActivityItem[] for RecentActivities component
 */
export function formatAuditToActivity(logs: AuditLog[]): ActivityItem[] {
  return logs.map((log) => {
    const Icon = entityIcons[log.entityType] || Activity;
    const actorName = log.actor
      ? `${log.actor.firstName} ${log.actor.lastName}`
      : 'System';

    return {
      id: log.id,
      icon: Icon,
      color: entityColors[log.entityType] || 'bg-gray-500',
      title: log.entityName
        ? `${log.entityType}: ${log.entityName}`
        : `${log.entityType} ${log.action.toLowerCase()}d`,
      description: log.details || `${log.action} by ${actorName}`,
      time: timeAgo(log.createdAt),
      link: entityLinks[log.entityType],
    };
  });
}

/**
 * Hook to fetch recent audit logs for dashboard widgets
 */
export function useRecentAuditLogs(limit: number = 10) {
  return useQuery({
    queryKey: ['audit-logs', 'recent', limit],
    queryFn: async () => {
      const response = await auditApi.getRecent(limit);
      return response.data.data;
    },
  });
}

/**
 * Hook to fetch paginated audit logs (for audit trail page)
 */
export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const response = await auditApi.getPaginated(filters);
      return response.data.data;
    },
  });
}