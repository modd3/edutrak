# EduTrak School Management System - API Documentation

A comprehensive school management system supporting multiple Kenyan curricula (CBC, 8-4-4, IGCSE, IB, TVET).

## 🏗️ Architecture

```
src/
├── services/          # Business logic layer
│   ├── school.service.ts
│   ├── user.service.ts
│   ├── student.service.ts
│   ├── teacher.service.ts
│   ├── guardian.service.ts
│   ├── academic.service.ts
│   ├── subject.service.ts
│   └── assessment.service.ts
├── controllers/       # HTTP request handlers
│   ├── school.controller.ts
│   ├── user.controller.ts
│   ├── student.controller.ts
│   ├── teacher.controller.ts
│   ├── guardian.controller.ts
│   ├── academic.controller.ts
│   ├── subject.controller.ts
│   └── assessment.controller.ts
└── routes/           # API route definitions
    ├── index.ts
    ├── school.routes.ts
    ├── user.routes.ts
    ├── student.routes.ts
    ├── teacher.routes.ts
    ├── guardian.routes.ts
    ├── academic.routes.ts
    ├── subject.routes.ts
    └── assessment.routes.ts
```

## 📋 API Endpoints

### Schools
- `POST /api/schools` - Create a new school
- `GET /api/schools` - Get all schools (with filters)
- `GET /api/schools/:id` - Get school by ID
- `PUT /api/schools/:id` - Update school
- `DELETE /api/schools/:id` - Delete school
- `GET /api/schools/:id/statistics` - Get school statistics

### Users & Authentication
- `POST /api/auth/login` - User login
- `POST /api/users` - Create new user
- `GET /api/users` - Get all users (with filters)
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/email/:email` - Get user by email
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/password` - Update password
- `PATCH /api/users/:id/activate` - Activate user
- `PATCH /api/users/:id/deactivate` - Deactivate user

### Students
- `POST /api/students` - Create student
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `GET /api/students/admission/:admissionNo` - Get by admission number
- `PUT /api/students/:id` - Update student
- `POST /api/students/enroll` - Enroll student in class
- `PATCH /api/students/enrollment/:enrollmentId/status` - Update enrollment status
- `POST /api/students/promote` - Promote student
- `POST /api/students/transfer` - Transfer student
- `POST /api/students/guardians` - Add guardian to student
- `GET /api/students/class/:classId` - Get students by class

### Teachers
- `POST /api/teachers` - Create teacher
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get teacher by ID
- `GET /api/teachers/user/:userId` - Get teacher by user ID
- `GET /api/teachers/tsc/:tscNumber` - Get teacher by TSC number
- `PUT /api/teachers/:id` - Update teacher
- `POST /api/teachers/assign-subject` - Assign subject to teacher
- `GET /api/teachers/:teacherId/workload` - Get teacher workload
- `GET /api/teachers/:teacherId/timetable` - Get teacher timetable

### Guardians
- `POST /api/guardians` - Create guardian
- `GET /api/guardians` - Get all guardians
- `GET /api/guardians/:id` - Get guardian by ID
- `GET /api/guardians/user/:userId` - Get guardian by user ID
- `PUT /api/guardians/:id` - Update guardian
- `GET /api/guardians/:guardianId/students` - Get guardian's students
- `GET /api/guardians/students/:studentId/guardians` - Get student's guardians
- `PATCH /api/guardians/set-primary` - Set primary guardian
- `DELETE /api/guardians/students/:studentId/guardians/:guardianId` - Remove guardian

### Academic (Years, Terms, Classes, Streams)
**Academic Years:**
- `POST /api/academic/years` - Create academic year
- `GET /api/academic/years` - Get all academic years
- `GET /api/academic/years/active` - Get active academic year
- `GET /api/academic/years/:id` - Get academic year by ID
- `PATCH /api/academic/years/:id/set-active` - Set active year

**Terms:**
- `POST /api/academic/terms` - Create term
- `GET /api/academic/terms/:id` - Get term by ID
- `GET /api/academic/years/:academicYearId/terms` - Get terms by academic year

**Classes:**
- `POST /api/academic/classes` - Create class
- `GET /api/academic/classes/:id` - Get class by ID
- `GET /api/academic/schools/:schoolId/classes` - Get school classes
- `PUT /api/academic/classes/:id` - Update class

**Streams:**
- `POST /api/academic/streams` - Create stream
- `GET /api/academic/streams/:id` - Get stream by ID
- `GET /api/academic/classes/:classId/streams` - Get class streams
- `PUT /api/academic/streams/:id` - Update stream
- `DELETE /api/academic/streams/:id` - Delete stream

### Subjects
- `POST /api/subjects` - Create subject
- `GET /api/subjects` - Get all subjects (with filters)
- `GET /api/subjects/:id` - Get subject by ID
- `GET /api/subjects/code/:code` - Get subject by code
- `PUT /api/subjects/:id` - Update subject
- `DELETE /api/subjects/:id` - Delete subject

**Subject Offerings (School-specific):**
- `POST /api/subjects/offerings` - Add subject to school
- `GET /api/subjects/schools/:schoolId/offerings` - Get school subjects
- `PATCH /api/subjects/offerings/toggle` - Activate/deactivate subject
- `DELETE /api/subjects/schools/:schoolId/subjects/:subjectId` - Remove subject

**Curriculum-specific:**
- `GET /api/subjects/cbc/learning-area/:learningArea` - CBC subjects by learning area
- `GET /api/subjects/844/group/:subjectGroup` - 8-4-4 subjects by group

### Assessments
- `POST /api/assessments` - Create assessment
- `POST /api/assessments/bulk` - Bulk create assessments
- `GET /api/assessments/:id` - Get assessment by ID
- `PUT /api/assessments/:id` - Update assessment
- `DELETE /api/assessments/:id` - Delete assessment

**Queries:**
- `GET /api/assessments/students/:studentId` - Get student assessments
- `GET /api/assessments/class-subjects/:classSubjectId` - Get class subject assessments

**Statistics:**
- `GET /api/assessments/students/:studentId/average` - Calculate student term average
- `GET /api/assessments/class-subjects/:classSubjectId/statistics` - Get subject statistics

**Grading:**
- `POST /api/assessments/convert-grade` - Convert marks to grade

**Reports:**
- `GET /api/assessments/students/:studentId/report` - Generate student term report
- `GET /api/assessments/classes/:classId/report` - Generate class term report

## 🔧 Setup Instructions

### Prerequisites
```bash
npm install express @prisma/client bcryptjs
npm install -D @types/express @types/bcryptjs typescript prisma
```

### Environment Variables
Create a `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/edutrak"
PORT=3000
```

### Database Setup
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed
```

### Application Setup
```typescript
// src/app.ts
import express from 'express';
import routes from './routes';

const app = express();

app.use(express.json());
app.use('/api', routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`EduTrak API running on port ${PORT}`);
});

export default app;
```

## 📊 Key Features by Curriculum

### CBC (Competency Based Curriculum)
- Learning Areas: Languages, Mathematics, Science & Technology, Social Studies, etc.
- Competency-based assessments
- Junior Secondary pathways (STEM, Arts & Sports, Social Sciences)
- Strand/Sub-strand tracking

### 8-4-4 System
- Subject Groups: Languages, Sciences, Humanities, Technical/Applied
- Traditional grading (A, A-, B+, etc.)
- Points system for university admission
- KCPE/KCSE exam support

### International Curricula
- IGCSE support
- IB (International Baccalaureate) support
- TVET (Technical & Vocational)

## 🎯 Common Use Cases

### 1. Creating a School with Complete Setup
```typescript
// 1. Create school
POST /api/schools
{
  "name": "Nairobi High School",
  "type": "SECONDARY",
  "county": "Nairobi",
  "ownership": "PUBLIC",
  "boardingStatus": "BOTH",
  "gender": "MIXED",
  "knecCode": "12345678",
  "nemisCode": "NH001"
}

// 2. Create academic year
POST /api/academic/years
{
  "year": 2024,
  "startDate": "2024-01-15",
  "endDate": "2024-11-30",
  "isActive": true
}

// 3. Create terms
POST /api/academic/terms
{
  "name": "TERM_1",
  "termNumber": 1,
  "startDate": "2024-01-15",
  "endDate": "2024-04-05",
  "academicYearId": 1
}

// 4. Add subjects to school
POST /api/subjects/offerings
{
  "schoolId": 1,
  "subjectId": 5  // Mathematics
}
```

### 2. Student Enrollment Flow
```typescript
// 1. Create student record
POST /api/students
{
  "admissionNo": "2024001",
  "firstName": "John",
  "lastName": "Doe",
  "gender": "MALE",
  "dob": "2010-05-15",
  "schoolId": 1
}

// 2. Enroll in class
POST /api/students/enroll
{
  "studentId": 1,
  "classId": 5,
  "streamId": 2,
  "academicYearId": 1,
  "selectedSubjects": [1, 2, 3, 5, 7]
}

// 3. Add guardian
POST /api/students/guardians
{
  "studentId": 1,
  "guardianId": 3,
  "isPrimary": true
}
```

### 3. Teacher Assignment
```typescript
// 1. Create user account
POST /api/users
{
  "email": "teacher@school.com",
  "password": "secure123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "TEACHER",
  "tscNumber": "TSC123456",
  "schoolId": 1
}

// 2. Create teacher profile
POST /api/teachers
{
  "userId": 10,
  "tscNumber": "TSC123456",
  "employmentType": "PERMANENT",
  "qualification": "Bachelor of Education",
  "specialization": "Mathematics"
}

// 3. Assign subject to class
POST /api/teachers/assign-subject
{
  "classId": 5,
  "subjectId": 1,
  "teacherId": 10,
  "termId": 1,
  "academicYearId": 1
}
```

### 4. Assessment Entry (CBC)
```typescript
POST /api/assessments
{
  "name": "Mid-Term Assessment",
  "type": "COMPETENCY_BASED",
  "studentId": 1,
  "classSubjectId": 15,
  "termId": 1,
  "competencyLevel": "MEETING_EXPECTATIONS",
  "remarks": "Good progress in problem-solving",
  "assessedBy": 10,
  "assessedDate": "2024-03-15"
}
```

### 5. Assessment Entry (8-4-4)
```typescript
POST /api/assessments
{
  "name": "End of Term Exam",
  "type": "END_OF_TERM",
  "studentId": 1,
  "classSubjectId": 15,
  "termId": 1,
  "marksObtained": 75,
  "maxMarks": 100,
  "grade": "B+",
  "assessedBy": 10,
  "assessedDate": "2024-04-01"
}
```

## 🔐 Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "count": 10  // For list endpoints
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## 📈 Query Parameters

Most GET endpoints support filtering:

**Example:**
```
GET /api/students?schoolId=1&gender=MALE&hasSpecialNeeds=true
GET /api/subjects?curriculum=CBC&isCore=true&learningArea=MATHEMATICS
GET /api/teachers?schoolId=1&employmentType=PERMANENT
```

## 🚀 Advanced Features

### Bulk Operations
- Bulk assessment creation for entire classes
- Bulk student promotion
- Mass enrollment

### Reporting
- Student term reports (individual)
- Class performance reports
- Teacher workload analysis
- School statistics dashboard

### Multi-Curriculum Support
- Automatic subject filtering by curriculum
- Curriculum-specific assessment types
- Flexible grading systems

## 📝 Notes

1. **Password Security**: All passwords are hashed using bcrypt before storage
2. **Soft Deletes**: Consider implementing soft deletes for critical data
3. **Validation**: Add input validation middleware (e.g., express-validator)
4. **Authentication**: Implement JWT tokens for production
5. **Authorization**: Add role-based access control (RBAC)
6. **Audit Logs**: Consider adding audit trails for sensitive operations
7. **File Uploads**: Extend for documents, photos, and result sheets
8. **Notifications**: Add SMS/email notifications for parents/guardians

## 🔄 Migration from 8-4-4 to CBC

The system supports schools transitioning from 8-4-4 to CBC:

```typescript
// Lower grades in CBC
POST /api/academic/classes
{
  "name": "Grade 7",
  "level": "7",
  "curriculum": "CBC",
  "pathway": "STEM",
  "academicYearId": 1,
  "schoolId": 1
}

// Upper grades still in 8-4-4
POST /api/academic/classes
{
  "name": "Form 3",
  "level": "11",
  "curriculum": "EIGHT_FOUR_FOUR",
  "academicYearId": 1,
  "schoolId": 1
}
```

## 📞 Support

For issues or questions, refer to the Prisma schema documentation in `schema.prisma`.