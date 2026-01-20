// src/components/reports/StudentReportCard.tsx

import { Download, Printer } from 'lucide-react';
import { useStudentReport } from '@/hooks/use-reports';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface StudentReportCardProps {
  studentId: string;
  termId: string;
}

export function StudentReportCard({ studentId, termId }: StudentReportCardProps) {
  const { data, isLoading } = useStudentReport(studentId, termId);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement PDF download
    console.log('Download PDF');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">No report data available</p>
        </CardContent>
      </Card>
    );
  }

  const report = data.data;
  const isCBC = report.class.curriculum === 'CBC';

  return (
    <Card className="print:shadow-none">
      <CardHeader className="print:border-b">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">
              Student Report Card
            </CardTitle>
            <CardDescription className="mt-2 space-y-1">
              <div>
                <span className="font-semibold">Student:</span>{' '}
                {report.student.firstName} {report.student.middleName}{' '}
                {report.student.lastName}
              </div>
              <div>
                <span className="font-semibold">Admission No:</span>{' '}
                {report.student.admissionNo}
              </div>
              <div>
                <span className="font-semibold">Class:</span> {report.class.name}
              </div>
              <div>
                <span className="font-semibold">Term:</span> {report.term.name}{' '}
                {report.academicYear.year}
              </div>
            </CardDescription>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Subject Performance */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Subject Performance</h3>
          
          {report.subjects.map((subject: any) => (
            <div key={subject.subjectId} className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">
                  {subject.subjectName} ({subject.subjectCode})
                </h4>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Average: {subject.average.toFixed(1)}%
                  </span>
                  {subject.position && (
                    <Badge variant="outline">
                      Position: {subject.position}
                    </Badge>
                  )}
                  {isCBC ? (
                    <Badge
                      className={
                        subject.competencyLevel === 'EXCEEDING_EXPECTATIONS'
                          ? 'bg-green-100 text-green-800'
                          : subject.competencyLevel === 'MEETING_EXPECTATIONS'
                          ? 'bg-blue-100 text-blue-800'
                          : subject.competencyLevel === 'APPROACHING_EXPECTATIONS'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                      variant="secondary"
                    >
                      {subject.competencyLevel?.replace('_', ' ')}
                    </Badge>
                  ) : (
                    <Badge
                      className={
                        subject.grade === 'A'
                          ? 'bg-green-100 text-green-800'
                          : subject.grade === 'B'
                          ? 'bg-blue-100 text-blue-800'
                          : subject.grade === 'C'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                      variant="secondary"
                    >
                      Grade {subject.grade}
                    </Badge>
                  )}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Marks</TableHead>
                    <TableHead className="text-right">Max</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    {isCBC ? (
                      <TableHead>Competency</TableHead>
                    ) : (
                      <TableHead>Grade</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subject.assessments.map((assessment: any) => (
                    <TableRow key={assessment.assessmentId}>
                      <TableCell>{assessment.assessmentName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {assessment.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {assessment.marks}
                      </TableCell>
                      <TableCell className="text-right">
                        {assessment.maxMarks}
                      </TableCell>
                      <TableCell className="text-right">
                        {assessment.percentage.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        {isCBC ? (
                          <span className="text-xs">
                            {assessment.competencyLevel?.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="font-semibold">
                            {assessment.grade}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold bg-gray-50">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right">
                      {subject.totalMarks}
                    </TableCell>
                    <TableCell className="text-right">
                      {subject.totalMaxMarks}
                    </TableCell>
                    <TableCell className="text-right">
                      {subject.average.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      {isCBC
                        ? subject.competencyLevel?.replace('_', ' ')
                        : `Grade ${subject.grade}`}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ))}
        </div>

        <Separator />

        {/* Overall Performance */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Overall Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {report.overallPerformance.totalMarks}
                </div>
                <p className="text-xs text-gray-500 mt-1">Total Marks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {report.overallPerformance.averagePercentage.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Average</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {report.overallPerformance.overallPosition}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Position (of {report.overallPerformance.totalStudents})
                </p>
              </CardContent>
            </Card>
            {!isCBC && report.overallPerformance.overallGrade && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {report.overallPerformance.overallGrade}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Overall Grade</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-gray-500 text-center pt-4 border-t print:mt-8">
          Generated on {new Date(report.generatedAt).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
