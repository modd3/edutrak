// src/hooks/use-reports.ts

import { useQuery } from '@tanstack/react-query';
import { assessmentApi } from '@/api/assessment-api';

/**
 * Generate student report card
 */
export function useStudentReport(studentId: string | undefined, termId: string | undefined) {
  return useQuery({
    queryKey: ['reports', 'student', studentId, termId],
    queryFn: () => assessmentApi.generateStudentReport(studentId!, termId!),
    enabled: !!studentId && !!termId,
    staleTime: 1000 * 60 * 5, // 5 minutes - reports are computation-heavy
  });
}

/**
 * Generate class performance report
 */
export function useClassReport(classId: string | undefined, termId: string | undefined) {
  return useQuery({
    queryKey: ['reports', 'class', classId, termId],
    queryFn: () => assessmentApi.generateClassReport(classId!, termId!),
    enabled: !!classId && !!termId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
