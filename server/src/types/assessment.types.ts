// src/types/assessment.types.ts

import { 
  AssessmentDefinition, 
  AssessmentResult, 
  AssessmentType, 
  CompetencyLevel,
  Curriculum 
} from '@prisma/client';

/**
 * Extended Assessment Definition with relations
 */
export interface AssessmentDefinitionWithRelations extends AssessmentDefinition {
  classSubject: {
    id: string;
    subject: {
      id: string;
      name: string;
      code: string;
    };
    class: {
      id: string;
      name: string;
      level: string;
      curriculum: Curriculum;
    };
    stream?: {
      id: string;
      name: string;
    } | null;
    teacherProfile?: {
      id: string;
      user: {
        firstName: string;
        lastName: string;
      };
    } | null;
  };
  term: {
    id: string;
    name: string;
    termNumber: number;
  };
  academicYear?: {
    id: string;
    year: number;
  } | null;
  strand?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    results: number;
  };
}

/**
 * Extended Assessment Result with relations
 */
export interface AssessmentResultWithRelations extends AssessmentResult {
  student: {
    id: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
  };
  assessmentDef: {
    id: string;
    name: string;
    type: AssessmentType;
    maxMarks?: number | null;
    classSubject: {
      subject: {
        id: string;
        name: string;
        code: string;
      };
      class: {
        id: string;
        name: string;
      };
    };
    term: {
      id: string;
      name: string;
    };
  };
  assessedBy: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

/**
 * Grade Entry Types
 */
export interface GradeEntryData {
  studentId: string;
  marks: number;
  comment?: string;
}

export interface BulkGradeEntryData {
  assessmentDefId: string;
  entries: GradeEntryData[];
}

export interface CSVGradeEntry {
  studentAdmissionNo: string;
  marks: number;
  comment?: string;
}

/**
 * Report Card Types
 */
export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  assessments: AssessmentScore[];
  totalMarks: number;
  totalMaxMarks: number;
  average: number;
  grade?: string;
  competencyLevel?: CompetencyLevel;
  position?: number;
  comment?: string;
}

export interface AssessmentScore {
  assessmentId: string;
  assessmentName: string;
  type: AssessmentType;
  marks: number;
  maxMarks: number;
  grade?: string;
  competencyLevel?: CompetencyLevel;
  percentage: number;
}

export interface StudentReportCard {
  student: {
    id: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
    middleName?: string;
  };
  class: {
    id: string;
    name: string;
    level: string;
    curriculum: Curriculum;
  };
  term: {
    id: string;
    name: string;
    termNumber: number;
  };
  academicYear: {
    id: string;
    year: number;
  };
  subjects: SubjectPerformance[];
  overallPerformance: {
    totalMarks: number;
    totalMaxMarks: number;
    averagePercentage: number;
    overallGrade?: string;
    overallPosition?: number;
    totalStudents: number;
  };
  generatedAt: Date;
}

/**
 * Class Performance Report Types
 */
export interface ClassSubjectPerformance {
  subjectId: string;
  subjectName: string;
  totalStudents: number;
  studentsAssessed: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  gradeDistribution?: GradeDistribution;
  competencyDistribution?: CompetencyDistribution;
}

export interface GradeDistribution {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
}

export interface CompetencyDistribution {
  [CompetencyLevel.EXCEEDING_EXPECTATIONS]: number;
  [CompetencyLevel.MEETING_EXPECTATIONS]: number;
  [CompetencyLevel.APPROACHING_EXPECTATIONS]: number;
  [CompetencyLevel.BELOW_EXPECTATIONS]: number;
}

export interface TopPerformer {
  studentId: string;
  studentName: string;
  admissionNo: string;
  averageScore: number;
}

export interface ClassPerformanceReport {
  class: {
    id: string;
    name: string;
    level: string;
    curriculum: Curriculum;
  };
  term: {
    id: string;
    name: string;
    termNumber: number;
  };
  subjects: ClassSubjectPerformance[];
  overallStatistics: {
    totalStudents: number;
    averagePerformance: number;
    topPerformers: TopPerformer[];
  };
}

/**
 * Filter Types
 */
export interface AssessmentFilter {
  termId?: string;
  classSubjectId?: string;
  type?: AssessmentType;
  academicYearId?: string;
  page?: number;
  limit?: number;
}

export interface ResultFilter {
  studentId?: string;
  assessmentDefId?: string;
  classId?: string;
  termId?: string;
  academicYearId?: string;
  page?: number;
  limit?: number;
}

/**
 * Statistics Types
 */
export interface AssessmentStatistics {
  total: number;
  byType: Record<AssessmentType, number>;
  withResults: number;
  withoutResults: number;
}

/**
 * Bulk Operation Result Types
 */
export interface BulkGradeEntryResult {
  successful: number;
  failed: number;
  results: AssessmentResult[];
  errors: Array<{
    studentId: string;
    error: string;
  }>;
}

export interface CSVUploadResult {
  successful: number;
  failed: number;
  results: AssessmentResult[];
  errors: Array<{
    row: number;
    admissionNo: string;
    error: string;
  }>;
}

/**
 * API Response Types
 */
export interface AssessmentListResponse {
  data: AssessmentDefinitionWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ResultListResponse {
  data: AssessmentResultWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SingleAssessmentResponse {
  data: AssessmentDefinitionWithRelations;
}

export interface SingleResultResponse {
  data: AssessmentResultWithRelations;
}

export interface ReportCardResponse {
  data: StudentReportCard;
}

export interface ClassReportResponse {
  data: ClassPerformanceReport;
}

/**
 * Request User Type (from JWT)
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  schoolId?: string;
}

/**
 * Extended Express Request
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
