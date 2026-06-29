import { useState } from 'react';
import { useGetPaymentProviders, useConfigurePaymentProvider, useUpdatePaymentProvider, useDeletePaymentProvider } from '@/hooks/use-fees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Trash2, Pencil, ShieldCheck, Smartphone, Globe } from 'lucide-react';
import { toast } from 'sonner';

const PROVIDER_META: Record<string, { label: string; icon: React.ElementType; description: string; fields: { apiKeyLabel: string; secretKeyLabel: string } }> = {
  MPESA: {
    label: 'M-Pesa (Daraja)',
    icon: Smartphone,
    description: 'Safaricom M-Pesa STK Push via Daraja API',
    fields: { apiKeyLabel: 'Consumer Key', secretKeyLabel: 'Consumer Secret' },
  },
  FLUTTERWAVE: {
    label: 'Flutterwave',
    icon: Globe,
    description: 'Card & mobile money payments via Flutterwave',
    fields: { apiKeyLabel: 'Public Key', secretKeyLabel: 'Secret Key' },
  },
};

const emptyForm = { provider: 'MPESA' as string, apiKey: '', secretKey: '', callbackUrl: '', webhookSecret: '', isActive: true };

export function ProviderConfig() {
  const { data, isLoading } = useGetPaymentProviders();
  const configure = useConfigurePaymentProvider();
  const update = useUpdatePaymentProvider();
  const remove = useDeletePaymentProvider();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const providers: any[] = data?.data?.data || data?.data || [];
  const meta = PROVIDER_META[form.provider] ?? PROVIDER_META.MPESA;

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (p: any) => {
    setForm({ provider: p.provider, apiKey: '', secretKey: '', callbackUrl: p.callbackUrl || '', webhookSecret: '', isActive: p.isActive });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.apiKey && !editId) { toast.error('API key is required'); return; }
    if (!form.secretKey && !editId) { toast.error('Secret key is required'); return; }

    if (editId) {
      const patch: any = { callbackUrl: form.callbackUrl, isActive: form.isActive };
      if (form.apiKey) patch.apiKey = form.apiKey;
      if (form.secretKey) patch.secretKey = form.secretKey;
      if (form.webhookSecret) patch.webhookSecret = form.webhookSecret;
      update.mutate({ providerId: editId, data: patch }, { onSuccess: () => setShowForm(false) });
    } else {
      configure.mutate(
        { provider: form.provider as any, apiKey: form.apiKey, secretKey: form.secretKey, callbackUrl: form.callbackUrl || undefined, webhookSecret: form.webhookSecret || undefined },
        { onSuccess: () => setShowForm(false) }
      );
    }
  };

  const isPending = configure.isPending || update.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Configure payment gateways to enable online fee collection.
          </p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : providers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No payment providers configured</p>
            <p className="text-sm text-muted-foreground mt-1">Add a provider to enable online fee payments for your school.</p>
            <Button onClick={openAdd} className="mt-4" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {providers.map((p: any) => {
            const m = PROVIDER_META[p.provider];
            const Icon = m?.icon ?? Globe;
            return (
              <Card key={p.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{m?.label ?? p.provider}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">{m?.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={p.isActive ? 'default' : 'secondary'}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground space-y-1">
                    {p.callbackUrl && <p>Callback: <span className="font-mono">{p.callbackUrl}</span></p>}
                    <p>Added: {new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Update Provider' : 'Configure Payment Provider'}</DialogTitle>
            <DialogDescription>
              {editId ? 'Update credentials or settings. Leave key fields blank to keep existing values.' : 'Add a new payment gateway for online fee collection.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {!editId && (
              <div className="space-y-1.5">
                <Label>Provider</Label>
                <Select value={form.provider} onValueChange={v => setForm({ ...form, provider: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROVIDER_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>{meta.fields.apiKeyLabel}{editId && <span className="text-muted-foreground text-xs ml-1">(leave blank to keep)</span>}</Label>
              <Input
                value={form.apiKey}
                onChange={e => setForm({ ...form, apiKey: e.target.value })}
                placeholder={editId ? '••••••••' : 'Enter key'}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{meta.fields.secretKeyLabel}{editId && <span className="text-muted-foreground text-xs ml-1">(leave blank to keep)</span>}</Label>
              <Input
                type="password"
                value={form.secretKey}
                onChange={e => setForm({ ...form, secretKey: e.target.value })}
                placeholder={editId ? '••••••••' : 'Enter secret'}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Callback URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                value={form.callbackUrl}
                onChange={e => setForm({ ...form, callbackUrl: e.target.value })}
                placeholder="https://your-domain.com/webhooks/..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>Webhook Secret <span className="text-muted-foreground text-xs">(optional — used to verify incoming webhooks)</span></Label>
              <Input
                value={form.webhookSecret}
                onChange={e => setForm({ ...form, webhookSecret: e.target.value })}
                placeholder="Shared secret from provider dashboard"
              />
            </div>

            {editId && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Enable or disable this provider</p>
                </div>
                <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editId ? 'Update' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Provider</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the provider configuration. Online payments using this provider will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { remove.mutate(deleteId!); setDeleteId(null); }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
