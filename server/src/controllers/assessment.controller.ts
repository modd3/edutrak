import { Request, Response } from 'express';
import { AssessmentService } from '../services/assessment.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';

const assessmentService = new AssessmentService();

export class AssessmentController {
  async createAssessment(req: Request, res: Response): Promise<Response> {
    try {
      const { name, type, studentId, classSubjectId, termId, maxMarks } = req.body;
      
      if (!name || !type || !studentId || !classSubjectId || !termId || !maxMarks) {
        return ResponseUtil.validationError(res, 'Required fields: name, type, studentId, classSubjectId, termId, maxMarks');
      }

      const assessment = await assessmentService.createAssessment(req.body);
      return ResponseUtil.created(res, 'Assessment created successfully', assessment);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async createBulkAssessments(req: Request, res: Response): Promise<Response> {
    try {
      const { assessments } = req.body;
      
      if (!assessments || !Array.isArray(assessments) || assessments.length === 0) {
        return ResponseUtil.validationError(res, 'Assessments array is required');
      }

      const result = await assessmentService.createBulkAssessments(assessments);
      return ResponseUtil.created(res, 'Bulk assessments created successfully', result);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getAssessmentById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Assessment ID is required', 400);
      }
      
      const assessment = await assessmentService.getAssessmentById(id);
      
      if (!assessment) {
        return ResponseUtil.notFound(res, 'Assessment');
      }

      return ResponseUtil.success(res, 'Assessment retrieved successfully', assessment);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async updateAssessment(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Assessment ID is required', 400);
      }
      
      const assessment = await assessmentService.updateAssessment(id, req.body);
      
      return ResponseUtil.success(res, 'Assessment updated successfully', assessment);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Assessment');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async deleteAssessment(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Assessment ID is required', 400);
      }
      
      await assessmentService.deleteAssessment(id);
      
      return ResponseUtil.success(res, 'Assessment deleted successfully');
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Assessment');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getStudentAssessments(req: Request, res: Response): Promise<Response> {
    try {
      const { studentId } = req.params;
      const filters = req.query;
      
      if (!studentId) {
        return ResponseUtil.error(res, 'Student ID is required', 400);
      }
      
      const result = await assessmentService.getStudentAssessments(studentId, {
        termId: filters.termId as string,
        classSubjectId: filters.classSubjectId as string,
        type: filters.type as any,
        page: filters.page ? parseInt(filters.page as string) : undefined,
        limit: filters.limit ? parseInt(filters.limit as string) : undefined,
      });
      
      return ResponseUtil.paginated(res, 'Student assessments retrieved successfully', result.assessments, result.pagination);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getClassSubjectAssessments(req: Request, res: Response): Promise<Response> {
    try {
      const { classSubjectId } = req.params;
      
      if (!classSubjectId) {
        return ResponseUtil.error(res, 'Class subject ID is required', 400);
      }
      
      const assessments = await assessmentService.getClassSubjectAssessments(classSubjectId);
      
      return ResponseUtil.success(res, 'Class subject assessments retrieved successfully', assessments, assessments.length);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async calculateStudentTermAverage(req: Request, res: Response): Promise<Response> {
    try {
      const { studentId } = req.params;
      const { termId } = req.query;
      
      if (!studentId) {
        return ResponseUtil.error(res, 'Student ID is required', 400);
      }
      
      if (!termId) {
        return ResponseUtil.validationError(res, 'termId query parameter is required');
      }

      const average = await assessmentService.calculateStudentTermAverage(studentId, termId as string);
      return ResponseUtil.success(res, 'Student term average calculated successfully', average);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getClassSubjectStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const { classSubjectId } = req.params;
      
      if (!classSubjectId) {
        return ResponseUtil.error(res, 'Class subject ID is required', 400);
      }
      
      const statistics = await assessmentService.getClassSubjectStatistics(classSubjectId);
      
      return ResponseUtil.success(res, 'Class subject statistics retrieved successfully', statistics);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async convertMarksToGrade(req: Request, res: Response): Promise<Response> {
    try {
      const { marks, maxMarks, curriculum } = req.body;
      
      if (marks === undefined || !maxMarks || !curriculum) {
        return ResponseUtil.validationError(res, 'Required fields: marks, maxMarks, curriculum');
      }

      const grade = await assessmentService.convertMarksToGrade(marks, maxMarks, curriculum);
      return ResponseUtil.success(res, 'Grade converted successfully', { grade });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async generateStudentTermReport(req: Request, res: Response): Promise<Response> {
    try {
      const { studentId } = req.params;
      const { termId } = req.query;
      
      if (!studentId) {
        return ResponseUtil.error(res, 'Student ID is required', 400);
      }
      
      if (!termId) {
        return ResponseUtil.validationError(res, 'termId query parameter is required');
      }

      const report = await assessmentService.generateStudentTermReport(studentId, termId as string);
      return ResponseUtil.success(res, 'Student term report generated successfully', report);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  /*async generateClassTermReport(req: Request, res: Response): Promise<Response> {
    try {
      const { classId } = req.params;
      const { termId } = req.query;
      
      if (!classId) {
        return ResponseUtil.error(res, 'Class ID is required', 400);
      }
      
      if (!termId) {
        return ResponseUtil.validationError(res, 'termId query parameter is required');
      }

      const report = await assessmentService.generateClassTermReport(classId, termId as string);
      return ResponseUtil.success(res, 'Class term report generated successfully', report);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getAssessmentTrends(req: Request, res: Response): Promise<Response> {
    try {
      const { studentId } = req.params;
      const { subjectId } = req.query;
      
      if (!studentId) {
        return ResponseUtil.error(res, 'Student ID is required', 400);
      }
      
      const trends = await assessmentService.getAssessmentTrends(studentId, subjectId as string);
      return ResponseUtil.success(res, 'Assessment trends retrieved successfully', trends);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }*/
} 