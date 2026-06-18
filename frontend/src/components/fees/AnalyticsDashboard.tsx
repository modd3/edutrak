import { useGetAnalytics, useGetCashFlowReport, useDetectAnomalies } from '@/hooks/use-fees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, AlertTriangle, DollarSign, Users } from 'lucide-react';

export function AnalyticsDashboard() {
  const { data: analytics, isLoading: analyticsLoading } = useGetAnalytics();
  const { data: cashFlow } = useGetCashFlowReport();
  const { data: anomalies } = useDetectAnomalies({ days: 30 });

  if (analyticsLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const data = analytics?.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {data?.totalBilled?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {data?.totalCollected?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.collectionRate?.toFixed(1) || 0}% collection rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">KES {data?.outstandingBalance?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">KES {data?.overdueAmount?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data?.topPaymentMethods?.map((method: any) => (
                <div key={method.method} className="flex justify-between items-center">
                  <span className="text-sm">{method.method}</span>
                  <div className="text-right">
                    <span className="text-sm font-medium">KES {method.totalAmount?.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 ml-2">({method.percentage?.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Defaulters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data?.defaulters?.slice(0, 10).map((defaulter: any) => (
                <div key={defaulter.studentId} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{defaulter.studentName}</p>
                    <p className="text-xs text-gray-500">{defaulter.className} • {defaulter.admissionNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">KES {defaulter.balance?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{defaulter.overdueDays} days overdue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {anomalies?.data && anomalies.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Detected Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {anomalies.data.map((anomaly: any, idx: number) => (
                <div key={idx} className="border rounded-md p-3 text-sm">
                  <p className="font-medium">{anomaly.type}</p>
                  <p className="text-gray-600">
                    Amount: KES {anomaly.amount?.toLocaleString()} • Date: {new Date(anomaly.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
