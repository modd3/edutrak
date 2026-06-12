// src/components/guardians/StudentGuardianManager.tsx
// Centralized component for managing student-guardian relationships
// Accessible from both student details and guardian details views
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Link2,
  Unlink,
  CheckCircle2,
  XCircle,
  Star,
  UserPlus,
  Search,
  Mail,
  Phone,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';

import {
  useStudentGuardians,
  useGuardianStudents,
  useLinkGuardianToStudent,
  useCreateGuardianAndLink,
  useUpdateStudentGuardian,
  useVerifyStudentGuardian,
  useUnlinkGuardian,
} from '@/hooks/use-student-guardians';
import type { StudentGuardianResponse } from '@/hooks/use-student-guardians';
import { useGuardians } from '@/hooks/use-guardians';
import { useStudents } from '@/hooks/use-students';
import { useSchoolContext } from '@/hooks/use-school-context';

// Schema for creating new guardian inline
const newGuardianSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  phone: z.string().optional(),
  idNumber: z.string().optional(),
  relationship: z.string().min(1, 'Relationship is required'),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  workPhone: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

type NewGuardianFormData = z.infer<typeof newGuardianSchema>;

const RELATIONSHIP_OPTIONS = [
  'Father',
  'Mother',
  'Guardian',
  'Uncle',
  'Aunt',
  'Grandparent',
  'Sibling',
  'Other',
];

interface StudentGuardianManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId?: string;
  guardianId?: string;
  mode: 'student' | 'guardian';
  studentName?: string;
  guardianName?: string;
}

export function StudentGuardianManager({
  open,
  onOpenChange,
  studentId,
  guardianId,
  mode,
  studentName,
  guardianName,
}: StudentGuardianManagerProps) {
  const { schoolId } = useSchoolContext();
  const [activeTab, setActiveTab] = useState('view');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRelationship, setEditingRelationship] = useState<{
    studentId: string;
    guardianId: string;
    currentRelationship: string | null;
    currentIsPrimary: boolean;
  } | null>(null);

  // Queries
  const { data: studentGuardianList = [] } = useStudentGuardians(
    mode === 'student' ? studentId || '' : ''
  );
  const { data: guardianStudentList = [] } = useGuardianStudents(
    mode === 'guardian' ? guardianId || '' : ''
  );

  // For linking existing guardians (in student mode)
  const { data: guardiansData } = useGuardians({
    search: searchQuery || undefined,
    pageSize: 20,
    page: 1,
  });
  const guardians = guardiansData?.data || [];

  // For linking existing students (in guardian mode)
  const { data: studentsData } = useStudents({
    schoolId: schoolId || '',
    search: searchQuery || undefined,
    pageSize: 20,
    page: 1,
  });
  const students = studentsData?.data || [];

  // Mutations
  const linkMutation = useLinkGuardianToStudent();
  const createAndLinkMutation = useCreateGuardianAndLink();
  const updateMutation = useUpdateStudentGuardian();
  const verifyMutation = useVerifyStudentGuardian();
  const unlinkMutation = useUnlinkGuardian();

  // Form for creating new guardian
  const newGuardianForm = useForm<NewGuardianFormData>({
    resolver: zodResolver(newGuardianSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      middleName: '',
      phone: '',
      idNumber: '',
      relationship: '',
      occupation: '',
      employer: '',
      workPhone: '',
      isPrimary: false,
    },
  });

  useEffect(() => {
    if (!open) {
      setActiveTab('view');
      setSearchQuery('');
      setEditingRelationship(null);
      newGuardianForm.reset();
    }
  }, [open, newGuardianForm]);

  // Link existing guardian to student
  const handleLinkGuardian = async (targetGuardianId: string) => {
    if (!studentId) return;
    try {
      await linkMutation.mutateAsync({
        studentId,
        guardianId: targetGuardianId,
        isPrimary: false,
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  // Link existing student to guardian
  const handleLinkStudent = async (targetStudentId: string) => {
    if (!guardianId) return;
    try {
      await linkMutation.mutateAsync({
        studentId: targetStudentId,
        guardianId,
        isPrimary: false,
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  // Create new guardian and link
  const handleCreateAndLink = async (data: NewGuardianFormData) => {
    if (!studentId) return;
    try {
      await createAndLinkMutation.mutateAsync({
        ...data,
        studentId,
      });
      newGuardianForm.reset();
      setActiveTab('view');
    } catch (error) {
      // Error handled in hook
    }
  };

  // Update relationship
  const handleUpdateRelationship = async (
    targetStudentId: string,
    targetGuardianId: string,
    updates: { relationship?: string; isPrimary?: boolean }
  ) => {
    try {
      await updateMutation.mutateAsync({
        studentId: targetStudentId,
        guardianId: targetGuardianId,
        data: updates,
      });
      setEditingRelationship(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  // Verify relationship
  const handleVerify = async (targetStudentId: string, targetGuardianId: string) => {
    try {
      await verifyMutation.mutateAsync({
        studentId: targetStudentId,
        guardianId: targetGuardianId,
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  // Unlink guardian from student
  const handleUnlink = async (targetStudentId: string, targetGuardianId: string) => {
    if (!confirm('Are you sure you want to remove this guardian from the student?')) return;
    try {
      await unlinkMutation.mutateAsync({
        studentId: targetStudentId,
        guardianId: targetGuardianId,
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  // Filter out already linked guardians/students
  const linkedGuardianIds = studentGuardianList.map((sg: StudentGuardianResponse) => sg.guardianId);
  const linkedStudentIds = guardianStudentList.map((sg: StudentGuardianResponse) => sg.studentId);
  const availableGuardians = (guardians || []).filter(
    (g: any) => !linkedGuardianIds.includes(g.id)
  );
  const availableStudents = (students || []).filter(
    (s: any) => !linkedStudentIds.includes(s.id)
  );

  const relationships: StudentGuardianResponse[] =
    mode === 'student' ? studentGuardianList : guardianStudentList;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {mode === 'student'
              ? `Manage Guardians - ${studentName || 'Student'}`
              : `Manage Students - ${guardianName || 'Guardian'}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'student'
              ? 'Link, create, or manage guardian relationships for this student.'
              : 'Link, create, or manage student relationships for this guardian.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="view">
              <Users className="h-4 w-4 mr-1" />
              Current ({relationships.length})
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link2 className="h-4 w-4 mr-1" />
              Link Existing
            </TabsTrigger>
            {mode === 'student' && (
              <TabsTrigger value="create">
                <UserPlus className="h-4 w-4 mr-1" />
                New Guardian
              </TabsTrigger>
            )}
          </TabsList>

          {/* VIEW TAB - Current relationships */}
          <TabsContent value="view" className="space-y-4">
            <ScrollArea className="max-h-[50vh]">
              {relationships.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No {mode === 'student' ? 'guardians' : 'students'} linked yet.</p>
                  <p className="text-sm">
                    Use the "Link Existing" tab to connect{' '}
                    {mode === 'student' ? 'a guardian' : 'a student'}.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {relationships.map((rel: StudentGuardianResponse) => (
                    <div
                      key={rel.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {mode === 'student' ? (
                              <span className="font-medium">
                                {rel.guardian?.user?.firstName} {rel.guardian?.user?.lastName}
                              </span>
                            ) : (
                              <span className="font-medium">
                                {rel.student?.firstName} {rel.student?.lastName}
                              </span>
                            )}
                            {rel.isPrimary && (
                              <Badge variant="default" className="text-xs gap-1">
                                <Star className="h-3 w-3" />
                                Primary
                              </Badge>
                            )}
                            {rel.isVerified ? (
                              <Badge variant="secondary" className="text-xs gap-1 bg-green-100 text-green-800">
                                <ShieldCheck className="h-3 w-3" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs gap-1 text-amber-600">
                                <XCircle className="h-3 w-3" />
                                Unverified
                              </Badge>
                            )}
                          </div>

                          {mode === 'student' ? (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {rel.guardian?.user?.email}
                              </div>
                              {rel.guardian?.user?.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {rel.guardian?.user?.phone}
                                </div>
                              )}
                              <div>
                                Relationship: {rel.relationship || rel.guardian?.relationship}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <GraduationCap className="h-3 w-3" />
                                {rel.student?.admissionNo}
                              </div>
                              {rel.student?.enrollments?.[0]?.class && (
                                <div>
                                  Class: {rel.student.enrollments[0].class.name}
                                  {rel.student.enrollments[0].stream && ` - ${rel.student.enrollments[0].stream.name}`}
                                </div>
                              )}
                              <div>
                                Relationship: {rel.relationship || 'Guardian'}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          {!rel.isVerified && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                mode === 'student'
                                  ? handleVerify(rel.studentId, rel.guardianId)
                                  : handleVerify(rel.studentId, rel.guardianId)
                              }
                              disabled={verifyMutation.isPending}
                              title="Verify relationship"
                            >
                              <ShieldCheck className="h-4 w-4 text-green-600" />
                            </Button>
                          )}

                          {editingRelationship?.guardianId === rel.guardianId &&
                          editingRelationship?.studentId === rel.studentId && editingRelationship ? (
                            <div className="flex items-center gap-1">
                              <Select
                                value={editingRelationship.currentRelationship || ''}
                                onValueChange={(v) =>
                                  setEditingRelationship({ ...editingRelationship, currentRelationship: v })
                                }
                              >
                                <SelectTrigger className="h-8 w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {RELATIONSHIP_OPTIONS.map((r) => (
                                    <SelectItem key={r} value={r}>
                                      {r}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleUpdateRelationship(rel.studentId, rel.guardianId, {
                                    relationship: editingRelationship.currentRelationship || undefined,
                                  })
                                }
                                disabled={updateMutation.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setEditingRelationship({
                                  studentId: rel.studentId,
                                  guardianId: rel.guardianId,
                                  currentRelationship: rel.relationship || null,
                                  currentIsPrimary: rel.isPrimary,
                                })
                              }
                            >
                              Edit
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnlink(rel.studentId, rel.guardianId)}
                            disabled={unlinkMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* LINK TAB - Link existing */}
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={
                    mode === 'student'
                      ? 'Search guardians by name or email...'
                      : 'Search students by name or admission no...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="max-h-[40vh]">
              {mode === 'student' ? (
                availableGuardians.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">
                      {searchQuery
                        ? 'No guardians found. Try a different search.'
                        : 'No available guardians to link. Create a new guardian in the "New Guardian" tab.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableGuardians.map((guardian: any) => (
                      <div
                        key={guardian.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                      >
                        <div>
                          <p className="font-medium">
                            {guardian.user?.firstName} {guardian.user?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {guardian.user?.email} | {guardian.relationship}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleLinkGuardian(guardian.id)}
                          disabled={linkMutation.isPending}
                        >
                          <Link2 className="h-4 w-4 mr-1" />
                          Link
                        </Button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                availableStudents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">
                      {searchQuery
                        ? 'No students found. Try a different search.'
                        : 'No available students to link.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableStudents.map((student: any) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                      >
                        <div>
                          <p className="font-medium">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.admissionNo}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleLinkStudent(student.id)}
                          disabled={linkMutation.isPending}
                        >
                          <Link2 className="h-4 w-4 mr-1" />
                          Link
                        </Button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </ScrollArea>
          </TabsContent>

          {/* CREATE TAB - Create new guardian and link (student mode only) */}
          {mode === 'student' && (
            <TabsContent value="create" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Create a new guardian user account and link them to this student.
              </div>
              <ScrollArea className="max-h-[50vh] pr-4">
                <form
                  onSubmit={newGuardianForm.handleSubmit(handleCreateAndLink)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name *</Label>
                      <Input {...newGuardianForm.register('firstName')} placeholder="Jane" />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name *</Label>
                      <Input {...newGuardianForm.register('lastName')} placeholder="Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input {...newGuardianForm.register('email')} type="email" placeholder="parent@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <Input {...newGuardianForm.register('password')} type="password" placeholder="Min 8 characters" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input {...newGuardianForm.register('phone')} placeholder="+254..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship *</Label>
                      <Controller
                        name="relationship"
                        control={newGuardianForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {RELATIONSHIP_OPTIONS.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Middle Name</Label>
                      <Input {...newGuardianForm.register('middleName')} />
                    </div>
                    <div className="space-y-2">
                      <Label>ID Number</Label>
                      <Input {...newGuardianForm.register('idNumber')} />
                    </div>
                    <div className="space-y-2">
                      <Label>Occupation</Label>
                      <Input {...newGuardianForm.register('occupation')} />
                    </div>
                    <div className="space-y-2">
                      <Label>Employer</Label>
                      <Input {...newGuardianForm.register('employer')} />
                    </div>
                    <div className="space-y-2">
                      <Label>Work Phone</Label>
                      <Input {...newGuardianForm.register('workPhone')} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPrimary"
                      {...newGuardianForm.register('isPrimary')}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isPrimary" className="cursor-pointer">
                      Set as primary guardian
                    </Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab('view')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createAndLinkMutation.isPending}
                    >
                      {createAndLinkMutation.isPending ? 'Creating...' : 'Create & Link Guardian'}
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}