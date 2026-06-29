import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProviderConfig } from '@/components/fees/ProviderConfig';
import { LateFeesConfig } from '@/components/fees/LateFeesConfig';
import { Wallet, Clock } from 'lucide-react';

export function ProvidersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payment Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage payment gateways and configure late-fee policies.
        </p>
      </div>

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers" className="gap-2">
            <Wallet className="h-4 w-4" />
            Payment Providers
          </TabsTrigger>
          <TabsTrigger value="late-fees" className="gap-2">
            <Clock className="h-4 w-4" />
            Late Fees
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="mt-6">
          <ProviderConfig />
        </TabsContent>

        <TabsContent value="late-fees" className="mt-6">
          <LateFeesConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
