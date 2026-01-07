import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Teacher } from '@/types';
import {
  Briefcase,
  Mail,
  Phone,
  CreditCard,
  School,
  Calendar,
  Award,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { TeacherFormModal } from './TeacherFormModal';

interface TeacherDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: Teacher;
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const InfoItem = ({
  label,
  value,
  badge,
}: {
  label: string;
  value: string | number | undefined;
  badge?: boolean;
}) => (
  <div className="flex items-start gap-3">
    <div className="flex-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {badge ? (
        <Badge variant="outline" className="mt-1">
          {value}
        </Badge>
      ) : (
        <p className="text-sm font-semibold mt-1">{value || 'Not provided'}</p>
      )}
    </div>
  </div>
);

export function TeacherDetailsModal({ open, onOpenChange, teacher }: TeacherDetailsModalProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const fullName = `${teacher.user?.firstName} ${teacher.user?.middleName || ''} ${teacher.user?.lastName}`.trim();

  const basicInfo = [
    { label: 'Email', value: teacher.user?.email, icon: Mail },
    { label: 'Phone', value: teacher.user?.phone || 'Not provided', icon: Phone },
    { label: 'ID Number', value: teacher.user?.idNumber || 'Not provided', icon: CreditCard },
    { label: 'School', value: teacher.user?.school?.name || 'Not assigned', icon: School },
    { label: 'Status', value: teacher.user?.isActive ? 'Active' : 'Inactive', icon: AlertCircle },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {fullName}
            </DialogTitle>
            <DialogDescription>
              Complete teacher profile and information
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto pr-4">
            {/* Teacher Header */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant={teacher.user?.isActive ? 'default' : 'secondary'}>
                  {teacher.user?.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">Teacher</Badge>
                {teacher.user?.school && (
                  <Badge variant="outline">{teacher.user.school.name}</Badge>
                )}
                <Badge variant="outline">{teacher.employmentType}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{teacher.user?.email}</p>
            </div>

            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="profile">Professional</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
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
              </TabsContent>

              {/* Professional Tab */}
              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Professional Information
                    </CardTitle>
                    <CardDescription>Teaching credentials and qualifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoItem label="TSC Number" value={teacher.tscNumber} />
                      <InfoItem
                        label="Employment Type"
                        value={teacher.employmentType.replace(/_/g, ' ')}
                      />
                      <InfoItem
                        label="Employee Number"
                        value={teacher.employeeNumber || 'Not specified'}
                      />
                      <InfoItem
                        label="Qualification"
                        value={teacher.qualification || 'Not specified'}
                      />
                      <InfoItem
                        label="Specialization"
                        value={teacher.specialization || 'Not specified'}
                      />
                      <InfoItem
                        label="Date Joined"
                        value={
                          teacher.dateJoined ? formatDate(teacher.dateJoined) : 'Not specified'
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Assignments Tab */}
              <TabsContent value="assignments" className="space-y-4">
                {teacher.classTeacherOf && teacher.classTeacherOf.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Class Teacher Responsibilities
                      </CardTitle>
                      <CardDescription>Classes under your care</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {teacher.classTeacherOf.map((cls, idx) => (
                          <div key={idx} className="p-3 border rounded-lg">
                            <p className="text-sm font-medium">{cls.name}</p>
                            <div className="text-xs text-muted-foreground mt-1">
                              {cls.school?.name} • Academic Year: {cls.academicYear?.year}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground text-center">
                        No class teacher assignments yet
                      </p>
                    </CardContent>
                  </Card>
                )}

                {teacher.teachingSubjects && teacher.teachingSubjects.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Teaching Assignments ({teacher.teachingSubjects.length})
                      </CardTitle>
                      <CardDescription>Subjects and classes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                        {teacher.teachingSubjects.map((ts, idx) => (
                          <div key={idx} className="p-3 border rounded-lg text-sm">
                            <div className="font-medium">{ts.subject?.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {ts.class?.name} • {ts.term?.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground text-center">
                        No teaching assignments yet
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* System Information Tab */}
              <TabsContent value="system" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Record Created
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{formatDate(teacher.createdAt)}</p>
                      <p className="text-sm">
                        {new Date(teacher.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </p>
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
                      <p className="text-sm">{formatDate(teacher.updatedAt)}</p>
                      <p className="text-sm">
                        {new Date(teacher.updatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Record IDs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Teacher ID</p>
                      <code className="text-xs bg-muted p-2 rounded block break-all">
                        {teacher.id}
                      </code>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">User ID</p>
                      <code className="text-xs bg-muted p-2 rounded block break-all">
                        {teacher.userId}
                      </code>
                    </div>
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
              Edit Teacher
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Modal */}
      <TeacherFormModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        mode="edit"
        teacher={teacher}
      />
    </>
  );
}
