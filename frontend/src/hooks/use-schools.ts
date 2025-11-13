import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolService, SchoolFilters, CreateSchoolDto, UpdateSchoolDto } from '@/services/school.service';

// Query Keys
export const schoolKeys = {
  all: ['schools'] as const,
  lists: () => [...schoolKeys.all, 'list'] as const,
  list: (filters: SchoolFilters) => [...schoolKeys.lists(), filters] as const,
  details: () => [...schoolKeys.all, 'detail'] as const,
  detail: (id: string) => [...schoolKeys.details(), id] as const,
  statistics: () => [...schoolKeys.all, 'statistics'] as const,
};

// Get all schools
export function useSchools(filters?: SchoolFilters) {
  return useQuery({
    queryKey: schoolKeys.list(filters || {}),
    queryFn: () => schoolService.getAll(filters),
  });
}

// Get school by ID
export function useSchool(id: string) {
  return useQuery({
    queryKey: schoolKeys.detail(id),
    queryFn: () => schoolService.getById(id),
    enabled: !!id,
  });
}

// Get school statistics
export function useSchoolStatistics(schoolId?: string) {
  return useQuery({
    queryKey: [...schoolKeys.statistics(), schoolId],
    queryFn: () => schoolService.getStatistics(schoolId),
  });
}

// Create school
export function useCreateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSchoolDto) => schoolService.create(data),
    onSuccess: () => {
      // Invalidate and refetch schools list
      queryClient.invalidateQueries({ queryKey: schoolKeys.lists() });
      queryClient.invalidateQueries({ queryKey: schoolKeys.statistics() });
    },
  });
}

// Update school
export function useUpdateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSchoolDto }) => 
      schoolService.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific school and the list
      queryClient.invalidateQueries({ queryKey: schoolKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: schoolKeys.lists() });
      queryClient.invalidateQueries({ queryKey: schoolKeys.statistics() });
    },
  });
}

// Delete school
export function useDeleteSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => schoolService.delete(id),
    onSuccess: () => {
      // Invalidate and refetch schools list
      queryClient.invalidateQueries({ queryKey: schoolKeys.lists() });
      queryClient.invalidateQueries({ queryKey: schoolKeys.statistics() });
    },
  });
}

// Check if registration number exists
export function useCheckRegistrationNo(registrationNo: string) {
  return useQuery({
    queryKey: ['check-registration', registrationNo],
    queryFn: () => schoolService.checkRegistrationNo(registrationNo),
    enabled: !!registrationNo && registrationNo.length > 0,
  });
}

// Check if KNEC code exists
export function useCheckKnecCode(knecCode: string) {
  return useQuery({
    queryKey: ['check-knec', knecCode],
    queryFn: () => schoolService.checkKnecCode(knecCode),
    enabled: !!knecCode && knecCode.length > 0,
  });
}

// Check if KEMIS code exists
export function useCheckKemisCode(kemisCode: string) {
  return useQuery({
    queryKey: ['check-kemis', kemisCode],
    queryFn: () => schoolService.checkKemisCode(kemisCode),
    enabled: !!kemisCode && kemisCode.length > 0,
  });
}

// Get schools by county
export function useSchoolsByCounty(county: string) {
  return useQuery({
    queryKey: ['schools', 'county', county],
    queryFn: () => schoolService.getByCounty(county),
    enabled: !!county,
  });
}

// Bulk import schools
export function useBulkImportSchools() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (schools: CreateSchoolDto[]) => schoolService.bulkImport(schools),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolKeys.lists() });
      queryClient.invalidateQueries({ queryKey: schoolKeys.statistics() });
    },
  });
}