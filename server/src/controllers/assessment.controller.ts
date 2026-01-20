// src/controllers/assessment.controller.ts

import { Request, Response } from 'express';
import { AssessmentService } from '../services/assessment.service';
import { GradeEntryService } from '../services/grade-entry.service';
import { ReportGenerationService } from '../services/report-generation.service';
import prisma from '../database/client';
import {
  createAssessmentDefinitionSchema,
  updateAssessmentDefinitionSchema,
  bulkCreateAssessmentsSchema,
  createAssessmentResultSchema,
  updateAssessmentResultSchema,
  gradeEntrySchema,
  getAssessmentsQuerySchema,
  getResultsQuerySchema,
  csvGradeEntryRowSchema,
} from '../validation/assessment.validation';
import { z } from 'zod';

export class AssessmentController {
  private assessmentService: AssessmentService;
  private gradeEntryService: GradeEntryService;
  private reportService: ReportGenerationService;

  constructor() {
    this.assessmentService = new AssessmentService(prisma);
    this.gradeEntryService = new GradeEntryService(prisma);
    this.reportService = new ReportGenerationService(prisma);
  }

  /**
   * Create new assessment definition
   * POST /api/assessments
   */
  createAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = createAssessmentDefinitionSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const userId = req.user!.userId;

      const assessment = await this.assessmentService.createAssessment(
        data,
        schoolId,
        userId
      );

      res.status(201).json({
        message: 'Assessment created successfully',
        data: assessment,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        });
      } else {
        res.status(400).json({
          error: 'CREATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create assessment',
        });
      }
    }
  };

  /**
   * Bulk create assessments
   * POST /api/assessments/bulk
   */
  bulkCreateAssessments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assessments } = bulkCreateAssessmentsSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;

      const result = await this.assessmentService.bulkCreateAssessments(
        assessments,
        schoolId
      );

      res.status(201).json({
        message: `Successfully created ${result.created} assessments`,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        });
      } else {
        res.status(400).json({
          error: 'BULK_CREATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create assessments',
        });
      }
    }
  };

  /**
   * Get all assessments with filtering
   * GET /api/assessments
   */
  getAssessments = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = getAssessmentsQuerySchema.parse(req.query);
      const schoolId = req.user!.schoolId!;

      const result = await this.assessmentService.getAssessments(schoolId, query);

      res.json({
        data: result.assessments,
        pagination: {
          page: result.page,
          limit: query.limit || 20,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
        });
      } else {
        res.status(500).json({
          error: 'FETCH_FAILED',
          message: 'Failed to fetch assessments',
        });
      }
    }
  };

  /**
   * Get single assessment by ID
   * GET /api/assessments/:id
   */
  getAssessmentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId!;

      const assessment = await this.assessmentService.getAssessmentById(id, schoolId);

      if (!assessment) {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Assessment not found',
        });
        return;
      }

      res.json({
        data: assessment,
      });
    } catch (error) {
      res.status(500).json({
        error: 'FETCH_FAILED',
        message: 'Failed to fetch assessment',
      });
    }
  };

  /**
   * Update assessment definition
   * PUT /api/assessments/:id
   */
  updateAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = updateAssessmentDefinitionSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;

      const assessment = await this.assessmentService.updateAssessment(
        id,
        data,
        schoolId
      );

      res.json({
        message: 'Assessment updated successfully',
        data: assessment,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        });
      } else {
        res.status(400).json({
          error: 'UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update assessment',
        });
      }
    }
  };

  /**
   * Delete assessment definition
   * DELETE /api/assessments/:id
   */
  deleteAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId!;

      await this.assessmentService.deleteAssessment(id, schoolId);

      res.json({
        message: 'Assessment deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        error: 'DELETE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to delete assessment',
      });
    }
  };

  /**
   * Get assessments for a specific class
   * GET /api/assessments/class/:classId/term/:termId
   */
  getClassAssessments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { classId, termId } = req.params;
      const schoolId = req.user!.schoolId!;

      const assessments = await this.assessmentService.getClassAssessments(
        classId,
        termId,
        schoolId
      );

      res.json({
        data: assessments,
      });
    } catch (error) {
      res.status(500).json({
        error: 'FETCH_FAILED',
        message: 'Failed to fetch class assessments',
      });
    }
  };

  /**
   * Get assessments for a specific subject
   * GET /api/assessments/class-subject/:classSubjectId
   */
  getSubjectAssessments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { classSubjectId } = req.params;
      const schoolId = req.user!.schoolId!;

      const assessments = await this.assessmentService.getSubjectAssessments(
        classSubjectId,
        schoolId
      );

      res.json({
        data: assessments,
      });
    } catch (error) {
      res.status(500).json({
        error: 'FETCH_FAILED',
        message: 'Failed to fetch subject assessments',
      });
    }
  };

  /**
   * Get assessment statistics
   * GET /api/assessments/stats
   */
  getAssessmentStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { academicYearId } = req.query;
      const schoolId = req.user!.schoolId!;

      const stats = await this.assessmentService.getAssessmentStats(
        schoolId,
        academicYearId as string | undefined
      );

      res.json({
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        error: 'FETCH_FAILED',
        message: 'Failed to fetch assessment statistics',
      });
    }
  };

  /**
   * Create or update single grade entry
   * POST /api/assessments/results
   */
  createResult = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = createAssessmentResultSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const assessedById = req.user!.userId;

      const result = await this.gradeEntryService.createOrUpdateResult(
        data,
        assessedById,
        schoolId
      );

      res.status(201).json({
        message: 'Grade recorded successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        });
      } else {
        res.status(400).json({
          error: 'CREATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to record grade',
        });
      }
    }
  };

  /**
   * Bulk grade entry
   * POST /api/assessments/results/bulk
   */
  bulkGradeEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = gradeEntrySchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const assessedById = req.user!.userId;

      const result = await this.gradeEntryService.bulkGradeEntry(
        data,
        assessedById,
        schoolId
      );

      res.status(201).json({
        message: `Successfully recorded ${result.successful} grades`,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        });
      } else {
        res.status(400).json({
          error: 'BULK_ENTRY_FAILED',
          message: error instanceof Error ? error.message : 'Failed to record grades',
        });
      }
    }
  };

  /**
   * CSV bulk upload
   * POST /api/assessments/results/upload/:assessmentId
   */
  csvBulkUpload = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assessmentId } = req.params;
      const csvData = req.body.data; // Array of CSV rows
      const schoolId = req.user!.schoolId!;
      const assessedById = req.user!.userId;

      // Validate CSV data
      const validatedData = z.array(csvGradeEntryRowSchema).parse(csvData);

      const result = await this.gradeEntryService.csvBulkUpload(
        validatedData,
        assessmentId,
        assessedById,
        schoolId
      );

      res.status(201).json({
        message: `Successfully uploaded ${result.successful} grades`,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid CSV data',
          details: error.errors,
        });
      } else {
        res.status(400).json({
          error: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Failed to upload grades',
        });
      }
    }
  };

  /**
   * Get assessment results
   * GET /api/assessments/results
   */
  getResults = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = getResultsQuerySchema.parse(req.query);
      const schoolId = req.user!.schoolId!;

      const result = await this.gradeEntryService.getResults(schoolId, query);

      res.json({
        data: result.results,
        pagination: {
          page: result.page,
          limit: query.limit || 50,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
        });
      } else {
        res.status(500).json({
          error: 'FETCH_FAILED',
          message: 'Failed to fetch results',
        });
      }
    }
  };

  /**
   * Update assessment result
   * PUT /api/assessments/results/:id
   */
  updateResult = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = updateAssessmentResultSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;

      const result = await this.gradeEntryService.updateResult(id, data, schoolId);

      res.json({
        message: 'Grade updated successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        });
      } else {
        res.status(400).json({
          error: 'UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update grade',
        });
      }
    }
  };

  /**
   * Delete assessment result
   * DELETE /api/assessments/results/:id
   */
  deleteResult = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId!;

      await this.gradeEntryService.deleteResult(id, schoolId);

      res.json({
        message: 'Grade deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        error: 'DELETE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to delete grade',
      });
    }
  };

  /**
   * Generate student report card
   * GET /api/reports/student/:studentId/term/:termId
   */
  generateStudentReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentId, termId } = req.params;
      const schoolId = req.user!.schoolId!;

      const report = await this.reportService.generateStudentReportCard(
        studentId,
        termId,
        schoolId
      );

      res.json({
        data: report,
      });
    } catch (error) {
      res.status(400).json({
        error: 'REPORT_GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to generate report',
      });
    }
  };

  /**
   * Generate class performance report
   * GET /api/reports/class/:classId/term/:termId
   */
  generateClassReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { classId, termId } = req.params;
      const schoolId = req.user!.schoolId!;

      const report = await this.reportService.generateClassPerformanceReport(
        classId,
        termId,
        schoolId
      );

      res.json({
        data: report,
      });
    } catch (error) {
      res.status(400).json({
        error: 'REPORT_GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to generate report',
      });
    }
  };
}
