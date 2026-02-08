# EduTrak Grading and Reporting Module Guide

## Overview

The Grading and Reporting Module is the core academic evaluation system in EduTrak, designed with **teachers** and **students** as central users. This module enables:

- **Teachers** to create assessments, record student grades, and view class/stream performance
- **Students** to view their results and understand their performance
- **Parents** to monitor their child's academic progress (read-only)
- **Admins** to oversee system-wide assessments and generate institutional reports

## Architecture Overview

### Data Model Relationships

```
AssessmentDefinition (Assessment Template)
    ├── classSubjectId → ClassSubject (links subject to class)
    ├── termId → Term (term context)
    └── strandId → Strand (CBC learning strand - optional)

AssessmentResult (Individual Student Grade)
    ├── studentId → Student
    ├── assessmentDefId → AssessmentDefinition
    ├── numericValue (raw score, e.g., 75)
    ├── grade (letter grade, e.g., "B+")
    ├── competencyLevel (CBC level, e.g., "MEETING_EXPECTATIONS")
    └── assessedById → Teacher (who graded)

StudentClassSubject (Enrollment Link)
    ├── studentId → Student
    ├── classSubjectId → ClassSubject
    └── enrollmentId → StudentClass (which class they're in)
```

### Access Control Pattern

```
┌─────────────────────────────────────┐
│        School Isolation             │
│  (Multi-tenancy via schoolId)       │
└────────────┬────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────────┐   ┌────▼──────────┐
│   TEACHER  │   │   STUDENT     │
└────┬───────┘   └────┬──────────┘
     │                │
     │ Can view:      │ Can view:
     ├─ Assigned      ├─ Own
     │  class/        │  results
     │  subject       ├─ Class
     │  assessments   │  stats
     ├─ All results   │  (aggregate)
     │  for assigned  └─ Trends
     │  subjects
     └─ Class/stream
       performance
```

---

## Teacher Workflow

### 1. **Assessment Creation**

#### Flow: Create Individual Assessment

```
Teacher → AssessmentsPage → Create Assessment Modal
    ↓
Form inputs:
  - Assessment Name (e.g., "CAT 1 - Quadratic Equations")
  - Type (CAT, MIDTERM, END_OF_TERM, MOCK, etc.)
  - Max Marks (e.g., 50)
  - Class Subject (auto-filtered to teacher's assignments)
  - Term (auto-filled from active term)
  - [Optional] Strand (CBC only - for competency-based learning)
    ↓
API: POST /api/assessments
    ↓
Backend Validation:
  ✓ Class subject belongs to teacher's school
  ✓ Term belongs to school
  ✓ Strand (if provided) belongs to subject
  ✓ No duplicate assessment name in same subject/term
    ↓
Create: AssessmentDefinition record
    ↓
Response: Assessment with:
  - classSubject details (subject, class, stream)
  - term info
  - created timestamp
```

#### Code Flow

**Frontend** ([use-assessments.ts](../../frontend/src/hooks/use-assessments.ts)):
```typescript
export function useCreateAssessment() {
  return useMutation({
    mutationFn: (data: CreateAssessmentInput) => assessmentApi.createAssessment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessment created successfully');
    },
  });
}

// Input schema
interface CreateAssessmentInput {
  name: string;
  type: AssessmentType;              // 'CAT' | 'MIDTERM' | 'END_OF_TERM', etc.
  maxMarks?: number;                 // optional, defaults to 100
  termId: string;
  classSubjectId: string;            // Teacher's assigned subject+class combo
  strandId?: string;                 // optional, for CBC competency tracking
  academicYearId?: string;
}
```

**Backend** ([assessment.service.ts](../../server/src/services/assessment.service.ts)):
```typescript
async createAssessment(
  data: CreateAssessmentDefinitionInput,
  schoolId: string,
  userId: string
): Promise<AssessmentDefinition> {
  // 1. Verify classSubject belongs to school
  const classSubject = await this.prisma.classSubject.findFirst({
    where: { id: data.classSubjectId, schoolId }
  });
  
  // 2. Verify no duplicates
  const existing = await this.prisma.assessmentDefinition.findFirst({
    where: {
      name: data.name,
      classSubjectId: data.classSubjectId,
      termId: data.termId,
      schoolId,
    },
  });
  
  // 3. Create assessment
  return this.prisma.assessmentDefinition.create({ data });
}
```

---

### 2. **Grade Entry (Recording Marks)**

#### Two Methods

##### Method A: Manual Entry (Table UI)

```
Teacher → Grade Entry Page
    ↓
Select Assessment → GradeEntryTable Component
    ↓
[Fetches] Students enrolled in this subject
    (StudentClassSubject.status = 'ACTIVE')
    ↓
Display table:
┌────────────────────────────────────────┐
│ Admission No │ Name      │ Marks │ Comm │
├────────────────────────────────────────┤
│ STU-2024-001 │ John Doe  │ [__]  │ [__] │
│ STU-2024-002 │ Jane Smith│ [__]  │ [__] │
└────────────────────────────────────────┘
    ↓
Teacher enters marks and comments
    ↓
Click "Save" → Bulk Entry API
    ↓
API: POST /api/assessments/{id}/grades/bulk
Body:
{
  "assessmentDefId": "uuid",
  "entries": [
    { "studentId": "uuid", "marks": 75, "comment": "Good work" },
    { "studentId": "uuid", "marks": 82, "comment": "" }
  ]
}
    ↓
Backend Processing:
  ✓ Validate each student is enrolled in subject
  ✓ Validate marks ≤ maxMarks
  ✓ Auto-convert marks to grade/competency
  ✓ Create/Update AssessmentResult records
    ↓
Success: Toast notification "Recorded X grades"
```

**Component** ([GradeEntryTable.tsx](../../frontend/src/components/grades/GradeEntryTable.tsx)):
```typescript
interface GradeEntryTableProps {
  assessmentId: string;           // Assessment to grade
  classSubjectId: string;         // Subject context
  maxMarks?: number;
}

export function GradeEntryTable({
  assessmentId,
  classSubjectId,
  maxMarks = 100,
}: GradeEntryTableProps) {
  // 1. Fetch students enrolled in this subject
  const { data: subjectRosterData } = useStudentsEnrolledInSubject(classSubjectId);
  const students = subjectRosterData?.data?.map((item) => item.student) || [];
  
  // 2. Fetch existing results (pre-fill if grades already entered)
  const { data: existingResults } = useAssessmentResults(assessmentId);
  
  // 3. Initialize grades from existing results
  useEffect(() => {
    if (existingResults?.data) {
      const initialGrades: Record<string, GradeEntry> = {};
      existingResults.data.forEach((result) => {
        initialGrades[result.studentId] = {
          studentId: result.studentId,
          marks: result.numericValue?.toString() || '',
          comment: result.comment || '',
        };
      });
      setGrades(initialGrades);
    }
  }, [existingResults]);
  
  // 4. Handle save
  const handleSave = async () => {
    const entries = Object.values(grades)
      .filter((grade) => grade.marks !== '')
      .map((grade) => ({
        studentId: grade.studentId,
        marks: parseFloat(grade.marks),
        comment: grade.comment || undefined,
      }));
    
    await bulkEntryMutation.mutateAsync({
      assessmentDefId: assessmentId,
      entries,
    });
  };
}
```

##### Method B: CSV Upload

```
Teacher → Grade Entry Page → "Upload CSV" button
    ↓
Download template (auto-populated with students)
    ↓
Fill in marks in spreadsheet:
┌─────────────────┬──────────┬───────┬─────────┐
│ Admission No    │ Name     │ Marks │ Comment │
├─────────────────┼──────────┼───────┼─────────┤
│ STU-2024-001    │ John Doe │ 75    │ Good    │
│ STU-2024-002    │ Jane Smith│ 82   │        │
└─────────────────┴──────────┴───────┴─────────┘
    ↓
Upload CSV file
    ↓
API: POST /api/assessments/{id}/grades/csv
    ↓
Backend:
  ✓ Parse CSV rows
  ✓ Validate each row
  ✓ Upsert grades (create or update)
    ↓
Response: { successful: 2, failed: 0, errors: [] }
```

#### Grade Auto-Conversion

Based on **curriculum type**, raw marks are converted:

**8-4-4 System** (Letter Grades):
```typescript
const gradeScale = {
  A: { min: 80, max: 100 },      // Excellent
  'A-': { min: 75, max: 79 },    // Very Good
  'B+': { min: 70, max: 74 },    // Good
  B: { min: 65, max: 69 },       // Satisfactory
  'B-': { min: 60, max: 64 },    // Fair
  C: { min: 50, max: 59 },       // Pass
  D: { min: 40, max: 49 },       // Lower Pass
  E: { min: 0, max: 39 },        // Fail
};

// Example: 75 marks → "A-"
```

**CBC System** (Competency Levels):
```typescript
const competencyScale = {
  EXCEEDING_EXPECTATIONS: { min: 85, max: 100 },       // Level 4
  MEETING_EXPECTATIONS: { min: 70, max: 84 },         // Level 3
  APPROACHING_EXPECTATIONS: { min: 50, max: 69 },     // Level 2
  BELOW_EXPECTATIONS: { min: 0, max: 49 },            // Level 1
};

// Example: 75 marks → "MEETING_EXPECTATIONS"
```

**Backend Processing** ([grade-entry.service.ts](../../server/src/services/grade-entry.service.ts)):
```typescript
async createOrUpdateResult(
  data: CreateAssessmentResultInput,
  assessedById: string,
  schoolId: string
): Promise<AssessmentResult> {
  // 1. Fetch assessment + curriculum context
  const assessment = await this.prisma.assessmentDefinition.findFirst({
    where: { id: data.assessmentDefId, schoolId },
    include: {
      classSubject: {
        include: { class: true, subject: true },
      },
    },
  });
  
  // 2. Validate student enrolled
  const student = await this.prisma.student.findFirst({
    where: { id: data.studentId, schoolId },
  });
  
  // 3. Validate marks within bounds
  if (data.numericValue > assessment.maxMarks) {
    throw new Error('Marks exceed max');
  }
  
  // 4. Auto-convert based on curriculum
  const processedData = await this.processGradeData(
    data,
    assessment.classSubject.class.curriculum, // "CBC" | "EIGHT_FOUR_FOUR"
    assessment.maxMarks
  );
  
  // 5. Create or update result
  return this.prisma.assessmentResult.upsert({
    where: {
      studentId_assessmentDefId: {
        studentId: data.studentId,
        assessmentDefId: data.assessmentDefId,
      },
    },
    create: {
      studentId: data.studentId,
      assessmentDefId: data.assessmentDefId,
      numericValue: processedData.numericValue,
      grade: processedData.grade,                   // Letter grade (8-4-4)
      competencyLevel: processedData.competencyLevel, // Level (CBC)
      comment: data.comment,
      assessedById,
      schoolId,
    },
    update: { /* ... */ },
  });
}
```

---

### 3. **View Class/Stream Results**

#### Teacher Can See

```
Teacher → Assessments Page → Filter by:
  ├─ Class (their assigned classes only)
  ├─ Subject (their assigned subjects)
  ├─ Term (current or archived)
  └─ Status (drafted, in-progress, graded)
      ↓
Assessment List View
  - Assessment name, type, max marks
  - Grading status: "0/45 students graded" 
  - Actions: Grade, View Results, Edit, Delete
      ↓
Click "View Results" → Results Summary
  ├─ Subject name & code
  ├─ Class name (stream if applicable)
  ├─ Student-by-student results:
  │  ├─ Admission No
  │  ├─ Student Name
  │  ├─ Marks
  │  ├─ Grade/Competency Level
  │  └─ Comment
  ├─ Class Statistics:
  │  ├─ Average: 72.5
  │  ├─ Median: 74
  │  ├─ Highest: 92
  │  ├─ Lowest: 45
  │  ├─ Pass Rate: 91%
  │  └─ Grade Distribution:
  │     ├─ A: 10 students
  │     ├─ B+: 15 students
  │     ├─ B: 12 students
  │     └─ etc.
  └─ Actions:
     ├─ Export to PDF
     ├─ Export to Excel
     └─ Print
```

**API Endpoint** ([assessment.service.ts](../../server/src/services/assessment.service.ts)):
```typescript
async getSubjectAssessments(
  classSubjectId: string,
  schoolId: string
): Promise<AssessmentDefinition[]> {
  return this.prisma.assessmentDefinition.findMany({
    where: { classSubjectId, schoolId },
    include: {
      classSubject: { include: { subject: true, class: true, stream: true } },
      term: true,
      strand: true,
      _count: { select: { results: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Returns assessments with result count for grading status
```

#### Backend Statistics Calculation ([report-generation.service.ts](../../server/src/services/report-generation.service.ts)):

```typescript
async generateClassPerformanceReport(
  classId: string,
  termId: string,
  schoolId: string
): Promise<ClassPerformanceReport> {
  // 1. Fetch all assessments in class for term
  const assessmentDefs = await this.prisma.assessmentDefinition.findMany({
    where: {
      classSubject: { classId },
      termId,
    },
  });
  
  // 2. For each subject, calculate statistics
  for (const subjectId of subjects) {
    const results = await this.prisma.assessmentResult.findMany({
      where: {
        assessmentDef: {
          classSubject: { subjectId },
          termId,
        },
      },
    });
    
    // Calculate: average, pass rate, grade distribution, etc.
    const stats = {
      averageScore: results.reduce((sum, r) => sum + r.numericValue, 0) / results.length,
      passRate: results.filter(r => r.numericValue >= 50).length / results.length * 100,
      gradeDistribution: {
        A: results.filter(r => r.grade === 'A').length,
        'A-': results.filter(r => r.grade === 'A-').length,
        // ...
      },
    };
  }
  
  return classPerformanceReport;
}
```

---

## Student Workflow

### 1. **View Personal Results**

#### Access Points

```
Student Dashboard
    ├─ Quick Stats: "Average Grade", "Class Rank"
    ├─ Recent Grades Table:
    │  ├─ Subject | Assessment | Score | Grade | Date
    │  └─ [Sorted by most recent]
    └─ "View All Grades" link

or

Assessments Menu → "My Grades" → Filtered Results
    ├─ Filter by:
    │  ├─ Subject
    │  ├─ Term
    │  └─ Assessment Type
    └─ Display: [As above]
```

#### Flow: Query Own Results

```
Student → Dashboard / My Grades
    ↓
Frontend: useStudentResults(studentId, termId?)
    ↓
API: GET /api/results?studentId={id}&termId={termId}
    ↓
Backend Query:
  SELECT AssessmentResult
  WHERE studentId = {id}
    AND termId = {termId (if provided)}
    ↓
Include related:
  - AssessmentDefinition (name, type, maxMarks)
  - ClassSubject (subject name, class, stream)
  - Term (term name, dates)
    ↓
Response: Array of results
  [
    {
      assessmentDefId: "uuid",
      assessmentName: "CAT 1",
      subjectName: "Mathematics",
      className: "Form 3A",
      numericValue: 75,
      grade: "A-",
      competencyLevel: null,
      maxMarks: 100,
      percentage: 75,
      comment: "Good work",
      assessedAt: "2024-02-01"
    },
    // ... more results
  ]
    ↓
Frontend Renders:
  ✓ Grade displayed with color coding
  ✓ Percentage bar
  ✓ Trend: "↑ up 5 points from last CAT"
  ✓ Comment (if teacher provided)
```

**Hook** ([use-grades.ts](../../frontend/src/hooks/use-grades.ts)):
```typescript
export function useStudentResults(
  studentId: string | undefined,
  termId: string | undefined
) {
  return useQuery({
    queryKey: ['results', 'student', studentId, termId],
    queryFn: () => assessmentApi.getResults({ studentId, termId }),
    enabled: !!studentId && !!termId,
  });
}
```

**API Client** ([assessment-api.ts](../../frontend/src/api/assessment-api.ts)):
```typescript
export interface ResultFilters {
  studentId?: string;
  termId?: string;
  assessmentDefId?: string;
  classSubjectId?: string;
  type?: AssessmentType;
}

async getResults(filters?: ResultFilters) {
  return api.get('/results', { params: filters });
  // Response: { data: AssessmentResult[], pagination?: {...} }
}
```

---

### 2. **View Performance Trends**

#### Display Options

```
Student → Dashboard → "Performance Trend" Section
    ↓
Line Chart (Recharts):
  X-axis: Terms (Term 1, Term 2, Term 3)
  Y-axis: Average Score (0-100)
  Line per Subject:
    ├─ Mathematics: [85, 78, 82] trend line
    ├─ English: [92, 88, 90]
    ├─ Science: [76, 75, 80]
    └─ Kiswahili: [88, 91, 93]
    ↓
Interactivity:
  - Hover: Show exact score & term
  - Toggle subject: Show/hide line
  - Export: Download as image
```

#### Backend Calculation

```typescript
// Calculate average per subject per term
async getStudentSubjectTrends(
  studentId: string,
  academicYearId: string,
  schoolId: string
) {
  const results = await this.prisma.assessmentResult.findMany({
    where: {
      studentId,
      schoolId,
      assessmentDef: {
        term: { academicYear: { id: academicYearId } },
      },
    },
    include: {
      assessmentDef: {
        include: {
          term: true,
          classSubject: { include: { subject: true } },
        },
      },
    },
  });
  
  // Group by subject + term, calculate averages
  const trends = {};
  for (const result of results) {
    const key = `${subject}-${term}`;
    // Calculate running average for each subject per term
  }
  
  return trends;
}
```

---

### 3. **View Class/Stream Statistics** (Aggregate)

#### What Students Can See

```
Student → Dashboard / Results Page
    ├─ Class Average: 72.5 (your score: 82)
    ├─ Your Rank: #5 out of 45 in class
    ├─ Subject Comparison:
    │  ├─ Math: You 82, Class Avg 70 (↑ above average)
    │  ├─ English: You 88, Class Avg 85 (↑ above average)
    │  └─ Science: You 72, Class Avg 78 (↓ below average)
    └─ [NOTE: No other students' individual scores shown]
```

#### Limitation: Privacy

- Students see **only** aggregate class statistics
- Students **cannot** view other students' individual results
- Students **cannot** sort/search peers' grades

**Backend Query** (Aggregate only):
```typescript
async getClassAggregateStats(
  classId: string,
  termId: string,
  schoolId: string
) {
  // Return only:
  // - Average score per subject
  // - Your student's score
  // - Your rank (calculated server-side)
  // NO: Individual student results
  
  const results = await this.prisma.assessmentResult.findMany({
    where: {
      assessmentDef: {
        classSubject: { classId },
        termId,
      },
      schoolId,
    },
    select: {
      studentId: true,
      numericValue: true,
      assessmentDef: { select: { classSubject: { select: { subject: true } } } },
    },
  });
  
  // Calculate aggregates
  return {
    classAveragePerSubject: {...},
    studentRank: calculateRank(studentId),
  };
}
```

---

## Parent Workflow

### 1. **View Child's Results**

```
Parent → Dashboard → "Child Grades" Tab
    ├─ Select Child (if multiple enrolled)
    ├─ Select Term
    └─ View Results:
       ├─ All subjects & assessments
       ├─ Grades, comments, trends
       ├─ Class rank
       └─ Teacher comments
```

**Key Difference from Teacher**: Read-only; no grading or editing capability.

---

## Admin Workflow

### 1. **System-Wide Assessment Overview**

```
Admin → Assessments Page (unrestricted view)
    ├─ Filter: All classes, all subjects, all teachers
    ├─ Bulk actions:
    │  ├─ Export all results for term
    │  ├─ Generate bulk reports
    │  └─ Audit grading compliance
    └─ View:
       ├─ All assessments created
       ├─ Grading progress per teacher
       ├─ School-wide performance trends
       └─ Missing grades alerts
```

---

## Key Technical Patterns

### 1. **Subject Enrollment Link: StudentClassSubject**

Why this matters:
- **Not all students take all subjects**
- Elective/optional subjects require explicit enrollment
- **Core subjects auto-enrolled** when student joins class

```typescript
// When student enrolls in class:
async autoEnrollCoreSubjects(
  enrollmentId: string,
  classId: string,
  schoolId: string,
  studentId: string
): Promise<StudentClassSubject[]> {
  // Fetch CORE subjects offered in this class
  const coreSubjects = await this.prisma.classSubject.findMany({
    where: {
      classId,
      schoolId,
      subjectCategory: 'CORE',
    },
  });
  
  // Auto-enroll student in all CORE subjects
  return Promise.all(
    coreSubjects.map(cs =>
      this.enrollStudentInSubject({
        studentId,
        classSubjectId: cs.id,
        enrollmentId,
        schoolId,
      })
    )
  );
}

// Teacher can later add electives
async enrollStudentInSubject(data: {
  studentId: string;
  classSubjectId: string;
  enrollmentId: string;
  schoolId: string;
}): Promise<StudentClassSubject> {
  // Create StudentClassSubject record
  return this.prisma.studentClassSubject.create({
    data: {
      studentId: data.studentId,
      classSubjectId: data.classSubjectId,
      enrollmentId: data.enrollmentId,
      schoolId: data.schoolId,
      status: 'ACTIVE',
    },
  });
}
```

#### Result Fetching Logic

When fetching students for grade entry:
```typescript
// Teachers only see students enrolled in the subject
const rosterForGrading = await studentClassSubjectService
  .getStudentsEnrolledInSubject(classSubjectId);

// This filters to ONLY students with:
// - StudentClassSubject.classSubjectId = classSubjectId
// - StudentClassSubject.status = 'ACTIVE'
```

### 2. **Multi-Curriculum Support**

Same assessment interface, different grade conversion:

```typescript
async processGradeData(
  data: CreateAssessmentResultInput,
  curriculum: Curriculum,
  maxMarks: number
): Promise<ProcessedGradeData> {
  const percentage = (data.numericValue / maxMarks) * 100;
  
  if (curriculum === 'EIGHT_FOUR_FOUR') {
    return {
      numericValue: data.numericValue,
      grade: this.calculateGrade844(percentage),
      competencyLevel: null,
    };
  } else if (curriculum === 'CBC') {
    return {
      numericValue: data.numericValue,
      grade: null,
      competencyLevel: this.calculateCompetencyLevel(percentage),
    };
  }
}

private calculateGrade844(percentage: number): string {
  if (percentage >= 80) return 'A';
  if (percentage >= 75) return 'A-';
  if (percentage >= 70) return 'B+';
  // ... etc
}

private calculateCompetencyLevel(percentage: number): CompetencyLevel {
  if (percentage >= 85) return 'EXCEEDING_EXPECTATIONS';
  if (percentage >= 70) return 'MEETING_EXPECTATIONS';
  if (percentage >= 50) return 'APPROACHING_EXPECTATIONS';
  return 'BELOW_EXPECTATIONS';
}
```

### 3. **Result Editing (Teacher Can Update)**

```typescript
// Same endpoint: POST /api/assessments/{id}/grades
// If result already exists (unique: studentId_assessmentDefId):

return this.prisma.assessmentResult.upsert({
  where: {
    studentId_assessmentDefId: {
      studentId: data.studentId,
      assessmentDefId: data.assessmentDefId,
    },
  },
  create: { /* new result */ },
  update: {
    numericValue: newValue,
    grade: newGrade,
    competencyLevel: newCompetency,
    comment: newComment,
    assessedById: teacherId,
    updatedAt: new Date(),
  },
});

// Frontend: If grade already entered, "Save" updates instead of creating
```

---

## Report Generation Pipeline

### 1. **Student Report Card**

```
ReportGenerationService.generateStudentReportCard(
  studentId, termId, schoolId
)
    ↓
1. Fetch student + enrollment
2. Fetch all assessments in term for student's class
3. Fetch all results for this student in this term
4. Group results by subject
5. Calculate per-subject stats:
   - Total marks & max marks
   - Average score
   - Grade/competency level
   - Position in class (for this subject)
6. Calculate overall stats:
   - Class average per subject
   - Student's overall rank
   - Pass rate by subject
7. Return: StudentReportCard object
    ↓
Frontend Renders:
  - Student details header
  - Tabular results (all subjects)
  - Overall statistics
  - Rank/position
  - Teacher comments
    ↓
Export: PDF, Excel, or print
```

### 2. **Class Performance Report**

```
ReportGenerationService.generateClassPerformanceReport(
  classId, termId, schoolId
)
    ↓
1. Fetch all assessments for class in term
2. For each subject:
   a. Fetch all results
   b. Calculate:
      - Average score
      - Pass rate (% ≥ 50)
      - Grade distribution (A, B+, etc.)
      - Competency distribution (CBC)
      - Highest/lowest scores
      - Top/bottom performers
3. Return: ClassPerformanceReport
    ↓
Frontend Displays:
  - Subject performance matrix
  - Grade distribution charts (bar, pie)
  - Top 5 students
  - Subject performance comparison
  - Trends vs. previous terms
```

---

## API Endpoints Reference

### Assessment Management

| Method | Endpoint | Role | Purpose |
|--------|----------|------|---------|
| POST | `/api/assessments` | TEACHER | Create assessment |
| GET | `/api/assessments` | TEACHER, ADMIN | List assessments (filtered by school) |
| GET | `/api/assessments/:id` | TEACHER, STUDENT | View assessment details |
| PUT | `/api/assessments/:id` | TEACHER | Update assessment (before grading) |
| DELETE | `/api/assessments/:id` | TEACHER | Delete assessment (no grades entered) |
| GET | `/api/assessments/class-subjects/:id` | TEACHER | Get subject assessments |

### Grade Entry

| Method | Endpoint | Role | Purpose |
|--------|----------|------|---------|
| POST | `/api/results` | TEACHER | Record single grade |
| POST | `/api/results/bulk` | TEACHER | Bulk grade entry |
| POST | `/api/results/csv` | TEACHER | CSV upload |
| GET | `/api/results` | STUDENT, TEACHER, PARENT | Fetch results (filtered by role) |
| PUT | `/api/results/:id` | TEACHER | Update existing grade |

### Reporting

| Method | Endpoint | Role | Purpose |
|--------|----------|------|---------|
| GET | `/api/reports/student/:studentId?termId=X` | STUDENT, PARENT, TEACHER | Student report card |
| GET | `/api/reports/class/:classId?termId=X` | TEACHER, ADMIN | Class performance |
| GET | `/api/reports/export/:format` | TEACHER, ADMIN | Export (PDF, Excel) |

---

## Current Implementation Status

### ✅ Implemented

- [x] Assessment definition creation
- [x] Grade entry (manual table + CSV upload)
- [x] Bulk grade recording
- [x] Grade auto-conversion (8-4-4 & CBC)
- [x] Result viewing (student, teacher, parent)
- [x] Class performance report generation
- [x] Student report card generation
- [x] Multi-curriculum support
- [x] Multi-tenancy (school isolation)

### 🟡 Partial/In-Progress

- [ ] Report export (PDF generation)
- [ ] Advanced filtering & search in results
- [ ] Performance trends visualization
- [ ] Mobile-optimized grade entry

### ⚠️ Not Yet Implemented

- [ ] Grade comment templates
- [ ] Automated parent notifications
- [ ] Grade appeals/review workflow
- [ ] Supplementary exams workflow
- [ ] Integration with student promotion logic
- [ ] Benchmark/national exam score mapping

---

## File Reference Map

### Frontend Components

- [GradeEntryTable.tsx](../../frontend/src/components/grades/GradeEntryTable.tsx) - Manual grade entry UI
- [CSVUpload.tsx](../../frontend/src/components/grades/CSVUpload.tsx) - CSV upload UI
- [GradeEntryPage.tsx](../../frontend/src/pages/assessments/GradeEntryPage.tsx) - Grade entry page container
- [ReportsPage.tsx](../../frontend/src/pages/assessments/ReportsPage.tsx) - Report generation UI
- [StudentDashboard.tsx](../../frontend/src/pages/dashboards/StudentDashboard.tsx) - Student results display
- [TeacherDashboard.tsx](../../frontend/src/pages/dashboards/TeacherDashboard.tsx) - Teacher stats overview

### Frontend Hooks & Services

- [use-assessments.ts](../../frontend/src/hooks/use-assessments.ts) - Assessment queries/mutations
- [use-grades.ts](../../frontend/src/hooks/use-grades.ts) - Grade entry hooks
- [use-reports.ts](../../frontend/src/hooks/use-reports.ts) - Report generation hooks
- [assessment-api.ts](../../frontend/src/api/assessment-api.ts) - API client

### Backend Services

- [assessment.service.ts](../../server/src/services/assessment.service.ts) - Assessment CRUD & queries
- [grade-entry.service.ts](../../server/src/services/grade-entry.service.ts) - Grade recording & conversion
- [report-generation.service.ts](../../server/src/services/report-generation.service.ts) - Report generation
- [assessment.controller.ts](../../server/src/controllers/assessment.controller.ts) - Route handlers
- [assessment.validation.ts](../../server/src/validation/assessment.validation.ts) - Input schemas

### Database Schema

- [schema.prisma](../../server/prisma/schema.prisma) - Relevant models:
  - `AssessmentDefinition`
  - `AssessmentResult`
  - `ClassSubject`
  - `StudentClassSubject`
  - `Term`, `Class`, `Subject`, `Student`, `Teacher`

---

## Next Steps for Enhancement

1. **PDF Export**: Integrate a PDF library (e.g., `pdfkit`, `puppeteer`) to export report cards
2. **Visualization**: Add Recharts charts to dashboard for performance trends
3. **Notifications**: Email teacher when grades are requested, notify parent of results
4. **Analytics**: Add dashboard showing grading trends, identify at-risk students
5. **Automation**: Auto-send report cards to parents end-of-term
6. **Mobile**: Optimize grade entry for tablets (landscape view optimization)

