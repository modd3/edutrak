export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'SUPPORT_STAFF';
export type SchoolType = 'PRIMARY' | 'SECONDARY' | 'TVET' | 'SPECIAL_NEEDS' | 'PRE_PRIMARY';
export type Curriculum = 'CBC' | 'EIGHT_FOUR_FOUR' | 'TVET' | 'IGCSE' | 'IB';
export type Gender = 'MALE' | 'FEMALE';
export type EnrollmentStatus = 'ACTIVE' | 'PROMOTED' | 'TRANSFERRED' | 'GRADUATED' | 'DROPPED_OUT' | 'SUSPENDED';
export type AssessmentType = 'CAT' | 'MIDTERM' | 'END_OF_TERM' | 'MOCK' | 'NATIONAL_EXAM' | 'COMPETENCY_BASED';
export type CompetencyLevel = 'EXCEEDING_EXPECTATIONS' | 'MEETING_EXPECTATIONS' | 'APPROACHING_EXPECTATIONS' | 'BELOW_EXPECTATIONS';
export type Ownership = 'PUBLIC' | 'PRIVATE' | 'FAITH_BASED' | 'NGO';
export type BoardingStatus = 'DAY' | 'BOARDING' | 'BOTH';
export type SchoolGender = 'BOYS' | 'GIRLS' | 'MIXED';
export type EmploymentType = 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'BOM' | 'PTA';
export type SubjectCategory = 'CORE' | 'ELECTIVE' | 'OPTIONAL' | 'TECHNICAL' | 'APPLIED';
export type LearningArea = 'LANGUAGES' | 'MATHEMATICS' | 'SCIENCE_TECHNOLOGY' | 'SOCIAL_STUDIES' | 'RELIGIOUS_EDUCATION' | 'CREATIVE_ARTS' | 'PHYSICAL_HEALTH_EDUCATION' | 'PRE_TECHNICAL_STUDIES';
export type Pathway = 'STEM' | 'ARTS_SPORTS' | 'SOCIAL_SCIENCES';
export type TermName = 'TERM_1' | 'TERM_2' | 'TERM_3';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  idNumber?: string;
  tscNumber?: string;
  role: Role;
  schoolId?: number;
  school?: School;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: number;
  name: string;
  registrationNo?: string;
  type: SchoolType;
  county: string;
  subCounty?: string;
  ward?: string;
  knecCode?: string;
  nemisCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  ownership: Ownership;
  boardingStatus: BoardingStatus;
  gender: SchoolGender;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  admissionNo: string;
  upiNumber?: string;
  nemisUpi?: string;
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
  schoolId?: number;
  school?: School;
  userId?: number;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: number;
  userId: number;
  tscNumber: string;
  employmentType: EmploymentType;
  qualification?: string;
  specialization?: string;
  dateJoined?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Guardian {
  id: number;
  userId: number;
  relationship: string;
  occupation?: string;
  employer?: string;
  workPhone?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYear {
  id: number;
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Term {
  id: number;
  name: TermName;
  termNumber: number;
  startDate: string;
  endDate: string;
  academicYearId: number;
  academicYear?: AcademicYear;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: number;
  name: string;
  level: string;
  curriculum: Curriculum;
  academicYearId: number;
  schoolId: number;
  classTeacherId?: number;
  pathway?: Pathway;
  school?: School;
  academicYear?: AcademicYear;
  classTeacher?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Stream {
  id: number;
  name: string;
  capacity?: number;
  classId: number;
  schoolId: number;
  streamTeacherId?: number;
  class?: Class;
  school?: School;
  streamTeacher?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  category: SubjectCategory;
  isCore: boolean;
  learningArea?: LearningArea;
  subjectGroup?: string;
  curriculum: Curriculum[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  id: number;
  name: string;
  type: AssessmentType;
  studentId: number;
  classSubjectId: number;
  termId: number;
  marksObtained?: number;
  maxMarks: number;
  competencyLevel?: CompetencyLevel;
  grade?: string;
  remarks?: string;
  assessedBy?: number;
  assessedDate?: string;
  student?: Student;
  term?: Term;
  createdAt: string;
  updatedAt: string;
}

export interface StudentClass {
  id: number;
  studentId: number;
  classId: number;
  streamId?: number;
  academicYearId: number;
  status: EnrollmentStatus;
  selectedSubjects?: number[];
  promotedToId?: number;
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