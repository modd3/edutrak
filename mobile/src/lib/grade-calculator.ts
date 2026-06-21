// ─── CBC (Competency Based Curriculum) — Primary Grading System ─────────────
// Based on official KNEC CBC scoring guidelines for Kenya's Competency Based Curriculum
// 4 broad bands: Exceeding Expectations, Meeting Expectations, Approaching Expectations, Below Expectations

export enum CompetencyLevel {
  EXCEEDING_EXPECTATIONS = 'EXCEEDING_EXPECTATIONS',
  MEETING_EXPECTATIONS = 'MEETING_EXPECTATIONS',
  APPROACHING_EXPECTATIONS = 'APPROACHING_EXPECTATIONS',
  BELOW_EXPECTATIONS = 'BELOW_EXPECTATIONS',
}

export interface CBCGradeScale {
  minScore: number
  maxScore: number
  grade: string
  competency: CompetencyLevel
  label: string
  shortLabel: string
  color: string
  description: string
}

export const CBC_GRADE_SCALE: CBCGradeScale[] = [
  {
    minScore: 80,
    maxScore: 100,
    grade: 'A',
    competency: CompetencyLevel.EXCEEDING_EXPECTATIONS,
    label: 'Exceeding Expectations',
    shortLabel: 'EE',
    color: '#22c55e',
    description:
      'The learner consistently demonstrates exceptional understanding and can apply knowledge creatively beyond this level.',
  },
  {
    minScore: 60,
    maxScore: 79,
    grade: 'B',
    competency: CompetencyLevel.MEETING_EXPECTATIONS,
    label: 'Meeting Expectations',
    shortLabel: 'ME',
    color: '#3b82f6',
    description:
      'The learner demonstrates expected understanding of competencies at this level.',
  },
  {
    minScore: 40,
    maxScore: 59,
    grade: 'C',
    competency: CompetencyLevel.APPROACHING_EXPECTATIONS,
    label: 'Approaching Expectations',
    shortLabel: 'AE',
    color: '#eab308',
    description:
      'The learner is progressing towards meeting the expected competencies. Additional support may be needed.',
  },
  {
    minScore: 0,
    maxScore: 39,
    grade: 'D',
    competency: CompetencyLevel.BELOW_EXPECTATIONS,
    label: 'Below Expectations',
    shortLabel: 'BE',
    color: '#ef4444',
    description:
      'The learner needs significant support to meet the expected competencies at this level.',
  },
]

/**
 * Calculate CBC grade and competency level from numeric score.
 * This is the PRIMARY grading method for the Kenyan Competency Based Curriculum.
 */
export function calculateCBCGrade(
  score: number,
  maxMarks: number
): CBCGradeScale {
  if (maxMarks <= 0) {
    return CBC_GRADE_SCALE[CBC_GRADE_SCALE.length - 1]
  }
  const percentage = (score / maxMarks) * 100
  const result = CBC_GRADE_SCALE.find(
    (r) => percentage >= r.minScore && percentage <= r.maxScore
  )
  return result || CBC_GRADE_SCALE[CBC_GRADE_SCALE.length - 1]
}

/**
 * Get just the CompetencyLevel for a score (CBC primary)
 */
export function getCompetencyLevel(
  score: number,
  maxMarks: number
): CompetencyLevel {
  return calculateCBCGrade(score, maxMarks).competency
}

/**
 * Get just the letter grade for a score (CBC primary)
 */
export function getLetterGrade(score: number, maxMarks: number): string {
  return calculateCBCGrade(score, maxMarks).grade
}

// ─── Traditional 8-4-4 Grade Scale (Backward Compatibility) ─────────────────
// Kept for institutions still using the 8-4-4 system and for KCSE results

export interface LegacyGradeScale {
  grade: string
  minScore: number
  maxScore: number
  points: number
  remarks: string
}

export const LEGACY_GRADE_SCALES: LegacyGradeScale[] = [
  { grade: 'A', minScore: 80, maxScore: 100, points: 12, remarks: 'Excellent' },
  { grade: 'A-', minScore: 75, maxScore: 79, points: 11, remarks: 'Very Good' },
  { grade: 'B+', minScore: 70, maxScore: 74, points: 10, remarks: 'Good' },
  { grade: 'B', minScore: 65, maxScore: 69, points: 9, remarks: 'Above Average' },
  { grade: 'B-', minScore: 60, maxScore: 64, points: 8, remarks: 'Average' },
  { grade: 'C+', minScore: 55, maxScore: 59, points: 7, remarks: 'Fair' },
  { grade: 'C', minScore: 50, maxScore: 54, points: 6, remarks: 'Fair Average' },
  { grade: 'C-', minScore: 45, maxScore: 49, points: 5, remarks: 'Below Average' },
  { grade: 'D+', minScore: 40, maxScore: 44, points: 4, remarks: 'Weak' },
  { grade: 'D', minScore: 35, maxScore: 39, points: 3, remarks: 'Poor' },
  { grade: 'D-', minScore: 30, maxScore: 34, points: 2, remarks: 'Very Poor' },
  { grade: 'E', minScore: 0, maxScore: 29, points: 1, remarks: 'Failed' },
]

/**
 * Calculate grade using the traditional 8-4-4 scale.
 * Used for KCSE results and schools that haven't fully transitioned to CBC.
 */
export function calculateLegacyGrade(
  score: number,
  maxScore: number
): LegacyGradeScale {
  const percentage = (score / maxScore) * 100
  return (
    LEGACY_GRADE_SCALES.find(
      (scale) => percentage >= scale.minScore && percentage <= scale.maxScore
    ) || LEGACY_GRADE_SCALES[LEGACY_GRADE_SCALES.length - 1]
  )
}

/**
 * Calculate GPA from an array of scores.
 * Uses CBC competency levels for the GPA calculation (works with both systems).
 */
export function calculateGPA(
  scores: Array<{ score: number; maxScore: number }>
): number {
  if (scores.length === 0) return 0

  const totalPercentage = scores.reduce((sum, s) => {
    return sum + (s.score / s.maxScore) * 100
  }, 0)

  return totalPercentage / scores.length
}

/**
 * Helper: get color for a CBC grade
 */
export function getGradeColor(grade: string): string {
  const scale = CBC_GRADE_SCALE.find((s) => s.grade === grade)
  return scale?.color || '#6b7280'
}