import { useState, useEffect } from 'react';
import type { FeatureRegistry } from '@/types';

// Maps raw featureKey ("fees.mpesa") → human label ("M-Pesa Integration")
export function useFeatureRegistry() {
  const [registry, setRegistry] = useState<FeatureRegistry>({});

  useEffect(() => {
    fetch('/api/v1/plans/features/registry', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(json => setRegistry(json.data ?? {}))
      .catch(() => {}); // registry is cosmetic — fall back to raw keys silently
  }, []);

  return registry;
}