// src/components/reports/ClassPerformanceReport.tsx

import { Download, Printer, Users, TrendingUp, BarChart3, Award } from 'lucide-react';
import { useClassReport } from '@/hooks/use-reports';
import { useSchoolContext } from '@/hooks/use-school-context';
import {
  Card,
  CardContent,
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
import { Button } from '@/components/ui/button';
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
  const { schoolName } = useSchoolContext();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement PDF download
    console.log('Download PDF');
  };

  if (isLoading) {
    return (
      <div className="p-8 border rounded-lg">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">No report data available for this class and term.</p>
        </CardContent>
      </Card>
    );
  }

  const report = data.data;
  const isCBC = report.class.curriculum === 'CBC';

  const schoolDetails = {
    name: schoolName || 'EduTrak School',
    address: 'P.O. Box 12345-00100, Nairobi, Kenya',
    logoUrl: '/school-logo.png',
  };

  const gradeDistribution = report.overallStatistics.gradeDistribution || {};

  return (
    <div className="bg-white text-gray-900 print:text-black">
      <div className="p-4 md:p-8 max-w-6xl mx-auto border print:border-none rounded-lg print:shadow-none">
        
        {/* Professional Header */}
        <header className="pb-6 border-b-4 border-blue-900">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-24 w-24 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-300">
                <img src={schoolDetails.logoUrl} alt="School Logo" className="h-20 w-20 object-contain" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold uppercase text-blue-900 tracking-wide">
                  {schoolDetails.name}
                </h1>
                <p className="text-xs text-gray-600 mt-1">{schoolDetails.address}</p>
              </div>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
          </div>
        </header>

        {/* Report Title */}
        <div className="text-center py-4 border-b-2 border-gray-300">
          <h2 className="text-xl font-bold text-blue-900 uppercase tracking-wide">
            CLASS PERFORMANCE ANALYSIS REPORT
          </h2>
          <p className="text-xs text-gray-600 mt-1">{report.term.name} - {report.academicYear?.year || 'N/A'}</p>
        </div>

        {/* Class Information */}
        <section className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Class</p>
              <p className="font-bold text-gray-900">{report.class.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Curriculum</p>
              <p className="font-bold text-gray-900">{report.class.curriculum}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Total Students</p>
              <p className="font-bold text-gray-900">{report.overallStatistics.totalStudents}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Students Assessed</p>
              <p className="font-bold text-gray-900">{report.overallStatistics.totalStudents}</p>
            </div>
          </div>
        </section>

        {/* Key Performance Indicators */}
        <section className="mt-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4 uppercase tracking-wide">Key Performance Indicators</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border-2 border-blue-900 p-4 rounded-lg text-center">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Class Average</p>
              <p className="text-3xl font-bold text-blue-900">{report.overallStatistics.averagePerformance.toFixed(1)}%</p>
            </div>
            <div className="border-2 border-green-600 p-4 rounded-lg text-center">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Highest Score</p>
              <p className="text-3xl font-bold text-green-600">{report.overallStatistics.topPerformers[0]?.averageScore.toFixed(1) || 'N/A'}%</p>
            </div>
            <div className="border-2 border-orange-600 p-4 rounded-lg text-center">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Lowest Score</p>
              <p className="text-3xl font-bold text-orange-600">{report.overallStatistics.lowestScore?.toFixed(1) || 'N/A'}%</p>
            </div>
            <div className="border-2 border-purple-600 p-4 rounded-lg text-center">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Mean Grade</p>
              <p className="text-3xl font-bold text-purple-600">{report.overallStatistics.meanGrade || 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* Subject Performance Analysis */}
        <section className="mt-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4 uppercase tracking-wide">Subject Performance Analysis</h3>
          <div className="overflow-x-auto">
            <Table className="border-2 border-gray-400">
              <TableHeader>
                <TableRow className="bg-blue-900 text-white">
                  <TableHead className="font-bold border-r border-gray-400 text-white">Subject</TableHead>
                  <TableHead className="font-bold border-r border-gray-400 text-white text-center">Students Assessed</TableHead>
                  <TableHead className="font-bold border-r border-gray-400 text-white text-center">Average (%)</TableHead>
                  <TableHead className="font-bold border-r border-gray-400 text-white text-center">Highest (%)</TableHead>
                  <TableHead className="font-bold border-r border-gray-400 text-white text-center">Lowest (%)</TableHead>
                  <TableHead className="font-bold border-r border-gray-400 text-white text-center">Pass Rate</TableHead>
                  {!isCBC && <TableHead className="font-bold text-white">Mean Grade</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.subjects.map((subject: any, index: number) => (
                  <TableRow key={subject.subjectId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <TableCell className="border-r border-gray-300 font-semibold text-gray-900">{subject.subjectName}</TableCell>
                    <TableCell className="border-r border-gray-300 text-center">{subject.studentsAssessed}</TableCell>
                    <TableCell className="border-r border-gray-300 text-center font-bold">{subject.averageScore.toFixed(1)}</TableCell>
                    <TableCell className="border-r border-gray-300 text-center font-bold text-green-600">{subject.highestScore.toFixed(1)}</TableCell>
                    <TableCell className="border-r border-gray-300 text-center font-bold text-orange-600">{subject.lowestScore.toFixed(1)}</TableCell>
                    <TableCell className="border-r border-gray-300 text-center font-bold">{subject.passRate.toFixed(0)}%</TableCell>
                    {!isCBC && <TableCell className="text-center font-bold text-blue-900">-</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Grade Distribution */}
        <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-4 uppercase tracking-wide">Grade Distribution</h3>
            <div className="border-2 border-gray-400 p-4 rounded-lg">
              {Object.entries(gradeDistribution).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(gradeDistribution).map(([grade, count]: [string, any]) => (
                    <div key={grade}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-900">Grade {grade}</span>
                        <span className="font-semibold text-gray-900">{count} Student(s)</span>
                      </div>
                      <Progress value={(count / report.overallStatistics.totalStudents) * 100} className="h-3" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No grade distribution data available.</p>
              )}
            </div>
          </div>

          {/* Top Performers */}
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-4 uppercase tracking-wide">Top Performers</h3>
            <div className="border-2 border-gray-400 p-4 rounded-lg">
              {report.overallStatistics.topPerformers && report.overallStatistics.topPerformers.length > 0 ? (
                <div className="space-y-2">
                  {report.overallStatistics.topPerformers.slice(0, 5).map((student: any, index: number) => (
                    <div key={student.studentId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-semibold text-gray-900">{index + 1}. {student.studentName}</p>
                        <p className="text-xs text-gray-600">{student.admissionNo}</p>
                      </div>
                      <p className="font-bold text-blue-900 text-lg">{student.averageScore.toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No top performers data available.</p>
              )}
            </div>
          </div>
        </section>

        {/* Class Ranking */}
        <section className="mt-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4 uppercase tracking-wide">Class Ranking</h3>
          <div className="overflow-x-auto">
            <Table className="border-2 border-gray-400">
              <TableHeader>
                <TableRow className="bg-blue-900 text-white">
                  <TableHead className="font-bold border-r border-gray-400 text-white text-center">Rank</TableHead>
                  <TableHead className="font-bold border-r border-gray-400 text-white">Admission No</TableHead>
                  <TableHead className="font-bold border-r border-gray-400 text-white">Student Name</TableHead>
                  <TableHead className="font-bold border-r border-gray-400 text-white text-center">Average (%)</TableHead>
                  {!isCBC && <TableHead className="font-bold text-white text-center">Mean Grade</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.overallStatistics.topPerformers && report.overallStatistics.topPerformers.map((student: any, index: number) => (
                  <TableRow key={student.studentId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <TableCell className="border-r border-gray-300 text-center font-bold text-blue-900">{index + 1}</TableCell>
                    <TableCell className="border-r border-gray-300 font-semibold text-gray-900">{student.admissionNo}</TableCell>
                    <TableCell className="border-r border-gray-300 text-gray-900">{student.studentName}</TableCell>
                    <TableCell className="border-r border-gray-300 text-center font-bold">{student.averageScore.toFixed(1)}</TableCell>
                    {!isCBC && <TableCell className="text-center font-bold text-blue-900">-</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t-4 border-blue-900">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="h-16 mb-2"></div>
              <p className="text-xs font-semibold border-t-2 border-gray-800 pt-1">Class Teacher</p>
            </div>
            <div className="text-center">
              <div className="h-16 mb-2"></div>
              <p className="text-xs font-semibold border-t-2 border-gray-800 pt-1">Principal/Head Teacher</p>
            </div>
            <div className="text-center">
              <div className="h-16 mb-2 border-2 border-gray-400 rounded flex items-center justify-center">
                <span className="text-xs text-gray-500">School Stamp</span>
              </div>
              <p className="text-xs font-semibold pt-1">Official Stamp</p>
            </div>
          </div>
          <div className="text-xs text-gray-600 text-center pt-4 border-t border-gray-300">
            <p>Report generated on {new Date(report.generatedAt).toLocaleString()}</p>
            <p>Term: {report.term.name} | Academic Year: {report.academicYear?.year || 'N/A'}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}