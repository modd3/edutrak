import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth-store';
import { useSchoolContext } from '@/hooks/use-school-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Loader2, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useSchools } from '@/hooks/use-schools';
import { CreateBillingAccountModal } from '@/components/billing/createBillingAccountModal';

// Validation schemas
const billingAccountSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  legalName: z.string().min(2, 'Legal name is required'),
  email: z.string().email("Please provide an Email!").optional(),
  Phone: z.string().min(2, 'Enter phone number').optional(),
  TaxId: z.string().min(2, 'Enter Tax ID').optional(),
  country: z.string().min(2, 'Enter a country Name').optional().default("Kenya"),
  city: z.string().min(2, 'Enter a city name').optional(),
  AddressLine1: z.string().min(2, 'Please Enter an Address').optional(),
  AddressLine2: z.string().min(2, 'Please Enter an Address').optional(),
  prefferedCurrency: z.string().min(2, 'Enter a preffered currency').optional().default("KES"),
});

const invoiceSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  subtotalMinor: z.number().min(0, 'Amount must be positive'),
});

type BillingAccountInput = z.infer<typeof billingAccountSchema>;
type InvoiceInput = z.infer<typeof invoiceSchema>;

export default function BillingAdminPage() {
  const { schoolId: contextSchoolId } = useSchoolContext();
  console.log("context ID: ", contextSchoolId)
  const token = useAuthStore((s) => s.token);
  const baseUrl = import.meta.env.VITE_API_URL;
  const schools = useSchools();
  console.log("schools: ", schools)

  const [activeTab, setActiveTab] = useState('accounts');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateBillingAccountModal, setShowCreateBillingAccountModal] = useState(false);
  const [apiResult, setApiResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  // Billing Account Form
  const accountForm = useForm<BillingAccountInput>({
    resolver: zodResolver(billingAccountSchema),
    defaultValues: {
      schoolId: contextSchoolId || '',
      legalName: '',
    },
  });

  // Invoice Form
  const invoiceForm = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      subscriptionId: '',
      invoiceNumber: '',
      subtotalMinor: 0,
    },
  });

  const handleSaveBillingAccount = async (data: BillingAccountInput) => {
    setIsLoading(true);
    setApiResult(null);
    try {
      const res = await fetch(`${baseUrl}/billing-accounts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (res.ok) {
        setApiResult({ success: true, message: 'Billing account saved successfully', data: json.data });
        toast.success('Billing account saved');
        accountForm.reset();
      } else {
        setApiResult({ success: false, message: json.error || 'Failed to save billing account', data: json });
        toast.error(json.error || 'Failed to save billing account');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      setApiResult({ success: false, message });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvoice = async (data: InvoiceInput) => {
    setIsLoading(true);
    setApiResult(null);
    try {
      const res = await fetch(`${baseUrl}/billing/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          subtotalMinor: Number(data.subtotalMinor),
          dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setApiResult({ success: true, message: 'Invoice created successfully', data: json.data });
        toast.success('Invoice created');
        invoiceForm.reset();
      } else {
        setApiResult({ success: false, message: json.error || 'Failed to create invoice', data: json });
        toast.error(json.error || 'Failed to create invoice');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      setApiResult({ success: false, message });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing Administration</h1>
          <p className="text-gray-600">Manage billing accounts and invoices</p>
        </div>
        <Button onClick={() => setShowCreateBillingAccountModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Billing Account
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts">Billing Accounts</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        {/* Billing Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Register Billing Account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={accountForm.handleSubmit(handleSaveBillingAccount)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">School ID</label>
                  <Input
                    placeholder="e.g., school-123"
                    {...accountForm.register('schoolId')}
                    disabled={isLoading}
                  />
                  {accountForm.formState.errors.schoolId && (
                    <p className="text-red-600 text-sm mt-1">{accountForm.formState.errors.schoolId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Legal Name</label>
                  <Input
                    placeholder="e.g., St. Mary's Secondary School"
                    {...accountForm.register('legalName')}
                    disabled={isLoading}
                  />
                  {accountForm.formState.errors.legalName && (
                    <p className="text-red-600 text-sm mt-1">{accountForm.formState.errors.legalName.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Billing Account'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={invoiceForm.handleSubmit(handleCreateInvoice)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Subscription ID</label>
                  <Input
                    placeholder="e.g., sub-456"
                    {...invoiceForm.register('subscriptionId')}
                    disabled={isLoading}
                  />
                  {invoiceForm.formState.errors.subscriptionId && (
                    <p className="text-red-600 text-sm mt-1">{invoiceForm.formState.errors.subscriptionId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Invoice Number</label>
                  <Input
                    placeholder="e.g., INV-2024-001"
                    {...invoiceForm.register('invoiceNumber')}
                    disabled={isLoading}
                  />
                  {invoiceForm.formState.errors.invoiceNumber && (
                    <p className="text-red-600 text-sm mt-1">{invoiceForm.formState.errors.invoiceNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Amount (Minor Currency Units)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 50000 (500.00)"
                    {...invoiceForm.register('subtotalMinor', { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                  {invoiceForm.formState.errors.subtotalMinor && (
                    <p className="text-red-600 text-sm mt-1">{invoiceForm.formState.errors.subtotalMinor.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Amount in minor currency units (e.g., cents for USD)</p>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Invoice'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* API Response Display */}
      {apiResult && (
        <Alert variant={apiResult.success ? 'default' : 'destructive'}>
          <div className="flex gap-2">
            {apiResult.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <div className="flex-1">
              <AlertDescription>{apiResult.message}</AlertDescription>
              {apiResult.data && (
                <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                  {JSON.stringify(apiResult.data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </Alert>
      )}
      {/* Modals */}
            <CreateBillingAccountModal
              open={showCreateBillingAccountModal}
              onOpenChange={setShowCreateBillingAccountModal}
              isLoading={isLoading}
            />
    </div>
    
  );
}
