// lib/cbc-constants.ts — CBC (Competency-Based Curriculum) display constants
// Kenya's CBC uses Learning Areas, Core Competencies, and 4-band competency levels

import { LearningArea, CoreCompetency, AssessmentType, CompetencyLevel } from '@/types';

// ─── Learning Areas (8 areas in CBC) ─────────────────────────────────────────
export const LEARNING_AREA_LABELS: Record<string, string> = {
  [LearningArea.LANGUAGES]: 'Languages',
  [LearningArea.MATHEMATICS]: 'Mathematics',
  [LearningArea.SCIENCE_TECHNOLOGY]: 'Science & Technology',
  [LearningArea.SOCIAL_STUDIES]: 'Social Studies',
  [LearningArea.RELIGIOUS_EDUCATION]: 'Religious Education',
  [LearningArea.CREATIVE_ARTS]: 'Creative Arts',
  [LearningArea.PHYSICAL_HEALTH_EDUCATION]: 'Physical & Health Education',
  [LearningArea.PRE_TECHNICAL_STUDIES]: 'Pre-Technical Studies',
};

export const LEARNING_AREA_COLORS: Record<string, string> = {
  [LearningArea.LANGUAGES]: 'bg-blue-100 text-blue-800 border-blue-200',
  [LearningArea.MATHEMATICS]: 'bg-purple-100 text-purple-800 border-purple-200',
  [LearningArea.SCIENCE_TECHNOLOGY]: 'bg-green-100 text-green-800 border-green-200',
  [LearningArea.SOCIAL_STUDIES]: 'bg-amber-100 text-amber-800 border-amber-200',
  [LearningArea.RELIGIOUS_EDUCATION]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [LearningArea.CREATIVE_ARTS]: 'bg-pink-100 text-pink-800 border-pink-200',
  [LearningArea.PHYSICAL_HEALTH_EDUCATION]: 'bg-red-100 text-red-800 border-red-200',
  [LearningArea.PRE_TECHNICAL_STUDIES]: 'bg-teal-100 text-teal-800 border-teal-200',
};

// ─── Core Competencies (7 competencies in CBC) ───────────────────────────────
export const CORE_COMPETENCY_LABELS: Record<string, string> = {
  [CoreCompetency.COMMUNICATION_COLLABORATION]: 'Communication & Collaboration',
  [CoreCompetency.SELF_EFFICACY]: 'Self-Efficacy',
  [CoreCompetency.CRITICAL_THINKING]: 'Critical Thinking & Problem Solving',
  [CoreCompetency.CREATIVITY_IMAGINATION]: 'Creativity & Imagination',
  [CoreCompetency.CITIZENSHIP]: 'Citizenship',
  [CoreCompetency.DIGITAL_LITERACY]: 'Digital Literacy',
  [CoreCompetency.LEARNING_TO_LEARN]: 'Learning to Learn',
};

// ─── 4-Band Competency Level Labels ──────────────────────────────────────────
export const COMPETENCY_LEVEL_LABELS: Record<string, string> = {
  [CompetencyLevel.EXCEEDING_EXPECTATIONS]: 'Exceeding Expectations',
  [CompetencyLevel.MEETING_EXPECTATIONS]: 'Meeting Expectations',
  [CompetencyLevel.APPROACHING_EXPECTATIONS]: 'Approaching Expectations',
  [CompetencyLevel.BELOW_EXPECTATIONS]: 'Below Expectations',
};

export const COMPETENCY_LEVEL_SHORT: Record<string, string> = {
  [CompetencyLevel.EXCEEDING_EXPECTATIONS]: 'EE',
  [CompetencyLevel.MEETING_EXPECTATIONS]: 'ME',
  [CompetencyLevel.APPROACHING_EXPECTATIONS]: 'AE',
  [CompetencyLevel.BELOW_EXPECTATIONS]: 'BE',
};

export const COMPETENCY_LEVEL_COLORS: Record<string, string> = {
  [CompetencyLevel.EXCEEDING_EXPECTATIONS]: 'bg-green-500 text-white',
  [CompetencyLevel.MEETING_EXPECTATIONS]: 'bg-blue-500 text-white',
  [CompetencyLevel.APPROACHING_EXPECTATIONS]: 'bg-amber-400 text-white',
  [CompetencyLevel.BELOW_EXPECTATIONS]: 'bg-red-500 text-white',
};

export const COMPETENCY_LEVEL_DESCRIPTIONS: Record<string, string> = {
  [CompetencyLevel.EXCEEDING_EXPECTATIONS]: 'The learner consistently demonstrates exceptional understanding and can apply knowledge creatively beyond this level.',
  [CompetencyLevel.MEETING_EXPECTATIONS]: 'The learner demonstrates expected understanding of competencies at this level.',
  [CompetencyLevel.APPROACHING_EXPECTATIONS]: 'The learner is progressing towards meeting the expected competencies. Additional support may be needed.',
  [CompetencyLevel.BELOW_EXPECTATIONS]: 'The learner needs significant support to meet the expected competencies at this level.',
};

// ─── Assessment Type Labels ──────────────────────────────────────────────────
export const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  [AssessmentType.CAT]: 'Continuous Assessment Test (CAT)',
  [AssessmentType.MIDTERM]: 'Mid-Term Assessment',
  [AssessmentType.END_OF_TERM]: 'End of Term Assessment',
  [AssessmentType.MOCK]: 'Mock Assessment',
  [AssessmentType.NATIONAL_EXAM]: 'National Examination',
  [AssessmentType.COMPETENCY_BASED]: 'Competency-Based Assessment',
  [AssessmentType.FORMATIVE]: 'Formative Assessment (Ongoing)',
  [AssessmentType.SUMMATIVE]: 'Summative Assessment (Term-end)',
  [AssessmentType.SBA]: 'School-Based Assessment',
  [AssessmentType.DIAGNOSTIC]: 'Diagnostic Assessment',
  [AssessmentType.KPSEA]: 'Kenya Primary School Education Assessment',
  [AssessmentType.KJSEA]: 'Kenya Junior Secondary Education Assessment',
  [AssessmentType.GRADE_9_PLACEMENT]: 'Grade 9 Pathway Placement',
};

export const ASSESSMENT_TYPE_COLORS: Record<string, string> = {
  [AssessmentType.CAT]: 'bg-blue-100 text-blue-800',
  [AssessmentType.MIDTERM]: 'bg-purple-100 text-purple-800',
  [AssessmentType.END_OF_TERM]: 'bg-green-100 text-green-800',
  [AssessmentType.MOCK]: 'bg-yellow-100 text-yellow-800',
  [AssessmentType.NATIONAL_EXAM]: 'bg-red-100 text-red-800',
  [AssessmentType.COMPETENCY_BASED]: 'bg-indigo-100 text-indigo-800',
  [AssessmentType.FORMATIVE]: 'bg-teal-100 text-teal-800',
  [AssessmentType.SUMMATIVE]: 'bg-orange-100 text-orange-800',
  [AssessmentType.SBA]: 'bg-cyan-100 text-cyan-800',
  [AssessmentType.DIAGNOSTIC]: 'bg-gray-100 text-gray-800',
  [AssessmentType.KPSEA]: 'bg-rose-100 text-rose-800',
  [AssessmentType.KJSEA]: 'bg-fuchsia-100 text-fuchsia-800',
  [AssessmentType.GRADE_9_PLACEMENT]: 'bg-violet-100 text-violet-800',
};

// ─── Assessment Status ──────────────────────────────────────────────────────
export const ASSESSMENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  GRADING_IN_PROGRESS: 'Grading in Progress',
  RESULTS_PUBLISHED: 'Results Published',
  CLOSED: 'Closed',
};

export const ASSESSMENT_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PUBLISHED: 'bg-blue-100 text-blue-800',
  GRADING_IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESULTS_PUBLISHED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-red-100 text-red-800',
};

// ─── Subject → Learning Area Mapping ─────────────────────────────────────────
export const SUBJECT_TO_LEARNING_AREA: Record<string, string> = {
  'English': LearningArea.LANGUAGES,
  'Kiswahili': LearningArea.LANGUAGES,
  'Literature': LearningArea.LANGUAGES,
  'Indigenous Languages': LearningArea.LANGUAGES,
  'Mathematics': LearningArea.MATHEMATICS,
  'Integrated Science': LearningArea.SCIENCE_TECHNOLOGY,
  'Biology': LearningArea.SCIENCE_TECHNOLOGY,
  'Chemistry': LearningArea.SCIENCE_TECHNOLOGY,
  'Physics': LearningArea.SCIENCE_TECHNOLOGY,
  'Computer Science': LearningArea.SCIENCE_TECHNOLOGY,
  'Agriculture': LearningArea.SCIENCE_TECHNOLOGY,
  'Social Studies': LearningArea.SOCIAL_STUDIES,
  'Geography': LearningArea.SOCIAL_STUDIES,
  'History & Government': LearningArea.SOCIAL_STUDIES,
  'Civic Education': LearningArea.SOCIAL_STUDIES,
  'CRE': LearningArea.RELIGIOUS_EDUCATION,
  'IRE': LearningArea.RELIGIOUS_EDUCATION,
  'Hindu Religious Education': LearningArea.RELIGIOUS_EDUCATION,
  'Music': LearningArea.CREATIVE_ARTS,
  'Art & Design': LearningArea.CREATIVE_ARTS,
  'Home Science': LearningArea.CREATIVE_ARTS,
  'Physical Education': LearningArea.PHYSICAL_HEALTH_EDUCATION,
  'Pre-Technical Studies': LearningArea.PRE_TECHNICAL_STUDIES,
  'Woodwork': LearningArea.PRE_TECHNICAL_STUDIES,
  'Metalwork': LearningArea.PRE_TECHNICAL_STUDIES,
  'Electricity': LearningArea.PRE_TECHNICAL_STUDIES,
};

/**
 * Get the Learning Area for a given subject name
 */
export function getLearningAreaForSubject(subjectName: string): string | undefined {
  return SUBJECT_TO_LEARNING_AREA[subjectName];
}

// ─── CBC Grade Level Hierarchy (Kenya) ───────────────────────────────────────
export const CBC_EDUCATION_LEVELS = {
  'Pre-Primary': ['PP1', 'PP2'],
  'Lower Primary': ['Grade 1', 'Grade 2', 'Grade 3'],
  'Upper Primary': ['Grade 4', 'Grade 5', 'Grade 6'],
  'Junior Secondary': ['Grade 7', 'Grade 8', 'Grade 9'],
  'Senior Secondary': ['Grade 10', 'Grade 11', 'Grade 12'],
} as const;