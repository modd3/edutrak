# Frontend Components - Specific Code Fixes Required

## Priority 1: CRITICAL FIXES (Must do immediately)

### Fix 1: StudentEnrollmentModal.tsx - Wrong Enrollment Endpoint

**File**: `frontend/src/components/students/StudentEnrollmentModal.tsx`  
**Lines**: 85-99  
**Issue**: Using `/students/enroll` endpoint which doesn't exist in new model

**Current Code**:
```typescript
// Enroll mutation (create)
const { mutate: createEnrollment, isPending: isCreating } = useMutation({
  mutationFn: async (data: EnrollmentFormData) => {
    const response = await api.post('/students/enroll', {
      studentId: data.studentId,
      classId: data.classId,
      streamId: data.streamId === 'none' ? undefined : data.streamId,
      academicYearId: data.academicYearId,
      schoolId,
    });
    return response.data?.data || response.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['students'] });
    toast.success('Student enrolled successfully');
    onOpenChange(false);
    form.reset();
  },
  onError: (error: any) => {
    console.error('Enrollment error:', error);
    toast.error(error.response?.data?.message || 'Failed to enroll student');
  },
});
```

**Fixed Code**:
```typescript
// Enroll mutation (create)
const { mutate: createEnrollment, isPending: isCreating } = useMutation({
  mutationFn: async (data: EnrollmentFormData) => {
    const response = await api.post('/student-classes', {
      studentId: data.studentId,
      classId: data.classId,
      streamId: data.streamId === 'none' ? undefined : data.streamId,
      academicYearId: data.academicYearId,
    });
    return response.data?.data || response.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['students'] });
    queryClient.invalidateQueries({ queryKey: ['classes'] });
    toast.success('Student enrolled successfully');
    onOpenChange(false);
    form.reset();
  },
  onError: (error: any) => {
    console.error('Enrollment error:', error);
    toast.error(error.response?.data?.message || 'Failed to enroll student');
  },
});
```

**Changes**:
- Line 88: Change endpoint from `/students/enroll` to `/student-classes`
- Line 95: Remove `schoolId` from payload (not needed)
- Line 99: Add invalidation for `['classes']` query key

---

### Fix 2: AssessmentResultsEntryModal.tsx - Use Subject Roster Instead of Class Enrollments

**File**: `frontend/src/components/assessments/AssessmentResultsEntryModal.tsx`  
**Lines**: 55-58  
**Issue**: Fetches ALL class students instead of only those enrolled in the subject

**Current Code**:
```typescript
const [selectedStudent, setSelectedStudent] = useState<string>('');
const { data: students } = useEnrollmentsByClass(classId || '', { enabled: !!classId });
const { mutate: createResult, isPending: isCreating } = useCreateAssessmentResult();
```

**Fixed Code**:
```typescript
const [selectedStudent, setSelectedStudent] = useState<string>('');
// Import at top: import { useSubjectRoster } from '@/hooks/use-subject-roster';
const { data: studentRoster } = useSubjectRoster(
  assessmentId ? undefined : classId || '',
  { enabled: !!classId }
);
const students = studentRoster?.data || [];
const { mutate: createResult, isPending: isCreating } = useCreateAssessmentResult();
```

**Or Alternative - Get from Assessment Data**:
```typescript
const [selectedStudent, setSelectedStudent] = useState<string>('');
// If assessment includes classSubjectId, use that
const { data: assessment } = useAssessment(assessmentId);
const { data: studentRoster } = useSubjectRoster(
  assessment?.classSubjectId || '',
  { enabled: !!assessment?.classSubjectId }
);
const students = studentRoster?.data || [];
const { mutate: createResult, isPending: isCreating } = useCreateAssessmentResult();
```

**Changes**:
- Replace `useEnrollmentsByClass()` with proper subject roster hook
- This ensures only students who selected the subject appear
- Prevents accidental grade entry for students not in the subject

---

### Fix 3: GradeEntryPage.tsx - Use Subject Roster

**File**: `frontend/src/pages/assessments/GradeEntryPage.tsx`  
**Lines**: 28-31  
**Issue**: Hook name is unclear; verify it uses correct endpoint

**Current Code**:
```typescript
// Fetch students who have selected this subject
const { data: studentsData, isLoading: studentsLoading } = useClassSubjectStudents(
  assessment?.classSubjectId
);
const students = studentsData?.data || [];
```

**Verify/Fix**:
1. **If hook uses wrong endpoint**: Update to use `/academic/student-class-subject/subject-roster`
2. **If hook doesn't exist**: Create new hook in `use-subject-roster.ts`

**Suggested Hook Implementation**:
```typescript
// frontend/src/hooks/use-subject-roster.ts
import { useQuery } from '@tanstack/react-query';
import { studentClassSubjectApi } from '@/api/student-class-subject-api';

export function useSubjectRoster(
  classSubjectId: string,
  options?: { enabled?: boolean; page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ['subject-roster', classSubjectId, options?.page, options?.limit],
    queryFn: () =>
      studentClassSubjectApi.getStudentsEnrolledInSubject(classSubjectId, {
        page: options?.page,
        limit: options?.limit,
      }),
    enabled: options?.enabled !== false && !!classSubjectId,
  });
}
```

---

## Priority 2: VERIFICATION NEEDED

### Verify 1: Check useClassSubjects Hook Response Structure

**File**: `frontend/src/hooks/use-class-subjects.ts`  
**Lines**: 40-44  

**Current**:
```typescript
export function useClassSubjects(classId: string, academicYearId: string, termId: string) {
  return useQuery({
    queryKey: ['class-subjects', classId, academicYearId, termId],
    queryFn: () => classSubjectsApi.getByClass(classId, { academicYearId, termId }),
    enabled: !!classId && !!academicYearId && !!termId,
  });
}
```

**Action Required**:
1. Check what `classSubjectsApi.getByClass()` actually returns
2. Verify it includes proper relations: `{ id, subject, teacher, category, ... }`
3. Used in: ClassDetailsModal.tsx line 115

---

### Verify 2: Check useClassEnrollments Response Structure

**File**: `frontend/src/hooks/use-class-students.ts`  
**Lines**: 14-22

**Current**:
```typescript
export function useClassEnrollments(classId: string) {
  return useQuery({
    queryKey: ['classes', classId, 'enrollments'],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<StudentClass>>(
        `/classes/${classId}/enrollments`
      );
      return response.data;
    },
    enabled: !!classId,
  });
}
```

**Action Required**:
1. Verify endpoint returns StudentClass with full nested student info
2. Used in: AssessmentResultsEntryModal.tsx (should be replaced)
3. Used in: Multiple other places (verify they need full student details)

---

### Verify 3: Check ClassSubjectsApi Implementation

**File**: `frontend/src/api/index.ts`  
**Lines**: 182-195 (approximately)

**Expected Structure**:
```typescript
export const classSubjectsApi = {
  getAll: (params?: any) => api.get('/class-subjects', { params }),
  getByClass: (classId: string, params?: any) => 
    api.get(`/classes/${classId}/subjects`, { params }),
  assign: (data: any) => api.post('/class-subjects/assign', data),
  // ... other methods
};
```

**Action Required**:
1. Verify `getByClass()` endpoint path
2. Verify parameters include `academicYearId`, `termId`
3. Verify response structure includes proper relations

---

## Priority 3: NEW COMPONENTS TO CREATE

### Component 1: Subject Selection Dialog

**Purpose**: Allow students to select subjects after class enrollment

**File**: `frontend/src/components/subjects/StudentSubjectSelectionModal.tsx` (NEW)

**Template**:
```typescript
import { useState, useEffect } from 'react';
import { useBulkEnrollStudentsInSubject } from '@/hooks/use-student-subject-enrollment';
import { useClassSubjects } from '@/hooks/use-class-subjects';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface StudentSubjectSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classSubjectIds: string[]; // IDs of subjects in the class
  studentEnrollmentId: string;
  classId: string;
  schoolId: string;
}

export function StudentSubjectSelectionModal({
  open,
  onOpenChange,
  classSubjectIds,
  studentEnrollmentId,
  classId,
  schoolId,
}: StudentSubjectSelectionModalProps) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const { data: classSubjects } = useClassSubjects(classId, '', '');
  const { mutate: enrollInSubjects, isPending } = useBulkEnrollStudentsInSubject();

  const handleEnroll = () => {
    if (selectedSubjects.length === 0) return;
    
    enrollInSubjects({
      enrollmentIds: [studentEnrollmentId],
      classSubjectId: selectedSubjects[0], // Adjust logic as needed
      schoolId,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setSelectedSubjects([]);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Subjects</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Subject list with checkboxes */}
          {classSubjects?.data?.map((subject: any) => (
            <div key={subject.id} className="flex items-center space-x-2">
              <Checkbox
                id={subject.id}
                checked={selectedSubjects.includes(subject.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedSubjects([...selectedSubjects, subject.id]);
                  } else {
                    setSelectedSubjects(
                      selectedSubjects.filter((id) => id !== subject.id)
                    );
                  }
                }}
              />
              <label htmlFor={subject.id} className="flex-1">
                {subject.subject?.name}
                {subject.isCompulsory && (
                  <Badge className="ml-2" variant="secondary">
                    Compulsory
                  </Badge>
                )}
              </label>
            </div>
          ))}
        </div>
        <Button onClick={handleEnroll} disabled={isPending}>
          Confirm Selection
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Hook 1: useSubjectRoster (NEW)

**File**: `frontend/src/hooks/use-subject-roster.ts` (NEW)

```typescript
import { useQuery } from '@tanstack/react-query';
import { studentClassSubjectApi } from '@/api/student-class-subject-api';

export interface SubjectRosterOptions {
  enabled?: boolean;
  page?: number;
  limit?: number;
}

export function useSubjectRoster(
  classSubjectId: string | undefined,
  options?: SubjectRosterOptions
) {
  return useQuery({
    queryKey: [
      'subject-roster',
      classSubjectId,
      options?.page,
      options?.limit,
    ],
    queryFn: () =>
      studentClassSubjectApi.getStudentsEnrolledInSubject(
        classSubjectId!,
        {
          page: options?.page,
          limit: options?.limit,
        }
      ),
    enabled: options?.enabled !== false && !!classSubjectId,
  });
}
```

---

### Hook 2: useClassSubjectStudents Update (IF NOT CORRECT)

**File**: `frontend/src/hooks/use-student-subjects.ts` (CREATE IF MISSING)

```typescript
import { useQuery } from '@tanstack/react-query';
import { studentClassSubjectApi } from '@/api/student-class-subject-api';

/**
 * Fetch all students enrolled in a specific subject
 * Used for grade entry pages
 */
export function useClassSubjectStudents(classSubjectId: string | undefined) {
  return useQuery({
    queryKey: ['class-subject-students', classSubjectId],
    queryFn: () =>
      studentClassSubjectApi.getStudentsEnrolledInSubject(classSubjectId!),
    enabled: !!classSubjectId,
  });
}
```

---

## Priority 4: INTEGRATION CHECKLIST

### Before Testing
- [ ] Backend: StudentClassSubject model implemented
- [ ] Backend: All new endpoints implemented and tested
- [ ] Backend: Prisma schema updated and migrated

### Code Changes
- [ ] Fix StudentEnrollmentModal.tsx endpoint
- [ ] Fix AssessmentResultsEntryModal.tsx to use subject roster
- [ ] Verify useClassSubjects returns correct data
- [ ] Create or update useSubjectRoster hook
- [ ] Create StudentSubjectSelectionModal component

### Testing
- [ ] Manual test: Student enrollment flow
- [ ] Manual test: Subject selection
- [ ] Manual test: Grade entry with subject filtering
- [ ] API: Verify all endpoints called with correct parameters
- [ ] API: Verify response structures match expectations

### Edge Cases
- [ ] What if student selects no subjects?
- [ ] What if subject is dropped mid-term?
- [ ] What if new subject is added after enrollment?
- [ ] What if student is promoted to new class?

---

## Reference: API Response Structures Expected

### GET /classes/{classId}/enrollments
**Expected Response**:
```typescript
{
  data: [
    {
      id: string;
      studentId: string;
      classId: string;
      streamId?: string;
      academicYearId: string;
      status: 'ACTIVE' | 'PROMOTED' | 'DROPPED';
      student: {
        id: string;
        firstName: string;
        lastName: string;
        admissionNo: string;
        gender: string;
        dob?: string;
        user?: { ... }
      }
    }
  ],
  total: number;
  page: number;
  pageSize: number;
}
```

### GET /class-subjects
**Expected Response**:
```typescript
{
  data: {
    data: [
      {
        id: string;
        classId: string;
        subjectId: string;
        academicYearId: string;
        termId: string;
        isCompulsory: boolean;
        subjectCategory: 'CORE' | 'ELECTIVE';
        subject: {
          id: string;
          name: string;
          code: string;
        };
        teacherProfile?: {
          id: string;
          user: {
            firstName: string;
            lastName: string;
          }
        }
      }
    ],
    total: number;
  }
}
```

### GET /academic/student-class-subject/subject-roster
**Expected Response**:
```typescript
{
  data: [
    {
      student: {
        id: string;
        admissionNo: string;
        firstName: string;
        middleName?: string;
        lastName: string;
        gender: string;
      }
    }
  ],
  total: number;
  page: number;
  limit: number;
  pages: number;
}
```

