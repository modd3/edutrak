import api from './client';
import { ApiResponse, PaginatedResponse, BillingAccount } from '@/types';

export interface CreateBillingAccountInput {
  legalName: string;
  email?: string;
  phone?: string;
  taxId?: string;
  country?: string;
  city?: string;
  addressLine1: string;
  addressLine2?: string;
  prefferedCurrency?: string;
}

export const billingAccountsApi = {
  /**
   * Create a new subscription
   */
  create: (data: CreateBillingAccountInput) =>
    api.put<ApiResponse<BillingAccount>>('/billing-accounts', data),

  /**
   * Get list of billing accounts with filters
   */
  list: (params?: {
    schoolId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<PaginatedResponse<BillingAccount[]>>('/billing-accounts', { params }),

  /**
   * Get a single billing account by ID
   */
  getBySchool: (schoolId: string) =>
    api.get<ApiResponse<BillingAccount>>(`/billing-accounts/${schoolId}`),
};
