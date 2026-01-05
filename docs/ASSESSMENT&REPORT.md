# EduTrak: Assessment, Grading & Report Generation Logic

Comprehensive guide for implementing the dual-curriculum assessment system supporting both CBC (Competency-Based Curriculum) and 8-4-4 (Traditional Grading System).

---

## 🎯 Overview

### Two Parallel Assessment Systems:

1. **CBC (Competency-Based Curriculum)** - Grades PP1 to Grade 9
   - Uses competency levels instead of marks
   - Focuses on learning outcomes
   - Descriptive feedback-oriented

2. **8-4-4 System** - Forms 1-4 (being phased out)
   - Traditional marks and grades
   - Points system for university entry
   - Subject-specific grading

---

## 📊 Assessment Types

### Common Assessment Types (Both Systems)

```typescript
export enum AssessmentType {
  CAT = 'CAT',                    // Continuous Assessment Test
  MIDTERM = 'MIDTERM',            // Mid-Term Exam
  END_OF_TERM = 'END_OF_TERM',    // End of Term Exam
  MOCK = 'MOCK',                  // Mock Exam (Form 4/Grade 9)
  NATIONAL_EXAM = 'NATIONAL_EXAM', // KCPE/KCSE
  COMPETENCY_BASED = 'COMPETENCY_BASED' // CBC-specific
}
```

### Assessment Weights by Type

```typescript
const ASSESSMENT_WEIGHTS = {
  CBC: {
    COMPETENCY_BASED: 100, // Single comprehensive assessment
  },
  EIGHT_FOUR_FOUR: {
    CAT: 20,           // 20% of term grade
    MIDTERM: 30,       // 30% of term grade
    END_OF_TERM: 50,   // 50% of term grade
  }
};
```

---

## 🎓 CBC Grading System

### Competency Levels

```typescript
export enum CompetencyLevel {
  EXCEEDING_EXPECTATIONS = 'EXCEEDING_EXPECTATIONS',       // 4 - Exceptional
  MEETING_EXPECTATIONS = 'MEETING_EXPECTATIONS',           // 3 - Satisfactory
  APPROACHING_EXPECTATIONS = 'APPROACHING_EXPECTATIONS',   // 2 - Developing
  BELOW_EXPECTATIONS = 'BELOW_EXPECTATIONS'                // 1 - Needs Support
}

const COMPETENCY_DESCRIPTIONS = {
  EXCEEDING_EXPECTATIONS: {
    symbol: 'EE',
    numeric: 4,
    description: 'The learner exceeds the expectations for the grade level',
    color: '#10b981', // green
  },
  MEETING_EXPECTATIONS: {
    symbol: 'ME',
    numeric: 3,
    description: 'The learner meets the expectations for the grade level',
    color: '#3b82f6', // blue
  },
  APPROACHING_EXPECTATIONS: {
    symbol: 'AE',
    numeric: 2,
    description: 'The learner is approaching the expectations for the grade level',
    color: '#f59e0b', // amber
  },
  BELOW_EXPECTATIONS: {
    symbol: 'BE',
    numeric: 1,
    description: 'The learner is below the expectations for the grade level',
    color: '#ef4444', // red
  },
};
```

### CBC Assessment Logic

```typescript
interface CBCAssessment {
  studentId: number;
  subjectId: number;
  termId: number;
  learningArea: LearningArea;
  strands: CBCStrand[];
  overallCompetency: CompetencyLevel;
  teacherRemarks: string;
  evidenceOfLearning: string[];
}

interface CBCStrand {
  strandName: string;
  competencyLevel: CompetencyLevel;
  specificObservations: string;
}

// Example: Assessing Mathematics
const mathAssessment: CBCAssessment = {
  studentId: 1,
  subjectId: 5,
  termId: 1,
  learningArea: 'MATHEMATICS',
  strands: [
    {
      strandName: 'Numbers',
      competencyLevel: 'MEETING_EXPECTATIONS',
      specificObservations: 'Can perform basic operations with whole numbers',
    },
    {
      strandName: 'Measurement',
      competencyLevel: 'EXCEEDING_EXPECTATIONS',
      specificObservations: 'Demonstrates excellent understanding of length and mass',
    },
    {
      strandName: 'Geometry',
      competencyLevel: 'APPROACHING_EXPECTATIONS',
      specificObservations: 'Still developing understanding of 3D shapes',
    },
  ],
  overallCompetency: 'MEETING_EXPECTATIONS',
  teacherRemarks: 'John shows good progress in mathematics. Keep practicing geometry.',
  evidenceOfLearning: ['Class activities', 'Projects', 'Observations'],
};

// Calculate overall competency from strands
function calculateOverallCompetency(strands: CBCStrand[]): CompetencyLevel {
  const numericValues = strands.map(s => COMPETENCY_DESCRIPTIONS[s.competencyLevel].numeric);
  const average = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
  
  if (average >= 3.5) return 'EXCEEDING_EXPECTATIONS';
  if (average >= 2.5) return 'MEETING_EXPECTATIONS';
  if (average >= 1.5) return 'APPROACHING_EXPECTATIONS';
  return 'BELOW_EXPECTATIONS';
}
```

### CBC Report Card Structure

```typescript
interface CBCReportCard {
  student: Student;
  term: Term;
  academicYear: AcademicYear;
  assessments: CBCAssessment[];
  
  // Core Competencies Assessment
  coreCompetencies: {
    communication: CompetencyLevel;
    collaboration: CompetencyLevel;
    criticalThinking: CompetencyLevel;
    creativity: CompetencyLevel;
    citizenship: CompetencyLevel;
    digitalLiteracy: CompetencyLevel;
    learningToLearn: CompetencyLevel;
  };
  
  // Values Assessment
  values: {
    respect: CompetencyLevel;
    responsibility: CompetencyLevel;
    integrity: CompetencyLevel;
    patriotism: CompetencyLevel;
    unity: CompetencyLevel;
    peace: CompetencyLevel;
    love: CompetencyLevel;
  };
  
  classTeacherRemarks: string;
  principalRemarks: string;
  daysPresent: number;
  daysAbsent: number;
  promotionStatus: 'PROMOTED' | 'RETAINED' | 'TRANSFERRED';
}
```

---

## 📐 8-4-4 Grading System

### Grade Scale

```typescript
const GRADE_SCALE = {
  A: { min: 80, max: 100, points: 12, description: 'Excellent' },
  'A-': { min: 75, max: 79, points: 11, description: 'Very Good' },
  'B+': { min: 70, max: 74, points: 10, description: 'Good' },
  B: { min: 65, max: 69, points: 9, description: 'Good' },
  'B-': { min: 60, max: 64, points: 8, description: 'Above Average' },
  'C+': { min: 55, max: 59, points: 7, description: 'Above Average' },
  C: { min: 50, max: 54, points: 6, description: 'Average' },
  'C-': { min: 45, max: 49, points: 5, description: 'Average' },
  'D+': { min: 40, max: 44, points: 4, description: 'Below Average' },
  D: { min: 35, max: 39, points: 3, description: 'Below Average' },
  'D-': { min: 30, max: 34, points: 2, description: 'Poor' },
  E: { min: 0, max: 29, points: 1, description: 'Very Poor' },
};

function convertMarksToGrade(percentage: number): string {
  for (const [grade, range] of Object.entries(GRADE_SCALE)) {
    if (percentage >= range.min && percentage <= range.max) {
      return grade;
    }
  }
  return 'E';
}

function gradeToPoints(grade: string): number {
  return GRADE_SCALE[grade]?.points || 0;
}
```

### 8-4-4 Assessment Calculation

```typescript
interface TraditionalAssessment {
  studentId: number;
  subjectId: number;
  termId: number;
  assessments: {
    cat1?: number;
    cat2?: number;
    midterm?: number;
    endOfTerm?: number;
  };
  maxMarks: {
    cat: number;      // Usually 30
    midterm: number;  // Usually 30
    endOfTerm: number; // Usually 70-100
  };
}

function calculateTermMark(assessment: TraditionalAssessment): {
  totalMarks: number;
  percentage: number;
  grade: string;
  points: number;
} {
  const { assessments, maxMarks } = assessment;
  
  // Calculate weighted average
  const catAverage = assessments.cat1 && assessments.cat2
    ? (assessments.cat1 + assessments.cat2) / 2
    : assessments.cat1 || assessments.cat2 || 0;
  
  const catScore = (catAverage / maxMarks.cat) * 20; // 20% weight
  const midtermScore = assessments.midterm
    ? (assessments.midterm / maxMarks.midterm) * 30 // 30% weight
    : 0;
  const endOfTermScore = assessments.endOfTerm
    ? (assessments.endOfTerm / maxMarks.endOfTerm) * 50 // 50% weight
    : 0;
  
  const totalPercentage = catScore + midtermScore + endOfTermScore;
  const grade = convertMarksToGrade(totalPercentage);
  const points = gradeToPoints(grade);
  
  return {
    totalMarks: totalPercentage,
    percentage: totalPercentage,
    grade,
    points,
  };
}
```

### Mean Grade Calculation (For KCSE)

```typescript
interface SubjectResult {
  subjectName: string;
  grade: string;
  points: number;
}

function calculateMeanGrade(subjects: SubjectResult[]): {
  totalPoints: number;
  meanGrade: string;
  meanPoints: number;
} {
  // KCSE uses best 7 subjects + 2 compulsory (English & Math)
  const compulsorySubjects = subjects.filter(
    s => s.subjectName === 'English' || s.subjectName === 'Mathematics'
  );
  
  const otherSubjects = subjects
    .filter(s => s.subjectName !== 'English' && s.subjectName !== 'Mathematics')
    .sort((a, b) => b.points - a.points)
    .slice(0, 5); // Best 5 remaining
  
  const allSubjects = [...compulsorySubjects, ...otherSubjects];
  const totalPoints = allSubjects.reduce((sum, s) => sum + s.points, 0);
  const meanPoints = totalPoints / allSubjects.length;
  
  // Convert mean points to mean grade
  const meanGrade = convertPointsToMeanGrade(meanPoints);
  
  return {
    totalPoints,
    meanGrade,
    meanPoints: Number(meanPoints.toFixed(2)),
  };
}

function convertPointsToMeanGrade(points: number): string {
  if (points >= 11.5) return 'A';
  if (points >= 10.5) return 'A-';
  if (points >= 9.5) return 'B+';
  if (points >= 8.5) return 'B';
  if (points >= 7.5) return 'B-';
  if (points >= 6.5) return 'C+';
  if (points >= 5.5) return 'C';
  if (points >= 4.5) return 'C-';
  if (points >= 3.5) return 'D+';
  if (points >= 2.5) return 'D';
  if (points >= 1.5) return 'D-';
  return 'E';
}
```

### 8-4-4 Report Card Structure

```typescript
interface TraditionalReportCard {
  student: Student;
  term: Term;
  academicYear: AcademicYear;
  
  subjects: Array<{
    subjectName: string;
    cat1?: number;
    cat2?: number;
    midterm?: number;
    endOfTerm?: number;
    totalMarks: number;
    grade: string;
    points: number;
    teacherInitials: string;
    remarks?: string;
  }>;
  
  summary: {
    totalMarks: number;
    averageMarks: number;
    totalPoints: number;
    meanGrade: string;
    position: number;
    outOf: number;
    streamPosition?: number;
  };
  
  conduct: {
    behavior: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    attendance: number;
    punctuality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  };
  
  classTeacherRemarks: string;
  principalRemarks: string;
  nextTermBegins: string;
}
```

---

## 📈 Class Performance Analysis

### Class Statistics Calculation

```typescript
interface ClassStatistics {
  subjectName: string;
  assessmentType: AssessmentType;
  
  stats: {
    totalStudents: number;
    studentsAssessed: number;
    highestMark: number;
    lowestMark: number;
    averageMark: number;
    medianMark: number;
    standardDeviation: number;
  };
  
  gradeDistribution: {
    [grade: string]: number;
  };
  
  performanceBands: {
    excellent: number;    // 75-100%
    good: number;         // 60-74%
    average: number;      // 45-59%
    belowAverage: number; // 30-44%
    poor: number;         // 0-29%
  };
}

function calculateClassStatistics(
  assessments: Assessment[]
): ClassStatistics {
  const marks = assessments
    .filter(a => a.marksObtained !== null)
    .map(a => (a.marksObtained! / a.maxMarks) * 100);
  
  marks.sort((a, b) => a - b);
  
  const totalStudents = assessments.length;
  const studentsAssessed = marks.length;
  const highestMark = Math.max(...marks);
  const lowestMark = Math.min(...marks);
  const averageMark = marks.reduce((a, b) => a + b, 0) / marks.length;
  const medianMark = marks[Math.floor(marks.length / 2)];
  
  // Standard deviation
  const variance = marks.reduce((sum, mark) => {
    return sum + Math.pow(mark - averageMark, 2);
  }, 0) / marks.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Grade distribution
  const gradeDistribution: { [grade: string]: number } = {};
  marks.forEach(mark => {
    const grade = convertMarksToGrade(mark);
    gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
  });
  
  // Performance bands
  const performanceBands = {
    excellent: marks.filter(m => m >= 75).length,
    good: marks.filter(m => m >= 60 && m < 75).length,
    average: marks.filter(m => m >= 45 && m < 60).length,
    belowAverage: marks.filter(m => m >= 30 && m < 45).length,
    poor: marks.filter(m => m < 30).length,
  };
  
  return {
    subjectName: assessments[0]?.classSubject?.subject?.name || '',
    assessmentType: assessments[0]?.type,
    stats: {
      totalStudents,
      studentsAssessed,
      highestMark: Number(highestMark.toFixed(2)),
      lowestMark: Number(lowestMark.toFixed(2)),
      averageMark: Number(averageMark.toFixed(2)),
      medianMark: Number(medianMark.toFixed(2)),
      standardDeviation: Number(standardDeviation.toFixed(2)),
    },
    gradeDistribution,
    performanceBands,
  };
}
```

---

## 📋 Report Generation Logic

### Backend Service Methods

```typescript
// src/services/assessment.service.ts

export class AssessmentService {
  // Generate individual student report
  async generateStudentTermReport(
    studentId: number,
    termId: number
  ): Promise<ReportCard> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { class: true, stream: true },
        },
      },
    });
    
    const term = await prisma.term.findUnique({
      where: { id: termId },
      include: { academicYear: true },
    });
    
    const assessments = await prisma.assessment.findMany({
      where: { studentId, termId },
      include: {
        classSubject: {
          include: { subject: true },
        },
      },
    });
    
    const enrollment = student?.enrollments[0];
    const curriculum = enrollment?.class?.curriculum;
    
    if (curriculum === 'CBC') {
      return this.generateCBCReport(student!, term!, assessments);
    } else {
      return this.generateTraditionalReport(student!, term!, assessments);
    }
  }
  
  // Generate CBC report
  private generateCBCReport(
    student: Student,
    term: Term,
    assessments: Assessment[]
  ): CBCReportCard {
    const assessmentsBySubject = assessments.reduce((acc, assessment) => {
      const subjectName = assessment.classSubject.subject.name;
      if (!acc[subjectName]) acc[subjectName] = [];
      acc[subjectName].push(assessment);
      return acc;
    }, {} as Record<string, Assessment[]>);
    
    const subjectAssessments = Object.entries(assessmentsBySubject).map(
      ([subjectName, subjectAssessments]) => ({
        subjectName,
        learningArea: subjectAssessments[0].classSubject.subject.learningArea,
        overallCompetency: subjectAssessments[0].competencyLevel,
        teacherRemarks: subjectAssessments[0].remarks || '',
      })
    );
    
    return {
      student,
      term,
      academicYear: term.academicYear,
      assessments: subjectAssessments,
      coreCompetencies: {
        // These would come from separate competency assessments
        communication: 'MEETING_EXPECTATIONS',
        collaboration: 'MEETING_EXPECTATIONS',
        criticalThinking: 'APPROACHING_EXPECTATIONS',
        creativity: 'EXCEEDING_EXPECTATIONS',
        citizenship: 'MEETING_EXPECTATIONS',
        digitalLiteracy: 'APPROACHING_EXPECTATIONS',
        learningToLearn: 'MEETING_EXPECTATIONS',
      },
      values: {
        respect: 'MEETING_EXPECTATIONS',
        responsibility: 'MEETING_EXPECTATIONS',
        integrity: 'EXCEEDING_EXPECTATIONS',
        patriotism: 'MEETING_EXPECTATIONS',
        unity: 'MEETING_EXPECTATIONS',
        peace: 'MEETING_EXPECTATIONS',
        love: 'EXCEEDING_EXPECTATIONS',
      },
      classTeacherRemarks: 'Good progress overall. Keep up the good work.',
      principalRemarks: 'Satisfactory performance.',
      daysPresent: 60,
      daysAbsent: 3,
      promotionStatus: 'PROMOTED',
    };
  }
  
  // Generate traditional report
  private generateTraditionalReport(
    student: Student,
    term: Term,
    assessments: Assessment[]
  ): TraditionalReportCard {
    const subjectResults = assessments.map(assessment => {
      const percentage = (assessment.marksObtained! / assessment.maxMarks) * 100;
      const grade = convertMarksToGrade(percentage);
      const points = gradeToPoints(grade);
      
      return {
        subjectName: assessment.classSubject.subject.name,
        marksObtained: assessment.marksObtained!,
        maxMarks: assessment.maxMarks,
        grade,
        points,
        teacherInitials: 'JD',
      };
    });
    
    const totalMarks = subjectResults.reduce((sum, s) => sum + s.marksObtained, 0);
    const averageMarks = totalMarks / subjectResults.length;
    const totalPoints = subjectResults.reduce((sum, s) => sum + s.points, 0);
    const meanGrade = convertPointsToMeanGrade(totalPoints / subjectResults.length);
    
    // Calculate position (would query all students in class)
    const position = await this.calculatePosition(student.id, term.id);
    
    return {
      student,
      term,
      academicYear: term.academicYear,
      subjects: subjectResults,
      summary: {
        totalMarks: Number(totalMarks.toFixed(2)),
        averageMarks: Number(averageMarks.toFixed(2)),
        totalPoints,
        meanGrade,
        position: position.classPosition,
        outOf: position.totalStudents,
        streamPosition: position.streamPosition,
      },
      conduct: {
        behavior: 'Good',
        attendance: 95,
        punctuality: 'Excellent',
      },
      classTeacherRemarks: 'Good performance. Keep improving.',
      principalRemarks: 'Well done.',
      nextTermBegins: '2024-05-06',
    };
  }
  
  // Calculate student position in class
  private async calculatePosition(
    studentId: number,
    termId: number
  ): Promise<{
    classPosition: number;
    streamPosition: number;
    totalStudents: number;
  }> {
    // Get all students in the same class
    const enrollment = await prisma.studentClass.findFirst({
      where: { studentId, status: 'ACTIVE' },
      include: { class: true, stream: true },
    });
    
    const classStudents = await prisma.studentClass.findMany({
      where: {
        classId: enrollment?.classId,
        status: 'ACTIVE',
      },
      include: {
        student: {
          include: {
            assessments: {
              where: { termId },
            },
          },
        },
      },
    });
    
    // Calculate average for each student
    const studentAverages = classStudents.map(s => {
      const assessments = s.student.assessments;
      const totalPoints = assessments.reduce(
        (sum, a) => sum + gradeToPoints(a.grade || 'E'),
        0
      );
      return {
        studentId: s.studentId,
        averagePoints: totalPoints / assessments.length,
      };
    });
    
    // Sort by average (descending)
    studentAverages.sort((a, b) => b.averagePoints - a.averagePoints);
    
    // Find position
    const classPosition = studentAverages.findIndex(s => s.studentId === studentId) + 1;
    
    return {
      classPosition,
      streamPosition: classPosition, // Simplified
      totalStudents: studentAverages.length,
    };
  }
  
  // Generate class report
  async generateClassTermReport(
    classId: number,
    termId: number
  ): Promise<ClassReport> {
    const students = await prisma.studentClass.findMany({
      where: { classId, status: 'ACTIVE' },
      include: { student: true },
    });
    
    const reports = await Promise.all(
      students.map(enrollment =>
        this.generateStudentTermReport(enrollment.studentId, termId)
      )
    );
    
    return {
      class: await prisma.class.findUnique({ where: { id: classId } }),
      term: await prisma.term.findUnique({ where: { id: termId } }),
      studentReports: reports,
      classStatistics: await this.getClassStatistics(classId, termId),
    };
  }
}
```

---

## 🎨 Frontend Implementation

### Assessment Form (8-4-4)

```typescript
// src/components/assessments/TraditionalAssessmentForm.tsx

interface AssessmentFormProps {
  classSubjectId: number;
  termId: number;
  students: Student[];
}

export function TraditionalAssessmentForm({
  classSubjectId,
  termId,
  students,
}: AssessmentFormProps) {
  const [assessments, setAssessments] = useState<Map<number, AssessmentData>>(
    new Map()
  );
  
  const createBulkAssessment = useCreateBulkAssessment();
  
  const handleMarkChange = (
    studentId: number,
    field: 'cat1' | 'cat2' | 'midterm' | 'endOfTerm',
    value: number
  ) => {
    const current = assessments.get(studentId) || {};
    assessments.set(studentId, { ...current, [field]: value });
    setAssessments(new Map(assessments));
  };
  
  const calculateGrade = (studentId: number): string => {
    const data = assessments.get(studentId);
    if (!data) return '-';
    
    const result = calculateTermMark({
      studentId,
      assessments: data,
      maxMarks: { cat: 30, midterm: 30, endOfTerm: 100 },
    });
    
    return result.grade;
  };
  
  const handleSubmit = async () => {
    const assessmentData = Array.from(assessments.entries()).map(
      ([studentId, data]) => ({
        studentId,
        classSubjectId,
        termId,
        ...data,
      })
    );
    
    await createBulkAssessment.mutateAsync(assessmentData);
  };
  
  return (
    <div className="space-y-4">
      <table className="w-full">
        <thead>
          <tr>
            <th>Adm No</th>
            <th>Student Name</th>
            <th>CAT 1 /30</th>
            <th>CAT 2 /30</th>
            <th>Midterm /30</th>
            <th>End of Term /100</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.id}>
              <td>{student.admissionNo}</td>
              <td>{`${student.firstName} ${student.lastName}`}</td>
              <td>
                <Input
                  type="number"
                  max={30}
                  onChange={(e) =>
                    handleMarkChange(student.id, 'cat1', Number(e.target.value))
                  }
                />
              </td>
              <td>
                <Input
                  type="number"
                  max={30}
                  onChange={(e) =>
                    handleMarkChange(student.id, 'cat2', Number(e.target.value))
                  }
                />
              </td>
              <td>
                <Input
                  type="number"
                  max={30}
                  onChange={(e) =>
                    handleMarkChange(student.id, 'midterm', Number(e.target.value))
                  }
                />
              </td>
              <td>
                <Input
                  type="number"
                  max={100}
                  onChange={(e) =>
                    handleMarkChange(student.id, 'endOfTerm', Number(e.target.value))
                  }
                />
              </td>
              <td>
                <Badge>{calculateGrade(student.id)}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <Button onClick={handleSubmit} disabled={createBulkAssessment.isPending}>
        Submit Assessments
      </Button>
    </div>
  );
}
```

### CBC Assessment Form

```typescript
// src/components/assessments/CBCAssessmentForm.tsx

export function CBCAssessmentForm({ student, subject, termId }: Props) {
  const { register, handleSubmit } = useForm<CBCAssessmentData>();
  const createAssessment = useCreateAssessment();
  
  const onSubmit = async (data: CBCAssessmentData) => {
    await createAssessment.mutateAsync({
      studentId: student.id,
      subjectId: subject.id,
      termId,
      type: 'COMPETENCY_BASED',
      competencyLevel: data.overallCompetency,
      remarks: data.teacherRemarks,
      strands: JSON.stringify(data.strands),
    });
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="font-semibold">Student: {student.firstName} {student.lastName}</h3>
        <p className="text-sm text-muted-foreground">Subject: {subject.name}</p>
      </div>
      
      <div className="space-y-4">
        <h4 className="font-medium">Strand Assessment</h4>
        {subject.strands.map((strand, index) => (
          <div key={index} className="border p-4 rounded-lg">
            <Label>{strand.name}</Label>
            <Select {...register(`strands.${index}.competencyLevel`)}>
              <SelectTrigger>
                <SelectValue placeholder="Select competency level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXCEEDING_EXPECTATIONS">
                  Exceeding Expectations (EE)
                </SelectItem>
                <SelectItem value="MEETING_EXPECTATIONS">
                  Meeting Expectations (ME)
                </SelectItem>
                <SelectItem value="APPROACHING_EXPECTATIONS">
                  Approaching Expectations (AE)
                </SelectItem>
                <SelectItem value="BELOW_EXPECTATIONS">
                  Below Expectations (BE)
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Textarea
              {...register(`strands.