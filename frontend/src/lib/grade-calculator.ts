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