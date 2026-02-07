export enum SchoolType {
  PRE_PRIMARY = 'PRE_PRIMARY',
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  TVET = 'TVET',
  SPECIAL_NEEDS = 'SPECIAL_NEEDS',
}
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  SUPPORT_STAFF = 'SUPPORT_STAFF'
}
export enum Curriculum {
  CBC = 'CBC',
  EIGHT_FOUR_FOUR = 'EIGHT_FOUR_FOUR',
  TVET = 'TVET',
  IGCSE = 'IGCSE',
  IB = 'IB'
};
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
};
export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  PROMOTED = 'PROMOTED',
  TRANSFERRED = 'TRANSFERRED',
  GRADUATED = 'GRADUATED',
  DROPPED_OUT = 'DROPPED_OUT',
  SUSPENDED = 'SUSPENDED'
};

export enum SubjectEnrollmentStatus {
  ACTIVE = 'ACTIVE',
  DROPPED = 'DROPPED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}
export enum AssessmentType  {
  CAT = 'CAT',
  MIDTERM = 'MIDTERM',
  END_OF_TERM = 'END_OF_TERM',
  MOCK = 'MOCK',
  NATIONAL_EXAM = 'NATIONAL_EXAM',
  COMPETENCY_BASED = 'COMPETENCY_BASED'
};
export enum CompetencyLevel {
  EXCEEDING_EXPECTATIONS = 'EXCEEDING_EXPECTATIONS',
  MEETING_EXPECTATIONS = 'MEETING_EXPECTATIONS',
  APPROACHING_EXPECTATIONS = 'APPROACHING_EXPECTATIONS',
  BELOW_EXPECTATIONS = 'BELOW_EXPECTATIONS'
};
export enum Ownership {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  FAITH_BASED = 'FAITH_BASED',
  NGO = 'NGO',
}
export enum BoardingStatus {
  DAY = 'DAY',
  BOARDING = 'BOARDING',
  BOTH = 'BOTH',
}
export enum SchoolGender {
  BOYS = 'BOYS',
  GIRLS = 'GIRLS',
  MIXED = 'MIXED',
}
export enum EmploymentType {
  PERMANENT = 'PERMANENT',
  CONTRACT = 'CONTRACT',
  TEMPORARY = 'TEMPORARY',
  BOM = 'BOM',
  PTA = 'PTA'
};
export enum SubjectCategory {
  CORE = 'CORE',
  ELECTIVE = 'ELECTIVE',
  OPTIONAL = 'OPTIONAL',
  TECHNICAL = 'TECHNICAL',
  APPLIED = 'APPLIED'
};
export enum LearningArea {
  LANGUAGES = 'LANGUAGES',
  MATHEMATICS = 'MATHEMATICS',
  SCIENCE_TECHNOLOGY = 'SCIENCE_TECHNOLOGY',
  SOCIAL_STUDIES = 'SOCIAL_STUDIES',
  RELIGIOUS_EDUCATION = 'RELIGIOUS_EDUCATION',
  CREATIVE_ARTS = 'CREATIVE_ARTS',
  PHYSICAL_HEALTH_EDUCATION = 'PHYSICAL_HEALTH_EDUCATION',
  PRE_TECHNICAL_STUDIES = 'PRE_TECHNICAL_STUDIES'
};
export enum Pathway {
  STEM = 'STEM',
  ARTS_SPORTS = 'ARTS_SPORTS',
  SOCIAL_SCIENCES = 'SOCIAL_SCIENCES'
};
export enum TermName {
  TERM_1 = 'TERM_1',
  TERM_2 = 'TERM_2',
  TERM_3 = 'TERM_3'
};

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  idNumber?: string;
  role: Role;
  schoolId?: string;
  school?: School;
  student?: Student;
  teacher?: Teacher;
  guardian?: Guardian;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: string;
  name: string;
  registrationNo?: string;
  type: SchoolType;
  county: string;
  subCounty?: string;
  ward?: string;
  knecCode?: string;
  kemisCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  ownership: Ownership;
  boardingStatus: BoardingStatus;
  gender: SchoolGender;
  classes: Class[]
  students: Student[]
  streams: Stream[]
  subjectOfferings: SubjectOffering[]
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    students: number;
    teachers: number;
    classes: number;
  }
}

export interface Student {
  id: string;
  admissionNo: string;
  upiNumber?: string;
  kemisUpi?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: Gender;
  dob?: string;
  birthCertNo?: string;
  nationality?: string;
  county?: string;
  subCounty?: string;
  hasSpecialNeeds?: boolean;
  specialNeedsType?: string;
  medicalCondition?: string;
  allergies?: string;
  schoolId?: string;
  school?: School;
  userId?: string;
  user?: User;
  guardians?: StudentGuardian[];
  enrollments?: StudentClass[];
  assessments?: AssessmentResult[];
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  userId: string;
  tscNumber: string;
  employmentType: EmploymentType;
  employeeNumber?: string;
  qualification?: string;
  specialization?: string;
  classTeacherOf?: Class[];
  streamTeacherOf?: Stream[];
  teachingSubjects?: ClassSubject[];

  dateJoined?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Guardian {
  id: string;
  userId: string;
  relationship: string;
  occupation?: string;
  employer?: string;
  workPhone?: string;
  user?: User;
  students?: StudentGuardian[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentGuardian {
  id: string;
  studentId: string;
  guardianId: string;
  relationship: string;
  isPrimary: boolean;
  createdAt: string;

  student: Student;
  guardian: Guardian;
}

export interface AcademicYear {
  id: string;
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Term {
  id: string;
  name: TermName;
  termNumber: number;
  startDate: string;
  endDate: string;
  academicYearId: string;
  academicYear?: AcademicYear;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  name: string;
  level: string;
  curriculum: Curriculum;
  academicYearId: string;
  schoolId: string;
  classTeacherId?: string;
  pathway?: Pathway;
  streams?: Stream[];
  school?: School;
  academicYear?: AcademicYear;
  classTeacher?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Stream {
  id: string;
  name: string;
  capacity?: number;
  classId: string;
  schoolId: string;
  streamTeacherId?: string;
  class?: Class;
  school?: School;
  streamTeacher?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  category: SubjectCategory;
  learningArea?: LearningArea;
  subjectGroup?: string;
  curriculum: Curriculum[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectOffering {
  id: String;   
  schoolId: String;
  subjectId: String;
  school: School;
  subject: Subject;
  isActive: Boolean;  
}

export interface Strand {
  id: string;
  name: string;
  description: string;
  subjectId: string;
  subject: string;
  classSubjects: ClassSubjectStrand[];
  createdAt: string;
  updateAt: string;
}

export interface ClassSubjectStrand {
  id: string;
  classSubjectId: string;
  strandId: string;
  classSubject: ClassSubject;
  strand: Strand;
}

export interface AssessmentDefinition {
  id: string;
  name: string;
  type: AssessmentType;
  maxMarks: number;
  termId: string;
  term?: Term;
  classSubjectId: string;
  classSubject?: ClassSubject;
  strandId: string;
  strand: Strand;
  results: AssessmentResult;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentResult {
  id: string;
  studentId: string;
  student: Student;
  assessmentDefId: string;
  assessmentDef: AssessmentDefinition;
  numericValue: number;
  grade: string;
  competencyLevel: CompetencyLevel;
  comment: string;
  assessedById: string;
  assessedBy: Teacher;
  createdAt: string;
  updatedAt: string;
}

export interface StudentClass {
  id: string;
  studentId: string;
  classId: string;
  streamId?: string;
  academicYearId: string;
  status: EnrollmentStatus;
  selectedSubjects?: string[];
  promotedToId?: string;
  promotionDate?: string;
  transferredFrom?: string;
  transferDate?: string;
  student?: Student;
  class?: Class;
  stream?: Stream;
  academicYear?: AcademicYear;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  termId: string;
  academicYearId: string;
  subjectCategory: SubjectCategory; 
  
  class?: Class;
  subject?: Subject;
  teacher?: User; 
  term?: Term;
  academicYear?: AcademicYear;
  strands?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}