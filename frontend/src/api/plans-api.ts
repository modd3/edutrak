import api from './index';
import {Plan, PlanFeature, PaginatedResponse, ApiResponse} from '@/types';

export interface PlansResponse {
  data: Plan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PlanFeatureInput {
  featureKey: string;
  enabled: boolean;
  limitType: 'BOOLEAN' | 'COUNT';
  limitValue?: number | null;
}

export type CreatePlanInput  = Partial<Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>>

export type UpdatePlanInput = Partial<Omit<CreatePlanInput, 'key'>>

export const plansApi = {
  list: (params?: { page?: number; limit?: number; isActive?: boolean }) =>
    api.get<PaginatedResponse<Plan>>('/plans', { params }),
  
  getById: (id: string) => 
    api.get<ApiResponse<Plan>>(`/plans/${id}`),
  
  create: (data: CreatePlanInput) =>
    api.post<ApiResponse<Plan>>('/plans', data),
  
  update: (id: string, data: UpdatePlanInput) =>
    api.patch<ApiResponse<Plan>>(`/plans/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/plans/${id}`),
};
