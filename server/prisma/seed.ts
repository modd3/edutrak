import { PrismaClient, Role, SchoolType, Ownership, BoardingStatus, SchoolGender, Curriculum } from '@prisma/client';
import { hashPassword } from '../src/utils/hash';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Super Admin
  const superAdminPassword = await hashPassword('Admin123!');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@edutrak.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'superadmin@edutrak.com',
      password: superAdminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log('✅ Super Admin created:', superAdmin.email);

  // Create sample schools
  const schools = await Promise.all([
    prisma.school.upsert({
      where: { knecCode: 'SCH001' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Nairobi High School',
        registrationNo: 'REG001',
        type: SchoolType.SECONDARY,
        county: 'Nairobi',
        subCounty: 'Westlands',
        ward: 'Kitisuru',
        knecCode: 'SCH001',
        nemisCode: 'NEM001',
        phone: '+254700000001',
        email: 'info@nairobi-high.ac.ke',
        address: 'P.O. Box 12345, Nairobi',
        ownership: Ownership.PUBLIC,
        boardingStatus: BoardingStatus.BOTH,
        gender: SchoolGender.MIXED,
      },
    }),
    prisma.school.upsert({
      where: { knecCode: 'SCH002' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Mombasa Primary School',
        registrationNo: 'REG002',
        type: SchoolType.PRIMARY,
        county: 'Mombasa',
        subCounty: 'Mvita',
        ward: 'Central',
        knecCode: 'SCH002',
        nemisCode: 'NEM002',
        phone: '+254700000002',
        email: 'info@mombasa-primary.ac.ke',
        address: 'P.O. Box 67890, Mombasa',
        ownership: Ownership.PUBLIC,
        boardingStatus: BoardingStatus.DAY,
        gender: SchoolGender.MIXED,
      },
    }),
  ]);

  console.log('✅ Sample schools created');

  // Create academic year
  const academicYear = await prisma.academicYear.upsert({
    where: { year: 2024 },
    update: {},
    create: {
      id: uuidv4(),
      year: 2024,
      startDate: new Date('2024-01-08'),
      endDate: new Date('2024-11-22'),
      isActive: true,
    },
  });

  console.log('✅ Academic year created:', academicYear.year);

  // Create terms for the academic year
  const terms = await Promise.all([
    prisma.term.create({
      data: {
        id: uuidv4(),
        name: 'TERM_1',
        termNumber: 1,
        startDate: new Date('2024-01-08'),
        endDate: new Date('2024-04-05'),
        academicYearId: academicYear.id,
      },
    }),
    prisma.term.create({
      data: {
        id: uuidv4(),
        name: 'TERM_2',
        termNumber: 2,
        startDate: new Date('2024-05-06'),
        endDate: new Date('2024-08-02'),
        academicYearId: academicYear.id,
      },
    }),
    prisma.term.create({
      data: {
        id: uuidv4(),
        name: 'TERM_3',
        termNumber: 3,
        startDate: new Date('2024-08-26'),
        endDate: new Date('2024-11-22'),
        academicYearId: academicYear.id,
      },
    }),
  ]);

  console.log('✅ Terms created');

  // Create sample subjects
  const subjects = await Promise.all([
    prisma.subject.upsert({
      where: { code: 'MATH' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Mathematics',
        code: 'MATH',
        category: 'CORE',
        isCore: true,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        learningArea: 'MATHEMATICS',
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
        category: 'CORE',
        isCore: true,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        learningArea: 'LANGUAGES',
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
        category: 'CORE',
        isCore: true,
        curriculum: [Curriculum.CBC, Curriculum.EIGHT_FOUR_FOUR],
        learningArea: 'LANGUAGES',
        description: 'Kiswahili language and literature',
      },
    }),
  ]);

  console.log('✅ Sample subjects created');

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