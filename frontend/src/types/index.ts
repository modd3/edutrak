export type SchoolType = 'PRIMARY' | 'SECONDARY' | 'TVET' | 'SPECIAL_NEEDS' | 'PRE_PRIMARY';
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  SUPPORT_STAFF = 'SUPPORT_STAFF'
}
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
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  idNumber?: string;
  tscNumber?: string;
  role: Role;
  schoolId?: string;
  school?: School;
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
  id: string;
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
  schoolId?: string;
  school?: School;
  userId?: string;
  user?: User;
  enrollments?: StudentClass[];
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  userId: string;
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
  id: string;
  userId: string;
  relationship: string;
  occupation?: string;
  employer?: string;
  workPhone?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
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

export interface Assessment {
  id: string;
  name: string;
  type: AssessmentType;
  studentId: string;
  classSubjectId: string;
  termId: string;
  marksObtained?: number;
  maxMarks: number;
  competencyLevel?: CompetencyLevel;
  grade?: string;
  remarks?: string;
  assessedBy?: string;
  assessedDate?: string;
  student?: Student;
  term?: Term;
  classSubject?: ClassSubject;
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