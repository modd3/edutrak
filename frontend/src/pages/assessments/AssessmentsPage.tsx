// src/pages/assessments/AssessmentsPage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';
import { AssessmentList } from '@/components/assessments/AssessmentList';
import { useAssessmentStats } from '@/hooks/use-assessments';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssessmentType } from '@/types';

export function AssessmentsPage() {
  const navigate = useNavigate();
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  const { data: stats } = useAssessmentStats();

  const handleGradeEntry = (assessmentId: string) => {
    navigate(`/assessments/${assessmentId}/grades`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Assessments</h1>
        <p className="text-gray-500 mt-1">
          Manage assessments, enter grades, and generate reports
        </p>
      </div>

      {/* Statistics Cards */}
      {stats?.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.data.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                With Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.data.withResults}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.data.withoutResults}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                By Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.data.byType || {}).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-gray-600">{type}</span>
                    <span className="font-semibold">{count as number}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
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
                  <SelectItem value="term1">Term 1</SelectItem>
                  <SelectItem value="term2">Term 2</SelectItem>
                  <SelectItem value="term3">Term 3</SelectItem>
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
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {/* TODO: Load subjects from API */}
                  <SelectItem value="math">Mathematics</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment List by Type */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="CAT">CATs</TabsTrigger>
          <TabsTrigger value="MIDTERM">Mid-Term</TabsTrigger>
          <TabsTrigger value="END_OF_TERM">End of Term</TabsTrigger>
          <TabsTrigger value="MOCK">Mock</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {selectedTerm && (
            <AssessmentList
              termId={selectedTerm}
              classSubjectId={selectedSubject}
              onGradeEntry={handleGradeEntry}
            />
          )}
          {!selectedTerm && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">
                  Please select a term to view assessments
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {['CAT', 'MIDTERM', 'END_OF_TERM', 'MOCK'].map((type) => (
          <TabsContent key={type} value={type} className="mt-6">
            {selectedTerm && (
              <AssessmentList
                termId={selectedTerm}
                classSubjectId={selectedSubject}
                onGradeEntry={handleGradeEntry}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
