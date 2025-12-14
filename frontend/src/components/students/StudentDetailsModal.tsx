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
  Calendar,
  Users,
  Heart,
  AlertCircle,
  MapPin,
  FileText,
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

export function StudentDetailsModal({ open, onOpenChange, student }: StudentDetailsModalProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim();

  const basicInfo = [
    { label: 'Admission Number', value: student.admissionNo, icon: FileText },
    { label: 'Gender', value: student.gender, icon: Users },
    { label: 'Date of Birth', value: student.dob ? formatDate(student.dob) : 'Not provided', icon: Calendar },
    { label: 'Birth Certificate', value: student.birthCertNo || 'Not provided', icon: CreditCard },
    { label: 'UPI Number', value: student.upiNumber || 'Not assigned', icon: FileText },
    { label: 'KEMIS UPI', value: student.kemisUpi || 'Not assigned', icon: FileText },
  ];

  const locationInfo = [
    { label: 'Nationality', value: student.nationality || 'Not provided', icon: MapPin },
    { label: 'County', value: student.county || 'Not provided', icon: MapPin },
    { label: 'Sub County', value: student.subCounty || 'Not provided', icon: MapPin },
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
              Complete student profile and enrollment information
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto pr-4">
            {/* Student Header */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="default">{student.admissionNo}</Badge>
                <Badge variant="outline">{student.gender}</Badge>
                {student.hasSpecialNeeds && (
                  <Badge variant="secondary">Special Needs</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {student.school?.name || 'School not assigned'}
              </p>
            </div>

            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
                <TabsTrigger value="guardians">Guardians</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {basicInfo.map((item, index) => (
                        <InfoItem key={index} {...item} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Location Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {locationInfo.map((item, index) => (
                        <InfoItem key={index} {...item} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Created
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{formatDate(student.createdAt)}</p>
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
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Enrollment Tab */}
              <TabsContent value="enrollment" className="space-y-4">
                {student.enrollments && student.enrollments.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Enrollment</CardTitle>
                      <CardDescription>Class and stream assignments</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {student.enrollments.map((enrollment, idx) => (
                        <div key={idx} className="p-4 border rounded-lg space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <InfoItem 
                              label="Class" 
                              value={enrollment.class?.name || 'N/A'} 
                              icon={GraduationCap}
                            />
                            <InfoItem 
                              label="Stream" 
                              value={enrollment.stream?.name || 'Not assigned'} 
                              icon={Users}
                            />
                            <InfoItem 
                              label="Academic Year" 
                              value={enrollment.academicYear?.year?.toString() || 'N/A'} 
                              icon={Calendar}
                            />
                            <div className="flex items-start gap-3">
                              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground">Status</p>
                                <Badge variant={enrollment.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                  {enrollment.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No enrollment records found</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Guardians Tab */}
              <TabsContent value="guardians" className="space-y-4">
                {student.guardians && student.guardians.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Guardians ({student.guardians.length})</CardTitle>
                      <CardDescription>Parent and guardian information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {student.guardians.map((sg, idx) => (
                          <div key={idx} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-medium">
                                {sg.guardian?.user?.firstName} {sg.guardian?.user?.lastName}
                              </p>
                              {sg.isPrimary && (
                                <Badge variant="default" className="text-xs">Primary</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span>{sg.guardian?.user?.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{sg.guardian?.user?.phone || 'Not provided'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span>{sg.relationship}</span>
                              </div>
                              {sg.guardian?.occupation && (
                                <div className="flex items-center gap-2 text-sm">
                                  <GraduationCap className="h-3 w-3 text-muted-foreground" />
                                  <span>{sg.guardian.occupation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No guardians assigned</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Medical Tab */}
              <TabsContent value="medical" className="space-y-4">
                {student.hasSpecialNeeds && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                          Special Needs
                        </p>
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          {student.specialNeedsType || 'Type not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Medical Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {student.medicalCondition || student.allergies ? (
                      <div className="space-y-3">
                        {student.medicalCondition && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Medical Conditions
                            </p>
                            <p className="text-sm">{student.medicalCondition}</p>
                          </div>
                        )}
                        {student.allergies && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Allergies
                            </p>
                            <p className="text-sm">{student.allergies}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No medical conditions or allergies recorded
                      </p>
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
      {showEditModal && (
        <StudentFormModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          mode="edit"
          student={student}
        />
      )}
    </>
  );
}

// Helper component
function InfoItem({ 
  label, 
  value, 
  icon: Icon 
}: { 
  label: string; 
  value: string; 
  icon: any;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}