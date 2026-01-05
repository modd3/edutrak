
School Management System - Complete Project Context

Project Overview
Name: Kenyan School Management System (SMS)
 Type: Multi-tenant SaaS Application
 Target Market: Kenyan Schools (Primary, Secondary, TVET)
 Tech Stack: React + TypeScript (Frontend), Node.js + Express + Prisma (Backend), PostgreSQL (Database)

Table of Contents
1. Technology Stack
2. Database Schema
3. Architecture Overview
4. Key Features Implemented
5. Authentication & Authorization
6. User Roles & Profiles
7. Subscription & Billing
8. Frontend Structure
9. Backend Structure
10. API Patterns
11. Code Conventions
12. Kenyan Education System Context
13. Sequence Generation System
14. File Upload & Bulk Operations
15. Future Roadmap

Technology Stack

Frontend
• Framework: React 18 with TypeScript
• Build Tool: Vite
• Routing: React Router v6
• State Management: React Query (TanStack Query)
• UI Library: shadcn/ui (Radix UI primitives)
• Styling: Tailwind CSS
• Forms: React Hook Form + Zod validation
• HTTP Client: Axios
• Icons: Lucide React


Backend
◇ Runtime: Node.js
◇ Framework: Express.js
◇ Language: TypeScript
◇ ORM: Prisma
◇ Database: PostgreSQL
◇ Authentication: JWT (JSON Web Tokens)
◇ Password Hashing: bcrypt
◇ Validation: Zod


DevOps & Infrastructure
◇ Version Control: Git
◇ Package Manager: npm
◇ Environment: .env files for configuration
◇ Deployment: (To be determined - AWS/GCP/Azure)


Database Schema

*Source of Truth: `server/prisma/schema.prisma`*

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ===== SCHOOL & ORGANIZATION =====

model School {
  id             String    @id @default(uuid())
  name           String
  registrationNo String?   @unique
  type           SchoolType
  county         String
  subCounty      String?
  ward           String?
  knecCode       String?   @unique  // KNEC school code
  kemisCode      String?   @unique  // KEMIS code for reporting
  
  // Contact
  phone          String?
  email          String?
  address        String?
  
  // School characteristics
  ownership      Ownership
  boardingStatus BoardingStatus
  gender         SchoolGender
  
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  // Relations
  users          User[]
  classes        Class[]
  students       Student[]
  streams        Stream[]
  subjectOfferings SubjectOffering[]
  academicYears  AcademicYear[]
  terms          Term[]
  classSubjects  ClassSubject[]
  studentClasses StudentClass[]
  assessmentDefinitions AssessmentDefinition[]
  assessmentResults AssessmentResult[]
  
  @@index([county])
  @@index([type])
}

enum SchoolType {
  PRIMARY
  SECONDARY
  TVET
  SPECIAL_NEEDS
  PRE_PRIMARY
}

enum Ownership {
  PUBLIC
  PRIVATE
  FAITH_BASED
  NGO
}

enum BoardingStatus {
  DAY
  BOARDING
  BOTH
}

enum SchoolGender {
  BOYS
  GIRLS
  MIXED
}

// ===== USERS & PROFILES =====

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  middleName String?
  phone     String?
  idNumber  String?   @unique  // National ID or Birth Cert No
  role      Role     @default(TEACHER)

  schoolId  String?
  school    School?  @relation(fields: [schoolId], references: [id])

  // Role profiles
  student   Student?
  teacher   Teacher?
  guardian  Guardian?
  

  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([role])
  @@index([schoolId])
}

enum Role {
  SUPER_ADMIN    // System admin
  ADMIN          // School admin
  TEACHER
  STUDENT
  PARENT
  SUPPORT_STAFF
}

model Student {
  id              String    @id @default(uuid())
  admissionNo     String    @unique
  upiNumber       String?   @unique  // Unique Personal Identifier
  kemisUpi        String?   @unique  // KEMIS UPI
  
  firstName       String
  middleName      String?
  lastName        String
  gender          Gender
  dob             DateTime?
  birthCertNo     String?
  
  // Kenyan-specific
  nationality     String    @default("Kenyan")
  county          String?
  subCounty       String?
  
  // Special needs
  hasSpecialNeeds Boolean   @default(false)
  specialNeedsType String?  // Visual, Hearing, Physical, Learning, etc.
  
  // Medical
  medicalCondition String?
  allergies        String?
  
  schoolId        String?
  school          School?   @relation(fields: [schoolId], references: [id])

  userId          String?   @unique
  user            User?     @relation(fields: [userId], references: [id])

  // Relations
  enrollments     StudentClass[]
  guardians       StudentGuardian[]
  assessmentResults     AssessmentResult[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([schoolId])
  @@index([schoolId, admissionNo])
  @@index([schoolId, gender])
}

enum Gender {
  MALE
  FEMALE
}

model Guardian {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  
  relationship    String   // Father, Mother, Guardian, etc.
  occupation      String?
  employer        String?
  workPhone       String?
  
  students        StudentGuardian[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model StudentGuardian {
  id          String   @id @default(uuid())
  studentId   String
  guardianId  String
  isPrimary   Boolean  @default(false)
  
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  guardian    Guardian @relation(fields: [guardianId], references: [id], onDelete: Cascade)
  
  @@unique([studentId, guardianId])
}

model Teacher {
  id             String   @id @default(uuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id])
  
  tscNumber      String   @unique
  employeeNumber String   @unique
  employmentType EmploymentType
  qualification  String?  // Diploma, Degree, Masters, etc.
  specialization String?  // Subject specialization
  
  dateJoined     DateTime?    @default(now())
  
  // Relations
  classTeacherOf Class[]       @relation("ClassTeacher")
  streamTeacherOf Stream[]     @relation("StreamTeacher")
  teachingSubjects ClassSubject[] @relation("TeacherClassSubjects")

  // Assessment relations
  assessmentsGraded AssessmentResult[] @relation("AssessedBy")
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

enum EmploymentType {
  PERMANENT
  CONTRACT
  TEMPORARY
  BOM          // Board of Management
  PTA          // Parents Teachers Association
}

// ===== SEQUENCE GENERATOR =====

model Sequence {
  id        String   @id @default(uuid())
  key       String   @unique  // Composite key: TYPE_SCHOOL_YEAR
  type      String              // ADMISSION_NUMBER, EMPLOYEE_NUMBER, etc.
  schoolId  String?             // Optional: for school-specific sequences
  year      Int?                // Optional: for annually resetting sequences
  
  currentValue Int    @default(0)  // Current counter value
  prefix       String?              // Prefix for formatting (e.g., "STU", "EMP")
  
  lastGeneratedAt DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([type])
  @@index([schoolId])
  @@index([year])
  @@index([type, schoolId, year])
}

// ===== ACADEMIC STRUCTURE =====

model AcademicYear {
  id        String   @id @default(uuid())
  year      Int      @unique  // e.g., 2024
  startDate DateTime
  endDate   DateTime
  isActive  Boolean  @default(false)
  schoolId  String?
  
  school         School? @relation(fields: [schoolId], references: [id])
  terms          Term[]
  classes        Class[]
  classSubjects  ClassSubject[]   @relation("AcademicYearClassSubjects")
  studentClasses StudentClass[]
  assessmentDefinitions AssessmentDefinition[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([isActive])
  @@index([schoolId])
}

model Term {
  id             String   @id @default(uuid())
  name           TermName
  termNumber     Int      // 1, 2, or 3
  startDate      DateTime
  endDate        DateTime
  
  academicYearId String
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])
  
  schoolId       String?
  school         School?  @relation(fields: [schoolId], references: [id])
  
  classSubjects  ClassSubject[]   @relation("TermClassSubjects")
  AssessmentDefinitions    AssessmentDefinition[]
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([academicYearId, termNumber])
  @@index([academicYearId])
  @@index([academicYearId, schoolId])
  @@index([schoolId])
}

enum TermName {
  TERM_1
  TERM_2
  TERM_3
}

// ===== CURRICULUM & CLASSES =====

model Class {
  id             String      @id @default(uuid())
  name           String       // e.g., "Grade 7", "Form 3"
  level          String       // Grade/Form level
  curriculum     Curriculum
  
  academicYearId String
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])
  
  schoolId       String
  school         School       @relation(fields: [schoolId], references: [id])
  
  classTeacherId String?
  classTeacher   Teacher?        @relation("ClassTeacher", fields: [classTeacherId], references: [id])
  
  // For CBC: Track which pathway/strand
  pathway        Pathway?
  
  streams        Stream[]
  students       StudentClass[]
  subjects       ClassSubject[]
  promotedStudents StudentClass[] @relation("Promotion")
  
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  
  @@unique([name, academicYearId, schoolId])
  @@index([curriculum])
  @@index([schoolId])
  @@index([schoolId, academicYearId])
  @@index([schoolId, level])
}

enum Curriculum {
  CBC              // Competency Based Curriculum (2-6-3-3)
  EIGHT_FOUR_FOUR  // 8-4-4 System (being phased out)
  TVET             // Technical & Vocational
  IGCSE            // International
  IB               // International Baccalaureate
}

enum Pathway {
  // CBC Junior Secondary pathways
  STEM            // Science, Technology, Engineering, Math
  ARTS_SPORTS     // Arts and Sports Sciences
  SOCIAL_SCIENCES // Social Sciences
}

// Streams within a class (e.g., Form 3 North, Form 3 South)
model Stream {
  id             String   @id @default(uuid())
  name           String   // North, South, East, West, etc.
  capacity       Int?
  
  classId        String
  class          Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  
  schoolId       String
  school         School   @relation(fields: [schoolId], references: [id])
  
  streamTeacherId String?
  streamTeacher   Teacher?   @relation("StreamTeacher", fields: [streamTeacherId], references: [id])
  
  students       StudentClass[]
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([classId, name])
  @@index([classId])
}

// ===== SUBJECTS =====

model Subject {
  id            String   @id @default(uuid())
  name          String
  code          String   @unique
  
  // Subject classification
  category      SubjectCategory
    
  // CBC-specific
  learningArea  LearningArea?  // For CBC subjects
  
  // 8-4-4 specific
  subjectGroup  SubjectGroup?  // Sciences, Languages, etc.
  
  curriculum    Curriculum[]   // Which curricula offer this subject
  
  description   String?
  
  offerings     SubjectOffering[]
  classLinks    ClassSubject[]
  strands       Strand[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([code])
  @@index([category])
}

enum SubjectCategory {
  CORE
  ELECTIVE
  OPTIONAL
  TECHNICAL
  APPLIED
}

enum LearningArea {
  // CBC Learning Areas
  LANGUAGES
  MATHEMATICS
  SCIENCE_TECHNOLOGY
  SOCIAL_STUDIES
  RELIGIOUS_EDUCATION
  CREATIVE_ARTS
  PHYSICAL_HEALTH_EDUCATION
  PRE_TECHNICAL_STUDIES
}

enum SubjectGroup {
  // 8-4-4 Groups
  LANGUAGES
  SCIENCES
  HUMANITIES
  TECHNICAL_APPLIED
  BUSINESS_STUDIES
}

// Subjects offered by a school
model SubjectOffering {
  id        String   @id @default(uuid())
  schoolId  String
  subjectId String
  
  school    School   @relation(fields: [schoolId], references: [id])
  subject   Subject  @relation(fields: [subjectId], references: [id])
  
  isActive  Boolean  @default(true)
  
  @@unique([schoolId, subjectId])
  @@index([schoolId])
}

model ClassSubject {
  id             String      @id @default(uuid())
  classId        String
  subjectId      String
  teacherId      String
  termId         String
  academicYearId String
  subjectCategory SubjectCategory
  
  schoolId       String?
  school         School?     @relation(fields: [schoolId], references: [id])
  
  class          Class        @relation(fields: [classId], references: [id])
  subject        Subject      @relation(fields: [subjectId], references: [id])
  term           Term         @relation("TermClassSubjects", fields: [termId], references: [id])
  academicYear   AcademicYear @relation("AcademicYearClassSubjects", fields: [academicYearId], references: [id])
  teacherProfile Teacher      @relation("TeacherClassSubjects", fields: [teacherId], references: [id])
  
  // CBC: Strand/Sub-strand tracking
  strands        ClassSubjectStrand[]      
  
  assessments    AssessmentDefinition[]
  
  @@unique([classId, subjectId, termId, academicYearId])
  @@index([teacherId])
  @@index([schoolId, academicYearId])
  @@index([schoolId, classId])
  @@index([schoolId, termId])
}

// ===== STUDENT ENROLLMENT =====

model StudentClass {
  id             String          @id @default(uuid())
  studentId      String
  classId        String
  streamId       String?         // Optional stream assignment
  academicYearId String
  
  schoolId       String?
  school         School?         @relation(fields: [schoolId], references: [id])
  
  status         EnrollmentStatus @default(ACTIVE)
  
  // For subject selection (especially CBC pathways & electives)
  selectedSubjects String[]       
  
  // Promotion tracking
  promotedToId   String?
  promotionDate  DateTime?
  
  // Transfer tracking
  transferredFrom String?
  transferDate   DateTime?
  
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  student        Student      @relation(fields: [studentId], references: [id])
  class          Class        @relation(fields: [classId], references: [id])
  stream         Stream?      @relation(fields: [streamId], references: [id])
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])
  promotedTo     Class?       @relation("Promotion", fields: [promotedToId], references: [id])
  
  @@index([studentId])
  @@index([classId])
  @@index([status])
  @@index([schoolId, academicYearId])
  @@index([schoolId, classId])
}

enum EnrollmentStatus {
  ACTIVE
  PROMOTED
  TRANSFERRED
  GRADUATED
  DROPPED_OUT
  SUSPENDED
}

// ===== ASSESSMENT & GRADING =====

// 1. Defines the CBC Strands/Competencies

model Strand {
  id           String    @id @default(uuid())
  name         String  // e.g., "1.1: Number Recognition", "2.3: Speaking and Listening"
  description  String?
  
  subjectId    String
  subject      Subject   @relation(fields: [subjectId], references: [id])
  
  // This links strands to the class subjects that teach them
  classSubjects ClassSubjectStrand[]
  
  // This links a strand to a specific assessment activity
  assessmentDefinitions AssessmentDefinition[]
  
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

// Join table for ClassSubject and Strand 
model ClassSubjectStrand {
  id             String   @id @default(uuid())
  classSubjectId String
  strandId       String
  
  classSubject ClassSubject @relation(fields: [classSubjectId], references: [id])
  strand       Strand       @relation(fields: [strandId], references: [id])
  
  @@unique([classSubjectId, strandId])
}

// 2. Defines the assessment activity itself
model AssessmentDefinition {
  id              String   @id @default(uuid())
  name            String   // "CAT 1", "End of Term", "Project 1"
  type            AssessmentType
  maxMarks        Float?   // For 8-4-4 (e.g., 100)
  
  termId          String
  term            Term     @relation(fields: [termId], references: [id])
  
  classSubjectId  String
  classSubject    ClassSubject @relation(fields: [classSubjectId], references: [id])
  
  // Add missing fields
  schoolId        String?
  school          School?  @relation(fields: [schoolId], references: [id])
  academicYearId  String?
  academicYear    AcademicYear? @relation(fields: [academicYearId], references: [id])
  
  // For CBC: Link this assessment to a specific strand
  strandId        String?
  strand          Strand?  @relation(fields: [strandId], references: [id])
  
  // All the student scores for this test
  results         AssessmentResult[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([schoolId])
  @@index([academicYearId])
  @@index([termId])
  @@index([classSubjectId])
  @@index([strandId])
}

// 3. Stores the individual student's result
model AssessmentResult {
  id              String   @id @default(uuid())
  
  studentId       String
  student         Student  @relation(fields: [studentId], references: [id])
  
  assessmentDefId String
  assessmentDef   AssessmentDefinition @relation(fields: [assessmentDefId], references: [id])
  
  // Add missing field
  schoolId        String?
  school          School?  @relation(fields: [schoolId], references: [id])
  
  // --- Flexible Score Fields ---
  // For 8-4-4
  numericValue    Float?
  grade           String?  // A, B+, C
  
  // For CBC
  competencyLevel CompetencyLevel?
  
  // --- End Flexible Fields ---
  
  comment         String?  // Teacher's remarks
  
  assessedById    String   // The Teacher ID of the teacher
  assessedBy      Teacher     @relation("AssessedBy", fields: [assessedById], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // A student can only have one result per assessment
  @@unique([studentId, assessmentDefId]) 
  @@index([schoolId])
  @@index([studentId])
  @@index([assessmentDefId])
  @@index([assessedById])
}

enum AssessmentType {
  CAT             // Continuous Assessment Test
  MIDTERM
  END_OF_TERM
  MOCK
  NATIONAL_EXAM   // KCPE/KCSE
  COMPETENCY_BASED
}

enum CompetencyLevel {
  // CBC Competency Levels
  EXCEEDING_EXPECTATIONS
  MEETING_EXPECTATIONS
  APPROACHING_EXPECTATIONS
  BELOW_EXPECTATIONS
}
```


Architecture Overview

Multi-Tenant Architecture
◇ School Isolation: Each school's data is completely isolated
◇ Shared Database: Single PostgreSQL database with row-level security
◇ School Context: All operations filtered by schoolId
◇ Subscription-Based Access: Features gated by subscription plan


Request Flow
Client Request
    ↓
React Router
    ↓
React Component
    ↓
React Query Hook (use-*.ts)
    ↓
API Service (axios)
    ↓
Express Route
    ↓
Authentication Middleware
    ↓
Feature Gate Middleware (check subscription)
    ↓
Limit Check Middleware (check quotas)
    ↓
Controller
    ↓
Service Layer
    ↓
Prisma ORM
    ↓
PostgreSQL Database

Key Features Implemented

1. User Management
◇ ✅ User CRUD with role-specific profiles
◇ ✅ Create users with profiles in one transaction
◇ ✅ Bulk user upload via CSV (Students, Teachers, Parents, Admins)
◇ ✅ User activation/deactivation
◇ ✅ Password management (change, reset)
◇ ✅ User search and filtering


2. School Management
◇ ✅ School CRUD operations
◇ ✅ Kenyan-specific fields (KNEC code, KEMIS code, counties)
◇ ✅ School types (Primary, Secondary, TVET, etc.)
◇ ✅ School details modal with comprehensive info


3. Authentication & Authorization
◇ ✅ JWT-based authentication
◇ ✅ Login with email/password
◇ ✅ Token refresh mechanism
◇ ✅ Session verification
◇ ✅ Role-based access control


4. Profile Management
◇ ✅ Role-specific profiles (Student, Teacher, Guardian)
◇ ✅ Conditional profile creation based on role
◇ ✅ Profile details modal with tabs
◇ ✅ Medical and special needs tracking (students)
◇ ✅ Professional qualifications (teachers)


5. Sequence Generation
◇ ✅ Auto-generate admission numbers (STU-2024-00001)
◇ ✅ Auto-generate employee numbers
◇ ✅ School-specific sequences
◇ ✅ Annual reset capability
◇ ✅ Preview next number without generating


6. Bulk Operations
◇ ✅ CSV upload for bulk user creation
◇ ✅ Role-specific templates
◇ ✅ Validation and error reporting
◇ ✅ Success/failure summary


Authentication & Authorization

JWT Token Structure
{
  userId: string;
  email: string;
  role: Role;
  schoolId: string;
  type: 'access' | 'refresh';
}

Token Management
◇ Access Token: Short-lived (1 hour), used for API requests
◇ Refresh Token: Long-lived (7 days), used to get new access tokens
◇ Storage: Stored in HTTP-only cookies or localStorage
◇ Validation: Verified on every protected route


Authorization Levels
enum Role {
  SUPER_ADMIN    // System-wide access
  ADMIN          // School-level admin
  TEACHER        // Teaching staff
  STUDENT        // Student users
  PARENT         // Parent/Guardian
  SUPPORT_STAFF  // Non-teaching staff
}

Middleware Chain
// Protect routes
router.post('/users', 
  authenticate,                    // Verify JWT
  authorize(['ADMIN']),           // Check role
  checkLimit('STUDENTS'),         // Check subscription limits
  requireFeature('BULK_UPLOAD'),  // Check feature access
  controller.create
);

User Roles & Profiles

Role Hierarchy
SUPER_ADMIN (System Administrator)
    ↓
ADMIN (School Administrator)
    ↓
TEACHER (Teaching Staff)
    ↓
STUDENT (Learner)
    ↓
PARENT (Guardian)
    ↓
SUPPORT_STAFF (Non-teaching)

Profile Structure

Student Profile
◇ Base Info: Name, email, phone, ID number
◇ Academic: Admission number, UPI, KEMIS UPI
◇ Personal: Gender, DOB, birth certificate, nationality
◇ Location: County, sub-county
◇ Medical: Conditions, allergies, special needs
◇ Relations: Links to guardians, enrollment in classes


Teacher Profile
◇ Base Info: Name, email, phone, ID number
◇ Professional: TSC number, employment type
◇ Qualifications: Degree, specialization
◇ Assignments: Class teacher roles, subjects taught


Guardian Profile
◇ Base Info: Name, email, phone, ID number
◇ Relationship: Father, Mother, Guardian, etc.
◇ Work: Occupation, employer, work phone
◇ Wards: Links to students under care


Subscription & Billing

Subscription Plans

| Plan | Students | Teachers | Price (KES/mo) |
| FREE | 50 | 5 | 0 |
| STARTER | 300 | 20 | 15,000 |
| PROFESSIONAL | 1,000 | 50 | 35,000 |
| ENTERPRISE | Unlimited | Unlimited | 75,000+ |


Feature Gates
// Backend
router.post('/users/bulk', 
  requireFeature('BULK_UPLOAD'),
  controller.bulkUpload
);

// Frontend
<FeatureGate feature="BULK_UPLOAD">
  <BulkUploadButton />
</FeatureGate>

Limit Enforcement
// Check before creating
await checkLimit(schoolId, 'STUDENTS');

// Track usage
await trackUsage(schoolId, 'STUDENTS_COUNT', currentCount);

Frontend Structure

Directory Layout
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Layout components (DashboardLayout, etc.)
│   ├── schools/         # School-related components
│   ├── users/           # User-related components
│   └── shared/          # Shared components
├── hooks/
│   ├── use-schools.ts   # School management hooks
│   ├── use-users.ts     # User management hooks
│   └── use-auth.ts      # Authentication hooks
├── lib/
│   ├── api.ts           # Axios instance
│   ├── utils.ts         # Utility functions
│   └── constants.ts     # App constants
├── pages/
│   ├── schools/         # School pages
│   ├── users/           # User pages
│   └── auth/            # Auth pages
├── types/
│   └── index.ts         # TypeScript types
└── App.tsx

Component Patterns

Modal Pattern
<SchoolFormModal 
  open={showModal}
  onOpenChange={setShowModal}
  mode="create" | "edit"
  school={selectedSchool}
/>

List Pattern
<DataTable 
  columns={columns}
  data={items}
  pageSize={20}
/>

Details Pattern
<UserDetailsModal 
  open={showDetails}
  onOpenChange={setShowDetails}
  user={selectedUser}
/>

Backend Structure

Directory Layout
src/
├── controllers/
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── school.controller.ts
│   └── subscription.controller.ts
├── services/
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── user-creation.service.ts
│   ├── school.service.ts
│   ├── subscription.service.ts
│   └── sequence-generator.service.ts
├── middleware/
│   ├── auth.ts
│   ├── feature-gate.ts
│   └── limit-check.ts
├── routes/
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── school.routes.ts
│   └── subscription.routes.ts
├── utils/
│   ├── jwt.ts
│   ├── hash.ts
│   └── logger.ts
├── database/
│   └── client.ts
└── index.ts

Service Layer Pattern
export class UserService {
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = prisma;
  }
  
  async createUser(data: CreateUserData): Promise<User> {
    // Business logic here
  }
}

Controller Pattern
export class UserController {
  private userService: UserService;
  
  async createUser(req: Request, res: Response) {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

API Patterns

Request/Response Format

Success Response
{
  "data": { ... },
  "message": "Operation successful"
}

Error Response
{
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": { ... }
}

Paginated Response
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}

Common Endpoints

Authentication
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/profile

Users
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
PATCH  /api/users/:id/activate
PATCH  /api/users/:id/deactivate
POST   /api/users/bulk

Schools
GET    /api/schools
GET    /api/schools/:id
POST   /api/schools
PUT    /api/schools/:id
DELETE /api/schools/:id

Sequences
GET    /api/sequences/:type/preview
GET    /api/sequences/:type/current
POST   /api/sequences/:type/reset
POST   /api/sequences/:type/batch

Code Conventions

TypeScript
◇ Strict mode enabled
◇ Explicit types for function parameters and returns
◇ Interfaces for object shapes
◇ Enums for fixed sets of values
◇ Type guards where necessary


Naming Conventions
◇ Files: kebab-case (user-service.ts)
◇ Components: PascalCase (UserList.tsx)
◇ Functions: camelCase (createUser)
◇ Constants: UPPER_SNAKE_CASE (ROLE_LABELS)
◇ Types/Interfaces: PascalCase (User, CreateUserData)


React Patterns
// Component structure
export function ComponentName({ prop1, prop2 }: Props) {
  // State
  const [state, setState] = useState();
  
  // Queries/Mutations
  const { data } = useQuery();
  const { mutate } = useMutation();
  
  // Effects
  useEffect(() => {}, []);
  
  // Handlers
  const handleAction = () => {};
  
  // Render
  return <div>...</div>;
}

React Query Patterns
// Query Hook
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const response = await api.get('/users', { params: filters });
      return response.data;
    },
  });
}

// Mutation Hook
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await api.post('/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
    },
  });
}

Kenyan Education System Context

School Types
◇ Primary: Grades 1-6 (CBC) or Standards 1-8 (8-4-4)
◇ Secondary: Forms 1-4 (8-4-4) or Grade 7-12 (CBC)
◇ TVET: Technical and Vocational Education
◇ Special Needs: Schools for students with disabilities
◇ Pre-Primary: Nursery and kindergarten


Curricula
◇ CBC (Competency Based Curriculum): New system, 2-6-3-3
◇ 8-4-4: Legacy system being phased out
◇ IGCSE/IB: International curricula


Assessment
◇ CBC: Competency-based (Exceeding, Meeting, Approaching, Below Expectations)
◇ 8-4-4: Grade-based (A, B, C, D, E)


Kenyan Counties (47)
Nairobi, Mombasa, Kisumu, Nakuru, Kiambu, Machakos, Kakamega, Meru, Nyeri, Uasin Gishu, Kericho, Bomet, Bungoma, Busia, Embu, Garissa, Homa Bay, Isiolo, Kajiado, Kilifi, Kirinyaga, Kisii, Kitui, Kwale, Laikipia, Lamu, Makueni, Mandera, Marsabit, Migori, Murang'a, Nandi, Narok, Nyandarua, Nyamira, Samburu, Siaya, Taita Taveta, Tana River, Tharaka Nithi, Trans Nzoia, Turkana, Vihiga, Wajir, West Pokot, Elgeyo Marakwet, Baringo

Important Codes
◇ KNEC Code: Kenya National Examinations Council school code
◇ KEMIS Code: Kenya Education Management Information System code
◇ TSC Number: Teachers Service Commission registration number
◇ UPI: Unique Personal Identifier (student tracking number)


Sequence Generation System

Purpose
Auto-generate unique, sequential numbers for various entities in a uniform way.

Supported Sequences
1. ADMISSION_NUMBER: STU-2024-00001
2. EMPLOYEE_NUMBER: EMP-2024-0123
3. RECEIPT_NUMBER: RCT/2024/000456
4. INVOICE_NUMBER: INV/2024/000789
5. ASSESSMENT_NUMBER: ASS-2024-1234
6. CLASS_CODE: CLS-2024-123

Format Configuration
{
  prefix: 'STU',          // Prefix
  separator: '-',         // Separator
  length: 5,              // Digits (00001)
  includeYear: true,      // Add year
  includeSchool: true,    // Add school code
  resetAnnually: true     // Reset each year
}

Key Features
◇ Thread-safe: Uses database transactions
◇ School-specific: Each school has own sequences
◇ Annual reset: Can reset counter each year
◇ Preview mode: See next number without generating
◇ Batch generation: Generate multiple numbers at once


Usage
// Generate admission number
const admissionNo = await sequenceGenerator.generateAdmissionNumber(schoolId);
// Returns: "STU-2024-00001"

// Preview next
const preview = await sequenceGenerator.previewNext('ADMISSION_NUMBER', schoolId);
// Returns: "STU-2024-00053" (doesn't increment)

// Batch generate
const numbers = await sequenceGenerator.generateBatch('ADMISSION_NUMBER', 100, schoolId);
// Returns: ["STU-2024-00001", ..., "STU-2024-00100"]

File Upload & Bulk Operations

CSV Upload Format

Students
email,firstName,lastName,admissionNo,gender,dob,county
john@school.com,John,Doe,STU2024001,MALE,2010-05-15,Nairobi

Teachers
email,firstName,lastName,tscNumber,employmentType,qualification
teacher@school.com,Jane,Smith,TSC123456,PERMANENT,Bachelor of Education

Parents
email,firstName,lastName,relationship,occupation
parent@mail.com,Mary,Johnson,Mother,Doctor

Bulk Upload Process
1. Select Type: Choose Students/Teachers/Parents/Admins
2. Download Template: Get pre-formatted CSV
3. Fill Data: Add information to CSV
4. Upload: Select and upload file
5. Validation: System validates each row
6. Results: See success/failure summary

Error Handling
◇ Shows specific row numbers with errors
◇ Displays error messages for each failure
◇ Successful rows are still created
◇ Failed rows can be fixed and re-uploaded


Future Roadmap

Phase 1: Core SaaS Features (Weeks 1-20)
◇ [x] User & School Management
◇ [x] Profile Management
◇ [x] Sequence Generation
◇ [x] Bulk Operations
◇ [ ] Subscription System
◇ [ ] Payment Integration (M-Pesa, Stripe)
◇ [ ] Feature Gates & Limits
◇ [ ] Billing Dashboard


Phase 2: Academic Features (Months 4-6)
◇ [x] Class & Stream Management
◇ [x] Subject Management
◇ [ ] Timetable System
◇ [ ] Attendance Tracking
◇ [x] Grade Entry & Reports
◇ [x] Assessment Management


Phase 3: Communication (Months 7-9)
◇ [ ] SMS Notifications (via Africa's Talking)
◇ [ ] Email Notifications
◇ [ ] Parent Portal
◇ [ ] Mobile App (React Native)
◇ [ ] In-app Messaging


Phase 4: Finance (Months 10-12)
◇ [ ] Fee Management
◇ [ ] Payment Tracking
◇ [ ] Receipt Generation
◇ [ ] Financial Reports
◇ [ ] Budget Management


Phase 5: Advanced Features (Year 2)
◇ [ ] Custom Report Builder
◇ [ ] API Access (for Enterprise)
◇ [ ] Integrations (Google Classroom, etc.)
◇ [ ] Multi-language Support
◇ [ ] Advanced Analytics


Important Implementation Notes

1. User Creation with Profiles
CRITICAL: Users and their role-specific profiles must be created in a single transaction.
// DO THIS
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  const student = await tx.student.create({ 
    data: { userId: user.id, ...profileData } 
  });
});

// DON'T DO THIS
const user = await prisma.user.create({ data: userData });
const student = await prisma.student.create({ data: profileData }); // Separate!

2. School Context in Queries
CRITICAL: Always filter by schoolId for data isolation.
// DO THIS
const students = await prisma.student.findMany({
  where: { schoolId: user.schoolId }  // Filter by school!
});

// DON'T DO THIS
const students = await prisma.student.findMany(); // All students!

3. Password Handling
CRITICAL: Never return passwords in responses.
// DO THIS
const { password, ...userWithoutPassword } = user;
return userWithoutPassword;

// DON'T DO THIS
return user; // Includes password!

4. Token Validation
CRITICAL: Always verify JWT tokens on protected routes.
// DO THIS
router.post('/users', authenticate, controller.create);

// DON'T DO THIS
router.post('/users', controller.create); // No auth!

5. Feature Access
CRITICAL: Check subscription plan before allowing feature access.
// DO THIS
router.post('/users/bulk', 
  authenticate,
  requireFeature('BULK_UPLOAD'),
  controller.bulkUpload
);

// DON'T DO THIS
router.post('/users/bulk', authenticate, controller.bulkUpload); // No check!

Environment Variables

Frontend (.env)
VITE_API_URL=http://localhost:4000/api
VITE_APP_NAME=School Management System

Backend (.env)
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/school_db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# App
PORT=4000
NODE_ENV=development

# Payment Gateways
MPESA_CONSUMER_KEY=your-mpesa-key
MPESA_CONSUMER_SECRET=your-mpesa-secret
STRIPE_SECRET_KEY=your-stripe-key

Testing Data

Test Credentials
Super Admin:
Email: admin@system.com
Password: Admin123!@#

School Admin:
Email: admin@school.com
Password: School123!@#

Teacher:
Email: teacher@school.com
Password: Teacher123!@#

Student:
Email: student@school.com
Password: Student123!@#

Test School IDs
School 1: school-uuid-123
School 2: school-uuid-456

Quick Reference Commands

Database
# Create migration
npx prisma migrate dev --name description

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

Development
# Install dependencies
npm install

# Run frontend
npm run dev

# Run backend
npm run dev

# Build for production
npm run build

AI Code Generation Guidelines
When generating code for this project, please:
1. Follow TypeScript strictly - Always use explicit types
2. Use Prisma patterns - All database operations through Prisma
3. Implement transactions - Use $transaction for multi-step operations
4. Filter by schoolId - Always include school context
5. Hash passwords - Use bcrypt for password hashing
6. Validate with Zod - Use Zod schemas for validation
7. Use React Query - All API calls through React Query hooks
8. Follow shadcn/ui patterns - Use existing UI components
9. Handle errors properly - Try-catch blocks with meaningful messages
10. Include loading states - Show loading indicators during operations
11. Add toast notifications - Use sonner for user feedback
12. Check subscriptions - Implement feature gates where needed
13. Track usage - Monitor limits for subscription plans
14. Generate sequences - Use sequence generator for IDs
15. Support bulk operations - Allow CSV imports where appropriate

Contact & Support
Project Type: Commercial SaaS
 Target Launch: Q2 2025
 Primary Market: Kenya
 Secondary Markets: East Africa

Document Version
Version: 1.0.0
 Last Updated: November 2024
 Next Review: After Phase 1 completion

How to Use This Document

For Continuing with Claude
1. Start new chat
2. Upload this document
3. Say: "I'm continuing the School Management System project. Please review the context document."
4. Claude will have full project context

For Other AI Models
1. Provide this document as context
2. Specify: "Use this as the complete project specification"
3. Reference specific sections when asking for code
4. Example: "Based on the API Patterns section, create a new endpoint for attendance tracking"

For Developers
1. Read this document first
2. Review Database Schema section
3. Check Code Conventions
4. Follow Implementation Notes
5. Use Quick Reference Commands
End of Document
