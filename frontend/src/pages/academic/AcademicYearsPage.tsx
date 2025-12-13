// src/pages/academic/AcademicYearsPage.tsx
import { useState } from 'react';
import { Plus, Calendar, CheckCircle2, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAcademicYears, useSetActiveAcademicYear } from '@/hooks/use-academic';
import { AcademicYearFormModal } from '@/components/academic/AcademicYearFormModal';
import { AcademicYearDetailsModal } from '@/components/academic/AcademicYearDetailsModal';
import type { AcademicYear } from '@/hooks/use-academic';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export function AcademicYearsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data: response, isLoading } = useAcademicYears();
  const { mutate: setActive } = useSetActiveAcademicYear();

  // Extract academicYears from the response
  const academicYears = response?.data || [];
  
  const handleSetActive = (id: string) => {
    if (confirm('Set this as the active academic year?')) {
      setActive(id);
    }
  };

  const handleViewDetails = (year: AcademicYear) => {
    setSelectedYear(year);
    setShowDetailsModal(true);
  };

  if (isLoading) {
    return (
            <div className="grid gap-6 lg:grid-cols-1">
              <Skeleton className="h-28 w-42" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-22 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Academic Years</h1>
          <p className="text-muted-foreground">
            Manage academic years and terms for your school
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Academic Year
        </Button>
      </div>

      {/* Academic Years Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {academicYears && academicYears.map((year: AcademicYear) => (
          <Card
            key={year.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              year.isActive ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleViewDetails(year)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {year.year}
                </CardTitle>
                {year.isActive && (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range */}
              <div className="text-sm text-muted-foreground">
                {format(new Date(year.startDate), 'MMM d, yyyy')} -{' '}
                {format(new Date(year.endDate), 'MMM d, yyyy')}
              </div>

              {/* Terms */}
              <div className="flex gap-1">
                {year.terms?.map((term) => (
                  <Badge key={term.id} variant="outline" className="text-xs">
                    Term {term.termNumber}
                  </Badge>
                ))}
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">
                      {year._count?.classes || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Classes</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">
                      {year._count?.studentClasses || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Students</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!year.isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetActive(year.id);
                  }}
                >
                  Set as Active
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {(!academicYears || academicYears.length === 0) && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Academic Years</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first academic year to get started
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Academic Year
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <AcademicYearFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />

      {selectedYear && (
        <AcademicYearDetailsModal
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          academicYear={selectedYear}
        />
      )}
    </div>
  );
}
