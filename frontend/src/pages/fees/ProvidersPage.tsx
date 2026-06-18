import { ProviderConfig } from '@/components/fees/ProviderConfig';

export function ProvidersPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Payment Providers</h1>
      <ProviderConfig />
    </div>
  );
}
