// src/controllers/class-subject-strand.controller.ts
import { Response } from 'express';
import { ClassSubjectStrandService } from '../services/class-subject-strand.service';
import { ResponseUtil } from '../utils/response';
import { RequestWithUser } from '../middleware/school-context';
import {
  assignStrandToClassSubjectSchema,
  bulkAssignStrandsSchema,
  removeStrandFromClassSubjectSchema,
  getStrandsQuerySchema,
} from '../validation/class-subject-strand.validation';

const service = new ClassSubjectStrandService();

export class ClassSubjectStrandController {
  /**
   * Assign a strand to a class subject
   */
  async assignStrandToClassSubject(req: RequestWithUser, res: Response) {
    try {
      const data = assignStrandToClassSubjectSchema.parse(req.body);

      // Validate school access
      if (data.schoolId !== req.schoolId && !req.isSuperAdmin) {
        return ResponseUtil.forbidden(res, 'You do not have access to this school');
      }

      const assignment = await service.assignStrandToClassSubject(data);
      return ResponseUtil.created(res, 'Strand assigned to class subject successfully', assignment);
    } catch (error: any) {
      if (error.message.includes('already assigned')) {
        return ResponseUtil.conflict(res, error.message);
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Bulk assign strands to a class subject
   */
  async bulkAssignStrands(req: RequestWithUser, res: Response) {
    try {
      const data = bulkAssignStrandsSchema.parse(req.body);

      // Validate school access
      if (data.schoolId !== req.schoolId && !req.isSuperAdmin) {
        return ResponseUtil.forbidden(res, 'You do not have access to this school');
      }

      const assignments = await service.bulkAssignStrandsToClassSubject(data);
      return ResponseUtil.created(res, 'Strands bulk assigned successfully', {
        assigned: assignments.length,
        assignments,
      });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get all strands for a class subject
   */
  async getStrandsForClassSubject(req: RequestWithUser, res: Response) {
    try {
      const { classSubjectId, includeAssessments } = req.query;

      if (!classSubjectId || typeof classSubjectId !== 'string') {
        return ResponseUtil.validationError(res, 'Class subject ID is required');
      }

      let data;
      if (includeAssessments === 'true') {
        data = await service.getStrandsWithAssessments(classSubjectId, req.schoolId!);
      } else {
        data = await service.getStrandsForClassSubject(classSubjectId, req.schoolId!);
      }

      return ResponseUtil.success(res, 'Strands retrieved successfully', {
        data,
        total: data.length,
      });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get all class subjects for a strand
   */
  async getClassSubjectsForStrand(req: RequestWithUser, res: Response) {
    try {
      const { strandId } = req.params;

      if (!strandId) {
        return ResponseUtil.validationError(res, 'Strand ID is required');
      }

      const assignments = await service.getClassSubjectsForStrand(strandId, req.schoolId!);
      return ResponseUtil.success(res, 'Class subjects for strand retrieved', {
        data: assignments,
        total: assignments.length,
      });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Remove strand from class subject
   */
  async removeStrandFromClassSubject(req: RequestWithUser, res: Response) {
    try {
      const data = removeStrandFromClassSubjectSchema.parse(req.body);

      // Validate school access
      if (data.schoolId !== req.schoolId && !req.isSuperAdmin) {
        return ResponseUtil.forbidden(res, 'You do not have access to this school');
      }

      await service.removeStrandFromClassSubject(
        data.classSubjectId,
        data.strandId,
        data.schoolId
      );

      return ResponseUtil.success(res, 'Strand removed from class subject');
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get strand count for a class subject
   */
  async getStrandCount(req: RequestWithUser, res: Response) {
    try {
      const { classSubjectId } = req.query;

      if (!classSubjectId || typeof classSubjectId !== 'string') {
        return ResponseUtil.validationError(res, 'Class subject ID is required');
      }

      const count = await service.getStrandCountForClassSubject(classSubjectId);

      return ResponseUtil.success(res, 'Strand count retrieved', {
        classSubjectId,
        count,
      });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Validate strand assignments for a class subject
   */
  async validateStrandAssignments(req: RequestWithUser, res: Response) {
    try {
      const { classSubjectId } = req.query;

      if (!classSubjectId || typeof classSubjectId !== 'string') {
        return ResponseUtil.validationError(res, 'Class subject ID is required');
      }

      const isValid = await service.validateStrandAssignments(classSubjectId);

      return ResponseUtil.success(res, 'Strand assignments validation complete', {
        classSubjectId,
        isValid,
      });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }
}
