import { Request, Response } from 'express';
import { TeacherService } from '../services/teacher.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';
import { Role } from '@prisma/client';
import { RequestWithUser } from '../middleware/school-context';

export class TeacherController {
  async createTeacher(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { userId, tscNumber, employmentType } = req.body;
      
      if (!userId || !tscNumber || !employmentType) {
        return ResponseUtil.validationError(res, 'Required fields: userId, tscNumber, employmentType');
      }

      const teacherService = new TeacherService(req);
      const teacher = await teacherService.createTeacher(req.body);
      return ResponseUtil.created(res, 'Teacher created successfully', teacher);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'Teacher with this TSC number already exists');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async createTeacherWithUser(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const currentUser = req.user!;
      const { email, password, firstName, lastName, tscNumber, employmentType } = req.body;
      
      if (!email || !password || !firstName || !lastName || !tscNumber || !employmentType) {
        return ResponseUtil.validationError(res, 'Required fields: email, password, firstName, lastName, tscNumber, employmentType');
      }

      const teacherService = new TeacherService(req);
      const teacher = await teacherService.createTeacherWithUser(req.body, {
        userId: currentUser.userId,
        role: currentUser.role as Role
      });
      return ResponseUtil.created(res, 'Teacher with user account created successfully', teacher);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'Teacher or user with these details already exists');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getTeachers(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const filters = req.query;
      const teacherService = new TeacherService(req);
      const result = await teacherService.getTeachers({
        schoolId: filters.schoolId as string,
        employmentType: filters.employmentType as any,
        page: filters.page ? parseInt(filters.page as string) : undefined,
        limit: filters.limit ? parseInt(filters.limit as string) : undefined,
        search: filters.search as string,
      });
      
      return ResponseUtil.paginated(res, 'Teachers retrieved successfully', result.teachers, result.pagination);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getTeacherById(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Teacher ID is required', 400);
      }
      
      const teacherService = new TeacherService(req);
      const teacher = await teacherService.getTeacherById(id);
      
      if (!teacher) {
        return ResponseUtil.notFound(res, 'Teacher');
      }

      return ResponseUtil.success(res, 'Teacher retrieved successfully', teacher);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getTeacherByUserId(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return ResponseUtil.error(res, 'User ID is required', 400);
      }
      
      const teacherService = new TeacherService(req);
      const teacher = await teacherService.getTeacherByUserId(userId);
      
      if (!teacher) {
        return ResponseUtil.notFound(res, 'Teacher');
      }

      return ResponseUtil.success(res, 'Teacher retrieved successfully', teacher);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getTeacherByTscNumber(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { tscNumber } = req.params;
      
      if (!tscNumber) {
        return ResponseUtil.error(res, 'TSC number is required', 400);
      }
      
      const teacherService = new TeacherService(req);
      const teacher = await teacherService.getTeacherByTscNumber(tscNumber);
      
      if (!teacher) {
        return ResponseUtil.notFound(res, 'Teacher');
      }

      return ResponseUtil.success(res, 'Teacher retrieved successfully', teacher);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async updateTeacher(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Teacher ID is required', 400);
      }
      
      const teacherService = new TeacherService(req);
      const teacher = await teacherService.updateTeacher(id, req.body);
      
      return ResponseUtil.success(res, 'Teacher updated successfully', teacher);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Teacher');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async assignSubjectToTeacher(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { classId, subjectId, teacherId, termId, academicYearId } = req.body;
      
      if (!classId || !subjectId || !teacherId || !termId || !academicYearId) {
        return ResponseUtil.validationError(res, 'Required fields: classId, subjectId, teacherId, termId, academicYearId');
      }

      const teacherService = new TeacherService(req);
      const assignment = await teacherService.assignSubjectToTeacher(req.body);
      return ResponseUtil.created(res, 'Subject assigned to teacher successfully', assignment);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'This subject is already assigned to this teacher for the specified term');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getTeacherWorkload(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { teacherId } = req.params;
      const { academicYearId } = req.query;
      
      if (!teacherId) {
        return ResponseUtil.error(res, 'Teacher ID is required', 400);
      }
      
      const teacherService = new TeacherService(req);
      const workload = await teacherService.getTeacherWorkload(
        teacherId, 
        academicYearId as string
      );
      
      return ResponseUtil.success(res, 'Teacher workload retrieved successfully', workload);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getTeacherTimetable(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { teacherId } = req.params;
      const { termId } = req.query;
      
      if (!teacherId) {
        return ResponseUtil.error(res, 'Teacher ID is required', 400);
      }
      
      if (!termId) {
        return ResponseUtil.validationError(res, 'termId query parameter is required');
      }

      const teacherService = new TeacherService(req);
      const timetable = await teacherService.getTeacherTimetable(teacherId, termId as string);
      return ResponseUtil.success(res, 'Teacher timetable retrieved successfully', timetable);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getTeacherPerformance(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { teacherId } = req.params;
      const { academicYearId } = req.query;
      
      if (!teacherId) {
        return ResponseUtil.error(res, 'Teacher ID is required', 400);
      }
      
      const teacherService = new TeacherService(req);
      const performance = await teacherService.getTeacherPerformance(teacherId, academicYearId as string);
      return ResponseUtil.success(res, 'Teacher performance retrieved successfully', performance);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }
}