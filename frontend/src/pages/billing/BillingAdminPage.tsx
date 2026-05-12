import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function BillingAdminPage() {
  const token = useAuthStore((s) => s.token);
  const [schoolId, setSchoolId] = useState('');
  const [legalName, setLegalName] = useState('');
  const [subscriptionId, setSubscriptionId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [subtotalMinor, setSubtotalMinor] = useState(0);
  const [result, setResult] = useState<string>('');

  const baseUrl = import.meta.env.VITE_API_URL;

  const upsertBillingAccount = async () => {
    const res = await fetch(`${baseUrl}/billing-accounts`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ schoolId, legalName }),
    });
    const json = await res.json();
    setResult(JSON.stringify(json, null, 2));
  };

  const createInvoice = async () => {
    const res = await fetch(`${baseUrl}/billing/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        schoolId,
        subscriptionId,
        invoiceNumber,
        subtotalMinor: Number(subtotalMinor),
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    const json = await res.json();
    setResult(JSON.stringify(json, null, 2));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Billing Admin Console</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="School ID" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} />
          <Input placeholder="Legal Name" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
          <Button onClick={upsertBillingAccount}>Save Billing Account</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Billing Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Subscription ID" value={subscriptionId} onChange={(e) => setSubscriptionId(e.target.value)} />
          <Input placeholder="Invoice Number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
          <Input type="number" placeholder="Subtotal Minor" value={subtotalMinor} onChange={(e) => setSubtotalMinor(Number(e.target.value))} />
          <Button onClick={createInvoice}>Create Invoice</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Result</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto">{result || 'No actions yet.'}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
