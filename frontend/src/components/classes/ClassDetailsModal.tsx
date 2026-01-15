// src/components/classes/ClassDetailsModal.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Class, Stream } from '@/types';
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
import { SubjectAssignmentModal } from '../subjects/SubjectAssignmentModal'; // Import the SubjectAssignmentModal
import { useClassStreams, useDeleteStream } from '@/hooks/use-academic';
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

export function ClassDetailsModal({ open, onOpenChange, classData }: ClassDetailsModalProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false); // State for subject modal
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  
  // Fetch streams for this class
  const { data: streamsData, isLoading: isLoadingStreams, isError } = useClassStreams(classData.id);
  const { mutate: deleteStream, isPending: isDeletingStream } = useDeleteStream();

  console.log("ClassDetailsModal - Streams Data: ", streamsData);
  console.log("ClassDetailsModal - Class Data: ", classData);
  console.log("ClassDetailsModal - Class Teacher firstname Data: ", classData.classTeacher?.firstName);
  
  const streams = streamsData?.data || [];
  console.log("ClassDetailsModal - Streams array: ", streams);

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
              </div>
              <p className="text-sm text-muted-foreground">
                {classData.school?.name} • Academic Year: {classData.academicYear?.year}
              </p>
            </div>

            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="streams">
                  Streams ({streams.length})
                </TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="subjects">Subjects</TabsTrigger>
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
                      <span>Subjects</span>
                      <Button size="sm" onClick={() => setShowSubjectModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Assign Subject
                      </Button>
                    </CardTitle>
                    <CardDescription>Subjects taught in this class</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Subject assignments coming soon...
                    </p>
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
      <SubjectAssignmentModal
        open={showSubjectModal}
        onOpenChange={setShowSubjectModal}
        classId={classData.id}
        academicYearId={classData.academicYear?.id || ''}
        termId={classData.academicYear?.activeTermId || ''} // You might need to get this from your data
      />

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