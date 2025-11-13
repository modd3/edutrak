import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog';
  import { Button } from '@/components/ui/button';
  import { Badge } from '@/components/ui/badge';
  import { User } from '@/types';
  import {
    User as UserIcon,
    Mail,
    Phone,
    CreditCard,
    School,
    Calendar,
    Shield,
    Users,
    BookOpen,
    GraduationCap,
    UserCheck,
  } from 'lucide-react';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
  
  interface UserDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User;
  }
  
  const ROLE_LABELS = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent',
  SUPPORT_STAFF: 'Support Staff',
};

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export function UserDetailsModal({ open, onOpenChange, user }: UserDetailsModalProps) {
  const fullName = `${user.firstName} ${user.middleName || ''} ${user.lastName}`.trim();

  const basicInfo = [
    { label: 'Email', value: user.email, icon: Mail },
    { label: 'Phone', value: user.phone || 'Not provided', icon: Phone },
    { label: 'ID Number', value: user.idNumber || 'Not provided', icon: CreditCard },
    { label: 'Role', value: ROLE_LABELS[user.role as keyof typeof ROLE_LABELS], icon: Shield },
    { label: 'School', value: user.school?.name || 'Not assigned', icon: School },
    { label: 'Status', value: user.isActive ? 'Active' : 'Inactive', icon: UserCheck },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {fullName}
          </DialogTitle>
          <DialogDescription>
          Complete user profile and activity information
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto pr-4">
          {/* User Header */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">
                {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
              </Badge>
              {user.school && (
                <Badge variant="outline">{user.school.name}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="role" disabled={!user.student && !user.teacher && !user.guardian}>
                Role Details
              </TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
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

            {/* Role-Specific Details Tab */}
            <TabsContent value="role" className="space-y-4">
              {user.student && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Student Profile
                    </CardTitle>
                    <CardDescription>Student-specific information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Admission No</p>
                        <p className="text-sm font-semibold">{user.student.admissionNo}</p>
                      </div>
                      {user.student.enrollments && user.student.enrollments.length > 0 && (
                        <>
                          <div>
                          <p className="text-sm font-medium text-muted-foreground">Current Class</p>
                            <p className="text-sm font-semibold">
                              {user.student.enrollments[0].class.name}
                            </p>
                          </div>
                          {user.student.enrollments[0].stream && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Stream</p>
                              <p className="text-sm font-semibold">
                                {user.student.enrollments[0].stream.name}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {user.student.guardians && user.student.guardians.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Guardians</h4>
                        <div className="space-y-2">
                          {user.student.guardians.map((sg, idx) => (
                            <div key={idx} className="p-2 border rounded-lg">
                              <p className="text-sm font-medium">
                                {sg.guardian?.user?.firstName} {sg.guardian?.user?.lastName}
                                {sg.isPrimary && (
                                  <Badge variant="outline" className="ml-2">Primary</Badge>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {sg.guardian?.user?.email} • {sg.guardian?.user?.phone}
                              </p>
                            </div>
                          ))}
                        </div>
                        </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {user.teacher && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Teacher Profile
                    </CardTitle>
                    <CardDescription>Teaching information and assignments</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">TSC Number</p>
                        <p className="text-sm font-semibold">{user.teacher.tscNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Employment Type</p>
                        <p className="text-sm font-semibold">
                          {user.teacher.employmentType.replace('_', ' ')}
                        </p>
                      </div>
                    </div>

                    {user.teacher.classTeacherOf && user.teacher.classTeacherOf.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Class Teacher Of</h4>
                        <div className="space-y-2">
                          {user.teacher.classTeacherOf.map((cls, idx) => (
                            <div key={idx} className="p-2 border rounded-lg">
                                <p className="text-sm font-medium">{cls.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {cls?.school?.name} • {cls?.academicYear?.year}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {user.teacher.teachingSubjects && user.teacher.teachingSubjects.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          Teaching Subjects ({user.teacher.teachingSubjects.length})
                        </h4>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                          {user.teacher.teachingSubjects.map((ts, idx) => (
                            <div key={idx} className="p-2 border rounded-lg text-xs">
                              <p className="font-medium">{ts?.subject?.name}</p>
                              <p className="text-muted-foreground">
                                {ts?.class?.name} • {ts?.term?.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {user.guardian && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                      Guardian Profile
                    </CardTitle>
                    <CardDescription>Guardian information and wards</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Relationship</p>
                        <p className="text-sm font-semibold">{user.guardian.relationship}</p>
                      </div>
                      {user.guardian.occupation && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Occupation</p>
                          <p className="text-sm font-semibold">{user.guardian.occupation}</p>
                        </div>
                      )}
                    </div>

                    {user.guardian.students && user.guardian.students.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          Wards ({user.guardian.students.length})
                        </h4>
                        <div className="space-y-2">
                          {user.guardian.students.map((sg, idx) => (
                            <div key={idx} className="p-2 border rounded-lg">
                              <p className="text-sm font-medium">
                                {sg.student.firstName} {sg.student.lastName}
                                {sg.isPrimary && (
                                  <Badge variant="outline" className="ml-2">Primary Ward</Badge>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {sg.student.school?.name} • Admission No: {sg.student.admissionNo}
                                </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>User activity and logs</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Activity tracking coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Information Tab */}
            <TabsContent value="system" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Account Created
                    </CardTitle>
                    </CardHeader>
                  <CardContent>
                    <p className="text-sm">{formatDate(user.createdAt)}</p>
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
                    <p className="text-sm">{formatDate(user.updatedAt)}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>User ID</CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="text-xs bg-muted p-2 rounded block">
                    {user.id}
                  </code>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Edit User
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}