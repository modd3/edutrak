import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetInvoiceById } from '@/hooks/use-fees';
import { PaymentRecordingModal } from './PaymentRecordingModal';
import { Calendar, DollarSign, User, FileText } from 'lucide-react';

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

interface InvoiceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
}

const STATUS_COLORS: Record<string, string> = {
  UNPAID: 'destructive',
  PARTIAL: 'secondary',
  PAID: 'success',
  OVERDUE: 'destructive',
  CANCELLED: 'outline',
  WAIVED: 'outline',
};

const STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Unpaid',
  PARTIAL: 'Partially Paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
  WAIVED: 'Waived',
};

export function InvoiceDetailsModal({
  open,
  onOpenChange,
  invoiceId,
}: InvoiceDetailsModalProps) {
  const { data: invoiceData, isLoading } = useGetInvoiceById(invoiceId);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const invoice = invoiceData?.data?.data
  
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Loading invoice...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!invoice) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-40">
            <p className="text-red-500">Invoice not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const balance = invoice.totalAmount - invoice.paidAmount - invoice.discountAmount;
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && balance > 0;

  return (
    <>
      <Dialog open={open && !showPaymentModal} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setShowPaymentModal(false);
        }
        onOpenChange(isOpen);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex justify-between items-start gap-4">
              <div>
                <DialogTitle>Invoice Details</DialogTitle>
                <DialogDescription>
                  Invoice {invoice.invoiceNo}
                </DialogDescription>
              </div>
              <Badge variant={STATUS_COLORS[invoice.status] as any}>
                {STATUS_LABELS[invoice.status] || invoice.status}
              </Badge>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-180px)]">
            <div className="p-4 space-y-6">
              {/* Invoice Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Student</p>
                      <p className="font-semibold">
                        {invoice.student?.firstName} {invoice.student?.lastName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {invoice.student?.admissionNo}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Created Date</p>
                      <p className="font-semibold">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(invoice.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fee Items */}
              <Tabs defaultValue="items" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="items">Fee Items</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                </TabsList>

                <TabsContent value="items" className="space-y-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Invoice Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {invoice.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-gray-600">{item.category}</p>
                            </div>
                            <p className="font-semibold">KES {item.amount}</p>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="mt-4 space-y-2 border-t pt-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">
                            KES {(invoice.totalAmount - invoice.discountAmount)}
                          </span>
                        </div>
                        {invoice.discountAmount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span className="font-medium">
                              -KES {invoice.discountAmount}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold border-t pt-2">
                          <span>Total Amount</span>
                          <span>KES {invoice.totalAmount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {invoice.notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">{invoice.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="payments" className="space-y-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Payment Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="p-3 bg-blue-50 rounded">
                          <p className="text-gray-600 text-xs">Total Amount</p>
                          <p className="font-semibold">
                            KES {invoice.totalAmount}
                          </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded">
                          <p className="text-gray-600 text-xs">Paid Amount</p>
                          <p className="font-semibold text-green-600">
                            KES {invoice.paidAmount}
                          </p>
                        </div>
                        <div
                          className={`p-3 rounded ${
                            balance > 0 ? 'bg-red-50' : 'bg-green-50'
                          }`}
                        >
                          <p className="text-gray-600 text-xs">Outstanding</p>
                          <p
                            className={`font-semibold ${
                              balance > 0 ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            KES {balance.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {invoice.dueDate && (
                        <div className="p-3 bg-gray-50 rounded flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <div>
                            <p className="text-xs text-gray-600">Due Date</p>
                            <p className="font-medium">
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </p>
                            {isOverdue && (
                              <p className="text-xs text-red-600">Overdue</p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Payment History */}
                  {invoice.payments && invoice.payments.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Payment History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {invoice.payments.map((payment: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-3 border rounded-lg space-y-2"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">
                                    {payment.method}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {new Date(payment.paidAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant="secondary">
                                  {payment.status}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">
                                  {payment.transactionRef || payment.mpesaCode || '-'}
                                </span>
                                <span className="font-semibold text-green-600">
                                  +KES {payment.amount}
                                </span>
                              </div>
                              {payment.notes && (
                                <p className="text-xs text-gray-600">
                                  {payment.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-500 text-center">
                          No payments recorded yet
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {balance > 0 && invoice.status !== 'CANCELLED' && (
              <Button onClick={() => setShowPaymentModal(true)}>
                Record Payment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Recording Modal */}
      <PaymentRecordingModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        invoiceId={invoiceId}
      />
    </>
  );
}
