# Student Enrollment & Teacher Assignment Implementation

## Overview

This document describes the implementation of two critical workflows in the EduTrak frontend:

1. **Student Enrollment**: Enroll students in classes for an academic year
2. **Teacher-to-Subject Assignment**: Assign teachers to teach specific subjects in classes

---

## 1. Student Enrollment Workflow

### How It Works

Students are enrolled in classes with optional stream assignment for a specific academic year.

### Component: `StudentEnrollmentModal`

**Location**: `src/components/students/StudentEnrollmentModal.tsx`

**Features**:
- Automatic selection of the active academic year
- Class selection with dynamic stream loading
- Optional stream assignment if the class has streams
- Full Zod validation with clear error messages
- Automatic query invalidation for real-time updates

### Usage in StudentsList

```tsx
{/* Enroll Student Modal */}
{selectedStudent && (
  <StudentEnrollmentModal
    open={showEnrollModal}
    onOpenChange={setShowEnrollModal}
    student={selectedStudent}
  />
)}
```

### API Integration

**Endpoint**: `POST /students/enroll`

**Request Payload**:
```typescript
{
  studentId: string;        // Student ID
  classId: string;          // Target class ID
  streamId?: string;        // Optional stream ID (if class has streams)
  academicYearId: string;   // Active academic year ID
  schoolId: string;         // School context
}
```

**Response**:
```typescript
{
  success: true;
  message: "Student enrolled successfully";
  data: {
    id: string;
    studentId: string;
    classId: string;
    streamId?: string;
    academicYearId: string;
    status: "ACTIVE";
    createdAt: Date;
    // ... relationships included
  }
}
```

### Data Flow

```
StudentsList.tsx
  ↓
handleEnrollClick() → setSelectedStudent + setShowEnrollModal(true)
  ↓
StudentEnrollmentModal opens with student context
  ↓
User selects class and optional stream
  ↓
Form validation with Zod schema
  ↓
enrollStudent mutation (useStudents hook)
  ↓
POST /students/enroll
  ↓
Success: Query invalidation + Toast notification
  ↓
Modal closes, StudentsList refetches with updated enrollments
```

### Key Fixes Applied

1. **Parameter Mapping**: Fixed `pageSize` → `limit` parameter conversion for API compatibility
2. **Data Extraction**: Correctly extract students from `studentsData?.data` (array at root level)
3. **Stream Handling**: Properly handle `'none'` stream value (convert to undefined)
4. **Error Handling**: Added detailed error logging for debugging enrollment issues

---

## 2. Teacher-to-Subject Assignment Workflow

### How It Works

Teachers are assigned to teach specific subjects in classes for a given term and academic year. This is separate from subject assignment to classes.

### Components

#### `AssignTeacherToSubjectDialog`

**Location**: `src/components/teachers/AssignTeacherToSubjectDialog.tsx`

**Features**:
- Dynamic subject loading based on selected class
- Four required fields: Teacher, Class, Subject, Term
- Read-only academic year (always active year)
- Full form validation with Zod
- Loading states for async operations
- Detailed info messages

**Usage**:
```tsx
import { AssignTeacherToSubjectDialog } from '@/components/teachers/AssignTeacherToSubjectDialog';

<AssignTeacherToSubjectDialog />
```

#### `AssignSubjectDialog`

**Location**: `src/components/classes/AssignSubjectDialog.tsx`

**Updated Features**:
- Simplified: Only handles subject assignment to classes
- Compulsory subject flag
- Separate from teacher assignment
- Uses `useAssignSubject` hook

### API Integration

**Endpoint**: `POST /teachers/assign-subject`

**Request Payload**:
```typescript
{
  teacherId: string;        // Teacher ID
  classId: string;          // Class ID
  subjectId: string;        // Subject ID
  termId: string;           // Term ID (term1, term2, term3, term4)
  academicYearId: string;   // Academic year ID
}
```

**Response**:
```typescript
{
  success: true;
  message: "Subject assigned to teacher successfully";
  data: {
    id: string;
    classId: string;
    subjectId: string;
    teacherId: string;
    termId: string;
    academicYearId: string;
    class: { id, name, level };
    subject: { id, name, code };
    teacherProfile: {
      id;
      user: { firstName, lastName, email };
      tscNumber?: string;
      qualification?: string;
    };
    // ... relationships included
  }
}
```

### Data Flow

```
AssignTeacherToSubjectDialog opens
  ↓
User selects teacher
  ↓
User selects class
  ↓
Fetch class subjects from API
  ↓
User selects subject, term, and academic year
  ↓
Form validation with Zod schema
  ↓
assignTeacher mutation (useAssignTeacherToSubject hook)
  ↓
POST /teachers/assign-subject
  ↓
Success: Query invalidation for both teachers and classes + Toast
  ↓
Dialog closes, data refetches
```

---

## 3. Hooks

### `useStudents`

**Location**: `src/hooks/use-students.ts`

```typescript
export function useStudents(params?: { 
  schoolId?: string;
  search?: string;
  gender?: string;
  hasSpecialNeeds?: boolean;
  classId?: string;
  page?: number;
  pageSize?: number;
})
```

**Returns**: TanStack Query result with `PaginatedResponse<Student>`

### `useEnrollStudent`

```typescript
export function useEnrollStudent() {
  // Returns mutation for enrolling a student
  return useMutation({
    mutationFn: (data: {
      studentId: string;
      classId: string;
      streamId?: string;
      academicYearId: string;
      schoolId: string;
    }) => studentService.enroll(data),
    // ... auto invalidation and toast
  });
}
```

### `useAssignTeacherToSubject`

**Location**: `src/hooks/use-teachers.ts`

```typescript
export function useAssignTeacherToSubject() {
  return useMutation({
    mutationFn: (data: {
      teacherId: string;
      classId: string;
      subjectId: string;
      termId: string;
      academicYearId: string;
    }) => teacherService.assignSubjectToClass(data),
    // ... auto invalidation and toast
  });
}
```

---

## 4. Services

### `studentService.enroll`

**Location**: `src/services/student.service.ts`

```typescript
enroll: async (data: {
  studentId: string;
  classId: string;
  streamId?: string;
  academicYearId: string;
  schoolId: string;
}): Promise<any> => {
  const response = await api.post('/students/enroll', data);
  return response.data.data;
}
```

### `teacherService.assignSubjectToClass`

**Location**: `src/services/teacher.service.ts`

```typescript
assignSubjectToClass: async (data: {
  teacherId: string;
  classId: string;
  subjectId: string;
  termId: string;
  academicYearId: string;
}): Promise<any> => {
  const response = await api.post('/teachers/assign-subject', data);
  return response.data?.data || response.data;
}
```

---

## 5. Usage Examples

### Enrolling a Student

```tsx
import { StudentEnrollmentModal } from '@/components/students/StudentEnrollmentModal';

export default function StudentsList() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  return (
    <>
      {/* Students table with action dropdown */}
      <DropdownMenuItem onClick={() => {
        setSelectedStudent(student);
        setShowEnrollModal(true);
      }}>
        <UserPlus className="mr-2 h-4 w-4" />
        Enroll in Class
      </DropdownMenuItem>

      {/* Modal */}
      {selectedStudent && (
        <StudentEnrollmentModal
          open={showEnrollModal}
          onOpenChange={setShowEnrollModal}
          student={selectedStudent}
        />
      )}
    </>
  );
}
```

### Assigning a Teacher to a Subject

```tsx
import { AssignTeacherToSubjectDialog } from '@/components/teachers/AssignTeacherToSubjectDialog';

export default function TeacherManagement() {
  return (
    <div>
      <h1>Teacher Management</h1>
      <AssignTeacherToSubjectDialog />
      {/* Teachers list and other content */}
    </div>
  );
}
```

---

## 6. Common Errors & Solutions

### Error: "Students not showing in StudentsList"

**Cause**: Parameter mismatch between frontend and backend

**Solution**: The backend expects `limit` but frontend was sending `pageSize`. This has been fixed in:
- `studentService.getAll()` - now maps `pageSize` → `limit`
- `useStudents()` - properly passes all parameters

### Error: "Failed to enroll student"

**Possible Causes**:
1. Student already enrolled in a class for the academic year
2. Invalid stream ID
3. Missing required fields

**Debug Steps**:
```typescript
// Check browser console for error details
console.error('Enrollment error:', error);
// Error will have response.data.message from backend
```

### Error: "Teacher assignment failed"

**Possible Causes**:
1. Teacher already assigned to this subject in this class for the term
2. Invalid subject ID for the class
3. Invalid term ID

**Solution**: Check that:
- Subject belongs to the selected class
- Term ID is valid (term1, term2, term3, term4)
- Teacher is not already assigned to this subject in this class

---

## 7. Testing Checklist

- [x] Students display correctly in StudentsList
- [x] Search/filter works for students
- [x] Student enrollment modal opens with correct student
- [x] Academic year auto-selects
- [x] Streams load dynamically when class selected
- [x] Enrollment form validates required fields
- [x] Enrollment succeeds and modal closes
- [x] Toast notification shows on success
- [x] Teacher assignment dialog opens
- [x] Classes load correctly
- [x] Subjects load dynamically when class selected
- [x] Teachers load in dropdown
- [x] Form validation works
- [x] Assignment succeeds
- [x] Query cache invalidates properly

---

## 8. Future Enhancements

1. **Bulk Student Enrollment**: Enroll multiple students at once
2. **Teacher Workload Tracking**: Show current workload during assignment
3. **Conflict Detection**: Warn when enrolling student with existing enrollment
4. **Subject Prerequisites**: Validate based on subject prerequisites
5. **Stream Capacity Checking**: Prevent over-enrollment in streams
6. **Historical Data**: View enrollment history and changes

---

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── students/
│   │   │   └── StudentEnrollmentModal.tsx ✅
│   │   ├── classes/
│   │   │   └── AssignSubjectDialog.tsx ✅ (updated)
│   │   └── teachers/
│   │       └── AssignTeacherToSubjectDialog.tsx ✅ (new)
│   ├── hooks/
│   │   ├── use-students.ts ✅ (fixed)
│   │   └── use-teachers.ts ✅ (enhanced)
│   ├── services/
│   │   ├── student.service.ts ✅ (fixed)
│   │   └── teacher.service.ts ✅ (enhanced)
│   └── pages/
│       └── students/
│           └── StudentsList.tsx ✅ (fixed)
```

---

## Summary

✅ **Fixed StudentsList Display**: Students now properly load and display from paginated API response
✅ **Implemented Full Enrollment**: Students can be enrolled in classes with stream selection
✅ **Implemented Teacher Assignment**: Teachers can be assigned to subjects in specific classes
✅ **Clean Separation of Concerns**: Subject assignment and teacher assignment are separate dialogs
✅ **Full Form Validation**: All forms use Zod for type-safe validation
✅ **Proper Error Handling**: Detailed error messages and logging for debugging
✅ **Real-time Updates**: Query caching with automatic invalidation on mutations
