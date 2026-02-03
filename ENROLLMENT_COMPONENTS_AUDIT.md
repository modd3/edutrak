# EduTrak Frontend Components - Enrollment & Assessment API Audit

**Date**: February 3, 2026  
**Purpose**: Identify all React components using enrollment, subject selection, and assessment APIs that need updating for the new StudentClassSubject model

---

## Executive Summary

The backend is transitioning from a flat `selectedSubjects` JSON array model to a proper `StudentClassSubject` relational model. Frontend components must be updated to:
- Replace `/students/enroll` endpoints with proper `/student-classes` endpoints
- Implement the new `/academic/student-class-subject/` endpoint suite for subject enrollments
- Update grade entry to work with the new subject roster system

---

## Component Inventory

### 1. **Enrollment Components**

#### [EnrollStudentDialog.tsx](frontend/src/components/classes/EnrollStudentDialog.tsx)
**Location**: `/frontend/src/components/classes/`  
**Status**: ⚠️ Needs Update  
**Purpose**: Dialog for enrolling a student into a class

**Current Implementation**:
- Uses hook: `useEnrollStudent()` from `@/hooks/use-class-students`
- API endpoint: `POST /student-classes` (via mutation)
- Payload includes: `studentId`, `classId`, `streamId`, `academicYearId`, `status`
- Related hooks used:
  - `useStudents()` - fetch available students
  - `useClassStreams()` - fetch class streams
  - `useEnrollStudent()` - mutation hook

**What it does**:
- Displays a dialog for enrolling a single student in a class
- Allows optional stream selection
- Shows available students in a select dropdown
- Triggers enrollment mutation on submit

**Current API Usage**:
```
POST /student-classes
Payload: {
  studentId: string,
  classId: string,
  streamId?: string,
  academicYearId: string,
  status: 'ACTIVE'
}
```

**Update Required**:
- ✅ Already uses correct endpoint (`/student-classes`)
- ✅ Correct payload structure
- No changes needed for this component

---

#### [StudentEnrollmentModal.tsx](frontend/src/components/students/StudentEnrollmentModal.tsx)
**Location**: `/frontend/src/components/students/`  
**Status**: ⚠️ Needs Update  
**Purpose**: Modal for managing student enrollment (create/edit modes)

**Current Implementation**:
- Mode: Create and Edit
- API endpoints:
  - Create: `POST /students/enroll` (custom endpoint in mutation)
  - Update: Uses `useUpdateEnrollment()` hook with `PATCH /student-classes/{id}`
- Related hooks:
  - `useClasses()` - fetch classes for the school
  - `useClassStreams()` - fetch streams when class changes
  - `useUpdateEnrollment()` - mutation for updates
- Uses React Hook Form with Zod validation

**What it does**:
- Create enrollment: Enrolls student via `POST /students/enroll`
- Edit enrollment: Updates existing enrollment
- Allows stream selection based on chosen class
- Pre-fills form in edit mode

**Current API Usage**:
```
// Create
POST /students/enroll
Payload: {
  studentId: string,
  classId: string,
  streamId?: string,
  academicYearId: string,
  schoolId: string
}

// Update
PATCH /student-classes/{id}
```

**Update Required**:
- 🔴 **CRITICAL**: Line 85 uses `POST /students/enroll` which may not exist in new model
- ✅ Update mutation already correct for PATCH endpoint
- **Action**: Change create mutation to use `/student-classes` endpoint instead

---

#### [useClassEnrollments hook](frontend/src/hooks/use-class-students.ts)
**Location**: `/frontend/src/hooks/`  
**Status**: ⚠️ Needs Update  
**Purpose**: React Query hooks for enrollment operations

**Current Implementation**:
```typescript
useClassEnrollments(classId) // GET /classes/{classId}/enrollments
useEnrollStudent() // POST /student-classes
useUpdateEnrollment() // PATCH /student-classes/{id}
useDeleteEnrollment() // DELETE /student-classes/{id}
```

**What it does**:
- Fetches enrollments for a class with pagination
- Creates new student enrollments
- Updates existing enrollment records
- Deletes enrollments

**Current API Usage**:
```
GET /classes/{classId}/enrollments
POST /student-classes
PATCH /student-classes/{id}
DELETE /student-classes/{id}
```

**Update Required**:
- 🟡 **NEEDS VERIFICATION**: Check if endpoints return new StudentClass structure with proper relations
- May need to add query parameters for filtering by status/term

---

### 2. **Subject Selection & Assignment Components**

#### [AssignSubjectDialog.tsx](frontend/src/components/classes/AssignSubjectDialog.tsx)
**Location**: `/frontend/src/components/classes/`  
**Status**: ⚠️ Needs Update  
**Purpose**: Dialog for assigning subjects to a class

**Current Implementation**:
- Hook: `useAssignSubject()` from `@/hooks/use-class-subjects`
- API endpoint: Called via `assignSubject()` mutation
- Payload: `classId`, `subjectId`, `teacherId`, `isCompulsory`

**What it does**:
- Displays list of available subjects
- Allows marking subject as compulsory
- Creates class-subject relationship

**Current API Usage**:
```
POST /class-subjects/assign (via classSubjectsApi)
Payload: {
  classId: string,
  subjectId: string,
  teacherId?: string,
  isCompulsory: boolean
}
```

**Update Required**:
- 🟡 **NEEDS VERIFICATION**: Check if this endpoint exists and maps to `ClassSubject` model
- May need additional parameters: `academicYearId`, `termId`

---

#### [SubjectAssignmentModal.tsx](frontend/src/components/subjects/SubjectAssignmentModal.tsx)
**Location**: `/frontend/src/components/subjects/`  
**Status**: ⚠️ Needs Update  
**Purpose**: Modal for assigning subjects to class with category and term selection

**Current Implementation**:
- Uses Zod schema validation
- Hooks:
  - `useSubjects()` - fetch available subjects
  - `useTeachers()` - fetch available teachers
  - `useAssignSubject()` - assignment mutation
- Supports optional stream assignment
- Auto-detects active term

**What it does**:
- Assign subject to class with category (CORE/ELECTIVE)
- Select term (defaults to active term)
- Optional teacher assignment
- Optional stream-specific assignment

**Current API Usage**:
```
POST /class-subjects/assign
Payload: {
  classId: string,
  subjectId: string,
  teacherId?: string,
  streamId?: string,
  subjectCategory: string,
  termId: string,
  academicYearId: string
}
```

**Update Required**:
- 🟡 **CHECK**: Verify endpoint supports all these parameters
- Confirm `termId` and `academicYearId` are required for the new model

---

#### [ClassDetailsModal.tsx](frontend/src/components/classes/ClassDetailsModal.tsx) - Subjects Tab
**Location**: `/frontend/src/components/classes/`  
**Status**: ⚠️ Needs Update  
**Purpose**: Displays class details including subjects taught

**Current Implementation**:
- Hook: `useClassSubjects(classId, academicYearId, termId)`
- Located at lines 115-116
- Displays subjects in a tab
- Shows subject data from `subjectsData?.data.data || []`

**What it does**:
- Fetches and displays all subjects for a class
- Shows in tabbed interface
- Allows editing/deleting subjects

**Current API Usage**:
```
GET /class-subjects
Params: { classId, academicYearId, termId }
```

**Update Required**:
- 🟡 **CHECK**: Verify the response structure includes proper ClassSubject relations
- Ensure subjects display correctly with new data model

---

### 3. **Grade Entry & Assessment Components**

#### [GradeEntryTable.tsx](frontend/src/components/grades/GradeEntryTable.tsx)
**Location**: `/frontend/src/components/grades/`  
**Status**: 🔴 Needs Significant Update  
**Purpose**: Table component for entering grades for an assessment

**Current Implementation**:
- Hook: `useAssessmentResults(assessmentId)` - fetch existing grades
- Hook: `useBulkGradeEntry()` - save grades
- Receives `students` array as prop
- Manages grades in local state with `Record<studentId, GradeEntry>`

**What it does**:
- Displays table of students enrolled in a subject
- Allows entering marks and comments per student
- Bulk save functionality
- CSV upload/download support

**Current API Usage**:
```
GET /results
  Params: { assessmentDefId }

POST /grades/bulk
  Payload: Array<{
    studentId: string,
    assessmentId: string,
    marks: number,
    comment: string
  }>
```

**Update Required**:
- 🔴 **CRITICAL**: Must fetch students from `/academic/student-class-subject/subject-roster`
- The `students` prop is passed in but should come from new endpoint
- Update to use new subject enrollment roster system
- Line 55: `useAssessmentResults(assessmentId)` should fetch from correct endpoint

**Related Page**: [GradeEntryPage.tsx](frontend/src/pages/assessments/GradeEntryPage.tsx)
- Line 28: Uses `useClassSubjectStudents()` hook
- Must update to fetch from new subject roster endpoint

---

#### [AssessmentResultsEntryModal.tsx](frontend/src/components/assessments/AssessmentResultsEntryModal.tsx)
**Location**: `/frontend/src/components/assessments/`  
**Status**: 🔴 Needs Update  
**Purpose**: Modal for entering assessment results for individual students

**Current Implementation**:
- Hook: `useEnrollmentsByClass(classId)` - fetch class students
- Hook: `useCreateAssessmentResult()` - create result mutation
- Shows all class enrollments in student dropdown
- Calculates grade based on marks

**What it does**:
- Select a student from class enrollments
- Enter marks (0 to maxMarks)
- Auto-calculate grade
- Optional remarks/comments
- Submit result

**Current API Usage**:
```
GET /classes/{classId}/enrollments
  (returns StudentClass[] with student details)

POST /assessment-results
  Payload: {
    studentId: string,
    assessmentId: string,
    marks: number,
    grade?: string,
    remarks?: string
  }
```

**Update Required**:
- 🔴 **CRITICAL**: Should fetch from subject roster, not class enrollments
- Current: `useEnrollmentsByClass(classId)` → displays all class students
- Updated: Should use `useSubjectRoster(classSubjectId)` → displays only subject-enrolled students
- Only students who selected the subject should appear in dropdown

---

#### [AssessmentDefinitionFormModal.tsx](frontend/src/components/assessments/AssessmentDefinitionFormModal.tsx)
**Location**: `/frontend/src/components/assessments/`  
**Status**: ⚠️ Needs Update  
**Purpose**: Modal for creating/editing assessment definitions

**Current Implementation**:
- Hook: `useClassSubjects()` - fetch available class subjects
- Requires: `classSubjectId`, `termId` for creation
- Zod validation schema

**What it does**:
- Create assessment definition for a class subject
- Specify assessment type: COMPETENCY, GRADE_BASED, HOLISTIC
- Set max marks
- Link to term and class subject

**Current API Usage**:
```
POST /assessments/definitions
  Payload: {
    name: string,
    type: string,
    maxMarks?: number,
    classSubjectId: string,
    termId: string
  }

PUT /assessments/definitions/{id}
  (for updates)
```

**Update Required**:
- ✅ Likely correct as-is
- Verify classSubjectId structure matches new model
- Check that classSubjects endpoint returns proper relations

---

### 4. **Support/Related Components**

#### [UserDetailsModal.tsx](frontend/src/components/users/UserDetailsModal.tsx) - Enrollment Tab
**Location**: `/frontend/src/components/users/`  
**Status**: ⚠️ Needs Update  
**Purpose**: Displays student enrollment information in user details

**Current Implementation**:
- Lines 300+: Shows `student.enrollments` array
- Displays enrollment list with badges

**What it does**:
- Lists all class enrollments for a student
- Shows enrollment status

**Current API Usage**:
- Student object contains nested `enrollments` array

**Update Required**:
- 🟡 **CHECK**: Verify student query includes enrollments with proper relations
- May need to fetch enrollments separately using `/students/{studentId}/enrollments`

---

#### [GradeEntryPage.tsx](frontend/src/pages/assessments/GradeEntryPage.tsx)
**Location**: `/frontend/src/pages/assessments/`  
**Status**: 🔴 Needs Update  
**Purpose**: Page for entering grades for an assessment

**Current Implementation**:
- Line 28: `useClassSubjectStudents(assessment?.classSubjectId)`
- Passes students to `<GradeEntryTable />`

**What it does**:
- Main page for teachers to enter grades
- Displays assessment details
- Shows student roster for grade entry
- Supports CSV upload

**Current API Usage**:
```
GET /assessments/{id}
  (returns assessment with classSubject)

GET /class-subject-students
  Params: { classSubjectId }
  (custom hook - needs verification)
```

**Update Required**:
- 🔴 **CRITICAL**: Replace `useClassSubjectStudents()` hook
- Use new endpoint: `/academic/student-class-subject/subject-roster`
- Must be parameterized by `classSubjectId`
- Check if hook `use-student-subjects.ts` exists and uses correct endpoint

---

## Service Layer Files

### [enrollment.service.ts](frontend/src/services/enrollment.service.ts)
**Purpose**: Centralized enrollment API service

**Current Endpoints**:
```typescript
enrollStudent: POST /enrollments
getStudentEnrollments: GET /students/{studentId}/enrollments
getClassEnrollments: GET /classes/{classId}/enrollments
updateEnrollment: PUT /enrollments/{enrollmentId}
promoteStudents: POST /enrollments/promote
```

**Update Required**:
- 🟡 **REVIEW**: May need to update endpoint paths
- Consider if enrollment endpoints differ from `student-classes` paths

---

### [student-class-subject-api.ts](frontend/src/api/student-class-subject-api.ts)
**Purpose**: New API client for StudentClassSubject model (ALREADY IMPLEMENTED!)

**Status**: ✅ Already in place  

**Current Methods**:
```typescript
enrollStudentInSubject() // POST /academic/student-class-subject/enroll
bulkEnrollStudentsInSubject() // POST /academic/student-class-subject/bulk-enroll
dropStudentFromSubject() // POST /academic/student-class-subject/drop
getStudentSubjectEnrollments() // GET /academic/student-class-subject/enrollment/{id}
getAllStudentSubjectEnrollments() // GET /academic/student-class-subject/students/{id}
getStudentsEnrolledInSubject() // GET /academic/student-class-subject/subject-roster
```

**Usage**: Already defined but needs to be utilized by frontend components

---

### [use-student-subject-enrollment.ts](frontend/src/hooks/use-student-subject-enrollment.ts)
**Purpose**: React Query hooks for StudentClassSubject operations (ALREADY IMPLEMENTED!)

**Status**: ✅ Already in place

**Current Hooks**:
```typescript
useEnrollStudentInSubject()
useBulkEnrollStudentsInSubject()
useDropStudentFromSubject()
```

**Usage**: Needs to be integrated into subject selection components

---

## API Endpoints Reference

### Enrollment Endpoints
```
GET   /classes/{classId}/enrollments          ← List class enrollments
GET   /students/{studentId}/enrollments       ← List student enrollments
POST  /student-classes                        ← Create enrollment
PATCH /student-classes/{id}                   ← Update enrollment
DELETE /student-classes/{id}                  ← Delete enrollment
```

### Subject Endpoints
```
GET   /subjects                               ← List all subjects
GET   /class-subjects                         ← List class subjects
POST  /class-subjects/assign                  ← Assign subject to class (needs verification)
```

### New StudentClassSubject Endpoints (Needs Implementation/Verification)
```
POST  /academic/student-class-subject/enroll           ← Enroll student in subject
POST  /academic/student-class-subject/bulk-enroll      ← Bulk enroll in subject
POST  /academic/student-class-subject/drop             ← Drop from subject
GET   /academic/student-class-subject/enrollment/{id}  ← Get subject enrollments
GET   /academic/student-class-subject/students/{id}    ← Get all subject enrollments
GET   /academic/student-class-subject/subject-roster   ← Get students in subject (for grades)
```

### Assessment Endpoints
```
GET   /assessments/definitions/{id}           ← Get assessment definition
POST  /assessments/definitions                ← Create assessment
GET   /results                                ← Get grade results
POST  /grades/bulk                            ← Bulk entry
```

---

## Summary of Required Updates

### 🔴 CRITICAL - Must Fix Immediately
1. **StudentEnrollmentModal.tsx** - Line 85: Change `POST /students/enroll` → use `/student-classes`
2. **GradeEntryTable.tsx** - Implement subject roster fetching
3. **AssessmentResultsEntryModal.tsx** - Use subject roster instead of class enrollments
4. **GradeEntryPage.tsx** - Update hook to fetch from subject roster endpoint
5. **Implement subject selection UI** - Need component for students to select subjects

### 🟡 MEDIUM - Verify & Update if Needed
1. Verify all class subject endpoints include `academicYearId` and `termId` parameters
2. Verify enrollment responses include complete relations
3. Check that `useClassSubjects()` returns correct structure
4. Verify `/classes/{classId}/enrollments` returns StudentClass with full student info

### ✅ ALREADY CORRECT
1. EnrollStudentDialog.tsx - Uses correct `/student-classes` endpoint
2. student-class-subject-api.ts - API client already defined
3. use-student-subject-enrollment.ts - Hooks already defined
4. AssessmentDefinitionFormModal.tsx - Correct endpoint usage

---

## Component Dependencies Map

```
EnrollStudentDialog
  ├── useEnrollStudent() ✅
  ├── useStudents()
  ├── useClassStreams()
  └── useClassSubjects()

StudentEnrollmentModal
  ├── useClasses()
  ├── useClassStreams()
  ├── useUpdateEnrollment() ✅
  └── useMutation (POST /students/enroll) ❌

GradeEntryPage
  ├── useAssessment()
  ├── useClassSubjectStudents() ❓ (needs verification)
  └── GradeEntryTable
      ├── useAssessmentResults()
      ├── useBulkGradeEntry()
      └── requires students prop

AssessmentResultsEntryModal
  ├── useEnrollmentsByClass() ❌ (should use subject roster)
  └── useCreateAssessmentResult()

SubjectAssignmentModal
  ├── useSubjects()
  ├── useTeachers()
  └── useAssignSubject()
```

---

## Next Steps

1. **Verify Backend Implementation**: Ensure all new endpoints are implemented
2. **Update StudentEnrollmentModal**: Fix create enrollment endpoint
3. **Implement Subject Selection**: Create UI for student subject selection
4. **Update Grade Entry**: Use subject roster instead of class enrollments
5. **Create Subject Enrollment Components**: For managing student-subject relationships
6. **Test Integration**: End-to-end testing of enrollment → subject selection → grade entry flow

---

## Appendix: Hook Implementations to Review

### Hooks That Need Creation/Update
- `use-student-subjects.ts` - fetch students in a subject (verify if uses correct endpoint)
- Subject selection hook - for students to view and select subjects
- Roster fetching hook - for grade entry page

### Existing But Needs Verification
- `useClassSubjects()` - should include proper relations and filtering
- `useClassEnrollments()` - should return complete student details

