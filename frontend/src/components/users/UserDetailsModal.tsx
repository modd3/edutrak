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
  Briefcase,
  Award,
  Heart,
  AlertCircle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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

  // Check if user has any role-specific profile
  const hasProfile = !!(user.role === 'STUDENT' || user.role === 'TEACHER' || user.role === 'PARENT');

  // Determine which profile tab to show
  const getProfileContent = () => {
    if (user.role === 'STUDENT') {
      return <StudentProfileTab user={user} />;
    }
    if (user.role === 'TEACHER') {
      return <TeacherProfileTab user={user} />;
    }
    if (user.role === 'PARENT') {
      return <GuardianProfileTab user={user} />;
    }
    console.log(hasProfile);
    console.log(user);
    return <NoProfileTab user={user} />;
  };

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
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="profile">
                {hasProfile ? 'Profile Details' : 'User Profile'}
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

            {/* Profile Tab - Always Active */}
            <TabsContent value="profile" className="space-y-4">
              {getProfileContent()}
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
                  <code className="text-xs bg-muted p-2 rounded block break-all">
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

// Student Profile Tab Component
function StudentProfileTab({ user }: { user: User }) {
  const student = user.student;
  console.log("Student: ", student);
  if (!student) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Student Information
          </CardTitle>
          <CardDescription>Academic and personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="Admission Number" value={student.admissionNo} />
            <InfoItem label="UPI Number" value={student.upiNumber || 'Not assigned'} />
            <InfoItem label="KEMIS UPI" value={student.kemisUpi || 'Not assigned'} />
            <InfoItem label="Gender" value={student.gender} />
            <InfoItem 
              label="Date of Birth" 
              value={student.dob ? formatDate(student.dob) : 'Not provided'} 
            />
            <InfoItem label="Birth Certificate" value={student.birthCertNo || 'Not provided'} />
            <InfoItem label="Nationality" value={student.nationality || 'Not provided'} />
            <InfoItem label="County" value={student.county || 'Not provided'} />
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

      {student.enrollments && student.enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Enrollment</CardTitle>
            <CardDescription>Class and stream information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label="Class" value={student?.enrollments[0].class.name} />
              <InfoItem 
                label="Stream" 
                value={student.enrollments[0].stream?.name || 'Not assigned'} 
              />
              <InfoItem 
                label="Academic Year" 
                value={student.enrollments[0].academicYear?.year?.toString() || 'N/A'} 
              />
              <InfoItem 
                label="Status" 
                value={student.enrollments[0].status} 
                badge 
              />
            </div>
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
                      <Badge variant="default" className="text-xs">Primary</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {sg.guardian?.user?.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {sg.guardian?.user?.phone || 'Not provided'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Teacher Profile Tab Component
function TeacherProfileTab({ user }: { user: User }) {
  const teacher = user.teacher;
  console.log("Teacher: ", teacher);
  console.log("User: ", user);
  if (!teacher) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Teacher Information
          </CardTitle>
          <CardDescription>Professional details and qualifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="TSC Number" value={teacher.tscNumber} />
            <InfoItem 
              label="Employment Type" 
              value={teacher.employmentType.replace('_', ' ')} 
            />
            <InfoItem label="Qualification" value={teacher.qualification || 'Not specified'} />
            <InfoItem label="Specialization" value={teacher.specialization || 'Not specified'} />
            <InfoItem 
              label="Date Joined" 
              value={teacher.dateJoined ? formatDate(teacher.dateJoined) : 'Not specified'} 
            />
          </div>
        </CardContent>
      </Card>

      {teacher.classTeacherOf && teacher.classTeacherOf.length > 0 && (
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
      )}

      {teacher.teachingSubjects && teacher.teachingSubjects.length > 0 && (
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
      )}
    </div>
  );
}

// Guardian Profile Tab Component
function GuardianProfileTab({ user }: { user: User }) {
  const guardian = user.guardian;
  console.log("Guardian: ", guardian);
  if (!guardian) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Guardian Information
          </CardTitle>
          <CardDescription>Personal and contact details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="Relationship" value={guardian.relationship} />
            <InfoItem label="Occupation" value={guardian.occupation || 'Not provided'} />
            <InfoItem label="Employer" value={guardian.employer || 'Not provided'} />
            <InfoItem label="Work Phone" value={guardian.workPhone || 'Not provided'} />
          </div>
        </CardContent>
      </Card>

      {guardian.students && guardian.students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Wards ({guardian.students.length})
            </CardTitle>
            <CardDescription>Students under your care</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {guardian.students.map((sg, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">
                      {sg.student.firstName} {sg.student.lastName}
                    </p>
                    {sg.isPrimary && (
                      <Badge variant="default" className="text-xs">Primary Ward</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">School:</span> {sg.student.school?.name}
                    </div>
                    <div>
                      <span className="font-medium">Admission No:</span> {sg.student.admissionNo}
                    </div>
                  </div>
                  {sg.student.enrollments && sg.student.enrollments.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">Class:</span>{' '}
                      {sg.student.enrollments[0].class?.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// No Profile Tab Component (for Admin, Super Admin, Support Staff)
function NoProfileTab({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          User Profile
        </CardTitle>
        <CardDescription>
          {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]} role information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Full Name" value={`${user.firstName} ${user.middleName || ''} ${user.lastName}`.trim()} />
          <InfoItem label="Email" value={user.email} />
          <InfoItem label="Phone" value={user.phone || 'Not provided'} />
          <InfoItem label="ID Number" value={user.idNumber || 'Not provided'} />
          <InfoItem label="Role" value={ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]} />
          <InfoItem label="School" value={user.school?.name || 'Not assigned'} />
        </div>

        <Separator />

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            This role does not require additional profile information. All relevant details are shown in the Basic Info tab.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for displaying information
function InfoItem({ 
  label, 
  value, 
  badge = false 
}: { 
  label: string; 
  value: string; 
  badge?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {badge ? (
        <Badge variant="outline" className="text-xs">{value}</Badge>
      ) : (
        <p className="text-sm font-semibold">{value}</p>
      )}
    </div>
  );
}