// src/pages/assessments/ReportsPage.tsx

import { useState } from 'react';
import { FileText, Users } from 'lucide-react';
import { StudentReportCard } from '@/components/reports/StudentReportCard';
import { ClassPerformanceReport } from '@/components/reports/ClassPerformanceReport';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export function ReportsPage() {
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-gray-500 mt-1">
          Generate and view student and class performance reports
        </p>
      </div>

      {/* Report Type Tabs */}
      <Tabs defaultValue="student" className="w-full">
        <TabsList>
          <TabsTrigger value="student">
            <FileText className="mr-2 h-4 w-4" />
            Student Reports
          </TabsTrigger>
          <TabsTrigger value="class">
            <Users className="mr-2 h-4 w-4" />
            Class Reports
          </TabsTrigger>
        </TabsList>

        {/* Student Report Tab */}
        <TabsContent value="student" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Student Report Card</CardTitle>
              <CardDescription>
                Select a student and term to generate their report card
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Term</label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* TODO: Load terms from API */}
                      <SelectItem value="term1">Term 1 2024</SelectItem>
                      <SelectItem value="term2">Term 2 2024</SelectItem>
                      <SelectItem value="term3">Term 3 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Class</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* TODO: Load classes from API */}
                      <SelectItem value="class1">Form 1A</SelectItem>
                      <SelectItem value="class2">Form 1B</SelectItem>
                      <SelectItem value="class3">Form 2A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Student
                  </label>
                  <Select
                    value={selectedStudent}
                    onValueChange={setSelectedStudent}
                    disabled={!selectedClass}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* TODO: Load students from API based on selected class */}
                      <SelectItem value="student1">
                        STU-001 - John Doe
                      </SelectItem>
                      <SelectItem value="student2">
                        STU-002 - Jane Smith
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Report Display */}
          {selectedStudent && selectedTerm && (
            <StudentReportCard studentId={selectedStudent} termId={selectedTerm} />
          )}

          {!selectedStudent && !selectedTerm && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold">
                  Select Student and Term
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Choose a student and term above to generate their report card
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Class Report Tab */}
        <TabsContent value="class" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Class Performance Report</CardTitle>
              <CardDescription>
                Select a class and term to view performance analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Term</label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term1">Term 1 2024</SelectItem>
                      <SelectItem value="term2">Term 2 2024</SelectItem>
                      <SelectItem value="term3">Term 3 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Class</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class1">Form 1A</SelectItem>
                      <SelectItem value="class2">Form 1B</SelectItem>
                      <SelectItem value="class3">Form 2A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Class Report Display */}
          {selectedClass && selectedTerm && (
            <ClassPerformanceReport classId={selectedClass} termId={selectedTerm} />
          )}

          {!selectedClass && !selectedTerm && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold">
                  Select Class and Term
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Choose a class and term above to view performance analytics
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
