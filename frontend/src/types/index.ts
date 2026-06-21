export enum SubscriptionStatus {
  TRIALING ='TRIALING', 
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  GRACE = 'GRACE',
  SUPENDED = 'SUSPENDED',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

export enum FeeCategory {
  TUITION = 'TUITION',
  BOARDING = 'BOARDING',
  LUNCH = 'LUNCH',
  TRANSPORT = 'TRANSPORT',
  ACTIVITY = 'TRANSPORT',
  UNIFORM = 'UNIFORM',
  EXAM = 'EXAM',
  LIBRARY = 'LIBRARY',
  LABORATORY = 'LABORATORY',
  DEVELOPMENT = 'DEVELOPMENT',
  MISCELLANEOUS = 'MISCELLANEOUS',
}

export enum InvoiceStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  WAIVED = 'WAIVED' // fully waived (scholarship etc.)
}

export enum PaymentMethod {
  CASH = 'CASH',
  MPESA = 'MPESA',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  CARD = 'CARD',
  SCHOLARSHIP = 'SCHOLARSHIP', // fee covered by scholarship fund
}

export enum PaymentStatus {
  PENDING = 'PENDING', // awaiting confirmation (e.g. bank transfer)
  COMPLETED = 'COMPLETED',
  REVERSED = 'REVERSED', // payment reversed / bounced
  FAILED ='FAILED',
}

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
export enum AssessmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  GRADING_IN_PROGRESS = 'GRADING_IN_PROGRESS',
  RESULTS_PUBLISHED = 'RESULTS_PUBLISHED',
  CLOSED = 'CLOSED',
}

export enum AssessmentType  {
  CAT = 'CAT',
  MIDTERM = 'MIDTERM',
  END_OF_TERM = 'END_OF_TERM',
  MOCK = 'MOCK',
  NATIONAL_EXAM = 'NATIONAL_EXAM',
  COMPETENCY_BASED = 'COMPETENCY_BASED',
  FORMATIVE = 'FORMATIVE',
  SUMMATIVE = 'SUMMATIVE',
  SBA = 'SBA',
  DIAGNOSTIC = 'DIAGNOSTIC',
  KPSEA = 'KPSEA',
  KJSEA = 'KJSEA',
  GRADE_9_PLACEMENT = 'GRADE_9_PLACEMENT',
};

export enum LearningArea {
  LANGUAGES = 'LANGUAGES',
  MATHEMATICS = 'MATHEMATICS',
  SCIENCE_TECHNOLOGY = 'SCIENCE_TECHNOLOGY',
  SOCIAL_STUDIES = 'SOCIAL_STUDIES',
  RELIGIOUS_EDUCATION = 'RELIGIOUS_EDUCATION',
  CREATIVE_ARTS = 'CREATIVE_ARTS',
  PHYSICAL_HEALTH_EDUCATION = 'PHYSICAL_HEALTH_EDUCATION',
  PRE_TECHNICAL_STUDIES = 'PRE_TECHNICAL_STUDIES',
};

export enum CoreCompetency {
  COMMUNICATION_COLLABORATION = 'COMMUNICATION_COLLABORATION',
  SELF_EFFICACY = 'SELF_EFFICACY',
  CRITICAL_THINKING = 'CRITICAL_THINKING',
  CREATIVITY_IMAGINATION = 'CREATIVITY_IMAGINATION',
  CITIZENSHIP = 'CITIZENSHIP',
  DIGITAL_LITERACY = 'DIGITAL_LITERACY',
  LEARNING_TO_LEARN = 'LEARNING_TO_LEARN',
};

export enum CompetencyLevel {
  EXCEEDING_EXPECTATIONS = 'EXCEEDING_EXPECTATIONS',
  MEETING_EXPECTATIONS = 'MEETING_EXPECTATIONS',
  APPROACHING_EXPECTATIONS = 'APPROACHING_EXPECTATIONS',
  BELOW_EXPECTATIONS = 'BELOW_EXPECTATIONS',
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

export interface Plan {
  id: string;
  key: string;
  name: string;
  description?: string;
  priceMinor: number;
  currency: string;
  billingInterval: string;
  isActive: boolean;
  features?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BillingAccount {
  id: string;
  schoolId: string;
  legalName: string;
  email?: string;
  phone?: string;
  taxId?: string;
  country?: string;
  city?: string;
  addressLine1?: string;
  addressLine2?: string;
  prefferedCurrency?: string;
  createdAt: string;
  updatedAt: string;
  school?: { id: string; name: string };
}

export interface Subscription {
  id: string;
  schoolId: string;
  planId: string;
  status: SubscriptionStatus
  startsAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  graceEndsAt?: string;
  cancelAt?: string;
  canceledAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  plan?: Plan;
  school?: { id: string; name: string };
}

export interface FeeStructure {
  id: string;
  name: string;
  description: string;
  academicYearId: string;
  termId?: string;
  classLevel?: string;
  boardingStatus?: BoardingStatus;
  currency: string;
  school: {id: string; name: string};
  academicYear: AcademicYear;
  term?: Term;
  items: FeeItem[];
  invoices: FeeInvoice[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeeItem {
  id: string;
  feeStructureId: string;
  name: string;
  category: FeeCategory[];
  amount: number;
  isOptional: boolean;
  descrition?: string;
  feeStructure: FeeStructure;
  invoiceItems: FeeInvoiceItem[];
  createdAt: string;
  updatedAt: string; 
}

export interface FeeInvoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  feeStructureId: string;
  academicYearId: string;
  termID?: string;
  schoolId: string;
  status: InvoiceStatus;
  totalAmount: number;
  discountAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  notes: string;
  issuedAt: string;
  createdAt: string;
  updatedAt: string;

  student: Student;
  feeStructure: FeeStructure;
  academicYear: AcademicYear;
  term?: Term;
  school: School;
  items: FeeInvoiceItem[];
  payments: FeePayment[];
  paymentPlan?: PaymentPlan;
  reminders: PaymentReminder[];
  feeRefunds: FeeRefund[];
}

export interface FeeInvoiceItem {
  id: string;
  invoiceId: string;
  feeItemId: string;
  name: string // snapshot of FeeItem.name
  category: FeeCategory;
  amount: number; // may differ from FeeItem.amount (waived)
  isWaived: boolean;
  waiverNote: string;
  createdAt: string;

  invoice: FeeInvoice;
  feeItem: FeeItem;
}

export interface FeePayment {
  id: string;
  receiptNo: string;
  invoiceId: string;
  studentId: string;
  schoolId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string; // M-Pesa code, cheque no., etc.
  mpesaCode?: string; // specific M-Pesa confirmation code
  bankName?: string;
  chequeNo: string;
  paidAt: string;
  reversedAt? : string;
  reversalReason: string;
  receivedById: string; // User.id who accepted the cash
  notes: string;
  createdAt: string;
  updatedAt: string;

  invoice: FeeInvoice;
  student: Student;  
  school: School;
  feeRefunds: FeeRefund[];
}

export interface PaymentPlan {
  id: string;
  invoiceId: string;
  totalAmount: number;
  installments: number; // Number of installments (e.g., 3)
  frequency: string; // "MONTHLY", "WEEKLY", "BIWEEKLY", "CUSTOM"
  firstDueDate: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  invoice: FeeInvoice;
  schedule: PaymentPlanInstallment[];
}

export interface PaymentPlanInstallment {
  id: string;
  planId: string;
  installmentNo: number; // 1, 2, 3...
  dueDate: string;
  amount: number;
  status: string;
  paidAmount: number;
  paidAt: string;
  paymentId?: string; // FeePayment.id when paid
  createdAt: string;
  updatedAt: string;
  plan: PaymentPlan;
}

export interface FeeRefund {
  id: string;
  paymentId: string;
  invoiceId: string;
  studentId: string;
  schoolId: string;
  amount: number;
  reason: string;
  status: string;
  paymentMethod: PaymentMethod;
  providerRefundId?: string;
  initiatedBy: string;
  completedAt?: string;
  errorMessage? : string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReminder {
  id: string;
  invoiceId: string;
  reminderType: string; // "PAYMENT_DUE", "OVERDUE_3DAYS", "OVERDUE_7DAYS", "FINAL_NOTICE"
  method: string; // "SMS", "EMAIL", "PUSH", "SYSTEM"
  recipientId?: string // User or Guardian ID
  recipientContact?: string; // Phone or email used
  status: string;
  sentAt: string;
  errorMessage?: string;
  createdAt: string;
  invoice: FeeInvoice ;
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
  isFinal?: boolean;
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
  description?: string;
  subjectId: string;
  subject?: string;
  classSubjects?: ClassSubjectStrand[];
  createdAt?: string;
  updateAt?: string;
}

export interface ClassSubjectStrand {
  id: string;
  classSubjectId: string;
  strandId: string;
  classSubject: ClassSubject;
  strand: Strand;
}

export interface AssessmentWeight {
  id: string;
  assessmentType: AssessmentType;
  termId: string;
  classSubjectId: string;
  weight: number;
  schoolId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentDefinition {
  id: string;
  name: string;
  type: AssessmentType;
  status: AssessmentStatus;
  maxMarks: number;
  termId: string;
  term?: Term;
  classSubjectId: string;
  classSubject?: ClassSubject;
  strandId: string;
  strand: Strand;
  createdById?: string;
  publishedAt?: string;
  resultsPublishedAt?: string;
  results: AssessmentResult;
  _count?: { results: number };
  createdAt: string;
  updatedAt: string;
}

export interface WeightedScoreResult {
  weightedScore: number;
  totalWeight: number;
  configuredWeights: number;
  resultsUsed: number;
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
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
