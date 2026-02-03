# Component Update Guide: StudentClassSubject Migration

## Overview
The backend has been refactored to use a relational `StudentClassSubject` model instead of storing subject selections in a JSON array on `StudentClass`. This document guides the frontend component updates.

---

## Architecture Changes

### Before (Old Model)
```
StudentClass
├── id
├── studentId
├── classId
├── selectedSubjects: string[] ❌ (JSON array in DB)
└── status

// Problem: Can't filter, sort, query subjects efficiently
```

### After (New Model)
```
StudentClass
├── id
├── studentId
├── classId
├── subjectEnrollments: StudentClassSubject[] ✅ (Proper relationship)

StudentClassSubject (NEW)
├── id
├── studentId
├── classSubjectId
├── enrollmentId (FK to StudentClass)
├── status: EnrollmentStatus
└── enrolledAt, droppedAt (timestamps)

ClassSubjectStrand (NEW)
├── classSubjectId
├── strandId
└── Enables curriculum organization
```

---

## Component Updates Required

### 1. ✅ **GradeEntryTable** (CRITICAL)
**File**: `frontend/src/components/grades/GradeEntryTable.tsx`

**Current Issue**: 
- Receives `students` prop with all class students
- Doesn't filter by actual subject enrollment
- Teachers can enter grades for students not enrolled in that subject

**Required Change**:
- Replace manual student prop with hook-based filtering
- Use new `useStudentsEnrolledInSubject(classSubjectId)` hook
- Only shows students actually enrolled in the subject

**Code Change**:
```tsx
// OLD
interface GradeEntryTableProps {
  assessmentId: string;
  students: Student[];  // ❌ Generic class roster
  maxMarks?: number;
}

// NEW
interface GradeEntryTableProps {
  assessmentId: string;
  classSubjectId: string;  // ✅ Specific subject
  maxMarks?: number;
}

// Inside component:
import { useStudentsEnrolledInSubject } from '@/hooks/use-student-subject-enrollment';

const { data: subjectRoster } = useStudentsEnrolledInSubject(classSubjectId);
// Now subjectRoster only includes students enrolled in this specific subject
```

**Why This Matters**:
- Prevents grade entry for students not taking the subject (electives)
- Accurate reporting
- Data integrity

---

### 2. 🔴 **StudentEnrollmentModal** (CRITICAL)
**File**: `frontend/src/components/students/StudentEnrollmentModal.tsx`

**Current Issue**:
- Form includes `selectedSubjects` field (deprecated)
- No subject selection after class enrollment
- Core subjects not auto-enrolled

**Required Changes**:
1. Remove `selectedSubjects` from form
2. Add subject selection flow after enrollment success
3. Use new hooks for subject enrollment

**Code Changes**:

```tsx
// Remove from form schema
const enrollmentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  classId: z.string().min(1, 'Class is required'),
  streamId: z.string().optional(),
  academicYearId: z.string().min(1, 'Academic year is required'),
  // ❌ REMOVE: selectedSubjects: z.array(z.string()).optional(),
});

// Add subject selection after enrollment
const { mutate: enrollStudent } = useEnrollStudentInSubject();
const { mutate: bulkEnrollStudents } = useBulkEnrollStudentsInSubject();

const onEnrollmentSuccess = (enrollmentData) => {
  // 1. Backend auto-enrolled core subjects ✅
  // 2. Show elective selection dialog
  setShowSubjectSelection(true);
  setCurrentEnrollmentId(enrollmentData.id);
};

const handleElectiveSelection = (selectedSubjectIds: string[]) => {
  // Use new hook to enroll in electives
  selectedSubjectIds.forEach((subjectId) => {
    enrollStudent({
      studentId: student.id,
      classSubjectId: subjectId,
      enrollmentId: enrollmentData.id,
      schoolId,
    });
  });
};
```

---

### 3. 🆕 **ElectiveSubjectSelectionDialog** (NEW COMPONENT)
**File**: `frontend/src/components/subjects/ElectiveSubjectSelectionDialog.tsx`

**Purpose**: Allow students to select elective/optional subjects after class enrollment

**Implementation**:
```tsx
import { useState } from 'react';
import { useClassSubjects } from '@/hooks/use-class-subjects';
import { useEnrollStudentInSubject } from '@/hooks/use-student-subject-enrollment';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ElectiveSubjectSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  studentId: string;
  enrollmentId: string;
  schoolId: string;
}

export function ElectiveSubjectSelectionDialog({
  open,
  onOpenChange,
  classId,
  studentId,
  enrollmentId,
  schoolId,
}: ElectiveSubjectSelectionDialogProps) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  
  // Get elective/optional subjects for this class
  const { data: classSubjects } = useClassSubjects(classId);
  const electiveSubjects = classSubjects?.filter(
    (cs: any) => ['ELECTIVE', 'OPTIONAL', 'TECHNICAL', 'APPLIED'].includes(cs.subjectCategory)
  );
  
  const { mutate: enrollInSubject, isPending } = useEnrollStudentInSubject();
  
  const handleSubmit = async () => {
    // Enroll student in selected electives
    selectedSubjects.forEach((classSubjectId) => {
      enrollInSubject({
        studentId,
        classSubjectId,
        enrollmentId,
        schoolId,
      });
    });
    
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Elective Subjects</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {electiveSubjects?.map((subject: any) => (
            <div key={subject.id} className="flex items-center">
              <Checkbox
                id={subject.id}
                checked={selectedSubjects.includes(subject.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedSubjects([...selectedSubjects, subject.id]);
                  } else {
                    setSelectedSubjects(selectedSubjects.filter(id => id !== subject.id));
                  }
                }}
              />
              <label htmlFor={subject.id} className="ml-2 cursor-pointer">
                {subject.subject.name}
              </label>
            </div>
          ))}
        </div>
        
        <Button onClick={handleSubmit} disabled={isPending}>
          Confirm Selection
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 4. 📝 **GradeEntryPage** 
**File**: `frontend/src/pages/grades/GradeEntryPage.tsx`

**Current Issue**: 
- Passes all class students to GradeEntryTable
- Should pass classSubjectId instead

**Change**:
```tsx
// OLD
<GradeEntryTable
  assessmentId={assessmentId}
  students={classStudents}  // ❌ All students
  maxMarks={assessment.maxMarks}
/>

// NEW
<GradeEntryTable
  assessmentId={assessmentId}
  classSubjectId={classSubjectId}  // ✅ Specific subject
  maxMarks={assessment.maxMarks}
/>
```

---

## New Hooks Available

### StudentSubjectEnrollment Hooks
Located: `frontend/src/hooks/use-student-subject-enrollment.ts`

```ts
// Enroll single student in subject
useEnrollStudentInSubject()

// Enroll multiple students in subject
useBulkEnrollStudentsInSubject()

// Drop student from subject
useDropStudentFromSubject()

// Get enrollments for a student
useStudentSubjectEnrollments(enrollmentId)

// Get all enrollments for student (across classes)
useAllStudentSubjectEnrollments(studentId)

// Get roster of students enrolled in subject
useStudentsEnrolledInSubject(classSubjectId)

// Get count of students enrolled
useSubjectEnrollmentCount(classSubjectId)

// Update status (ACTIVE/DROPPED_OUT)
useUpdateSubjectEnrollmentStatus()

// Bulk update statuses
useBulkUpdateSubjectStatus()
```

### ClassSubjectStrand Hooks
Located: `frontend/src/hooks/use-class-subject-strand.ts`

```ts
// Assign strand to class subject
useAssignStrandToClassSubject()

// Bulk assign strands
useBulkAssignStrands()

// Get strands for class subject
useStrandsForClassSubject(classSubjectId)

// Get class subjects for strand
useClassSubjectsForStrand(strandId)

// Get strand count
useStrandCount(classSubjectId)

// Remove strand
useRemoveStrandFromClassSubject()

// Validate strand assignments
useValidateStrandAssignments()
```

---

## API Endpoint Mapping

| Feature | Old Endpoint | New Endpoint | Hook |
|---------|-------------|-------------|------|
| Enroll Subject | `POST /enrollments/:id` (selectedSubjects) | `POST /student-class-subject/enroll` | `useEnrollStudentInSubject` |
| Get Subject Roster | Custom logic | `GET /student-class-subject/subject-roster` | `useStudentsEnrolledInSubject` |
| Drop Subject | Custom logic | `POST /student-class-subject/drop` | `useDropStudentFromSubject` |
| Update Status | N/A | `PATCH /student-class-subject/status` | `useUpdateSubjectEnrollmentStatus` |
| Assign Strand | N/A | `POST /class-subject-strand/assign` | `useAssignStrandToClassSubject` |

---

## Implementation Sequence

### Phase 1: Core Fixes (Day 1-2)
1. **Update GradeEntryTable** - Critical for grade entry to work
   - Replace students prop with hook-based roster
   - Test with subject roster filtering

2. **Update StudentEnrollmentModal** - Core enrollment flow
   - Remove selectedSubjects field
   - Add subject selection dialog after enrollment

### Phase 2: New Components (Day 3)
3. **Create ElectiveSubjectSelectionDialog**
   - Show after successful class enrollment
   - Allow selection of elective/optional subjects

4. **Update GradeEntryPage**
   - Pass classSubjectId instead of students array
   - Update component references

### Phase 3: Testing & Refinement (Day 4-5)
5. **End-to-end testing**
   - Test enrollment flow with subject selection
   - Test grade entry with filtered roster
   - Verify data persists correctly

---

## Testing Checklist

- [ ] Student enrollment creates class enrollment
- [ ] Backend auto-enrolls student in core subjects
- [ ] Subject selection dialog appears for electives
- [ ] Student can select/deselect elective subjects
- [ ] Selected electives saved to StudentClassSubject
- [ ] Grade entry table shows only enrolled students for the subject
- [ ] Can't enter grades for students not enrolled in subject
- [ ] Subject drop marks student as DROPPED_OUT status
- [ ] Strand assignment works for class subjects

---

## Backward Compatibility Notes

- Existing StudentClass enrollments still work (no selectedSubjects field needed)
- StudentClassSubject service handles all subject-related logic
- Frontend gracefully handles missing subject enrollments (shows empty list)
- No database migration needed (schema already updated)

---

## Questions?

Refer to:
- [FRONTEND_BACKEND_ALIGNMENT.md](FRONTEND_BACKEND_ALIGNMENT.md) - Full API reference
- [SCHEMA_ALIGNMENT_SUMMARY.md](SCHEMA_ALIGNMENT_SUMMARY.md) - Backend changes explained
- Backend hooks in `frontend/src/hooks/use-student-subject-enrollment.ts`
- Backend API in `frontend/src/api/student-class-subject-api.ts`

