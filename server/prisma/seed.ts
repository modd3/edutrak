import { PrismaClient, Role, SchoolType, Ownership, BoardingStatus, SchoolGender, Curriculum, Gender, EmploymentType, TermName, SubjectCategory, EnrollmentStatus, SubjectEnrollmentStatus, AssessmentType, InvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { hashPassword } from '../src/utils/hash';
import { v4 as uuidv4 } from 'uuid';
import {
  KENYAN_FIRST_NAMES_MALE, KENYAN_FIRST_NAMES_FEMALE, KENYAN_LAST_NAMES,
  GUARDIAN_OCCUPATIONS, KENYAN_COUNTIES, TEACHER_SPECIALIZATIONS,
  SUBJECT_DEFINITIONS, FORM_LEVELS, STREAMS, DEMO_SCHOOL_NAME,
  pick, pickN, randInt, admissionNo, tscNumber, employeeNumber,
  generateMarks, markToGrade
} from './seed-data';

const prisma = new PrismaClient();

// ─── Track created IDs for later reference ─────────────────────────────────
const state = {
  schoolId: '',
  academicYearId: '',
  term1Id: '' as string | undefined,
  term2Id: '' as string | undefined,
  subjectIds: {} as Record<string, string>,        // code → id
  teacherIds: [] as string[],
  teacherUserIds: [] as string[],
  studentIds: [] as string[],
  studentUserIds: [] as string[],
  guardianUserIds: [] as string[],
  guardianIds: [] as string[],
  classIds: {} as Record<string, string>,          // formName → id
  streamIds: [] as { id: string; classId: string; name: string }[],
  classSubjectIds: [] as { id: string; classId: string; subjectId: string; teacherId: string; streamId?: string }[],
  enrollmentIds: [] as { id: string; studentId: string; classId: string }[],
  assessmentDefIds: [] as { id: string; classSubjectId: string; type: string }[],
};

async function main() {
  console.log('🌱 Seeding Nairobi Premier Secondary School demo data...\n');

  // Step 1: Create the school
  const school = await prisma.school.create({
    data: {
      id: uuidv4(),
      name: DEMO_SCHOOL_NAME,
      registrationNo: 'NPS/2024/001',
      type: SchoolType.SECONDARY,
      county: 'Nairobi',
      subCounty: 'Westlands',
      ward: 'Kitisuru',
      knecCode: 'NPS001',
      kemisCode: 'NPSKEM001',
      phone: '+254700100200',
      email: 'info@nps.ac.ke',
      address: 'P.O. Box 100-00100, Nairobi',
      ownership: Ownership.PUBLIC,
      boardingStatus: BoardingStatus.BOTH,
      gender: SchoolGender.MIXED,
    },
  });
  state.schoolId = school.id;
  console.log('✅ School created:', school.name);

  // Step 2: Create subjects
  for (const def of SUBJECT_DEFINITIONS) {
    const subject = await prisma.subject.upsert({
      where: { code: def.code },
      update: {},
      create: {
        id: uuidv4(),
        name: def.name,
        code: def.code,
        category: def.category as SubjectCategory,
        curriculum: def.curriculum as Curriculum[],
      },
    });
    state.subjectIds[def.code] = subject.id;
  }
  console.log(`✅ ${Object.keys(state.subjectIds).length} subjects ready`);

  // Step 3: Offer all subjects at this school
  for (const [code, subjectId] of Object.entries(state.subjectIds)) {
    await prisma.subjectOffering.upsert({
      where: { schoolId_subjectId: { schoolId: state.schoolId, subjectId } },
      update: {},
      create: { id: uuidv4(), schoolId: state.schoolId, subjectId, isActive: true },
    });
  }
  console.log('✅ Subject offerings created');

  // Step 4: Create admin user
  const adminPassword = await hashPassword('Admin123!');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nps.ac.ke' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'admin@nps.ac.ke',
      password: adminPassword,
      firstName: 'School',
      lastName: 'Admin',
      role: Role.ADMIN,
      schoolId: state.schoolId,
      isActive: true,
    },
  });
  console.log('✅ Admin user created: admin@nps.ac.ke / Admin123!');

  // Step 5: Create super admin
  await prisma.user.upsert({
    where: { email: 'superadmin@edutrak.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'superadmin@edutrak.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Super admin: superadmin@edutrak.com / Admin123!');

  // Step 6: Academic Year 2025 with 2 terms
  const academicYear = await prisma.academicYear.create({
    data: {
      id: uuidv4(),
      year: 2025,
      startDate: new Date('2025-01-06'),
      endDate: new Date('2025-11-28'),
      isActive: true,
      schoolId: state.schoolId,
    },
  });
  state.academicYearId = academicYear.id;

  const term1 = await prisma.term.create({
    data: {
      id: uuidv4(),
      name: TermName.TERM_1,
      termNumber: 1,
      startDate: new Date('2025-01-06'),
      endDate: new Date('2025-04-04'),
      academicYearId: state.academicYearId,
      schoolId: state.schoolId,
    },
  });
  state.term1Id = term1.id;

  const term2 = await prisma.term.create({
    data: {
      id: uuidv4(),
      name: TermName.TERM_2,
      termNumber: 2,
      startDate: new Date('2025-05-05'),
      endDate: new Date('2025-08-08'),
      academicYearId: state.academicYearId,
      schoolId: state.schoolId,
    },
  });
  state.term2Id = term2.id;
  console.log('✅ Academic Year 2025 with Term 1 & Term 2 created');

  // Step 7: Create 12 classes (4 forms × 3 streams)
  let classIndex = 0;
  for (const form of FORM_LEVELS) {
    // Create the class (Form 1, Form 2, etc.)
    const isFinalForm = form === 'Form 4';
    const cls = await prisma.class.create({
      data: {
        id: uuidv4(),
        name: form,
        level: form,
        curriculum: Curriculum.EIGHT_FOUR_FOUR,
        academicYearId: state.academicYearId,
        schoolId: state.schoolId,
        isFinal: isFinalForm,
      },
    });
    state.classIds[form] = cls.id;

    // Create 3 streams per form
    for (const streamName of STREAMS) {
      const stream = await prisma.stream.create({
        data: {
          id: uuidv4(),
          name: streamName,
          capacity: 45,
          classId: cls.id,
          schoolId: state.schoolId,
        },
      });
      state.streamIds.push({ id: stream.id, classId: cls.id, name: streamName });
    }
    classIndex++;
  }
  console.log(`✅ ${FORM_LEVELS.length} classes with ${STREAMS.length} streams each created`);

  // Step 8: Create 15 teachers with user accounts
  const teacherSubjectAssignments = [
    { firstName: 'John', lastName: 'Kamau', subject: 'Mathematics', gender: 'MALE' },
    { firstName: 'Mary', lastName: 'Wanjiku', subject: 'English', gender: 'FEMALE' },
    { firstName: 'Peter', lastName: 'Omondi', subject: 'Kiswahili', gender: 'MALE' },
    { firstName: 'Grace', lastName: 'Chebet', subject: 'Biology', gender: 'FEMALE' },
    { firstName: 'David', lastName: 'Kiprop', subject: 'Chemistry', gender: 'MALE' },
    { firstName: 'Sarah', lastName: 'Kosgey', subject: 'Physics', gender: 'FEMALE' },
    { firstName: 'James', lastName: 'Mwangi', subject: 'Geography', gender: 'MALE' },
    { firstName: 'Esther', lastName: 'Muthoni', subject: 'History', gender: 'FEMALE' },
    { firstName: 'Samuel', lastName: 'Njoroge', subject: 'CRE', gender: 'MALE' },
    { firstName: 'Rebecca', lastName: 'Adhiambo', subject: 'Business Studies', gender: 'FEMALE' },
    { firstName: 'Daniel', lastName: 'Mutua', subject: 'Agriculture', gender: 'MALE' },
    { firstName: 'Faith', lastName: 'Wambui', subject: 'Computer Studies', gender: 'FEMALE' },
    { firstName: 'Patrick', lastName: 'Odhiambo', subject: 'Mathematics', gender: 'MALE' },
    { firstName: 'Nancy', lastName: 'Akinyi', subject: 'English', gender: 'FEMALE' },
    { firstName: 'Kevin', lastName: 'Kipkorir', subject: 'Biology', gender: 'MALE' },
  ];

  for (let i = 0; i < teacherSubjectAssignments.length; i++) {
    const t = teacherSubjectAssignments[i];
    const email = `teacher${i + 1}@nps.ac.ke`;
    const pwd = await hashPassword('Teacher123!');
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: uuidv4(),
        email,
        password: pwd,
        firstName: t.firstName,
        lastName: t.lastName,
        role: Role.TEACHER,
        schoolId: state.schoolId,
        isActive: true,
        phone: `+2547${String(randInt(10000000, 99999999)).padStart(8, '0')}`,
      },
    });
    state.teacherUserIds.push(user.id);

    const specs = TEACHER_SPECIALIZATIONS[t.subject] || ['BEd Education'];
    const teacher = await prisma.teacher.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        tscNumber: tscNumber(i + 1),
        employeeNumber: employeeNumber(i + 1),
        employmentType: i % 5 === 0 ? EmploymentType.CONTRACT : EmploymentType.PERMANENT,
        qualification: pick(specs),
        specialization: t.subject,
        dateJoined: new Date(`202${randInt(0, 4)}-0${randInt(1, 9)}-${randInt(10, 28)}`),
      },
    });
    state.teacherIds.push(teacher.id);
  }
  console.log(`✅ ${state.teacherIds.length} teachers created`);

  // Step 9: Create 80 students (20 per form level)
  let studentCounter = 1;
  const studentsPerForm = 20;
  
  for (let formIdx = 0; formIdx < FORM_LEVELS.length; formIdx++) {
    const form = FORM_LEVELS[formIdx];
    const classId = state.classIds[form];

    for (let s = 0; s < studentsPerForm; s++) {
      const isMale = randInt(0, 1) === 0;
      const firstName = isMale
        ? pick(KENYAN_FIRST_NAMES_MALE)
        : pick(KENYAN_FIRST_NAMES_FEMALE);
      const lastName = pick(KENYAN_LAST_NAMES);
      const middleName = isMale ? pick(KENYAN_FIRST_NAMES_MALE) : pick(KENYAN_FIRST_NAMES_FEMALE);
      const gender = isMale ? Gender.MALE : Gender.FEMALE;
      const admNo = `NPS/${2025}/${String(studentCounter).padStart(3, '0')}`;
      const email = `student${studentCounter}@nps.ac.ke`;
      const pwd = await hashPassword('Student123!');

      // Create user
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          id: uuidv4(),
          email,
          password: pwd,
          firstName,
          lastName,
          role: Role.STUDENT,
          schoolId: state.schoolId,
          isActive: true,
        },
      });
      state.studentUserIds.push(user.id);

      // Create student record
      const student = await prisma.student.create({
        data: {
          id: uuidv4(),
          admissionNo: admNo,
          firstName,
          middleName,
          lastName,
          gender,
          dob: new Date(`${2005 + formIdx}-${randInt(1, 12)}-${String(randInt(1, 28)).padStart(2, '0')}`),
          nationality: 'Kenyan',
          county: pick(KENYAN_COUNTIES),
          schoolId: state.schoolId,
          userId: user.id,
        },
      });
      state.studentIds.push(student.id);

      // Assign to a stream (distribute evenly: 6-7 per stream)
      const streamIndex = s % 3;
      const streamEntry = state.streamIds.find(
        st => st.classId === classId && st.name === STREAMS[streamIndex]
      );
      const streamId = streamEntry?.id;

      // Enroll in class
      const enrollment = await prisma.studentClass.create({
        data: {
          id: uuidv4(),
          studentId: student.id,
          classId,
          streamId: streamId!,
          academicYearId: state.academicYearId,
          schoolId: state.schoolId,
          status: EnrollmentStatus.ACTIVE,
        },
      });
      state.enrollmentIds.push({ id: enrollment.id, studentId: student.id, classId });
      
      studentCounter++;
    }
  }
  console.log(`✅ ${state.studentIds.length} students created and enrolled`);

  // Step 10: Create guardians and link to students
  // Create ~25 guardians, each linked to 2-4 students
  const existingGuardianEmails = new Set<string>();
  for (let g = 0; g < 25; g++) {
    const isMale = randInt(0, 1) === 0;
    const firstName = isMale ? pick(KENYAN_FIRST_NAMES_MALE) : pick(KENYAN_FIRST_NAMES_FEMALE);
    const lastName = pick(KENYAN_LAST_NAMES);
    const email = `guardian${g + 1}@nps.ac.ke`;
    const pwd = await hashPassword('Guard123!');

    if (existingGuardianEmails.has(email)) continue;
    existingGuardianEmails.add(email);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: uuidv4(),
        email,
        password: pwd,
        firstName,
        lastName,
        role: Role.PARENT,
        isActive: true,
        phone: `+2547${String(randInt(10000000, 99999999)).padStart(8, '0')}`,
      },
    });
    state.guardianUserIds.push(user.id);

    const guardian = await prisma.guardian.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        relationship: isMale ? 'Father' : 'Mother',
        occupation: pick(GUARDIAN_OCCUPATIONS),
        employer: 'Self-employed',
      },
    });
    state.guardianIds.push(guardian.id);
  }

  // Link guardians to students (each student gets 1-2 guardians)
  for (let si = 0; si < state.studentIds.length; si++) {
    const numGuardians = randInt(1, 2);
    const guardiansForStudent = pickN(state.guardianIds, numGuardians);
    for (let gi = 0; gi < guardiansForStudent.length; gi++) {
      await prisma.studentGuardian.create({
        data: {
          id: uuidv4(),
          studentId: state.studentIds[si],
          guardianId: guardiansForStudent[gi],
          isPrimary: gi === 0,
        },
      }).catch(() => {
        // Skip duplicate pairs silently
      });
    }
  }
  console.log(`✅ ${state.guardianIds.length} guardians created and linked`);

  // Step 11: Assign subjects to classes & teachers
  // Form 1 & 2: core subjects (MATH, ENG, KIS, BIO, CHEM, PHY, CRE, GEO, HIST)
  // Form 3 & 4: all subjects including electives
  const coreSubjects = ['MATH', 'ENG', 'KIS', 'BIO', 'CHEM', 'PHY', 'CRE', 'GEO', 'HIST'];
  const electiveSubjects = ['BUS', 'AGRI', 'COMP'];

  for (const form of FORM_LEVELS) {
    const classId = state.classIds[form];
    const isSenior = form === 'Form 3' || form === 'Form 4';
    const subjectsForForm = isSenior ? [...coreSubjects, ...electiveSubjects] : coreSubjects;

    // Get the streams for this class
    const formStreams = state.streamIds.filter(st => st.classId === classId);

    for (const stream of formStreams) {
      for (const subjectCode of subjectsForForm) {
        const subjectId = state.subjectIds[subjectCode];
        if (!subjectId) continue;

        // Find a teacher for this subject (prefer ones with matching specialization)
        const subjectName = SUBJECT_DEFINITIONS.find(s => s.code === subjectCode)?.name || '';
        const matchingTeacherIdx = state.teacherIds.findIndex((_, idx) => {
          return teacherSubjectAssignments[idx]?.subject === subjectName;
        });
        const teacherIdx = matchingTeacherIdx >= 0
          ? matchingTeacherIdx
          : randInt(0, state.teacherIds.length - 1);
        const teacherId = state.teacherIds[teacherIdx];

        const cs = await prisma.classSubject.create({
          data: {
            id: uuidv4(),
            classId,
            streamId: stream.id,
            subjectId,
            teacherId,
            termId: state.term1Id!,
            academicYearId: state.academicYearId,
            subjectCategory: electiveSubjects.includes(subjectCode) ? SubjectCategory.ELECTIVE : SubjectCategory.CORE,
            schoolId: state.schoolId,
          },
        });
        state.classSubjectIds.push({
          id: cs.id,
          classId,
          subjectId,
          teacherId,
          streamId: stream.id,
        });
      }
    }
  }
  console.log(`✅ ${state.classSubjectIds.length} class-subject-stream assignments created`);

  // Step 12: Enroll students in subjects (core subjects auto-enrolled, electives for senior forms)
  for (const enrollment of state.enrollmentIds) {
    const studentId = enrollment.studentId;
    const classId = enrollment.classId;
    const form = Object.entries(state.classIds).find(([_, cid]) => cid === classId)?.[0];
    const isSenior = form === 'Form 3' || form === 'Form 4';

    // Find class-subject entries for this class
    const classSubjects = state.classSubjectIds.filter(cs => cs.classId === classId);

    for (const cs of classSubjects) {
      const subjectCode = Object.entries(state.subjectIds).find(([_, sid]) => sid === cs.subjectId)?.[0];
      const isElective = electiveSubjects.includes(subjectCode || '');

      // Skip electives for junior forms
      if (isElective && !isSenior) continue;

      // For senior forms, randomly assign electives (each student gets 2-3 electives)
      if (isElective && isSenior) {
        if (Math.random() > 0.6) continue; // 40% chance to take each elective
      }

      await prisma.studentClassSubject.create({
        data: {
          id: uuidv4(),
          studentId,
          classSubjectId: cs.id,
          enrollmentId: enrollment.id,
          schoolId: state.schoolId,
          status: SubjectEnrollmentStatus.ACTIVE,
        },
      }).catch(() => { /* skip duplicates */ });
    }
  }
  console.log('✅ Student subject enrollments created');

  // Step 13: Create Term 1 assessment definitions (CAT 1, CAT 2, End Term per subject-class-stream)
  for (const cs of state.classSubjectIds) {
    // CAT 1
    const cat1 = await prisma.assessmentDefinition.create({
      data: {
        id: uuidv4(),
        name: `${SUBJECT_DEFINITIONS.find(s => s.code === Object.entries(state.subjectIds).find(([_, sid]) => sid === cs.subjectId)?.[0])?.name || 'Subject'} CAT 1`,
        type: AssessmentType.CAT,
        maxMarks: 100,
        classSubjectId: cs.id,
        termId: state.term1Id!,
        academicYearId: state.academicYearId,
        schoolId: state.schoolId,
      },
    });
    state.assessmentDefIds.push({ id: cat1.id, classSubjectId: cs.id, type: 'CAT_1' });

    // CAT 2
    const cat2 = await prisma.assessmentDefinition.create({
      data: {
        id: uuidv4(),
        name: `${SUBJECT_DEFINITIONS.find(s => s.code === Object.entries(state.subjectIds).find(([_, sid]) => sid === cs.subjectId)?.[0])?.name || 'Subject'} CAT 2`,
        type: AssessmentType.CAT,
        maxMarks: 100,
        classSubjectId: cs.id,
        termId: state.term1Id!,
        academicYearId: state.academicYearId,
        schoolId: state.schoolId,
      },
    });
    state.assessmentDefIds.push({ id: cat2.id, classSubjectId: cs.id, type: 'CAT_2' });

    // End Term
    const endTerm = await prisma.assessmentDefinition.create({
      data: {
        id: uuidv4(),
        name: `${SUBJECT_DEFINITIONS.find(s => s.code === Object.entries(state.subjectIds).find(([_, sid]) => sid === cs.subjectId)?.[0])?.name || 'Subject'} End of Term`,
        type: AssessmentType.END_OF_TERM,
        maxMarks: 100,
        classSubjectId: cs.id,
        termId: state.term1Id!,
        academicYearId: state.academicYearId,
        schoolId: state.schoolId,
      },
    });
    state.assessmentDefIds.push({ id: endTerm.id, classSubjectId: cs.id, type: 'END_TERM' });
  }
  console.log(`✅ ${state.assessmentDefIds.length} assessment definitions created`);

  // Step 14: Generate assessment results for all students in Term 1
  let resultCount = 0;
  for (const enrollment of state.enrollmentIds) {
    const studentId = enrollment.studentId;
    const classId = enrollment.classId;

    // Find class-subjects for this student's class
    const studentClassSubjects = state.classSubjectIds.filter(cs => cs.classId === classId);

    for (const cs of studentClassSubjects) {
      // Find assessment defs for this class-subject
      const defs = state.assessmentDefIds.filter(ad => ad.classSubjectId === cs.id);

      for (const def of defs) {
        let marks: number;
        let grade: string;

        if (def.type === 'END_TERM') {
          // End term uses a weighted average of CATs + final exam
          marks = generateMarks();
        } else {
          marks = generateMarks();
        }
        grade = markToGrade(marks);

        const existing = await prisma.assessmentResult.findFirst({
          where: {
            studentId,
            assessmentDefId: def.id,
          },
        });
        if (!existing) {
          await prisma.assessmentResult.create({
            data: {
              id: uuidv4(),
              studentId,
              assessmentDefId: def.id,
              schoolId: state.schoolId,
              numericValue: marks,
              grade,
              assessedById: cs.teacherId,
            },
          });
          resultCount++;
        }
      }
    }
  }
  console.log(`✅ ${resultCount} assessment results created`);

  // Step 15: Create fee structures (one per form level)
  const feeAmounts: Record<string, { tuition: number; boarding: number; activity: number }> = {
    'Form 1': { tuition: 18000, boarding: 12000, activity: 3000 },
    'Form 2': { tuition: 18000, boarding: 12000, activity: 3000 },
    'Form 3': { tuition: 20000, boarding: 13000, activity: 3500 },
    'Form 4': { tuition: 22000, boarding: 15000, activity: 4000 },
  };

  const feeStructureIds: Record<string, string> = {};
  for (const form of FORM_LEVELS) {
    const amounts = feeAmounts[form];
    const fs = await prisma.feeStructure.create({
      data: {
        id: uuidv4(),
        name: `${form} - Term 1 2025`,
        description: `Fee structure for ${form} students, Term 1 2025`,
        academicYearId: state.academicYearId,
        termId: state.term1Id!,
        classLevel: form,
        schoolId: state.schoolId,
        isActive: true,
        currency: 'KES',
      },
    });
    feeStructureIds[form] = fs.id;

    // Create fee items
    await prisma.feeItem.create({ data: { id: uuidv4(), feeStructureId: fs.id, name: 'Tuition Fee', category: 'TUITION' as any, amount: amounts.tuition } });
    await prisma.feeItem.create({ data: { id: uuidv4(), feeStructureId: fs.id, name: 'Boarding Fee', category: 'BOARDING' as any, amount: amounts.boarding } });
    await prisma.feeItem.create({ data: { id: uuidv4(), feeStructureId: fs.id, name: 'Activity Fee', category: 'ACTIVITY' as any, amount: amounts.activity } });
  }
  console.log('✅ Fee structures & items created');

  // Step 16: Generate fee invoices for each student
  let invoiceCounter = 1;
  let paymentCounter = 1;
  const studentsByClass: Record<string, { studentId: string; classId: string }[]> = {};
  for (const enrollment of state.enrollmentIds) {
    const classId = enrollment.classId;
    if (!studentsByClass[classId]) studentsByClass[classId] = [];
    studentsByClass[classId]!.push({ studentId: enrollment.studentId, classId });
  }

  for (const form of FORM_LEVELS) {
    const classId = state.classIds[form];
    const fsId = feeStructureIds[form];
    const amounts = feeAmounts[form];
    const totalAmount = amounts.tuition + amounts.boarding + amounts.activity;
    const students = studentsByClass[classId] || [];

    for (const { studentId } of students) {
      // 60% paid, 25% partial, 15% unpaid
      const paidRoll = Math.random();
      let status: InvoiceStatus;
      let paidAmount = 0;
      if (paidRoll < 0.6) {
        status = InvoiceStatus.PAID;
        paidAmount = totalAmount;
      } else if (paidRoll < 0.85) {
        status = InvoiceStatus.PARTIAL;
        paidAmount = Math.round(totalAmount * (0.3 + Math.random() * 0.4));
      } else {
        status = InvoiceStatus.UNPAID;
      }

      const invoice = await prisma.feeInvoice.create({
        data: {
          id: uuidv4(),
          invoiceNo: `INV/2025/${String(invoiceCounter).padStart(5, '0')}`,
          studentId,
          feeStructureId: fsId,
          academicYearId: state.academicYearId,
          termId: state.term1Id!,
          schoolId: state.schoolId,
          status,
          totalAmount,
          discountAmount: 0,
          paidAmount,
          balanceAmount: totalAmount - paidAmount,
          dueDate: new Date('2025-04-04'),
        },
      });
      invoiceCounter++;

      // Create payment records for paid/partial invoices
      if (paidAmount > 0) {
        const numPayments = status === InvoiceStatus.PAID ? randInt(1, 3) : 1;
        let remaining = paidAmount;
        for (let p = 0; p < numPayments; p++) {
          const amt = p < numPayments - 1 ? Math.round(remaining / (numPayments - p)) : remaining;
          remaining -= amt;
          await prisma.feePayment.create({
            data: {
              id: uuidv4(),
              receiptNo: `RCT/2025/${String(paymentCounter).padStart(5, '0')}`,
              invoiceId: invoice.id,
              studentId,
              schoolId: state.schoolId,
              amount: amt,
              method: pick([PaymentMethod.CASH, PaymentMethod.MPESA, PaymentMethod.BANK_TRANSFER]),
              status: PaymentStatus.COMPLETED,
              paidAt: new Date(2025, 0, randInt(10, 30)),
            },
          });
          paymentCounter++;
        }
      }
    }
  }
  console.log(`✅ ${invoiceCounter - 1} fee invoices and ${paymentCounter - 1} payments created`);

  // Step 17: Create Term 2 assessment definitions (lighter set — just one CAT + midterm for core subjects)
  for (const cs of state.classSubjectIds) {
    const subjectCode = Object.entries(state.subjectIds).find(([_, sid]) => sid === cs.subjectId)?.[0] || '';
    const isCore = coreSubjects.includes(subjectCode);
    if (!isCore) continue;

    // Only create for core subjects in Term 2
    await prisma.assessmentDefinition.create({
      data: {
        id: uuidv4(),
        name: `${SUBJECT_DEFINITIONS.find(s => s.code === subjectCode)?.name || 'Subject'} CAT 1 (Term 2)`,
        type: AssessmentType.CAT,
        maxMarks: 100,
        classSubjectId: cs.id,
        termId: state.term2Id!,
        academicYearId: state.academicYearId,
        schoolId: state.schoolId,
      },
    }).catch(() => {});
  }
  console.log('✅ Term 2 assessment definitions created');

  console.log('\n🎉 Seeding complete!');
  console.log('───────────────────────────────────────');
  console.log(`📧 admin@nps.ac.ke / Admin123!  — School Admin`);
  console.log(`📧 superadmin@edutrak.com / Admin123!  — Super Admin`);
  console.log(`📧 student1@nps.ac.ke / Student123!  — First student`);
  console.log(`📧 teacher1@nps.ac.ke / Teacher123!  — First teacher`);
  console.log(`📧 guardian1@nps.ac.ke / Guard123!    — First guardian`);
  console.log('───────────────────────────────────────');
  console.log(`🏫 ${DEMO_SCHOOL_NAME}`);
  console.log(`📚 ${FORM_LEVELS.length} form levels × ${STREAMS.length} streams = ${FORM_LEVELS.length * STREAMS.length} classes`);
  console.log(`👨‍🏫 ${state.teacherIds.length} teachers`);
  console.log(`👨‍🎓 ${state.studentIds.length} students`);
  console.log(`📝 ${resultCount} assessment results (Term 1)`);
  console.log(`💰 ${invoiceCounter - 1} fee invoices`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });