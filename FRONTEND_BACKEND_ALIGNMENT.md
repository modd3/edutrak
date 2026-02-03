// Frontend/Backend Alignment Summary - Schema Migration Guide

## 🎯 Overview

The backend has been migrated to align with the Prisma schema changes. The key change is the shift from `StudentClass.selectedSubjects` (JSON array) to a proper `StudentClassSubject` relational model.

**Frontend Status:** Requires updates to consume new APIs

---

## 📋 Changes Summary

### Backend Changes (Completed ✅)

| Component | Change | Impact |
|-----------|--------|--------|
| **StudentClass Model** | Removed `selectedSubjects` JSON array | New endpoints required for subject management |
| **StudentClassSubject** | New relational model | Proper tracking of student-subject enrollments |
| **ClassSubjectStrand** | New model for strand assignments | Strand-based assessment support |
| **API Endpoints** | 15 new endpoints added | Frontend must use new endpoints |
| **Validation** | Enhanced multi-tenancy filtering | Improved security, no breaking changes |

### Frontend Files Created

1. **`src/api/student-class-subject-api.ts`** - New API client for subject enrollments
2. **`src/api/class-subject-strand-api.ts`** - New API client for strand management
3. **`src/hooks/use-student-subject-enrollment.ts`** - Hooks for subject enrollment operations
4. **`src/hooks/use-class-subject-strand.ts`** - Hooks for strand operations
5. **`src/hooks/use-student-subjects.ts`** - UPDATED with new API integration

---

## 🔄 Migration Path for Components

### Phase 1: Subject Enrollment (Grade Entry)

**Old Approach:**
```typescript
// Old: Fetch students who selected subject via StudentClass.selectedSubjects
const { data: students } = useClassSubjectStudents(classSubjectId);
```

**New Approach:**
```typescript
// New: Fetch students enrolled via StudentClassSubject relationship
const { data: students } = useStudentsEnrolledInSubject(classSubjectId);
```

**Impact:** Components using `useClassSubjectStudents` will automatically work with new API since we've updated the hook.

---

### Phase 2: Subject Selection (Class Management)

**Old Approach:**
```typescript
// Old: Update selectedSubjects array in StudentClass
await enrollmentService.updateEnrollment(enrollmentId, {
  selectedSubjects: ['subj1', 'subj2']
});
```

**New Approach:**
```typescript
// New: Create StudentClassSubject records for each selected subject
const { mutate: enrollInSubject } = useEnrollStudentInSubject();

selectedSubjects.forEach(subjectId => {
  enrollInSubject({
    studentId,
    classSubjectId: subjectId,
    enrollmentId,
    schoolId
  });
});
```

**Components to Update:**
- `EnrollStudentDialog.tsx` - Needs subject selection UI
- Subject selection modals

---

### Phase 3: Assessment & Strand Support

**New Capability:**
```typescript
// Strand-based assessment queries
const { data: strands } = useStrandsForClassSubject(classSubjectId);
const { data: assessments } = useStrandAssessments(strandId);
```

**Components to Add:**
- Strand assignment UI
- Strand-based reporting

---

## 📦 API Endpoint Mapping

### Subject Enrollment Endpoints

```
POST   /academic/student-class-subject/enroll
POST   /academic/student-class-subject/bulk-enroll
POST   /academic/student-class-subject/drop
GET    /academic/student-class-subject/enrollment/:enrollmentId
GET    /academic/student-class-subject/students/:studentId
GET    /academic/student-class-subject/subject-roster
PATCH  /academic/student-class-subject/status
PATCH  /academic/student-class-subject/bulk-status
```

### Strand Management Endpoints

```
POST   /academic/class-subject-strand/assign
POST   /academic/class-subject-strand/bulk-assign
GET    /academic/class-subject-strand/class-subject
GET    /academic/class-subject-strand/strand/:strandId
DELETE /academic/class-subject-strand/remove
GET    /academic/class-subject-strand/validate
```

---

## 🎯 Component-by-Component Migration

### 1. **EnrollStudentDialog.tsx**

**Current State:** Enrolls student in class but doesn't handle subject selection

**Required Changes:**
- After enrollment, show subject selection UI
- Auto-enroll CORE subjects (done by backend)
- Allow selection of ELECTIVE/OPTIONAL subjects
- Use new `useEnrollStudentInSubject` hook

**Example:**
```typescript
async function handleEnroll() {
  // 1. Enroll in class (backend auto-enrolls core subjects)
  const enrollment = await enrollStudent({...});
  
  // 2. Enroll in selected elective subjects
  for (const subjectId of selectedElectives) {
    await enrollInSubject({
      studentId,
      classSubjectId: subjectId,
      enrollmentId: enrollment.id,
      schoolId
    });
  }
}
```

### 2. **GradeEntryTable.tsx**

**Current State:** May assume all students in class for subjects

**Required Changes:**
- Use `useStudentsEnrolledInSubject()` instead of class roster
- Only shows students actually enrolled in subject
- More accurate for elective courses

**Example:**
```typescript
const { data: roster } = useStudentsEnrolledInSubject(classSubjectId);
// roster.data contains only students enrolled in this subject
```

### 3. **ClassSubjectStudents Component** (if exists)

**Required Changes:**
- Filter students by subject enrollment status
- Show drop/transfer options
- Use new hooks

---

## ⚠️ Breaking Changes

None for existing functionality. The migration maintains backward compatibility at the service level while adding new capabilities.

**However:** Components that directly reference `StudentClass.selectedSubjects` will need updates since that field is now managed through `StudentClassSubject` relationship.

---

## ✨ New Features Enabled

### 1. Proper Subject Tracking
- Students can properly drop subjects
- Subject enrollment status is tracked
- Audit trail available

### 2. Strand-Based Assessments
- Assessments can now be organized by strand
- Strand-specific student performance reports
- Better curriculum alignment

### 3. Better Multi-Tenancy
- All queries properly scoped to school
- No cross-school data leakage

---

## 🧪 Testing Recommendations

### Frontend Tests

1. **Enrollment Flow**
   - [ ] Enroll student in class
   - [ ] Verify core subjects auto-enrolled
   - [ ] Select elective subjects
   - [ ] Verify subject enrollments created

2. **Grade Entry**
   - [ ] Only enrolled students appear
   - [ ] Grades save correctly
   - [ ] Subject roster accurate

3. **Subject Management**
   - [ ] Drop subject works
   - [ ] Status updates work
   - [ ] Bulk operations work

4. **Strand Support** (if implemented)
   - [ ] Assign strands to subjects
   - [ ] Create strand-based assessments
   - [ ] View strand reports

---

## 📝 Migration Checklist

- [x] Create StudentClassSubject API client
- [x] Create ClassSubjectStrand API client
- [x] Create new hooks
- [x] Update existing hooks for compatibility
- [ ] Update EnrollStudentDialog component
- [ ] Update GradeEntryTable component
- [ ] Update subject selection components
- [ ] Test enrollment flow end-to-end
- [ ] Test grade entry flow end-to-end
- [ ] Add strand UI components (optional)

---

## 🔗 Related Documentation

- Backend Summary: `SCHEMA_ALIGNMENT_SUMMARY.md`
- Prisma Schema: `server/prisma/schema.prisma`
- API Routes: `server/src/routes/academic.routes.ts`

---

## 💡 Key Points

1. **Backward Compatibility:** Existing endpoints continue to work
2. **Gradual Migration:** Can update components one by one
3. **New Capabilities:** Strands and better tracking enabled
4. **Security:** Enhanced multi-tenancy filtering throughout
5. **Performance:** Batch operations available for bulk updates

