// src/components/classes/ClassDetailsModal.tsx
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Class, Stream, Term } from '@/types';
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  User,
  Plus,
  Edit,
  Trash,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ClassFormModal } from './ClassFormModal';
import { StreamFormModal } from './StreamFormModal';
import { SubjectAssignmentModal } from '../subjects/SubjectAssignmentModal';
import { useClassStreams, useDeleteStream, useActiveAcademicYear } from '@/hooks/use-academic';
import {useClassSubjects} from '@/hooks/use-class-subjects';
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
import { toast } from 'sonner';

interface ClassDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: Class;
}

const CURRICULUM_LABELS = {
  CBC: 'CBC (Competency Based)',
  EIGHT_FOUR_FOUR: '8-4-4 System',
  TVET: 'TVET',
  IGCSE: 'IGCSE',
  IB: 'IB',
};

const PATHWAY_LABELS = {
  STEM: 'STEM',
  ARTS_SPORTS: 'Arts & Sports',
  SOCIAL_SCIENCES: 'Social Sciences',
};

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Helper function to find active term based on current date
const findActiveTerm = (terms: Term[]): Term | null => {
  if (!terms) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  for (const term of terms) {
    const startDate = new Date(term.startDate);
    const endDate = new Date(term.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999); 

    if (today >= startDate && today <= endDate) {
      return term;
    }
  }
  return null;
};

// Helper function to get term display name
const getTermDisplayName = (term: Term): string => {
  const termNumber = term.termNumber || term.name?.split('_')[1] || 'N/A';
  return `Term ${termNumber}`;
};

export function ClassDetailsModal({ open, onOpenChange, classData }: ClassDetailsModalProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  
  // Fetch streams for this class
  const { data: streamsData, isLoading: isLoadingStreams } = useClassStreams(classData.id);
  const { mutate: deleteStream, isPending: isDeletingStream } = useDeleteStream();
  const { data: activeAcademicYear } = useActiveAcademicYear();
  
   // Find active term based on current date
  const activeTerm = useMemo(() => {
    const terms = activeAcademicYear?.terms || [];
    return findActiveTerm(terms);
  }, [activeAcademicYear?.terms]);

  // Fetch subjects for this class
  const { data: subjectsData, isLoading: isLoadingSubjects } = useClassSubjects(classData.id, activeAcademicYear?.id || '', activeTerm?.id || '') ;

  const streams = streamsData?.data || [];
  const subjects = subjectsData?.data.data || [];
  console.log("subjects: ", subjects);
  console.log("subjectsData: ", subjectsData);

   

  // Safe access to terms
  const terms = activeAcademicYear?.terms || [];
  const hasTerms = terms.length > 0;

  // Basic class information
  const basicInfo = [
    { label: 'Class Name', value: classData.name, icon: GraduationCap },
    { label: 'Level', value: classData.level, icon: BookOpen },
    { 
      label: 'Curriculum', 
      value: CURRICULUM_LABELS[classData.curriculum as keyof typeof CURRICULUM_LABELS] || classData.curriculum, 
      icon: BookOpen 
    },
    { 
      label: 'Pathway', 
      value: classData.pathway ? PATHWAY_LABELS[classData.pathway as keyof typeof PATHWAY_LABELS] || classData.pathway : 'N/A', 
      icon: BookOpen 
    },
    { 
      label: 'Academic Year', 
      value: classData.academicYear?.year?.toString() || 'N/A', 
      icon: Calendar 
    },
    { 
      label: 'Current Term', 
      value: activeTerm 
        ? `${getTermDisplayName(activeTerm)} (${formatDate(activeTerm.startDate)} - ${formatDate(activeTerm.endDate)})`
        : 'No active term detected',
      icon: Calendar 
    },
    { 
      label: 'Class Teacher', 
      value: classData.classTeacher?.user
        ? `${classData.classTeacher.user?.firstName} ${classData.classTeacher.user?.lastName}`
        : 'Not assigned', 
      icon: User 
    },
  ];

  const handleDeleteStream = (stream: Stream) => {
    setSelectedStream(stream);
    setShowDeleteDialog(true);
  };

  const confirmDeleteStream = () => {
    if (selectedStream) {
      deleteStream(selectedStream.id, {
        onSuccess: () => {
          toast.success('Stream deleted successfully');
          setShowDeleteDialog(false);
          setSelectedStream(null);
        },
      });
    }
  };

  // Log streams and subjects when assign subject button is clicked
  const handleAssignSubjectClick = () => {
    console.log('=== Assign Subject Button Clicked ===');
    console.log('Class Details:', {
      id: classData.id,
      name: classData.name,
      level: classData.level,
      curriculum: classData.curriculum,
    });
    
    console.log('Available Streams:', streams.map(stream => ({
      id: stream.id,
      name: stream.name,
      capacity: stream.capacity,
      studentCount: stream._count?.students || 0,
      teacher: stream.streamTeacher?.user 
        ? `${stream.streamTeacher.user.firstName} ${stream.streamTeacher.user.lastName}`
        : 'Not assigned'
    })));
    
    console.log('Existing Subjects:', subjects.map(subject => ({
      id: subject.id,
      name: subject.subject?.name || subject.name,
      code: subject.subject?.code,
      category: subject.category,
      teacher: subject.teacher?.user 
        ? `${subject.teacher.user.firstName} ${subject.teacher.user.lastName}`
        : 'Not assigned'
    })));
    
    console.log('Academic Terms:', terms.map(term => ({
      id: term.id,
      name: term.name,
      termNumber: term.termNumber,
      startDate: term.startDate,
      endDate: term.endDate,
      displayName: getTermDisplayName(term)
    })));
    
    console.log('Active Term:', activeTerm ? {
      id: activeTerm.id,
      name: activeTerm.name,
      termNumber: activeTerm.termNumber,
      startDate: activeTerm.startDate,
      endDate: activeTerm.endDate,
    } : 'No active term');
    
    console.log('=== End Log ===');
    setShowSubjectModal(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {classData.name}
            </DialogTitle>
            <DialogDescription>
              Complete class information and management
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto pr-4">
            {/* Class Header */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="default">
                  {CURRICULUM_LABELS[classData.curriculum as keyof typeof CURRICULUM_LABELS] || classData.curriculum}
                </Badge>
                <Badge variant="outline">{classData.level}</Badge>
                {classData.pathway && (
                  <Badge variant="secondary">
                    {PATHWAY_LABELS[classData.pathway as keyof typeof PATHWAY_LABELS] || classData.pathway}
                  </Badge>
                )}
                {classData.academicYear?.isActive && (
                  <Badge variant="default">Active Year</Badge>
                )}
                {activeTerm && (
                  <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">
                    {getTermDisplayName(activeTerm)} Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {classData.school?.name} • Academic Year: {classData.academicYear?.year}
                {activeTerm && ` • Current Term: ${getTermDisplayName(activeTerm)}`}
              </p>
            </div>

            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="streams">
                  Streams ({streams.length})
                </TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="subjects">
                  Subjects ({subjects.length})
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {basicInfo.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                      <item.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="text-sm font-semibold">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Terms Information */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Academic Terms</h3>
                  {hasTerms ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {terms.map((term: Term) => {
                        const isActive = activeTerm?.id === term.id;
                        const isPast = new Date(term.endDate) < new Date();
                        const isFuture = new Date(term.startDate) > new Date();
                        
                        return (
                          <Card key={term.id} className={isActive ? 'border-primary border-2' : ''}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">
                                  {getTermDisplayName(term)}
                                </CardTitle>
                                {isActive && (
                                  <Badge variant="default" className="ml-2">Active</Badge>
                                )}
                                {isPast && (
                                  <Badge variant="outline" className="ml-2">Past</Badge>
                                )}
                                {isFuture && (
                                  <Badge variant="secondary" className="ml-2">Upcoming</Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Starts:</span>
                                  <span>{formatDate(term.startDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Ends:</span>
                                  <span>{formatDate(term.endDate)}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No terms defined for this academic year.</p>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Created
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{formatDate(classData.createdAt)}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Last Updated
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{formatDate(classData.updatedAt)}</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Streams Tab */}
              <TabsContent value="streams" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Class Streams</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage streams within this class
                    </p>
                  </div>
                  <Button size="sm" onClick={() => {
                    setSelectedStream(null);
                    setShowStreamModal(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stream
                  </Button>
                </div>

                {isLoadingStreams ? (
                  <div className="text-center py-8">Loading streams...</div>
                ) : streams.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No streams created yet</p>
                      <Button onClick={() => {
                        setSelectedStream(null);
                        setShowStreamModal(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Stream
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {streams.map((stream: Stream) => (
                      <Card key={stream.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{stream.name}</CardTitle>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedStream(stream);
                                  setShowStreamModal(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive"
                                onClick={() => handleDeleteStream(stream)}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <CardDescription>
                            Capacity: {stream.capacity || 'Unlimited'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Students:</span>
                              <span className="font-medium">
                                {stream._count?.students || 0}
                              </span>
                            </div>
                            {stream.streamTeacher?.user && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Stream Teacher:</span>
                                <span className="font-medium">
                                  {stream.streamTeacher.user?.firstName} {stream.streamTeacher.user?.lastName}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Students</CardTitle>
                    <CardDescription>Students enrolled in this class</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Student list coming soon...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Subjects Tab */}
              <TabsContent value="subjects" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Subjects ({subjects.length})</span>
                      <Button size="sm" onClick={handleAssignSubjectClick}>
                        <Plus className="h-4 w-4 mr-2" />
                        Assign Subject
                      </Button>
                    </CardTitle>
                    <CardDescription>Subjects taught in this class</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSubjects ? (
                      <div className="text-center py-4">Loading subjects...</div>
                    ) : subjects.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground mb-2">No subjects assigned yet.</p>
                        {hasTerms ? (
                          activeTerm ? (
                            <p className="text-sm text-muted-foreground">
                              Click "Assign Subject" to add subjects to this class for {getTermDisplayName(activeTerm)}.
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Click "Assign Subject" to add subjects to this class. You can select which term to assign the subject to.
                            </p>
                          )
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No terms available for this academic year. Please add terms first.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground mb-2">
                          Showing subjects assigned to this class
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {subjects.map((subject: any) => (
                            <div key={subject.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{subject.subject?.name || subject.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {subject.subject?.code} • {subject.category}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm">
                                  {subject.teacherProfile?.user 
                                    ? `${subject.teacherProfile.user.firstName} ${subject.teacherProfile.user.lastName}`
                                    : 'No teacher'}
                                </p>
                                <Badge variant="outline" className="mt-1">
                                  Term {subject.term?.termNumber || 'N/A'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => setShowEditModal(true)}>
              Edit Class
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Class Modal */}
      <ClassFormModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        mode="edit"
        classData={classData}
      />

      {/* Stream Form Modal */}
      <StreamFormModal
        open={showStreamModal}
        onOpenChange={(open) => {
          setShowStreamModal(open);
          if (!open) setSelectedStream(null);
        }}
        mode={selectedStream ? 'edit' : 'create'}
        stream={selectedStream || undefined}
        classId={classData.id}
      />

      {/* Subject Assignment Modal */}
      {hasTerms && (
        <SubjectAssignmentModal
          open={showSubjectModal}
          onOpenChange={setShowSubjectModal}
          classId={classData.id}
          academicYearId={classData.academicYear?.id || ''}
          terms={terms}
          streams={streams}
        />
      )}

      {/* Delete Stream Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stream</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete stream "{selectedStream?.name}"? 
              This action cannot be undone and will affect all students assigned to this stream.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingStream}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStream}
              disabled={isDeletingStream}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingStream ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
