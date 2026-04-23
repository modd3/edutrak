// frontend/src/components/fees/CollectionsChart.tsx
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetFeeCollectionReport } from '@/hooks/use-fees';
import { useSchoolContext } from '@/hooks/use-school-context';
import { formatCurrency } from '@/lib/utils';
 
interface CollectionsChartProps {
  academicYearId?: string;
  termId?: string;
}
 
/*function formatCurrency(value: number) {
  if (value >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `KES ${(value / 1_000).toFixed(0)}K`;
  return `KES ${value}`;
} */
 
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-600">{p.name}:</span>
            <span className="font-medium">
              {new Intl.NumberFormat('en-KE', {
                style: 'currency',
                currency: 'KES',
                minimumFractionDigits: 0,
              }).format(p.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};
 
export function CollectionsChart({ academicYearId, termId }: CollectionsChartProps) {
  const { schoolId } = useSchoolContext();
 
  // Default date range: last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
 
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo.toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(today.toISOString().slice(0, 10));
 
  const { data, isLoading } = useGetFeeCollectionReport({
    academicYearId,
    termId,
    date: dateTo,
  });
 
  const report = data?.data?.data ?? data?.data;
  const dailyData = report?.dailyCollection ?? [];
  const byMethod = report?.byPaymentMethod ?? {};
 
  // Build chart data: each entry has date + amount + count
  const chartData = dailyData.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
    'Collections (KES)': d.amount,
    'Transactions': d.count,
  }));
 
  // Payment method breakdown
  const methodEntries = Object.entries(byMethod).sort(([, a], [, b]) => (b as number) - (a as number));
 
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }
 
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Daily Collections</CardTitle>
            <CardDescription>Fee collections trend over the selected period</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
            No collection data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="Collections (KES)"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 3, fill: '#16a34a' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
 
        {/* Payment method breakdown */}
        {methodEntries.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-semibold text-gray-600 mb-2">BY PAYMENT METHOD</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {methodEntries.map(([method, amount]) => (
                <div key={method} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                  <span className="text-xs text-gray-600">{method}</span>
                  <span className="text-xs font-semibold text-gray-900">
                    {formatCurrency(amount as number)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
