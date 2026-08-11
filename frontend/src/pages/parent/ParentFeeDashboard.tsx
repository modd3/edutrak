import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Download,
  Eye
} from 'lucide-react';
import { ParentPaymentModal } from '@/components/fees/ParentPaymentModal';

interface FeeInvoice {
  id: string;
  invoiceNo: string;
  studentName: string;
  className: string;
  totalAmount: number;
  balanceAmount: number;
  paidAmount: number;
  dueDate: string;
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'WAIVED';
  items: Array<{
    name: string;
    category: string;
    amount: number;
  }>;
}

// Mock data - in real app this would come from API
const mockInvoices: FeeInvoice[] = [
  {
    id: '1',
    invoiceNo: 'INV-2024-001',
    studentName: 'Sarah Wanjiku',
    className: 'Grade 7A',
    totalAmount: 45000,
    balanceAmount: 45000,
    paidAmount: 0,
    dueDate: '2024-09-15',
    status: 'UNPAID',
    items: [
      { name: 'Tuition Fee', category: 'TUITION', amount: 25000 },
      { name: 'Lunch Program', category: 'LUNCH', amount: 12000 },
      { name: 'Activity Fee', category: 'ACTIVITY', amount: 5000 },
      { name: 'Library Fee', category: 'LIBRARY', amount: 3000 },
    ]
  },
  {
    id: '2',
    invoiceNo: 'INV-2024-002',
    studentName: 'John Kamau',
    className: 'Grade 5B',
    totalAmount: 38000,
    balanceAmount: 18000,
    paidAmount: 20000,
    dueDate: '2024-08-30',
    status: 'PARTIAL',
    items: [
      { name: 'Tuition Fee', category: 'TUITION', amount: 22000 },
      { name: 'Transport Fee', category: 'TRANSPORT', amount: 8000 },
      { name: 'Uniform Fee', category: 'UNIFORM', amount: 8000 },
    ]
  },
  {
    id: '3',
    invoiceNo: 'INV-2024-003',
    studentName: 'Mary Achieng',
    className: 'Grade 8A',
    totalAmount: 42000,
    balanceAmount: 0,
    paidAmount: 42000,
    dueDate: '2024-07-20',
    status: 'PAID',
    items: [
      { name: 'Tuition Fee', category: 'TUITION', amount: 28000 },
      { name: 'Examination Fee', category: 'EXAM', amount: 7000 },
      { name: 'Development Fee', category: 'DEVELOPMENT', amount: 7000 },
    ]
  }
];

export function ParentFeeDashboard() {
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoice | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  const getStatusBadge = (status: FeeInvoice['status'], dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status !== 'PAID';
    
    if (status === 'PAID') {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
    }
    if (status === 'PARTIAL') {
      return <Badge variant="secondary">Partially Paid</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    return <Badge variant="outline">Unpaid</Badge>;
  };

  const getStatusIcon = (status: FeeInvoice['status'], dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status !== 'PAID';
    
    if (status === 'PAID') {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    if (isOverdue) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    return <Clock className="h-4 w-4 text-amber-600" />;
  };

  const handlePayNow = (invoice: FeeInvoice) => {
    setSelectedInvoice(invoice);
    setPaymentModalOpen(true);
  };

  const totalOutstanding = mockInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
  const totalPaid = mockInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">School Fees</h1>
        <p className="text-gray-600">Manage and pay your children's school fees online</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Amount Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{mockInvoices.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Fee Invoices
          </CardTitle>
          <CardDescription>
            View and pay your children's school fees online
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockInvoices.map((invoice) => (
              <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Invoice Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(invoice.status, invoice.dueDate)}
                      <div>
                        <h3 className="font-semibold text-lg">{invoice.studentName}</h3>
                        <p className="text-sm text-gray-600">
                          {invoice.className} • Invoice #{invoice.invoiceNo}
                        </p>
                      </div>
                      {getStatusBadge(invoice.status, invoice.dueDate)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                      <div>
                        <p className="text-gray-500">Total Amount</p>
                        <p className="font-semibold">{formatCurrency(invoice.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Amount Paid</p>
                        <p className="font-semibold text-green-600">{formatCurrency(invoice.paidAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Balance</p>
                        <p className="font-semibold text-red-600">{formatCurrency(invoice.balanceAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Due Date</p>
                        <p className="font-semibold">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-col md:flex-row min-w-fit">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    {invoice.balanceAmount > 0 && invoice.status !== 'PAID' && (
                      <Button 
                        size="sm" 
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handlePayNow(invoice)}
                      >
                        <CreditCard className="h-4 w-4" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>

                {/* Fee Breakdown */}
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2 text-gray-700">Fee Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {invoice.items.map((item, index) => (
                      <div key={index} className="text-xs">
                        <span className="text-gray-500">{item.name}:</span>
                        <span className="ml-1 font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {selectedInvoice && (
        <ParentPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
}