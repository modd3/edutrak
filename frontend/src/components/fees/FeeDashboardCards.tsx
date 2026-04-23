// frontend/src/components/fees/FeeDashboardCards.tsx
import { TrendingUp, DollarSign, AlertCircle, CheckCircle2, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetFeeCollectionReport } from '@/hooks/use-fees';
import { useSchoolContext } from '@/hooks/use-school-context';
import { formatCurrency } from '@/lib/utils';
 
interface FeeDashboardCardsProps {
  academicYearId?: string;
  termId?: string;
}
 

export function FeeDashboardCards({ academicYearId, termId }: FeeDashboardCardsProps) {
  const { schoolId } = useSchoolContext();
  const { data, isLoading } = useGetFeeCollectionReport({ academicYearId, termId });
  const report = data?.data?.data ?? data?.data;
 
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
 
  const totalBilled = report?.totalBilled ?? 0;
  const totalCollected = report?.totalCollected ?? 0;
  const totalOutstanding = report?.totalOutstanding ?? 0;
  const totalDiscounted = report?.totalDiscounted ?? 0;
  const net = totalBilled - totalDiscounted;
  const collectionRate = net > 0 ? Math.min((totalCollected / net) * 100, 100) : 0;
  const byStatus = report?.byStatus ?? {};
 
  const cards = [
    {
      title: 'Total Billed',
      value: formatCurrency(totalBilled),
      sub: `Net of discounts: ${formatCurrency(net)}`,
      icon: DollarSign,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Collected',
      value: formatCurrency(totalCollected),
      sub: `${collectionRate.toFixed(1)}% collection rate`,
      icon: TrendingUp,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      progress: collectionRate,
    },
    {
      title: 'Outstanding Balance',
      value: formatCurrency(totalOutstanding),
      sub: `${byStatus.OVERDUE ?? 0} invoices overdue`,
      icon: AlertCircle,
      iconBg: totalOutstanding > 0 ? 'bg-red-100' : 'bg-green-100',
      iconColor: totalOutstanding > 0 ? 'text-red-600' : 'text-green-600',
    },
    {
      title: 'Invoice Status',
      value: `${(byStatus.PAID ?? 0) + (byStatus.WAIVED ?? 0)} Cleared`,
      sub: `${byStatus.UNPAID ?? 0} unpaid · ${byStatus.PARTIAL ?? 0} partial`,
      icon: CheckCircle2,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];
 
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`${card.iconBg} p-2.5 rounded-lg`}>
                <card.icon className={`${card.iconColor} h-5 w-5`} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.sub}</p>
            {card.progress !== undefined && (
              <Progress
                value={card.progress}
                className="mt-2 h-1.5"
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
