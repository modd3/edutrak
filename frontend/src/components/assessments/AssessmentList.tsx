// src/components/assessments/AssessmentList.tsx

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, FileText, Send, Play, CheckCircle, Lock } from 'lucide-react';
import { useAssessments, useDeleteAssessment, useUpdateAssessmentStatus } from '@/hooks/use-assessments';
import { AssessmentStatus } from '@/types';
import { AssessmentForm } from './AssessmentForm';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface AssessmentListProps {
  termId: string;
  classSubjectId?: string;
  onGradeEntry?: (assessmentId: string) => void;
}

const ASSESSMENT_TYPE_COLORS: Record<string, string> = {
  CAT: 'bg-blue-100 text-blue-800',
  MIDTERM: 'bg-purple-100 text-purple-800',
  END_OF_TERM: 'bg-green-100 text-green-800',
  MOCK: 'bg-yellow-100 text-yellow-800',
  NATIONAL_EXAM: 'bg-red-100 text-red-800',
  COMPETENCY_BASED: 'bg-indigo-100 text-indigo-800',
  FORMATIVE: 'bg-teal-100 text-teal-800',
  SUMMATIVE: 'bg-orange-100 text-orange-800',
  SBA: 'bg-cyan-100 text-cyan-800',
  DIAGNOSTIC: 'bg-gray-100 text-gray-800',
  KPSEA: 'bg-rose-100 text-rose-800',
  KJSEA: 'bg-fuchsia-100 text-fuchsia-800',
  GRADE_9_PLACEMENT: 'bg-violet-100 text-violet-800',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; nextAction?: { label: string; status: AssessmentStatus; icon: any } }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', nextAction: { label: 'Publish', status: AssessmentStatus.PUBLISHED, icon: Send } },
  PUBLISHED: { label: 'Published', color: 'bg-blue-100 text-blue-800', nextAction: { label: 'Start Grading', status: AssessmentStatus.GRADING_IN_PROGRESS, icon: Play } },
  GRADING_IN_PROGRESS: { label: 'Grading', color: 'bg-yellow-100 text-yellow-800', nextAction: { label: 'Publish Results', status: AssessmentStatus.RESULTS_PUBLISHED, icon: CheckCircle } },
  RESULTS_PUBLISHED: { label: 'Results Published', color: 'bg-green-100 text-green-800', nextAction: { label: 'Close', status: AssessmentStatus.CLOSED, icon: Lock } },
  CLOSED: { label: 'Closed', color: 'bg-red-100 text-red-800' },
};

export function AssessmentList({ termId, classSubjectId, onGradeEntry }: AssessmentListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useAssessments({ termId, classSubjectId });
  const deleteMutation = useDeleteAssessment();
  const statusMutation = useUpdateAssessmentStatus();

  const handleEdit = (assessment: any) => {
    setEditingAssessment(assessment);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteMutation.mutateAsync(deletingId);
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (assessmentId: string, newStatus: AssessmentStatus) => {
    await statusMutation.mutateAsync({ id: assessmentId, status: newStatus });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAssessment(null);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border p-4">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const assessments = data?.data || [];

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        {assessments.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <h3 className="mt-3 text-sm font-semibold text-muted-foreground">
              No assessments yet
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Select a subject and create your first assessment
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-medium">Name</TableHead>
                <TableHead className="font-medium">Type</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Subject</TableHead>
                <TableHead className="font-medium text-right">Results</TableHead>
                <TableHead className="font-medium text-right w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((assessment: any) => {
                const statusCfg = STATUS_CONFIG[assessment.status];
                return (
                  <TableRow key={assessment.id} className="group">
                    <TableCell className="font-medium">
                      {assessment.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={ASSESSMENT_TYPE_COLORS[assessment.type] || 'bg-gray-100 text-gray-800'}
                        variant="secondary"
                      >
                        {assessment.type?.replace('_', ' ') || assessment.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={statusCfg?.color || 'bg-gray-100 text-gray-800'}
                        variant="secondary"
                      >
                        {statusCfg?.label || assessment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {assessment.classSubject?.subject?.name || '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {assessment._count?.results || 0} entered
                      {assessment.maxMarks && (
                        <span className="ml-1 text-xs text-muted-foreground/60">
                          / {assessment.maxMarks} max
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="sr-only">Actions</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                            {assessment.name}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {onGradeEntry && (
                            <DropdownMenuItem onClick={() => onGradeEntry(assessment.id)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Enter Grades
                            </DropdownMenuItem>
                          )}
                          {statusCfg?.nextAction && (
                            <DropdownMenuItem onClick={() => handleStatusChange(assessment.id, statusCfg.nextAction!.status)}>
                              {(() => {
                                const Icon = statusCfg.nextAction!.icon;
                                return <Icon className="mr-2 h-4 w-4" />;
                              })()}
                              {statusCfg.nextAction!.label}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(assessment)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingId(assessment.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Assessment Form */}
      <AssessmentForm
        open={showForm}
        onOpenChange={handleCloseForm}
        mode={editingAssessment ? 'edit' : 'create'}
        assessment={editingAssessment}
        termId={termId}
        classSubjectId={classSubjectId || ''}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this assessment and all its results. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}