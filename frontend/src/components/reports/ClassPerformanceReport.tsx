// src/components/reports/ClassPerformanceReport.tsx

import { TrendingUp, Users, Award, BarChart3 } from 'lucide-react';
import { useClassReport } from '@/hooks/use-reports';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface ClassPerformanceReportProps {
  classId: string;
  termId: string;
}

export function ClassPerformanceReport({
  classId,
  termId,
}: ClassPerformanceReportProps) {
  const { data, isLoading } = useClassReport(classId, termId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
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
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.overallStatistics.totalStudents}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {report.class.name} - {report.term.name}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Class Average
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.overallStatistics.averagePerformance.toFixed(1)}%
            </div>
            <Progress
              value={report.overallStatistics.averagePerformance}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Curriculum
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.class.curriculum}</div>
            <p className="text-xs text-gray-500 mt-1">
              {report.class.level}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance Analysis</CardTitle>
          <CardDescription>
            Detailed breakdown of performance across all subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Students Assessed</TableHead>
                <TableHead className="text-right">Average</TableHead>
                <TableHead className="text-right">Highest</TableHead>
                <TableHead className="text-right">Lowest</TableHead>
                <TableHead className="text-right">Pass Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.subjects.map((subject: any) => (
                <TableRow key={subject.subjectId}>
                  <TableCell className="font-medium">
                    {subject.subjectName}
                  </TableCell>
                  <TableCell className="text-center">
                    {subject.studentsAssessed} / {subject.totalStudents}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="secondary"
                      className={
                        subject.averageScore >= 70
                          ? 'bg-green-100 text-green-800'
                          : subject.averageScore >= 50
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {subject.averageScore.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {subject.highestScore.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {subject.lowestScore.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Progress
                        value={subject.passRate}
                        className="w-16 h-2"
                      />
                      <span className="text-sm">
                        {subject.passRate.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Grade/Competency Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {report.subjects.map((subject: any) => (
          <Card key={subject.subjectId}>
            <CardHeader>
              <CardTitle className="text-base">{subject.subjectName}</CardTitle>
              <CardDescription>
                {isCBC ? 'Competency Distribution' : 'Grade Distribution'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCBC && subject.competencyDistribution ? (
                <div className="space-y-3">
                  {Object.entries(subject.competencyDistribution).map(
                    ([level, count]: [string, any]) => (
                      <div key={level}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">
                            {level.replace(/_/g, ' ').toLowerCase()}
                          </span>
                          <span className="font-semibold">{count}</span>
                        </div>
                        <Progress
                          value={(count / subject.studentsAssessed) * 100}
                          className="h-2"
                        />
                      </div>
                    )
                  )}
                </div>
              ) : subject.gradeDistribution ? (
                <div className="space-y-3">
                  {Object.entries(subject.gradeDistribution).map(
                    ([grade, count]: [string, any]) => (
                      <div key={grade}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold">Grade {grade}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                        <Progress
                          value={(count / subject.studentsAssessed) * 100}
                          className="h-2"
                        />
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No data available</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            <CardTitle>Top Performers</CardTitle>
          </div>
          <CardDescription>
            Students with highest overall performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Admission No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead className="text-right">Average Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.overallStatistics.topPerformers.map(
                (student: any, index: number) => (
                  <TableRow key={student.studentId}>
                    <TableCell className="font-bold">
                      {index + 1 <= 3 ? (
                        <Badge
                          variant="secondary"
                          className={
                            index === 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : index === 1
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-orange-100 text-orange-800'
                          }
                        >
                          {index + 1}
                        </Badge>
                      ) : (
                        index + 1
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {student.admissionNo}
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.studentName}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {student.averageScore.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
