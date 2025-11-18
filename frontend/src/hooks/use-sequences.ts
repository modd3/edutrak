// hooks/use-sequences.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api.service';

export type SequenceType = 
  | 'ADMISSION_NUMBER' 
  | 'EMPLOYEE_NUMBER' 
  | 'RECEIPT_NUMBER' 
  | 'INVOICE_NUMBER'
  | 'ASSESSMENT_NUMBER'
  | 'CLASS_CODE';

/**
 * Preview what the next sequence number will be
 * without actually generating it
 */
export function usePreviewSequence(
  type: SequenceType,
  schoolId?: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['sequence-preview', type, schoolId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (schoolId) params.append('schoolId', schoolId);
      
      const response = await api.get(`/sequences/${type}/preview?${params}`);
      return response.data;
    },
    enabled: options?.enabled !== false,
    refetchInterval: false, // Don't auto-refetch
    staleTime: 30000, // Consider stale after 30 seconds
  });
}

/**
 * Get current value of a sequence
 */
export function useCurrentSequenceValue(type: SequenceType, schoolId?: string) {
  return useQuery({
    queryKey: ['sequence-current', type, schoolId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (schoolId) params.append('schoolId', schoolId);
      
      const response = await api.get(`/sequences/${type}/current?${params}`);
      return response.data;
    },
  });
}

/**
 * Get sequence statistics
 */
export function useSequenceStats(type: SequenceType, schoolId?: string) {
  return useQuery({
    queryKey: ['sequence-stats', type, schoolId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (schoolId) params.append('schoolId', schoolId);
      
      const response = await api.get(`/sequences/${type}/stats?${params}`);
      return response.data;
    },
  });
}