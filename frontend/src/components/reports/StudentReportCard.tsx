// src/components/reports/StudentReportCard.tsx
import { Download, Printer, TrendingUp, Award } from 'lucide-react';
import { useStudentReport } from '@/hooks/use-reports';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useSchoolContext } from '@/hooks/use-school-context';
import { getGradeAndRemarks } from '@/lib/grade-calculator';

interface StudentReportCardProps {
  studentId: string;
  termId: string;
}

export function StudentReportCard({
  studentId,
  termId,
}: StudentReportCardProps) {
  const { data, isLoading } = useStudentReport(studentId, termId);
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
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="p-8 border rounded-lg text-center">
        <p className="text-gray-500">No report data available for this student and term.</p>
      </div>
    );
  }

  const report = data.data;
  const isCBC = report.class.curriculum === 'CBC';

  const renderValue = (value: any) => value ?? <span className='text-gray-400'>N/A</span>;

  const schoolDetails = {
    name: schoolName || 'EduTrak School',
    address: 'P.O. Box 12345-00100, Nairobi, Kenya',
    motto: 'Excellence and Integrity',
    logoUrl: '/school-logo.png',
  };

  const gradingSystem = isCBC
    ? [
        { level: 'Exceeding Expectations', description: 'Consistently demonstrates mastery', abbr: 'EE' },
        { level: 'Meeting Expectations', description: 'Demonstrates required competencies', abbr: 'ME' },
        { level: 'Approaching Expectations', description: 'Needs support to meet competencies', abbr: 'AE' },
        { level: 'Below Expectations', description: 'Requires significant intervention', abbr: 'BE' },
      ]
    : [
        { grade: 'A', range: '80-100', remarks: 'Excellent' },
        { grade: 'A-', range: '75-79', remarks: 'Excellent' },
        { grade: 'B+', range: '70-74', remarks: 'Very Good' },
        { grade: 'B', range: '65-69', remarks: 'Good' },
        { grade: 'B-', range: '60-64', remarks: 'Good' },
        { grade: 'C+', range: '55-59', remarks: 'Average' },
        { grade: 'C', range: '50-54', remarks: 'Average' },
        { grade: 'C-', range: '45-49', remarks: 'Fair' },
        { grade: 'D+', range: '40-44', remarks: 'Fair' },
        { grade: 'D', range: '35-39', remarks: 'Poor' },
        { grade: 'D-', range: '30-34', remarks: 'Poor' },
        { grade: 'E', range: '0-29', remarks: 'Fail' },
      ];

  // Calculate position suffix
  const getPositionSuffix = (pos: number) => {
    if (pos === 1) return 'st';
    if (pos === 2) return 'nd';
    if (pos === 3) return 'rd';
    return 'th';
  };

  return (
    <div className="bg-white text-gray-900 print:text-black">
      <div className="p-4 md:p-8 max-w-4xl mx-auto border print:border-none rounded-lg print:shadow-none">
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
                <p className="text-xs font-semibold text-gray-700 italic mt-1">
                  &quot;{schoolDetails.motto}&quot;
                </p>
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
            END OF TERM REPORT CARD
          </h2>
          <p className="text-xs text-gray-600 mt-1">{report.term.name} - {report.academicYear.year}</p>
        </div>

        {/* Student Information Section */}
        <section className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Student Name</p>
              <p className="font-bold text-gray-900">{`${report.student.firstName} ${report.student.lastName}`}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Admission No</p>
              <p className="font-bold text-gray-900">{report.student.admissionNo}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Class</p>
              <p className="font-bold text-gray-900">{report.class.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Curriculum</p>
              <p className="font-bold text-gray-900">{report.class.curriculum}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Academic Year</p>
              <p className="font-bold text-gray-900">{report.academicYear.year}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Term</p>
              <p className="font-bold text-gray-900">{report.term.name}</p>
            </div>
          </div>
        </section>

        {/* Academic Performance Table */}
        <section className="mt-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3 uppercase tracking-wide">Academic Performance</h3>
          <div className="overflow-x-auto">
            <Table className="border-2 border-gray-400">
              <TableHeader>
                <TableRow className="bg-blue-900 text-white">
                  <TableHead className="font-bold border-r border-gray-400 text-white">SUBJECT</TableHead>
                  {isCBC && <TableHead className="font-bold border-r border-gray-400 text-white text-center">STRAND</TableHead>}
                  <TableHead className="font-bold border-r border-gray-400 text-white text-center">CAT 1</TableHead>
                  <TableHead className="font-bold border-r border-gray-400 text-white text-center">CAT 2</TableHead>
                  <TableHead className="font-bold border-r border-gray-400 text-white text-center">END TERM</TableHead>
                  <TableHead className="font-bold border-r border-gray-400 text-white text-center">TOTAL</TableHead>
                  {!isCBC && <TableHead className="font-bold border-r border-gray-400 text-white text-center">GRADE</TableHead>}
                  <TableHead className="font-bold border-r border-gray-400 text-white">{isCBC ? 'LEVEL' : 'REMARKS'}</TableHead>
                  <TableHead className="font-bold text-white">TEACHER</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.subjects.map((subject: any, index: number) => {
                  const cat1 = subject.assessments.find((a: any) => a.type === 'CAT_1')?.marks;
                  const cat2 = subject.assessments.find((a: any) => a.type === 'CAT_2')?.marks;
                  const endTerm = subject.assessments.find((a: any) => a.type === 'END_TERM_EXAM')?.marks;
                  const { grade, remarks } = getGradeAndRemarks(subject.average);

                  return(
                    <TableRow key={subject.subjectId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <TableCell className="border-r border-gray-300 font-semibold text-gray-900">{subject.subjectName}</TableCell>
                      {isCBC && <TableCell className="border-r border-gray-300 text-center text-sm">{renderValue(subject.strand)}</TableCell>}
                      <TableCell className="border-r border-gray-300 text-center font-semibold">{renderValue(cat1)}</TableCell>
                      <TableCell className="border-r border-gray-300 text-center font-semibold">{renderValue(cat2)}</TableCell>
                      <TableCell className="border-r border-gray-300 text-center font-semibold">{renderValue(endTerm)}</TableCell>
                      <TableCell className="border-r border-gray-300 text-center font-bold text-lg">{subject.average.toFixed(1)}</TableCell>
                      {!isCBC && <TableCell className="border-r border-gray-300 text-center font-bold text-blue-900">{grade}</TableCell>}
                      {isCBC ? (
                        <TableCell className='border-r border-gray-300 text-xs font-semibold'>{subject.competencyLevel?.replace('_', ' ')}</TableCell>
                      ) : (
                        <TableCell className='border-r border-gray-300 text-sm'>{remarks}</TableCell>
                      )}
                      <TableCell className="text-sm">{subject.teacher}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Performance Summary and Grading System */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Performance Summary */}
          <div className="border-2 border-gray-400 p-4 rounded-lg">
            <h4 className="font-bold text-blue-900 uppercase text-center mb-4 pb-2 border-b-2 border-blue-900">Performance Summary</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Total Marks:</span>
                <span className="font-bold text-gray-900">{renderValue(report.overallPerformance.totalMarks)} / {renderValue(report.overallPerformance.totalMaxMarks)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Mean Score (%):</span>
                <span className="font-bold text-blue-900 text-lg">{report.overallPerformance.averagePercentage.toFixed(2)}%</span>
              </div>
              {!isCBC && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Mean Grade:</span>
                  <span className="font-bold text-blue-900 text-lg">{report.overallPerformance.overallGrade}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                <span className="font-semibold text-gray-700">Class Position:</span>
                <span className="font-bold text-blue-900 text-lg">
                  {renderValue(report.overallPerformance.overallPosition)}{getPositionSuffix(report.overallPerformance.overallPosition)} of {report.overallPerformance.totalStudents}
                </span>
              </div>
              {report.overallPerformance.streamPosition && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Stream Position:</span>
                  <span className="font-bold text-gray-900">{renderValue(report.overallPerformance.streamPosition)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Grading System */}
          <div className="border-2 border-gray-400 p-4 rounded-lg">
            <h4 className="font-bold text-blue-900 uppercase text-center mb-4 pb-2 border-b-2 border-blue-900">Grading System</h4>
            <div className="overflow-y-auto max-h-48">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className='font-bold text-gray-900'>{isCBC ? 'Level' : 'Grade'}</TableHead>
                    {!isCBC && <TableHead className='font-bold text-gray-900'>Range</TableHead>}
                    <TableHead className='font-bold text-gray-900'>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradingSystem.map((g: any) => (
                    <TableRow key={g.grade || g.level}>
                      <TableCell className='font-semibold text-gray-900'>{g.grade || g.level}</TableCell>
                      {!isCBC && <TableCell className='text-gray-700'>{g.range}</TableCell>}
                      <TableCell className='text-gray-700'>{g.description || g.remarks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>

        {/* Comments Section */}
        <section className="mt-6 space-y-4">
          <div className="border-2 border-gray-400 p-4 rounded-lg">
            <h4 className="font-bold text-blue-900 uppercase mb-2">Class Teacher's Remarks</h4>
            <p className="text-sm text-gray-800 min-h-12 p-2 bg-gray-50 rounded border border-gray-300">
              {report.comments?.classTeacherComment || 'Good progress, keep it up.'}
            </p>
          </div>
          <div className="border-2 border-gray-400 p-4 rounded-lg">
            <h4 className="font-bold text-blue-900 uppercase mb-2">Head Teacher's Remarks</h4>
            <p className="text-sm text-gray-800 min-h-12 p-2 bg-gray-50 rounded border border-gray-300">
              {report.comments?.headTeacherComment || 'A commendable performance.'}
            </p>
          </div>
        </section>

        {/* Signatures Section */}
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
            <p>Term closes on {new Date(report.term.endDate).toLocaleDateString()}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}