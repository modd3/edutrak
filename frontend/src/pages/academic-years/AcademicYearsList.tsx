import { useState } from 'react';
import {
  useAcademicYears,
  useSetActiveAcademicYear,
  useTerms,
} from '@/hooks/use-academic-years';
import { AcademicYear } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateAcademicYearForm } from '@/components/academic-years/CreateAcademicYearForm';
import { TermDatesForm } from '@/components/academic-years/TermDatesForm';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { CheckCircle, Loader2 } from 'lucide-react';

// A component for a single Academic Year Card
function AcademicYearCard({
  year,
  onSetActive,
  isSettingActive,
}: {
  year: AcademicYear;
  onSetActive: () => void;
  isSettingActive: boolean;
}) {
  const {
    data: terms,
    isLoading: isLoadingTerms,
    isError: isTermsError,
  } = useTerms(year.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{year.year} Academic Year</CardTitle>
          {year.isActive ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              Active
            </Badge>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={onSetActive}
              disabled={isSettingActive}
            >
              {isSettingActive ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Set as Active
            </Button>
          )}
        </div>
        <CardDescription>
          {formatDate(year.startDate)} - {formatDate(year.endDate)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingTerms && <Skeleton className="h-40 w-full" />}
        {isTermsError && <p className="text-destructive">Failed to load terms.</p>}
        {terms && <TermDatesForm terms={terms} />}
      </CardContent>
    </Card>
  );
}

// The main page component
export default function AcademicYearsList() {
  const [page] = useState(1);
  const { data, isLoading, isError } = useAcademicYears({ page, pageSize: 10 });
  const { mutate: setActiveYear, isPending: isSettingActive } =
    useSetActiveAcademicYear();

  const handleSetActive = (id: string) => {
    setActiveYear(id);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-6 lg:grid-cols-1">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }

    if (isError) {
      return <p className="text-destructive">Failed to load academic years.</p>;
    }

    if (!data || data.data.length === 0) {
      return <p>No academic years found. Please create one to begin.</p>;
    }

    return (
      <div className="grid gap-6 lg:grid-cols-1">
        {data.data.map((year) => (
          <AcademicYearCard
            key={year.id}
            year={year}
            onSetActive={() => handleSetActive(year.id)}
            isSettingActive={isSettingActive}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Academic Years</h1>
        <CreateAcademicYearForm />
      </div>

      {renderContent()}

      {/* TODO: Add pagination controls if data.total > data.pageSize */}
    </div>
  );
}