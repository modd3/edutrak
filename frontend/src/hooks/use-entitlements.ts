import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';

export interface EntitlementFeature {
  enabled: boolean;
  limitType?: 'COUNT' | 'BOOLEAN' | string;
  limitValue?: number;
}

export interface EntitlementsResponse {
  unrestricted?: boolean;
  status?: string;
  planName?: string;
  planKey?: string;
  currentPeriodEnd?: string;
  features?: Record<string, EntitlementFeature>;
}

export function useEntitlements() {
  const query = useQuery<EntitlementsResponse>({
    queryKey: ['entitlements', 'me'],
    queryFn: async () => {
      const res = await api.get('/entitlements/me');
      return res.data?.data || {};
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const isUnrestricted = !!query.data?.unrestricted;
  const features = query.data?.features || {};

  const hasFeature = (featureKey: string): boolean => {
    if (isUnrestricted) return true;
    const feat = features[featureKey];
    return feat ? !!feat.enabled : false;
  };

  const getFeatureLimit = (featureKey: string): number | undefined => {
    if (isUnrestricted) return undefined;
    return features[featureKey]?.limitValue;
  };

  return {
    ...query,
    entitlements: query.data,
    isUnrestricted,
    hasFeature,
    getFeatureLimit,
  };
}
