import { Request, Response } from 'express';
import { SubjectService } from '../services/subject.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';
import { Curriculum } from '@prisma/client';

const subjectService = new SubjectService();

export class SubjectController {
  async createSubject(req: Request, res: Response): Promise<Response> {
    try {
      const { name, code, category, curriculum } = req.body;
      
      if (!name || !code || !category || !curriculum) {
        return ResponseUtil.validationError(res, 'Required fields: name, code, category, curriculum');
      }

      const subject = await subjectService.createSubject(req.body);
      return ResponseUtil.created(res, 'Subject created successfully', subject);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'Subject with this code already exists');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getSubjects(req: Request, res: Response): Promise<Response> {
    try {
      const filters = req.query;
      const result = await subjectService.getSubjects({
        curriculum: filters.curriculum as any,
        isCore: filters.isCore ? filters.isCore === 'true' : undefined,
        learningArea: filters.learningArea as any,
        category: filters.category as any,
        page: filters.page ? parseInt(filters.page as string) : undefined,
        limit: filters.limit ? parseInt(filters.limit as string) : undefined,
        search: filters.search as string,
      });
      
      return ResponseUtil.paginated(res, 'Subjects retrieved successfully', result.subjects, result.pagination);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getSubjectById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Subject ID is required', 400);
      }
      
      const subject = await subjectService.getSubjectById(id);
      
      if (!subject) {
        return ResponseUtil.notFound(res, 'Subject');
      }

      return ResponseUtil.success(res, 'Subject retrieved successfully', subject);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getSubjectByCode(req: Request, res: Response): Promise<Response> {
    try {
      const { code } = req.params;
      
      if (!code) {
        return ResponseUtil.error(res, 'Subject code is required', 400);
      }
      
      const subject = await subjectService.getSubjectByCode(code);
      
      if (!subject) {
        return ResponseUtil.notFound(res, 'Subject');
      }

      return ResponseUtil.success(res, 'Subject retrieved successfully', subject);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async updateSubject(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Subject ID is required', 400);
      }
      
      const subject = await subjectService.updateSubject(id, req.body);
      
      return ResponseUtil.success(res, 'Subject updated successfully', subject);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Subject');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async deleteSubject(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Subject ID is required', 400);
      }
      
      await subjectService.deleteSubject(id);
      
      return ResponseUtil.success(res, 'Subject deleted successfully');
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Subject');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async addSubjectToSchool(req: Request, res: Response): Promise<Response> {
    try {
      const { schoolId, subjectId } = req.body;
      
      if (!schoolId || !subjectId) {
        return ResponseUtil.validationError(res, 'Required fields: schoolId, subjectId');
      }

      const offering = await subjectService.addSubjectToSchool(req.body);
      return ResponseUtil.created(res, 'Subject added to school successfully', offering);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'Subject already offered by this school');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getSchoolSubjects(req: Request, res: Response): Promise<Response> {
    try {
      const { schoolId } = req.params;
      
      if (!schoolId) {
        return ResponseUtil.error(res, 'School ID is required', 400);
      }
      
      const subjects = await subjectService.getSchoolSubjects(schoolId);
      
      return ResponseUtil.success(res, 'School subjects retrieved successfully', subjects, subjects.length);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async toggleSubjectOffering(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      if (!id) {
        return ResponseUtil.error(res, 'Subject offering ID is required', 400);
      }
      
      if (isActive === undefined) {
        return ResponseUtil.validationError(res, 'isActive field is required');
      }

      const offering = await subjectService.toggleSubjectOffering(id, isActive);
      return ResponseUtil.success(res, 'Subject offering status updated successfully', offering);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Subject offering');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async removeSubjectFromSchool(req: Request, res: Response): Promise<Response> {
    try {
      const { schoolId, subjectId } = req.params;
      
      if (!schoolId || !subjectId) {
        return ResponseUtil.error(res, 'School ID and Subject ID are required', 400);
      }
      
      await subjectService.removeSubjectFromSchool(schoolId, subjectId);
      return ResponseUtil.success(res, 'Subject removed from school successfully');
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Subject offering');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getCBCSubjectsByLearningArea(req: Request, res: Response): Promise<Response> {
    try {
      const { learningArea } = req.params;
      
      if (!learningArea) {
        return ResponseUtil.error(res, 'Learning area is required', 400);
      }
      
      const subjects = await subjectService.getCBCSubjectsByLearningArea(learningArea as any);
      
      return ResponseUtil.success(res, 'CBC subjects retrieved successfully', subjects, subjects.length);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async get844SubjectsByGroup(req: Request, res: Response): Promise<Response> {
    try {
      const { subjectGroup } = req.params;
      
      if (!subjectGroup) {
        return ResponseUtil.error(res, 'Subject group is required', 400);
      }
      
      const subjects = await subjectService.get844SubjectsByGroup(subjectGroup as any);
      
      return ResponseUtil.success(res, '8-4-4 subjects retrieved successfully', subjects, subjects.length);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getSubjectPerformance(req: Request, res: Response): Promise<Response> {
    try {
      const { subjectId } = req.params;
      const { academicYearId } = req.query;
      
      if (!subjectId) {
        return ResponseUtil.error(res, 'Subject ID is required', 400);
      }
      
      const performance = await subjectService.getSubjectPerformance(subjectId, academicYearId as string);
      return ResponseUtil.success(res, 'Subject performance retrieved successfully', performance);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getCurriculumSubjects(req: Request, res: Response): Promise<Response> {
    try {
      const { curriculum } = req.params;
      
      if (!curriculum) {
        return ResponseUtil.validationError(res, 'Curriculum parameter is required');
      }

      const subjects = await subjectService.getCurriculumSubjects(curriculum as Curriculum);
      return ResponseUtil.success(res, 'Curriculum subjects retrieved successfully', subjects, subjects.length);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }
}