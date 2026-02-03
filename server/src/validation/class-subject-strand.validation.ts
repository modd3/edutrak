// src/validation/class-subject-strand.validation.ts

import { z } from 'zod';

/**
 * Assign Strand to Class Subject Schema
 */
export const assignStrandToClassSubjectSchema = z.object({
  classSubjectId: z.string().uuid('Invalid class subject ID'),
  strandId: z.string().uuid('Invalid strand ID'),
  schoolId: z.string().uuid('Invalid school ID'),
});

/**
 * Bulk Assign Strands Schema
 */
export const bulkAssignStrandsSchema = z.object({
  classSubjectId: z.string().uuid('Invalid class subject ID'),
  strandIds: z.array(z.string().uuid('Invalid strand ID')).min(1, 'At least one strand is required'),
  schoolId: z.string().uuid('Invalid school ID'),
});

/**
 * Remove Strand from Class Subject Schema
 */
export const removeStrandFromClassSubjectSchema = z.object({
  classSubjectId: z.string().uuid('Invalid class subject ID'),
  strandId: z.string().uuid('Invalid strand ID'),
  schoolId: z.string().uuid('Invalid school ID'),
});

/**
 * Get Strands Query Schema
 */
export const getStrandsQuerySchema = z.object({
  classSubjectId: z.string().uuid('Invalid class subject ID').optional(),
  strandId: z.string().uuid('Invalid strand ID').optional(),
  schoolId: z.string().uuid('Invalid school ID').optional(),
  includeAssessments: z.string().transform((v) => v === 'true').optional(),
});

/**
 * Type exports
 */
export type AssignStrandToClassSubjectInput = z.infer<typeof assignStrandToClassSubjectSchema>;
export type BulkAssignStrandsInput = z.infer<typeof bulkAssignStrandsSchema>;
export type RemoveStrandFromClassSubjectInput = z.infer<typeof removeStrandFromClassSubjectSchema>;
export type GetStrandsQuery = z.infer<typeof getStrandsQuerySchema>;
