// Kenyan realistic data for demo seeding
export const KENYAN_FIRST_NAMES_MALE = [
  'James', 'John', 'Peter', 'David', 'Joseph', 'Daniel', 'Samuel', 'Michael',
  'Patrick', 'Stephen', 'George', 'Paul', 'Philip', 'Charles', 'Robert',
  'Brian', 'Kevin', 'Kennedy', 'Collins', 'Felix', 'Victor', 'Alex',
  'Nicholas', 'Vincent', 'Timothy', 'Simon', 'Duncan', 'Eric', 'Moses',
  'Francis', 'Andrew', 'Benjamin', 'Isaac', 'Julius', 'Erick', 'Dennis',
  'Evans', 'Thomas', 'Geoffrey', 'Anthony',
];

export const KENYAN_FIRST_NAMES_FEMALE = [
  'Mary', 'Jane', 'Grace', 'Faith', 'Esther', 'Margaret', 'Sarah', 'Ruth',
  'Rebecca', 'Dorothy', 'Elizabeth', 'Nancy', 'Alice', 'Lucy', 'Joyce',
  'Catherine', 'Janet', 'Susan', 'Rose', 'Ann', 'Mercy', 'Diana', 'Lydia',
  'Priscilla', 'Naomi', 'Agnes', 'Edith', 'Florence', 'Monica', 'Caroline',
  'Martha', 'Rachel', 'Lilian', 'Irene', 'Veronica', 'Hellen', 'Damaris',
  'Sophia', 'Deborah', 'Emily',
];

export const KENYAN_LAST_NAMES = [
  'Kamau', 'Mwangi', 'Njoroge', 'Wanjiku', 'Omondi', 'Otieno', 'Kiprop',
  'Kipkorir', 'Mutua', 'Kioko', 'Wambui', 'Muthoni', 'Chebet', 'Kosgei',
  'Ndeto', 'Musyoka', 'Mboya', 'Odhiambo', 'Ochieng', 'Baraza', 'Wekesa',
  'Wanjala', 'Simiyu', 'Ndombi', 'Lutomia', 'Mukhwana', 'Mango', 'Openda',
  'Anyango', 'Adhiambo', 'Omari', 'Mohammed', 'Hassan', 'Ali', 'Abdullahi',
  'Barre', 'Guleid', 'Issack', 'Osman', 'Sheikh',
];

export const GUARDIAN_OCCUPATIONS = [
  'Teacher', 'Businessman', 'Farmer', 'Civil Servant', 'Doctor', 'Lawyer',
  'Engineer', 'Accountant', 'Nurse', 'Police Officer', 'Banker', 'Journalist',
  'Driver', 'Mechanic', 'Clerk', 'Manager', 'Lecturer', 'Chef',
];

export const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Nyeri', 'Thika',
  'Machakos', 'Meru', 'Embu', 'Kitale', 'Kakamega', 'Malindi', 'Garissa',
];

export const TEACHER_SPECIALIZATIONS: Record<string, string[]> = {
  'Mathematics': ['BSc Mathematics', 'BEd Mathematics', 'MSc Applied Mathematics'],
  'English': ['BA English & Literature', 'BEd English', 'MA Linguistics'],
  'Kiswahili': ['BA Kiswahili', 'BEd Kiswahili', 'MA Kiswahili Studies'],
  'Biology': ['BSc Biology', 'BEd Science', 'MSc Biochemistry'],
  'Chemistry': ['BSc Chemistry', 'BEd Chemistry', 'MSc Analytical Chemistry'],
  'Physics': ['BSc Physics', 'BEd Physics', 'MSc Nuclear Physics'],
  'Geography': ['BA Geography', 'BEd Geography', 'MA Environmental Studies'],
  'History': ['BA History', 'BEd History', 'MA History'],
  'CRE': ['BA Theology', 'BEd Religious Studies', 'MA Divinity'],
  'Business Studies': ['BCom Accounting', 'BEd Business', 'MBA Finance'],
  'Agriculture': ['BSc Agriculture', 'BEd Agriculture', 'MSc Agronomy'],
  'Computer Studies': ['BSc Computer Science', 'BEd ICT', 'MSc IT'],
};

export const SUBJECT_DEFINITIONS = [
  { name: 'Mathematics', code: 'MATH', category: 'CORE', curriculum: ['CBC', 'EIGHT_FOUR_FOUR'] },
  { name: 'English', code: 'ENG', category: 'CORE', curriculum: ['CBC', 'EIGHT_FOUR_FOUR'] },
  { name: 'Kiswahili', code: 'KIS', category: 'CORE', curriculum: ['CBC', 'EIGHT_FOUR_FOUR'] },
  { name: 'Biology', code: 'BIO', category: 'CORE', curriculum: ['CBC', 'EIGHT_FOUR_FOUR'] },
  { name: 'Chemistry', code: 'CHEM', category: 'CORE', curriculum: ['CBC', 'EIGHT_FOUR_FOUR'] },
  { name: 'Physics', code: 'PHY', category: 'CORE', curriculum: ['CBC', 'EIGHT_FOUR_FOUR'] },
  { name: 'Geography', code: 'GEO', category: 'ELECTIVE', curriculum: ['EIGHT_FOUR_FOUR'] },
  { name: 'History & Government', code: 'HIST', category: 'ELECTIVE', curriculum: ['EIGHT_FOUR_FOUR'] },
  { name: 'Christian Religious Education', code: 'CRE', category: 'CORE', curriculum: ['EIGHT_FOUR_FOUR'] },
  { name: 'Business Studies', code: 'BUS', category: 'ELECTIVE', curriculum: ['EIGHT_FOUR_FOUR'] },
  { name: 'Agriculture', code: 'AGRI', category: 'ELECTIVE', curriculum: ['EIGHT_FOUR_FOUR'] },
  { name: 'Computer Studies', code: 'COMP', category: 'ELECTIVE', curriculum: ['EIGHT_FOUR_FOUR'] },
];

export const FORM_LEVELS = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];
export const STREAMS = ['East', 'West', 'Central'];
export const DEMO_SCHOOL_NAME = 'Nairobi Premier Secondary School';

export const ASSESSMENT_TYPES = ['CAT_1', 'CAT_2', 'END_TERM_EXAM'];

// Helper: pick random from array
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper: pick multiple without duplicates
export function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// Helper: random integer between min and max (inclusive)
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: generate plausible Kenyan admission number
export function admissionNo(prefix: string, index: number): string {
  return `${prefix}/${String(index).padStart(3, '0')}`;
}

// Helper: generate a random TSC number
export function tscNumber(index: number): string {
  return `TSC${String(2020000 + index).padStart(7, '0')}`;
}

// Helper: generate employee number
export function employeeNumber(index: number): string {
  return `EMP${String(5000 + index).padStart(4, '0')}`;
}

// Helper: generate realistic marks with a bell-curve-ish distribution
export function generateMarks(): number {
  // Weighted distribution: most students score between 30 and 85
  const base = randInt(20, 95);
  // Bump toward center
  if (base > 85) return randInt(70, 95);
  if (base < 25) return randInt(15, 45);
  return base;
}

// Helper: convert numeric mark to grade
export function markToGrade(marks: number): string {
  if (marks >= 80) return 'A';
  if (marks >= 75) return 'A-';
  if (marks >= 70) return 'B+';
  if (marks >= 65) return 'B';
  if (marks >= 60) return 'B-';
  if (marks >= 55) return 'C+';
  if (marks >= 50) return 'C';
  if (marks >= 45) return 'C-';
  if (marks >= 40) return 'D+';
  if (marks >= 35) return 'D';
  if (marks >= 30) return 'D-';
  return 'E';
}