// src/validation/assessment.validation.ts

import { z } from 'zod';
import { AssessmentType, CompetencyLevel } from '@prisma/client';

/**
 * Assessment Definition Schemas
 */
export const createAssessmentDefinitionSchema = z.object({
  name: z.string().min(1, 'Assessment name is required').max(100),
  type: z.enum(AssessmentType),
  maxMarks: z.number().positive('Max marks must be positive').optional(),
  termId: z.uuid('Invalid term ID'),
  classSubjectId: z.uuid('Invalid class subject ID'),
  strandId: z.uuid('Invalid strand ID').optional(),
  academicYearId: z.uuid('Invalid academic year ID').optional(),
});

export const updateAssessmentDefinitionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(AssessmentType).optional(),
  maxMarks: z.number().positive().optional(),
  termId: z.uuid().optional(),
  classSubjectId: z.uuid().optional(),
  strandId: z.uuid().optional(),
  academicYearId: z.uuid().optional(),
});

export const bulkCreateAssessmentsSchema = z.object({
  assessments: z.array(createAssessmentDefinitionSchema).min(1),
});

/**
 * Assessment Result Schemas
 */
export const createAssessmentResultSchema = z.object({
  studentId: z.uuid('Invalid student ID'),
  assessmentDefId: z.uuid('Invalid assessment definition ID'),
  numericValue: z.number().min(0, 'Score cannot be negative').optional(),
  grade: z.string().max(5).optional(),
  competencyLevel: z.enum(CompetencyLevel).optional(),
  comment: z.string().max(500).optional(),
}).refine(
  (data) => data.numericValue !== undefined || data.grade !== undefined || data.competencyLevel !== undefined,
  { message: 'At least one of numericValue, grade, or competencyLevel must be provided' }
);

export const updateAssessmentResultSchema = z.object({
  numericValue: z.number().min(0).optional(),
  grade: z.string().max(5).optional(),
  competencyLevel: z.enum(CompetencyLevel).optional(),
  comment: z.string().max(500).optional(),
});

export const bulkCreateResultsSchema = z.object({
  results: z.array(createAssessmentResultSchema).min(1),
});

/**
 * Grade Entry Schemas
 */
export const gradeEntrySchema = z.object({
  assessmentDefId: z.uuid('Invalid assessment ID'),
  entries: z.array(
    z.object({
      studentId: z.uuid('Invalid student ID'),
      marks: z.number().min(0, 'Marks cannot be negative'),
      comment: z.string().max(500).optional(),
    })
  ).min(1, 'At least one entry is required'),
});

/**
 * Query Schemas
 */
export const getAssessmentsQuerySchema = z.object({
  termId: z.uuid().optional(),
  classSubjectId: z.uuid().optional(),
  type: z.enum(AssessmentType).optional(),
  academicYearId: z.uuid().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const getResultsQuerySchema = z.object({
  studentId: z.uuid().optional(),
  assessmentDefId: z.uuid().optional(),
  classId: z.uuid().optional(),
  termId: z.uuid().optional(),
  academicYearId: z.uuid().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

/**
 * CSV Upload Schema
 */
export const csvGradeEntryRowSchema = z.object({
  studentAdmissionNo: z.string().min(1, 'Admission number is required'),
  marks: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid marks format').transform(Number),
  comment: z.string().max(500).optional(),
});

/**
 * Grade Boundaries Schema (for 8-4-4 conversion)
 */
export const gradeBoundariesSchema = z.object({
  boundaries: z.array(
    z.object({
      grade: z.string().length(1, 'Grade must be a single letter'),
      minMarks: z.number().min(0).max(100),
      maxMarks: z.number().min(0).max(100),
      points: z.number().min(1).max(12).optional(),
    })
  ).refine(
    (boundaries) => {
      // Ensure no overlapping ranges
      for (let i = 0; i < boundaries.length - 1; i++) {
        if (boundaries[i].minMarks < boundaries[i + 1].maxMarks) {
          return false;
        }
      }
      return true;
    },
    { message: 'Grade boundaries must not overlap' }
  ),
});

/**
 * Type exports
 */
export type CreateAssessmentDefinitionInput = z.infer<typeof createAssessmentDefinitionSchema>;
export type UpdateAssessmentDefinitionInput = z.infer<typeof updateAssessmentDefinitionSchema>;
export type CreateAssessmentResultInput = z.infer<typeof createAssessmentResultSchema>;
export type UpdateAssessmentResultInput = z.infer<typeof updateAssessmentResultSchema>;
export type GradeEntryInput = z.infer<typeof gradeEntrySchema>;
export type BulkCreateResultsInput = z.infer<typeof bulkCreateResultsSchema>;
export type GetAssessmentsQuery = z.infer<typeof getAssessmentsQuerySchema>;
export type GetResultsQuery = z.infer<typeof getResultsQuerySchema>;
export type CSVGradeEntryRow = z.infer<typeof csvGradeEntryRowSchema>;
export type GradeBoundaries = z.infer<typeof gradeBoundariesSchema>;