# Frontend Components - Quick Reference Table

| Component | File | Purpose | Current API | Status | Priority | Notes |
|-----------|------|---------|-------------|--------|----------|-------|
| **EnrollStudentDialog** | `components/classes/EnrollStudentDialog.tsx` | Enroll single student in class | `POST /student-classes` | ✅ | LOW | Already correct |
| **StudentEnrollmentModal** | `components/students/StudentEnrollmentModal.tsx` | Create/Edit enrollment | `POST /students/enroll` (create) | 🔴 | CRITICAL | Fix create endpoint to `/student-classes` |
| **AssignSubjectDialog** | `components/classes/AssignSubjectDialog.tsx` | Assign subject to class | `POST /class-subjects/assign` | 🟡 | MEDIUM | Verify endpoint exists |
| **SubjectAssignmentModal** | `components/subjects/SubjectAssignmentModal.tsx` | Assign subject with category/term | `POST /class-subjects/assign` | 🟡 | MEDIUM | Verify includes termId/academicYearId |
| **ClassDetailsModal** | `components/classes/ClassDetailsModal.tsx` | Display class details + subjects | `GET /class-subjects` | 🟡 | MEDIUM | Verify data structure |
| **GradeEntryTable** | `components/grades/GradeEntryTable.tsx` | Grade entry table | `GET /results`, `POST /grades/bulk` | 🔴 | CRITICAL | Need subject roster for students |
| **GradeEntryPage** | `pages/assessments/GradeEntryPage.tsx` | Grade entry page | `GET /assessments/{id}`, custom hook | 🔴 | CRITICAL | Update student fetching |
| **AssessmentResultsEntryModal** | `components/assessments/AssessmentResultsEntryModal.tsx` | Enter single result | `GET /classes/{id}/enrollments` | 🔴 | CRITICAL | Should use subject roster |
| **AssessmentDefinitionFormModal** | `components/assessments/AssessmentDefinitionFormModal.tsx` | Create assessment definition | `POST /assessments/definitions` | ✅ | LOW | Likely correct |
| **UserDetailsModal** | `components/users/UserDetailsModal.tsx` | Show user + enrollments | Student query with enrollments | 🟡 | MEDIUM | Verify enrollment relations |

---

## API Endpoint Status

| Endpoint | Current Use | Backend Status | Frontend Status | Action Required |
|----------|-------------|-----------------|-----------------|-----------------|
| `GET /classes/{id}/enrollments` | ClassDetailsModal, AssessmentResultsEntryModal | ❓ | Uses in 2 places | Migrate one to subject roster |
| `POST /student-classes` | EnrollStudentDialog, StudentEnrollmentModal | ✅ | Used correctly in 1 place | Fix StudentEnrollmentModal |
| `GET /class-subjects` | ClassDetailsModal | ❓ | 1 use | Verify returns correct structure |
| `POST /class-subjects/assign` | AssignSubjectDialog, SubjectAssignmentModal | ❓ | Used in 2 places | Verify endpoint exists and params |
| `POST /academic/student-class-subject/enroll` | **NOT USED** | ✅ Available | ❌ Missing implementation | Implement subject selection UI |
| `GET /academic/student-class-subject/subject-roster` | **NOT USED** | ✅ Available | ❌ Missing implementation | Create/update grade entry page |
| `GET /results` | GradeEntryTable | ✅ | 1 use | Keep current |
| `POST /grades/bulk` | GradeEntryTable | ✅ | 1 use | Keep current |

---

## Data Flow Diagram - Current vs. Required

### Current Flow (Before Update)
```
Student Selection
    ↓
Enroll in Class (StudentClass)
    ↓
Grade Entry (All Class Students)
    ↓
Select from all class enrollments
    ↓
Enter Grades
```

### Required Flow (After Update)
```
Student Selection
    ↓
Enroll in Class (StudentClass)
    ↓
Select Subjects (StudentClassSubject)
    ↓
Grade Entry (Only Selected Subjects' Students)
    ↓
Select from subject roster only
    ↓
Enter Grades
```

---

## Hook Dependencies

### Hooks That Use Correct Endpoints ✅
- `useEnrollStudent()` - POST /student-classes
- `useUpdateEnrollment()` - PATCH /student-classes/{id}
- `useDeleteEnrollment()` - DELETE /student-classes/{id}
- `useClassEnrollments()` - GET /classes/{id}/enrollments

### Hooks Needing Updates 🔴
- `useClassSubjectStudents()` - Should use `/academic/student-class-subject/subject-roster`
- Grade entry hooks - Need to integrate subject roster

### Hooks Already Implemented But Not Used 📦
- `useEnrollStudentInSubject()` - POST /academic/student-class-subject/enroll
- `useBulkEnrollStudentsInSubject()` - POST /academic/student-class-subject/bulk-enroll
- `useDropStudentFromSubject()` - POST /academic/student-class-subject/drop

---

## Implementation Checklist

### Phase 1: Fix Critical Enrollment Issues
- [ ] Update `StudentEnrollmentModal.tsx` - create endpoint
- [ ] Verify `useClassEnrollments()` returns complete student info
- [ ] Test enrollment flow end-to-end

### Phase 2: Implement Subject Selection
- [ ] Create `SubjectSelectionComponent` (NEW)
- [ ] Create `use-student-subject-selection.ts` hook (NEW)
- [ ] Integrate `useEnrollStudentInSubject()` hook
- [ ] Add "Select Subjects" step to enrollment flow

### Phase 3: Update Grade Entry
- [ ] Create `use-subject-roster.ts` hook (NEW or update existing)
- [ ] Update `GradeEntryPage.tsx` to use subject roster
- [ ] Update `AssessmentResultsEntryModal.tsx`
- [ ] Test grade entry with subject filtering

### Phase 4: Verification
- [ ] Verify `useClassSubjects()` data structure
- [ ] Verify all enrollment responses include relations
- [ ] Update `UserDetailsModal.tsx` if needed
- [ ] Full integration testing

---

## Component Update Details

### 1. StudentEnrollmentModal.tsx (Lines 85-95)

**Current Code:**
```typescript
const { mutate: createEnrollment, isPending: isCreating } = useMutation({
  mutationFn: async (data: EnrollmentFormData) => {
    const response = await api.post('/students/enroll', {  // ❌ WRONG
      studentId: data.studentId,
      classId: data.classId,
      streamId: data.streamId === 'none' ? undefined : data.streamId,
      academicYearId: data.academicYearId,
      schoolId,
    });
    return response.data?.data || response.data;
  },
```

**Required Fix:**
```typescript
const { mutate: createEnrollment, isPending: isCreating } = useMutation({
  mutationFn: async (data: EnrollmentFormData) => {
    const response = await api.post('/student-classes', {  // ✅ CORRECT
      studentId: data.studentId,
      classId: data.classId,
      streamId: data.streamId === 'none' ? undefined : data.streamId,
      academicYearId: data.academicYearId,
    });
    return response.data?.data || response.data;
  },
```

---

### 2. GradeEntryPage.tsx (Lines 25-35)

**Current Code:**
```typescript
const { data: studentsData, isLoading: studentsLoading } = useClassSubjectStudents(
  assessment?.classSubjectId
);
```

**Required Implementation:**
- Create/update hook to use: `GET /academic/student-class-subject/subject-roster?classSubjectId={id}`
- Alternatively, implement new hook: `useSubjectRoster(classSubjectId)`

---

### 3. AssessmentResultsEntryModal.tsx (Lines 55)

**Current Code:**
```typescript
const { data: students } = useEnrollmentsByClass(classId || '', { enabled: !!classId });
```

**Required Fix:**
```typescript
// Get classSubjectId from assessment
const { data: students } = useSubjectRoster(assessment?.classSubjectId || '', { 
  enabled: !!assessment?.classSubjectId 
});
```

---

## Related Backend Issues (From Error Log)

The backend has these issues preventing compilation:

1. **student.service.ts:451** - `subjectEnrollments` not valid in StudentClassInclude
2. **student-class-subject.service.ts** - StudentClassSubject model doesn't exist in Prisma schema
3. Multiple references to non-existent `prisma.studentClassSubject` client

**Action**: Backend must complete StudentClassSubject model implementation before frontend updates can be fully tested.

---

## Files Referenced in Frontend

### Component Files (Need Updates)
- `/frontend/src/components/classes/EnrollStudentDialog.tsx`
- `/frontend/src/components/classes/AssignSubjectDialog.tsx`
- `/frontend/src/components/classes/ClassDetailsModal.tsx`
- `/frontend/src/components/students/StudentEnrollmentModal.tsx`
- `/frontend/src/components/students/StudentDetailsModal.tsx`
- `/frontend/src/components/subjects/SubjectAssignmentModal.tsx`
- `/frontend/src/components/grades/GradeEntryTable.tsx`
- `/frontend/src/components/assessments/AssessmentResultsEntryModal.tsx`
- `/frontend/src/components/assessments/AssessmentDefinitionFormModal.tsx`

### Page Files (Need Updates)
- `/frontend/src/pages/assessments/GradeEntryPage.tsx`

### Service/Hook Files
- `/frontend/src/services/enrollment.service.ts`
- `/frontend/src/api/student-class-subject-api.ts` ✅ (already implemented)
- `/frontend/src/hooks/use-class-students.ts`
- `/frontend/src/hooks/use-class-subjects.ts`
- `/frontend/src/hooks/use-student-subject-enrollment.ts` ✅ (already implemented)
- `/frontend/src/hooks/use-grades.ts`

---

## Key Questions to Resolve

1. **Subject Selection Timing**: When should students select subjects?
   - During initial enrollment?
   - In a separate step after enrollment?
   - During class start?

2. **Subject Roster for Assessments**: 
   - Should grade entry show only students who selected a subject?
   - Or should it show all class enrollments initially?
   - Can students select subjects late (mid-term)?

3. **Subject Status**: 
   - Can students drop a subject and re-enroll?
   - What are valid `EnrollmentStatus` values for subject enrollments?

4. **Bulk Operations**:
   - Should there be bulk subject assignment for all class students?
   - Is bulk subject enrollment (from CSV) needed?

