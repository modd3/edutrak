import { useState, useEffect } from 'react';
import type { FeatureRegistry } from '@/types';
import api from '@/api'
import { useQuery } from '@tanstack/react-query';

// Maps raw featureKey ("fees.mpesa") → human label ("M-Pesa Integration")
export function useFeatureRegistry() {
  return useQuery({
    queryKey: ['feature-registry'],
    queryFn: async ()=> {
      const response = await api.get<FeatureRegistry>('/plans/features/registry');
      return response.data;
    },
   });
}