import { useGetPaymentProviders, useConfigurePaymentProvider, useDeletePaymentProvider } from '@/hooks/use-fees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export function ProviderConfig() {
  const { data: providers, isLoading } = useGetPaymentProviders();
  const configureMutation = useConfigurePaymentProvider();
  const deleteMutation = useDeletePaymentProvider();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'MPESA' as 'MPESA' | 'FLUTTERWAVE' | 'STRIPE',
    apiKey: '',
    secretKey: '',
    callbackUrl: '',
    webhookSecret: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    configureMutation.mutate(formData, {
      onSuccess: () => {
        setShowForm(false);
        setFormData({ provider: 'MPESA', apiKey: '', secretKey: '', callbackUrl: '', webhookSecret: '' });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payment Providers</h3>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Payment Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Provider</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="MPESA">M-Pesa (Daraja)</option>
                  <option value="FLUTTERWAVE">Flutterwave</option>
                  <option value="STRIPE">Stripe</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Secret Key</label>
                <input
                  type="password"
                  value={formData.secretKey}
                  onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Callback URL (optional)</label>
                <input
                  type="url"
                  value={formData.callbackUrl}
                  onChange={(e) => setFormData({ ...formData, callbackUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Webhook Secret (optional)</label>
                <input
                  type="text"
                  value={formData.webhookSecret}
                  onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={configureMutation.isPending}>
                  {configureMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Configuration
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {providers?.data?.map((provider: any) => (
          <Card key={provider.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{provider.provider}</h4>
                  <p className="text-sm text-gray-600">API Key: {provider.apiKey?.substring(0, 8)}...</p>
                  <p className="text-sm text-gray-600">Status: {provider.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(provider.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!providers?.data || providers.data.length === 0) && (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No payment providers configured. Add one to enable online payments.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
