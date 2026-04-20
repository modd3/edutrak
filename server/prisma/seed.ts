import { PrismaClient, Role, SchoolType, Ownership, BoardingStatus, SchoolGender, Curriculum, Gender, EmploymentType, TermName, SubjectCategory, LearningArea, SubjectGroup, EnrollmentStatus, SubjectEnrollmentStatus, AssessmentType, CompetencyLevel, FeeCategory, InvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { hashPassword } from '../src/utils/hash';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Helper function to create users
async function createUser(email: string, password: string, firstName: string, lastName: string, role: Role, schoolId?: string, additionalData: any = {}) {
  const hashedPassword = await hashPassword(password);
  return await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      id: uuidv4(),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      ...additionalData,
      role,
      schoolId,
      isActive: true,
    },
  });
}

// Helper function to create schools
async function createSchool(name: string, registrationNo: string, type: SchoolType, county: string, subCounty: string, ward: string, knecCode: string, kemisCode: string, phone: string, email: string, address: string, ownership: Ownership, boardingStatus: BoardingStatus, gender: SchoolGender) {
  return await prisma.school.upsert({
    where: { knecCode },
    update: {},
    create: {
      id: uuidv4(),
      name,
      registrationNo,
      type,
      county,
      subCounty,
      ward,
      knecCode,
      kemisCode,
      phone,
      email,
      address,
      ownership,
      boardingStatus,
      gender,
    },
  });
}

// Helper function to create academic year
async function createAcademicYear(year: number, startDate: Date, endDate: Date, isActive: boolean, schoolId?: string) {
  return await prisma.academicYear.upsert({
    where: { year },
    update: {},
    create: {
      id: uuidv4(),
      year,
      startDate,
      endDate,
      isActive,
      schoolId,
    },
  });
}

// Helper function to create terms
async function createTerms(academicYearId: string, schoolId?: string) {
  const terms = await Promise.all([
    prisma.term.upsert({
      where: {
        academicYearId_termNumber: {
          academicYearId,
          termNumber: 1,
        },
      },
      update: {},
      create: {
        id: uuidv4(),
        name: TermName.TERM_1,
        termNumber: 1,
        startDate: new Date('2024-01-08'),
        endDate: new Date('2024-04-05'),
        academicYearId,
        schoolId,
      },
    }),
    prisma.term.upsert({
      where: {
        academicYearId_termNumber: {
          academicYearId,
          termNumber: 2,
        },
      },
      update: {},
      create: {
        id: uuidv4(),
        name: TermName.TERM_2,
        termNumber: 2,
        startDate: new Date('2024-05-06'),
        endDate: new Date('2024-08-02'),
        academicYearId,
        schoolId,
      },
    }),
    prisma.term.upsert({
      where: {
        academicYearId_termNumber: {
          academicYearId,
          termNumber: 3,
        },
      },
      update: {},
      create: {
        id: uuidv4(),
        name: TermName.TERM_3,
        termNumber: 3,
        startDate: new Date('2024-08-26'),
        endDate: new Date('2024-11-22'),
        academicYearId,
        schoolId,
      },
    }),
  ]);
  return terms;
}

// Helper function to create subjects
async function createSubjects() {
  const subjects = await Promise.all([
    prisma.subject.upsert({
      where: { code: 'MATH' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Mathematics',
        code: 'MATH',
        category: SubjectCategory.CORE,
        learningArea: LearningArea.MATHEMATICS,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        description: 'Mathematics subject covering various topics',
      },
    }),
    prisma.subject.upsert({
      where: { code: 'ENG' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'English',
        code: 'ENG',
        category: SubjectCategory.CORE,
        learningArea: LearningArea.LANGUAGES,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        description: 'English language and literature',
      },
    }),
    prisma.subject.upsert({
      where: { code: 'KIS' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Kiswahili',
        code: 'KIS',
        category: SubjectCategory.CORE,
        learningArea: LearningArea.LANGUAGES,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        description: 'Kiswahili language and literature',
      },
    }),
    prisma.subject.upsert({
      where: { code: 'SCI' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Science',
        code: 'SCI',
        category: SubjectCategory.CORE,
        learningArea: LearningArea.SCIENCE_TECHNOLOGY,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        description: 'Integrated science covering biology, chemistry, and physics',
      },
    }),
    prisma.subject.upsert({
      where: { code: 'SOC' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Social Studies',
        code: 'SOC',
        category: SubjectCategory.CORE,
        learningArea: LearningArea.SOCIAL_STUDIES,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        description: 'Social studies covering history, geography, and civics',
      },
    }),
    prisma.subject.upsert({
      where: { code: 'CRE' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Christian Religious Education',
        code: 'CRE',
        category: SubjectCategory.CORE,
        learningArea: LearningArea.RELIGIOUS_EDUCATION,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        description: 'Christian religious education',
      },
    }),
    prisma.subject.upsert({
      where: { code: 'PHY' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Physical Education',
        code: 'PHY',
        category: SubjectCategory.CORE,
        learningArea: LearningArea.PHYSICAL_HEALTH_EDUCATION,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        description: 'Physical education and sports',
      },
    }),
    prisma.subject.upsert({
      where: { code: 'ART' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Art & Craft',
        code: 'ART',
        category: SubjectCategory.CORE,
        learningArea: LearningArea.CREATIVE_ARTS,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        description: 'Art and craft activities',
      },
    }),
    prisma.subject.upsert({
      where: { code: 'COMP' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Computer Studies',
        code: 'COMP',
        category: SubjectCategory.ELECTIVE,
        learningArea: LearningArea.SCIENCE_TECHNOLOGY,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        description: 'Computer studies and ICT',
      },
    }),
    prisma.subject.upsert({
      where: { code: 'BUS' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Business Studies',
        code: 'BUS',
        category: SubjectCategory.ELECTIVE,
        subjectGroup: SubjectGroup.BUSINESS_STUDIES,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        description: 'Business studies and entrepreneurship',
      },
    }),
    prisma.subject.upsert({
      where: { code: 'GEO' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Geography',
        code: 'GEO',
        category: SubjectCategory.ELECTIVE,
        learningArea: LearningArea.SOCIAL_STUDIES,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        description: 'Geography and environmental studies',
      },
    }),
    prisma.subject.upsert({
      where: { code: 'HIS' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'History',
        code: 'HIS',
        category: SubjectCategory.ELECTIVE,
        learningArea: LearningArea.SOCIAL_STUDIES,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        description: 'History and government',
      },
    }),
    prisma.subject.upsert({
      where: { code: 'AGRI' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Agriculture',
        code: 'AGRI',
        category: SubjectCategory.ELECTIVE,
        subjectGroup: SubjectGroup.TECHNICAL_APPLIED,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        description: 'Agriculture and nutrition',
      },
    }),
    prisma.subject.upsert({
      where: { code: 'HOM' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Home Science',
        code: 'HOM',
        category: SubjectCategory.ELECTIVE,
        subjectGroup: SubjectGroup.TECHNICAL_APPLIED,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        description: 'Home science and management',
      },
    }),
  ]);
  return subjects;
}

// Helper function to create fee structures
async function createFeeStructures(schoolId: string, academicYearId: string, termId: string) {
  const feeStructures = await Promise.all([
    // Primary School Fee Structure
    prisma.feeStructure.create({
      data: {
        id: uuidv4(),
        name: 'Primary - Term 1 2024',
        description: 'Fee structure for primary school students',
        academicYearId,
        termId,
        schoolId,
        currency: 'KES',
        isActive: true,
      },
    }),

    // Secondary School Fee Structure
    prisma.feeStructure.create({
      data: {
        id: uuidv4(),
        name: 'Secondary - Term 1 2024',
        description: 'Fee structure for secondary school students',
        academicYearId,
        termId,
        schoolId,
        currency: 'KES',
        isActive: true,
      },
    }),
  ]);

  // Create fee items for each structure
  await Promise.all([
    // Primary School Fee Items
    prisma.feeItem.create({
      data: {
        id: uuidv4(),
        feeStructureId: feeStructures[0].id,
        name: 'Tuition Fee',
        category: FeeCategory.TUITION,
        amount: 5000.00,
        description: 'Tuition fee for primary school',
      },
    }),
    prisma.feeItem.create({
      data: {
        id: uuidv4(),
        feeStructureId: feeStructures[0].id,
        name: 'Activity Fee',
        category: FeeCategory.ACTIVITY,
        amount: 2000.00,
        description: 'Activity fee for primary school',
      },
    }),
    prisma.feeItem.create({
      data: {
        id: uuidv4(),
        feeStructureId: feeStructures[0].id,
        name: 'Lunch Fee',
        category: FeeCategory.LUNCH,
        amount: 3000.00,
        description: 'Lunch fee for primary school',
      },
    }),

    // Secondary School Fee Items
    prisma.feeItem.create({
      data: {
        id: uuidv4(),
        feeStructureId: feeStructures[1].id,
        name: 'Tuition Fee',
        category: FeeCategory.TUITION,
        amount: 15000.00,
        description: 'Tuition fee for secondary school',
      },
    }),
    prisma.feeItem.create({
      data: {
        id: uuidv4(),
        feeStructureId: feeStructures[1].id,
        name: 'Boarding Fee',
        category: FeeCategory.BOARDING,
        amount: 10000.00,
        description: 'Boarding fee for secondary school',
      },
    }),
    prisma.feeItem.create({
      data: {
        id: uuidv4(),
        feeStructureId: feeStructures[1].id,
        name: 'Activity Fee',
        category: FeeCategory.ACTIVITY,
        amount: 3000.00,
        description: 'Activity fee for secondary school',
      },
    }),
  ]);

  return feeStructures;
}

// Helper function to create classes
async function createClasses(schoolId: string, academicYearId: string) {
  const classes = await Promise.all([
    // Primary School Classes
    prisma.class.upsert({
      where: {
        name_academicYearId_schoolId: {
          name: 'Grade 1',
          academicYearId,
          schoolId,
        },
      },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Grade 1',
        level: 'PRIMARY',
        curriculum: Curriculum.CBC,
        academicYearId,
        schoolId,
      },
    }),
    prisma.class.upsert({
      where: {
        name_academicYearId_schoolId: {
          name: 'Grade 2',
          academicYearId,
          schoolId,
        },
      },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Grade 2',
        level: 'PRIMARY',
        curriculum: Curriculum.CBC,
        academicYearId,
        schoolId,
      },
    }),
    prisma.class.upsert({
      where: {
        name_academicYearId_schoolId: {
          name: 'Grade 3',
          academicYearId,
          schoolId,
        },
      },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Grade 3',
        level: 'PRIMARY',
        curriculum: Curriculum.CBC,
        academicYearId,
        schoolId,
      },
    }),
    prisma.class.upsert({
      where: {
        name_academicYearId_schoolId: {
          name: 'Form 1',
          academicYearId,
          schoolId,
        },
      },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Form 1',
        level: 'SECONDARY',
        curriculum: Curriculum.EIGHT_FOUR_FOUR,
        academicYearId,
        schoolId,
      },
    }),
    prisma.class.upsert({
      where: {
        name_academicYearId_schoolId: {
          name: 'Form 2',
          academicYearId,
          schoolId,
        },
      },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Form 2',
        level: 'SECONDARY',
        curriculum: Curriculum.EIGHT_FOUR_FOUR,
        academicYearId,
        schoolId,
      },
    }),
    prisma.class.upsert({
      where: {
        name_academicYearId_schoolId: {
          name: 'Form 3',
          academicYearId,
          schoolId,
        },
      },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Form 3',
        level: 'SECONDARY',
        curriculum: Curriculum.EIGHT_FOUR_FOUR,
        academicYearId,
        schoolId,
      },
    }),
  ]);
  return classes;
}

// Helper function to create teachers
async function createTeachers(schoolId: string) {
  const users = await Promise.all([
    createUser('teacher1@school.com', 'Teacher123!', 'John', 'Kamau', Role.TEACHER, schoolId, {
      idNumber: 'ID123456',
      phone: '+254712345678',
    }),
    createUser('teacher2@school.com', 'Teacher123!', 'Mary', 'Wanjiru', Role.TEACHER, schoolId, {
      idNumber: 'ID123457',
      phone: '+254723456789',
    }),
    createUser('teacher3@school.com', 'Teacher123!', 'Peter', 'Omondi', Role.TEACHER, schoolId, {
      idNumber: 'ID123458',
      phone: '+254734567890',
    }),
  ]);

  // Create teacher profiles
  const profiles = await Promise.all([
    prisma.teacher.upsert({
      where: { userId: users[0].id },
      update: {},
      create: {
        id: uuidv4(),
        userId: users[0].id,
        tscNumber: 'TSC123456',
        employeeNumber: 'EMP001',
        employmentType: EmploymentType.PERMANENT,
        qualification: 'BSc Education',
        specialization: 'Mathematics',
        dateJoined: new Date('2020-01-15'),
      },
    }),
    prisma.teacher.upsert({
      where: { userId: users[1].id },
      update: {},
      create: {
        id: uuidv4(),
        userId: users[1].id,
        tscNumber: 'TSC123457',
        employeeNumber: 'EMP002',
        employmentType: EmploymentType.PERMANENT,
        qualification: 'BEd Arts',
        specialization: 'English',
        dateJoined: new Date('2019-09-01'),
      },
    }),
    prisma.teacher.upsert({
      where: { userId: users[2].id },
      update: {},
      create: {
        id: uuidv4(),
        userId: users[2].id,
        tscNumber: 'TSC123458',
        employeeNumber: 'EMP003',
        employmentType: EmploymentType.CONTRACT,
        qualification: 'Diploma in Education',
        specialization: 'Science',
        dateJoined: new Date('2021-02-10'),
      },
    }),
  ]);

  return profiles;
}

// Helper function to create students
async function createStudents(schoolId: string) {
  const users = await Promise.all([
    createUser('student1@school.com', 'Student123!', 'David', 'Mwangi', Role.STUDENT, schoolId, {
      idNumber: 'ID123459',
      phone: '+254745678901',
    }),
    createUser('student2@school.com', 'Student123!', 'Grace', 'Wangui', Role.STUDENT, schoolId, {
      idNumber: 'ID123460',
      phone: '+254756789012',
    }),
    createUser('student3@school.com', 'Student123!', 'James', 'Ouko', Role.STUDENT, schoolId, {
      idNumber: 'ID123461',
      phone: '+254767890123',
    }),
  ]);

  // Create student profiles
  const profiles = await Promise.all([
    prisma.student.upsert({
      where: { userId: users[0].id },
      update: {},
      create: {
        id: uuidv4(),
        admissionNo: 'ADM001',
        firstName: 'David',
        middleName: 'Kamau',
        lastName: 'Mwangi',
        gender: Gender.MALE,
        dob: new Date('2010-05-15'),
        nationality: 'Kenyan',
        schoolId,
        userId: users[0].id,
      },
    }),
    prisma.student.upsert({
      where: { userId: users[1].id },
      update: {},
      create: {
        id: uuidv4(),
        admissionNo: 'ADM002',
        firstName: 'Grace',
        middleName: 'Wanjiru',
        lastName: 'Wangui',
        gender: Gender.FEMALE,
        dob: new Date('2011-08-22'),
        nationality: 'Kenyan',
        schoolId,
        userId: users[1].id,
      },
    }),
    prisma.student.upsert({
      where: { userId: users[2].id },
      update: {},
      create: {
        id: uuidv4(),
        admissionNo: 'ADM003',
        firstName: 'James',
        middleName: 'Omondi',
        lastName: 'Ouko',
        gender: Gender.MALE,
        dob: new Date('2009-12-03'),
        nationality: 'Kenyan',
        schoolId,
        userId: users[2].id,
      },
    }),
  ]);

  return profiles;
}

// Helper function to create guardians
async function createGuardians() {
  const guardians = await Promise.all([
    createUser('guardian1@school.com', 'Guardian123!', 'Joseph', 'Mwangi', Role.PARENT, undefined, {
      idNumber: 'ID123462',
      phone: '+254778901234',
    }),
    createUser('guardian2@school.com', 'Guardian123!', 'Anne', 'Wangui', Role.PARENT, undefined, {
      idNumber: 'ID123463',
      phone: '+254789012345',
    }),
  ]);

  // Create guardian profiles
  const guardianProfiles = await Promise.all([
    prisma.guardian.upsert({
      where: { userId: guardians[0].id },
      update: {},
      create: {
        id: uuidv4(),
        userId: guardians[0].id,
        relationship: 'Father',
        occupation: 'Businessman',
        employer: 'Self-employed',
        workPhone: '+254712345678',
      },
    }),
    prisma.guardian.upsert({
      where: { userId: guardians[1].id },
      update: {},
      create: {
        id: uuidv4(),
        userId: guardians[1].id,
        relationship: 'Mother',
        occupation: 'Teacher',
        employer: 'Nairobi County Government',
        workPhone: '+254723456789',
      },
    }),
  ]);

  return guardianProfiles;
}

// Helper function to create student-guardian relationships
async function createStudentGuardians(students: any[], guardians: any[]) {
  const studentGuardians = await Promise.all([
    prisma.studentGuardian.create({
      data: {
        id: uuidv4(),
        studentId: students[0].id,
        guardianId: guardians[0].id,
        isPrimary: true,
      },
    }),
    prisma.studentGuardian.create({
      data: {
        id: uuidv4(),
        studentId: students[1].id,
        guardianId: guardians[1].id,
        isPrimary: true,
      },
    }),
  ]);
  return studentGuardians;
}

// Helper function to create class-subject assignments
async function createClassSubjects(classes: any[], subjects: any[], teachers: any[], termId: string, academicYearId: string, schoolId: string) {
  const classSubjects = await Promise.all([
    // Class 1 - Mathematics
    prisma.classSubject.create({
      data: {
        id: uuidv4(),
        classId: classes[0].id,
        subjectId: subjects[0].id,
        teacherId: teachers[0].id,
        termId,
        academicYearId,
        subjectCategory: SubjectCategory.CORE,
        schoolId,
      },
    }),
    // Class 1 - English
    prisma.classSubject.create({
      data: {
        id: uuidv4(),
        classId: classes[0].id,
        subjectId: subjects[1].id,
        teacherId: teachers[1].id,
        termId,
        academicYearId,
        subjectCategory: SubjectCategory.CORE,
        schoolId,
      },
    }),
    // Class 1 - Science
    prisma.classSubject.create({
      data: {
        id: uuidv4(),
        classId: classes[0].id,
        subjectId: subjects[3].id,
        teacherId: teachers[2].id,
        termId,
        academicYearId,
        subjectCategory: SubjectCategory.CORE,
        schoolId,
      },
    }),
    // Form 1 - Mathematics
    prisma.classSubject.create({
      data: {
        id: uuidv4(),
        classId: classes[3].id,
        subjectId: subjects[0].id,
        teacherId: teachers[0].id,
        termId,
        academicYearId,
        subjectCategory: SubjectCategory.CORE,
        schoolId,
      },
    }),
    // Form 1 - English
    prisma.classSubject.create({
      data: {
        id: uuidv4(),
        classId: classes[3].id,
        subjectId: subjects[1].id,
        teacherId: teachers[1].id,
        termId,
        academicYearId,
        subjectCategory: SubjectCategory.CORE,
        schoolId,
      },
    }),
    // Form 1 - Geography
    prisma.classSubject.create({
      data: {
        id: uuidv4(),
        classId: classes[3].id,
        subjectId: subjects[11].id,
        teacherId: teachers[1].id,
        termId,
        academicYearId,
        subjectCategory: SubjectCategory.ELECTIVE,
        schoolId,
      },
    }),
  ]);
  return classSubjects;
}

// Helper function to create student enrollments
async function createStudentEnrollments(students: any[], classes: any[], academicYearId: string, schoolId: string) {
  const enrollments = await Promise.all([
    // Student 1 - Grade 1
    prisma.studentClass.create({
      data: {
        id: uuidv4(),
        studentId: students[0].id,
        classId: classes[0].id,
        academicYearId,
        schoolId,
        status: EnrollmentStatus.ACTIVE,
      },
    }),
    // Student 2 - Grade 2
    prisma.studentClass.create({
      data: {
        id: uuidv4(),
        studentId: students[1].id,
        classId: classes[1].id,
        academicYearId,
        schoolId,
        status: EnrollmentStatus.ACTIVE,
      },
    }),
    // Student 3 - Form 1
    prisma.studentClass.create({
      data: {
        id: uuidv4(),
        studentId: students[2].id,
        classId: classes[3].id,
        academicYearId,
        schoolId,
        status: EnrollmentStatus.ACTIVE,
      },
    }),
  ]);
  return enrollments;
}

// Helper function to create student subject enrollments
async function createStudentSubjectEnrollments(students: any[], classSubjects: any[], enrollments: any[]) {
  await Promise.all([
    // Student 1 - Mathematics
    prisma.studentClassSubject.create({
      data: {
        id: uuidv4(),
        studentId: students[0].id,
        classSubjectId: classSubjects[0].id,
        enrollmentId: enrollments[0].id,
        status: SubjectEnrollmentStatus.ACTIVE,
      },
    }),
    // Student 1 - English
    prisma.studentClassSubject.create({
      data: {
        id: uuidv4(),
        studentId: students[0].id,
        classSubjectId: classSubjects[1].id,
        enrollmentId: enrollments[0].id,
        status: SubjectEnrollmentStatus.ACTIVE,
      },
    }),
    // Student 3 - Mathematics
    prisma.studentClassSubject.create({
      data: {
        id: uuidv4(),
        studentId: students[2].id,
        classSubjectId: classSubjects[3].id,
        enrollmentId: enrollments[2].id,
        status: SubjectEnrollmentStatus.ACTIVE,
      },
    }),
    // Student 3 - English
    prisma.studentClassSubject.create({
      data: {
        id: uuidv4(),
        studentId: students[2].id,
        classSubjectId: classSubjects[4].id,
        enrollmentId: enrollments[2].id,
        status: SubjectEnrollmentStatus.ACTIVE,
      },
    }),
    // Student 3 - Geography
    prisma.studentClassSubject.create({
      data: {
        id: uuidv4(),
        studentId: students[2].id,
        classSubjectId: classSubjects[5].id,
        enrollmentId: enrollments[2].id,
        status: SubjectEnrollmentStatus.ACTIVE,
      },
    }),
  ]);
}

// Helper function to create assessment definitions
async function createAssessmentDefinitions(classSubjects: any[]) {
  const assessmentDefinitions = await Promise.all([
    // Mathematics Assessment
    prisma.assessmentDefinition.create({
      data: {
        id: uuidv4(),
        name: 'Mathematics CAT 1',
        type: AssessmentType.CAT,
        maxMarks: 100,
        classSubjectId: classSubjects[0].id,
        termId: classSubjects[0].termId,
        academicYearId: classSubjects[0].academicYearId,
      },
      include: {
        classSubject: true,
      },
    }),
    // English Assessment
    prisma.assessmentDefinition.create({
      data: {
        id: uuidv4(),
        name: 'English CAT 1',
        type: AssessmentType.CAT,
        maxMarks: 100,
        classSubjectId: classSubjects[1].id,
        termId: classSubjects[1].termId,
        academicYearId: classSubjects[1].academicYearId,
      },
      include: {
        classSubject: true,
      },
    }),
    // Geography Assessment
    prisma.assessmentDefinition.create({
      data: {
        id: uuidv4(),
        name: 'Geography CAT 1',
        type: AssessmentType.CAT,
        maxMarks: 100,
        classSubjectId: classSubjects[5].id,
        termId: classSubjects[5].termId,
        academicYearId: classSubjects[5].academicYearId,
      },
      include: {
        classSubject: true,
      },
    }),
  ]);
  return assessmentDefinitions;
}

// Helper function to create assessment results
async function createAssessmentResults(students: any[], assessmentDefinitions: any[]) {
  await Promise.all([
    // Student 1 - Mathematics Result
    prisma.assessmentResult.create({
      data: {
        id: uuidv4(),
        studentId: students[0].id,
        assessmentDefId: assessmentDefinitions[0].id,
        numericValue: 85.5,
        grade: 'A',
        competencyLevel: CompetencyLevel.MEETING_EXPECTATIONS,
        assessedById: assessmentDefinitions[0].classSubject.teacherId,
      },
    }),
    // Student 3 - Mathematics Result
    prisma.assessmentResult.create({
      data: {
        id: uuidv4(),
        studentId: students[2].id,
        assessmentDefId: assessmentDefinitions[0].id,
        numericValue: 92.0,
        grade: 'A',
        competencyLevel: CompetencyLevel.EXCEEDING_EXPECTATIONS,
        assessedById: assessmentDefinitions[0].classSubject.teacherId,
      },
    }),
    // Student 3 - Geography Result
    prisma.assessmentResult.create({
      data: {
        id: uuidv4(),
        studentId: students[2].id,
        assessmentDefId: assessmentDefinitions[2].id,
        numericValue: 78.0,
        grade: 'B',
        competencyLevel: CompetencyLevel.APPROACHING_EXPECTATIONS,
        assessedById: assessmentDefinitions[2].classSubject.teacherId,
      },
    }),
  ]);
}

// Helper function to create fee invoices
async function createFeeInvoices(students: any[], feeStructures: any[]) {
  const feeInvoices = await Promise.all([
    // Student 1 - Primary School Invoice
    prisma.feeInvoice.create({
      data: {
        id: uuidv4(),
        invoiceNo: 'INV/2024/000001',
        studentId: students[0].id,
        feeStructureId: feeStructures[0].id,
        academicYearId: feeStructures[0].academicYearId,
        termId: feeStructures[0].termId,
        schoolId: feeStructures[0].schoolId,
        status: InvoiceStatus.UNPAID,
        totalAmount: 10000.00,
        discountAmount: 0,
        paidAmount: 0,
        balanceAmount: 10000.00,
        dueDate: new Date('2024-04-05'),
        issuedAt: new Date(),
      },
    }),
    // Student 3 - Secondary School Invoice
    prisma.feeInvoice.create({
      data: {
        id: uuidv4(),
        invoiceNo: 'INV/2024/000002',
        studentId: students[2].id,
        feeStructureId: feeStructures[1].id,
        academicYearId: feeStructures[1].academicYearId,
        termId: feeStructures[1].termId,
        schoolId: feeStructures[1].schoolId,
        status: InvoiceStatus.UNPAID,
        totalAmount: 28000.00,
        discountAmount: 0,
        paidAmount: 0,
        balanceAmount: 28000.00,
        dueDate: new Date('2024-04-05'),
        issuedAt: new Date(),
      },
    }),
  ]);
  return feeInvoices;
}

// Helper function to create fee payments
async function createFeePayments(feeInvoices: any[]) {
  await Promise.all([
    // Payment for Student 1
    prisma.feePayment.create({
      data: {
        id: uuidv4(),
        receiptNo: 'RCT/2024/000001',
        invoiceId: feeInvoices[0].id,
        studentId: feeInvoices[0].studentId,
        schoolId: feeInvoices[0].schoolId,
        amount: 5000.00,
        method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      },
    }),
  ]);
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Super Admin
  const superAdmin = await createUser('superadmin@edutrak.com', 'Admin123!', 'System', 'Administrator', Role.SUPER_ADMIN);
  console.log('✅ Super Admin created:', superAdmin.email);

  // Create sample schools
  const schools = await Promise.all([
    createSchool('Nairobi High School', 'REG001', SchoolType.SECONDARY, 'Nairobi', 'Westlands', 'Kitisuru', 'SCH001', 'KEM001', '+254700000001', 'info@nairobi-high.ac.ke', 'P.O. Box 12345, Nairobi', Ownership.PUBLIC, BoardingStatus.BOTH, SchoolGender.MIXED),
    createSchool('Mombasa Primary School', 'REG002', SchoolType.PRIMARY, 'Mombasa', 'Mvita', 'Central', 'SCH002', 'NEM002', '+254700000002', 'info@mombasa-primary.ac.ke', 'P.O. Box 67890, Mombasa', Ownership.PUBLIC, BoardingStatus.DAY, SchoolGender.MIXED),
    createSchool('Eldoret TVET Institute', 'REG003', SchoolType.TVET, 'Uasin Gishu', 'Eldoret', 'Huruma', 'SCH003', 'ELD003', '+254700000003', 'info@eldoret-tvet.ac.ke', 'P.O. Box 11223, Eldoret', Ownership.PRIVATE, BoardingStatus.BOTH, SchoolGender.MIXED),
  ]);
  console.log('✅ Sample schools created');

  // Create academic year and terms
  const academicYear = await createAcademicYear(2024, new Date('2024-01-08'), new Date('2024-11-22'), true);
  const terms = await createTerms(academicYear.id);
  console.log('✅ Academic year and terms created');

  // Create subjects
  const subjects = await createSubjects();
  console.log('✅ Sample subjects created');

  // Create fee structures and items
  const feeStructures = await createFeeStructures(schools[0].id, academicYear.id, terms[0].id);
  console.log('✅ Fee structures and items created');

  // Create classes for each school
  const classes = await createClasses(schools[0].id, academicYear.id);
  console.log('✅ Classes created');

  // Create teachers for each school
  const teachers = await createTeachers(schools[0].id);
  console.log('✅ Teachers created');

  // Create students for each school
  const students = await createStudents(schools[0].id);
  console.log('✅ Students created');

  // Create guardians
  const guardians = await createGuardians();
  console.log('✅ Guardians created');

  // Create student-guardian relationships
  await createStudentGuardians(students, guardians);
  console.log('✅ Student-guardian relationships created');

  // Create class-subject assignments
  const classSubjects = await createClassSubjects(classes, subjects, teachers, terms[0].id, academicYear.id, schools[0].id);
  console.log('✅ Class-subject assignments created');

  // Create student enrollments
  const enrollments = await createStudentEnrollments(students, classes, academicYear.id, schools[0].id);
  console.log('✅ Student enrollments created');

  // Create student subject enrollments
  await createStudentSubjectEnrollments(students, classSubjects, enrollments);
  console.log('✅ Student subject enrollments created');

  // Create assessment definitions
  const assessmentDefinitions = await createAssessmentDefinitions(classSubjects);
  console.log('✅ Assessment definitions created');

  // Create assessment results
  await createAssessmentResults(students, assessmentDefinitions);
  console.log('✅ Assessment results created');

  // Create fee invoices
  const feeInvoices = await createFeeInvoices(students, feeStructures);
  console.log('✅ Fee invoices created');

  // Create fee payments
  await createFeePayments(feeInvoices);
  console.log('✅ Fee payments created');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });