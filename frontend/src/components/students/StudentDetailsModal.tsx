// src/components/students/StudentDetailsModal.tsx
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
import { Student } from '@/types';
import {
  GraduationCap,
  Mail,
  Phone,
  CreditCard,
  School,
  Calendar,
  Heart,
  AlertCircle,
  Users,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StudentFormModal } from './StudentFormModal';

interface StudentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
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

export function StudentDetailsModal({ open, onOpenChange, student }: StudentDetailsModalProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim();

  const basicInfo = [
    { label: 'Email', value: student.user?.email, icon: Mail },
    { label: 'Phone', value: student.user?.phone || 'Not provided', icon: Phone },
    { label: 'ID Number', value: student.user?.idNumber || 'Not provided', icon: CreditCard },
    { label: 'Admission Number', value: student.admissionNo, icon: GraduationCap },
    { label: 'School', value: student.user?.school?.name || 'Not assigned', icon: School },
    { label: 'Status', value: student.user?.isActive ? 'Active' : 'Inactive', icon: AlertCircle },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {fullName}
            </DialogTitle>
            <DialogDescription>
              Complete student profile and academic information
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto pr-4">
            {/* Student Header */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant={student.user?.isActive ? 'default' : 'secondary'}>
                  {student.user?.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">Student</Badge>
                {student.user?.school && (
                  <Badge variant="outline">{student.user.school.name}</Badge>
                )}
                <Badge variant="outline">{student.admissionNo}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{student.user?.email}</p>
            </div>

            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
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

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Student Information
                    </CardTitle>
                    <CardDescription>Personal and academic details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoItem label="Admission Number" value={student.admissionNo} />
                      <InfoItem label="Gender" value={student.gender} />
                      <InfoItem
                        label="Date of Birth"
                        value={student.dob ? formatDate(student.dob) : 'Not provided'}
                      />
                      <InfoItem label="Birth Certificate" value={student.birthCertNo || 'Not provided'} />
                      <InfoItem label="UPI Number" value={student.upiNumber || 'Not assigned'} />
                      <InfoItem label="KEMIS UPI" value={student.kemisUpi || 'Not assigned'} />
                      <InfoItem label="Nationality" value={student.nationality || 'Not provided'} />
                      <InfoItem label="County" value={student.county || 'Not provided'} />
                      <InfoItem label="Sub County" value={student.subCounty || 'Not provided'} />
                    </div>

                    {student.hasSpecialNeeds && (
                      <>
                        <Separator />
                        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                                Special Needs
                              </p>
                              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                                {student.specialNeedsType || 'Type not specified'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {(student.medicalCondition || student.allergies) && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-500" />
                            <h4 className="text-sm font-semibold">Medical Information</h4>
                          </div>
                          {student.medicalCondition && (
                            <InfoItem label="Medical Condition" value={student.medicalCondition} />
                          )}
                          {student.allergies && (
                            <InfoItem label="Allergies" value={student.allergies} />
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Enrollment Tab */}
              <TabsContent value="enrollment" className="space-y-4">
                {student.enrollments && student.enrollments.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Enrollment</CardTitle>
                      <CardDescription>Class and stream information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {student.enrollments.map((enrollment, idx) => (
                          <div key={idx} className="p-3 border rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <InfoItem label="Class" value={enrollment.class?.name} />
                              <InfoItem
                                label="Stream"
                                value={enrollment.stream?.name || 'Not assigned'}
                              />
                              <InfoItem
                                label="Academic Year"
                                value={enrollment.academicYear?.year?.toString() || 'N/A'}
                              />
                              <InfoItem
                                label="Status"
                                value={enrollment.status}
                                badge
                              />
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
                        Not enrolled in any class yet
                      </p>
                    </CardContent>
                  </Card>
                )}

                {student.guardians && student.guardians.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Guardians ({student.guardians.length})
                      </CardTitle>
                      <CardDescription>Parent and guardian information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {student.guardians.map((sg, idx) => (
                          <div key={idx} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium">
                                {sg.guardian?.user?.firstName} {sg.guardian?.user?.lastName}
                              </p>
                              {sg.isPrimary && (
                                <Badge variant="default" className="text-xs">
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {sg.guardian?.user?.email || 'N/A'}
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {sg.guardian?.user?.phone || 'N/A'}
                              </div>
                              {sg.guardian?.relationship && (
                                <div className="col-span-2">
                                  Relationship: {sg.guardian.relationship}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
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
                      <p className="text-sm">{formatDate(student.createdAt)}</p>
                      <p className="text-sm">
                        {new Date(student.createdAt).toLocaleTimeString([], {
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
                      <p className="text-sm">{formatDate(student.updatedAt)}</p>
                      <p className="text-sm">
                        {new Date(student.updatedAt).toLocaleTimeString([], {
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
                      <p className="text-xs text-muted-foreground mb-1">Student ID</p>
                      <code className="text-xs bg-muted p-2 rounded block break-all">
                        {student.id}
                      </code>
                    </div>
                    {student.userId && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">User ID</p>
                        <code className="text-xs bg-muted p-2 rounded block break-all">
                          {student.userId}
                        </code>
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
              Edit Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Student Modal */}
      <StudentFormModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        mode="edit"
        student={student}
      />
    </>
  );
}
