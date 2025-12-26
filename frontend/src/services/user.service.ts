// src/services/user.service.ts
import api from '@/api';
import { User } from '@/types';

export interface UserFilters {
  schoolId?: string;
  search?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}

export interface UserStatistics {
  total: number;
  students: number;
  teachers: number;
  admins: number;
  parents: number;
  supportStaff: number;
  active: number;
  inactive: number;
}

class UserService {
  async getAll(filters?: UserFilters) {
    const response = await api.get('/users', { params: filters });
    return response.data;
  }

  async getById(id: string) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }

  async getStatistics(): Promise<UserStatistics> {
    const response = await api.get('/users/stats/overview');
    return response.data.data;
  }

  async create(data: Partial<User>) {
    const response = await api.post('/users', data);
    return response.data;
  }

  async update(id: string, data: Partial<User>) {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  }

  async delete(id: string) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }

  async activate(id: string) {
    const response = await api.patch(`/users/${id}/activate`);
    return response.data;
  }

  async deactivate(id: string) {
    const response = await api.patch(`/users/${id}/deactivate`);
    return response.data;
  }

  async changePassword(id: string, data: { currentPassword: string; newPassword: string }) {
    const response = await api.patch(`/users/${id}/change-password`, data);
    return response.data;
  }
}

export const userService = new UserService();