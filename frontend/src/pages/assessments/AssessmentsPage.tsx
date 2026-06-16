// src/pages/assessments/AssessmentsPage.tsx
// Clean tab-based layout: Assessments | Weights | Reports

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Scale, FileText, ClipboardList } from 'lucide-react';
import { AssessmentList } from '@/components/assessments/AssessmentList';
import { AssessmentForm } from '@/components/assessments/AssessmentForm';
import { WeightConfiguration } from '@/components/assessments/WeightConfiguration';
import { useActiveAcademicYear, useClasses } from '@/hooks/use-academic';
import { useClassSubjects } from '@/hooks/use-class-subjects';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';

export function AssessmentsPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedClassSubject, setSelectedClassSubject] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('assessments');

  const { data: activeYearData, isLoading: isLoadingYear } = useActiveAcademicYear();
  const activeYear = activeYearData;

  const { data: classesData } = useClasses(activeYear?.id);
  const classes = classesData?.data || [];

  const { data: classSubjectsData } = useClassSubjects(
    selectedClass,
    activeYear?.id || '',
    selectedTerm
  );
  const classSubjects = classSubjectsData?.data.data || [];
  const terms = activeYear?.terms || [];

  // Auto-select first term
  useEffect(() => {
    if (terms.length > 0 && !selectedTerm) {
      setSelectedTerm(terms[0].id);
    }
  }, [terms, selectedTerm]);

  // Auto-select first subject when class+term selected
  useEffect(() => {
    if (selectedClass && selectedTerm && classSubjects.length > 0 && !selectedClassSubject) {
      setSelectedClassSubject(classSubjects[0].id);
    }
  }, [selectedClass, selectedTerm, classSubjects, selectedClassSubject]);

  const handleGradeEntry = (assessmentId: string) => {
    navigate(`/assessments/${assessmentId}/grades`);
  };

  const handleCreateAssessment = () => {
    if (!selectedClass || !selectedTerm) {
      toast.error('Please select a class and term first');
      return;
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAssessment(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assessments</h1>
          {activeYear && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Academic Year {activeYear.year}{activeYear.isActive ? ' (Active)' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b pb-1">
          <TabsList className="h-10">
            <TabsTrigger value="assessments" className="flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4" />
              Assessments
            </TabsTrigger>
            <TabsTrigger value="weights" className="flex items-center gap-1.5">
              <Scale className="h-4 w-4" />
              Weights
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Create button only on assessments tab */}
          {activeTab === 'assessments' && (
            <Button size="sm" onClick={handleCreateAssessment} disabled={!selectedClass || !selectedTerm}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Assessment
            </Button>
          )}
        </div>

        {/* ─── ASSESSMENTS TAB ─── */}
        <TabsContent value="assessments" className="mt-4 space-y-4">
          {/* Compact Filter Bar */}
          <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 border">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div className="w-40">
                <Select value={selectedTerm} onValueChange={(v) => { setSelectedTerm(v); setSelectedClassSubject(''); }} disabled={isLoadingYear}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedClassSubject(''); }}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-52">
                <Select value={selectedClassSubject} onValueChange={setSelectedClassSubject} disabled={!selectedClass}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {classSubjects.map((cs: any) => (
                      <SelectItem key={cs.id} value={cs.id}>
                        {cs.subject?.name || 'Unknown'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Assessment List */}
          {selectedTerm ? (
            <AssessmentList
              termId={selectedTerm}
              classSubjectId={selectedClassSubject !== 'all' ? selectedClassSubject : undefined}
              onGradeEntry={handleGradeEntry}
            />
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              {isLoadingYear ? 'Loading...' : 'Select a term to view assessments'}
            </div>
          )}
        </TabsContent>

        {/* ─── WEIGHTS TAB ─── */}
        <TabsContent value="weights" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 border">
            <div className="w-40">
              <Select value={selectedTerm} onValueChange={(v) => { setSelectedTerm(v); setSelectedClassSubject(''); }} disabled={isLoadingYear}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedClassSubject(''); }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-52">
              <Select value={selectedClassSubject} onValueChange={setSelectedClassSubject} disabled={!selectedClass}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {classSubjects.map((cs: any) => (
                    <SelectItem key={cs.id} value={cs.id}>
                      {cs.subject?.name || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedTerm && selectedClassSubject && selectedClassSubject !== 'all' ? (
            <WeightConfiguration termId={selectedTerm} classSubjectId={selectedClassSubject} />
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              Select a term, class, and subject to configure weights
            </div>
          )}
        </TabsContent>

        {/* ─── REPORTS TAB ─── */}
        <TabsContent value="reports" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 border">
            <div className="w-40">
              <Select value={selectedTerm} onValueChange={setSelectedTerm} disabled={isLoadingYear}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" variant="outline" disabled>
              <FileText className="h-4 w-4 mr-1.5" />
              Generate Reports
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center h-60 text-sm text-muted-foreground gap-3 border rounded-lg">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <p>Select a class and term to generate CBC report cards</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/assessments/reports')}>
              Go to Reports Page
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Assessment Form Modal */}
      <AssessmentForm
        open={showForm}
        onOpenChange={handleCloseForm}
        mode={editingAssessment ? 'edit' : 'create'}
        assessment={editingAssessment}
        termId={selectedTerm}
        classSubjectId={selectedClassSubject || ''}
      />
    </div>
  );
}