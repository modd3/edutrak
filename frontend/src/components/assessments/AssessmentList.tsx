// src/components/assessments/AssessmentList.tsx

import { useState } from 'react';
import { MoreHorizontal, Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { useAssessments, useDeleteAssessment } from '@/hooks/use-assessments';
import { AssessmentForm } from './AssessmentForm';
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
};

export function AssessmentList({ termId, classSubjectId, onGradeEntry }: AssessmentListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useAssessments({ termId, classSubjectId });
  const deleteMutation = useDeleteAssessment();

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

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAssessment(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const assessments = data?.data || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assessments</CardTitle>
              <CardDescription>
                Manage assessments for this term
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Assessment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                No assessments
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new assessment.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Assessment
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Max Marks</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment: any) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">
                      {assessment.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={ASSESSMENT_TYPE_COLORS[assessment.type]}
                        variant="secondary"
                      >
                        {assessment.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assessment.classSubject?.subject?.name}
                    </TableCell>
                    <TableCell>
                      {assessment.maxMarks || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {assessment._count?.results || 0} entered
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {onGradeEntry && (
                            <DropdownMenuItem
                              onClick={() => onGradeEntry(assessment.id)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Enter Grades
                            </DropdownMenuItem>
                          )}
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              assessment and all associated results.
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
