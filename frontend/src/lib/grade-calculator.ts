// lib/grade-calculator.ts — Grade calculation utilities
// Supports both CBC (Competency-Based Curriculum) and traditional 8-4-4 grading

import { CompetencyLevel } from '@/types';

// ─── CBC Grade Scale (4 KNEC-standard bands) ─────────────────────────────────
// Based on official KNEC CBC scoring guidelines
export interface CBCGradeScale {
  minScore: number;
  maxScore: number;
  grade: string;
  competency: CompetencyLevel;
  label: string;
  shortLabel: string;
  color: string;
  description: string;
}

export const CBC_GRADE_SCALE: CBCGradeScale[] = [
  {
    minScore: 80, maxScore: 100,
    grade: 'A',
    competency: CompetencyLevel.EXCEEDING_EXPECTATIONS,
    label: 'Exceeding Expectations',
    shortLabel: 'EE',
    color: 'bg-green-500 text-white',
    description: 'The learner consistently demonstrates exceptional understanding and can apply knowledge creatively beyond this level.',
  },
  {
    minScore: 60, maxScore: 79,
    grade: 'B',
    competency: CompetencyLevel.MEETING_EXPECTATIONS,
    label: 'Meeting Expectations',
    shortLabel: 'ME',
    color: 'bg-blue-500 text-white',
    description: 'The learner demonstrates expected understanding of competencies at this level.',
  },
  {
    minScore: 40, maxScore: 59,
    grade: 'C',
    competency: CompetencyLevel.APPROACHING_EXPECTATIONS,
    label: 'Approaching Expectations',
    shortLabel: 'AE',
    color: 'bg-amber-400 text-white',
    description: 'The learner is progressing towards meeting the expected competencies. Additional support may be needed.',
  },
  {
    minScore: 0, maxScore: 39,
    grade: 'D',
    competency: CompetencyLevel.BELOW_EXPECTATIONS,
    label: 'Below Expectations',
    shortLabel: 'BE',
    color: 'bg-red-500 text-white',
    description: 'The learner needs significant support to meet the expected competencies at this level.',
  },
];

/**
 * Calculate CBC grade and competency level from numeric score.
 * The teacher enters the numeric score, grade + competency are auto-calculated.
 */
export function calculateCBCGrade(score: number, maxMarks: number): CBCGradeScale {
  if (maxMarks <= 0) {
    return CBC_GRADE_SCALE[CBC_GRADE_SCALE.length - 1];
  }
  const percentage = (score / maxMarks) * 100;
  const result = CBC_GRADE_SCALE.find(
    (r) => percentage >= r.minScore && percentage <= r.maxScore
  );
  return result || CBC_GRADE_SCALE[CBC_GRADE_SCALE.length - 1];
}

/**
 * Maps frontend 4-band competency to schema's _1 variant for storage
 * Schema expects: EXCEEDING_EXPECTATIONS_1, MEETING_EXPECTATIONS_1, etc.
 */
export function competencyForStorage(level: CompetencyLevel): string {
  const map: Record<string, string> = {
    [CompetencyLevel.EXCEEDING_EXPECTATIONS]: 'EXCEEDING_EXPECTATIONS_1',
    [CompetencyLevel.MEETING_EXPECTATIONS]: 'MEETING_EXPECTATIONS_1',
    [CompetencyLevel.APPROACHING_EXPECTATIONS]: 'APPROACHING_EXPECTATIONS_1',
    [CompetencyLevel.BELOW_EXPECTATIONS]: 'BELOW_EXPECTATIONS_1',
  };
  return map[level] || level;
}

/**
 * Quick helper: get just the CompetencyLevel for a score
 */
export function getCompetencyLevel(score: number, maxMarks: number): CompetencyLevel {
  return calculateCBCGrade(score, maxMarks).competency;
}

/**
 * Quick helper: get just the letter grade for a score
 */
export function getLetterGrade(score: number, maxMarks: number): string {
  return calculateCBCGrade(score, maxMarks).grade;
}

// ─── Traditional 8-4-4 Grade Scale (kept for legacy) ─────────────────────────
export interface GradeScale {
  grade: string;
  minScore: number;
  maxScore: number;
  points: number;
  remarks: string;
}

export const GRADE_SCALES: GradeScale[] = [
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
];

export function calculateGrade(score: number, maxScore: number): GradeScale {
  const percentage = (score / maxScore) * 100;
  return (
    GRADE_SCALES.find(
      (scale) => percentage >= scale.minScore && percentage <= scale.maxScore
    ) || GRADE_SCALES[GRADE_SCALES.length - 1]
  );
}

export function getGradeAndRemarks(score: number): { grade: string; remarks: string } {
  const scale = GRADE_SCALES.find((s) => score >= s.minScore && score <= s.maxScore);
  if (scale) {
    return { grade: scale.grade, remarks: scale.remarks };
  }
  return { grade: 'E', remarks: 'Failed' };
}

export function getKCSEGrade(meanPoints: number): string {
    if (meanPoints > 11.5) return 'A';
    if (meanPoints > 10.5) return 'A-';
    if (meanPoints > 9.5) return 'B+';
    if (meanPoints > 8.5) return 'B';
    if (meanPoints > 7.5) return 'B-';
    if (meanPoints > 6.5) return 'C+';
    if (meanPoints > 5.5) return 'C';
    if (meanPoints > 4.5) return 'C-';
    if (meanPoints > 3.5) return 'D+';
    if (meanPoints > 2.5) return 'D';
    if (meanPoints > 1.5) return 'D-';
    return 'E';
}