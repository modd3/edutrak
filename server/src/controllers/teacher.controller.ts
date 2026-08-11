import { Response } from 'express';
import { TeacherService } from '../services/teacher.service';
import { userCreationService } from '../services/user-creation.service';
import { auditService } from '../services/audit.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';
import { RequestWithUser } from '../middleware/school-context';
import { ResourceLimitError } from '../services/entitlement.service';

export class TeacherController {
  /**
   * Create a teacher with a new user account.
   * Delegates to UserCreationService.createUserWithProfile - the only place
   * that should create a User row - rather than re-implementing user
   * creation here. That also means teachers.max is enforced automatically,
   * since the check lives inside that service method.
   */
  async createTeacherWithUser(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const {
        email, password, firstName, lastName, middleName, phone, idNumber,
        tscNumber, employmentType, qualification, specialization, dateJoined,
      } = req.body;

      if (!email || !password || !firstName || !lastName || !tscNumber || !employmentType) {
        return ResponseUtil.validationError(res, 'Required fields: email, password, firstName, lastName, tscNumber, employmentType');
      }

      const user: any = await userCreationService.createUserWithProfile(
        { email, password, firstName, lastName, middleName, phone, idNumber, role: 'TEACHER' as any },
        { tscNumber, employmentType, qualification, specialization, dateJoined: dateJoined ? new Date(dateJoined) : undefined } as any,
        req.schoolId,
        req.isSuperAdmin || false
      );

      // Audit log
      auditService.log({
        schoolId: req.schoolId,
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'CREATE_TEACHER_WITH_USER',
        entityType: 'Teacher',
        entityId: user.teacher?.id ?? user.id,
        entityName: `${firstName} ${lastName}`,
        details: `Created teacher with user account: ${firstName} ${lastName} (${email})`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }).catch((err) => logger.warn('Audit log failed', { error: err.message }));

      return ResponseUtil.created(res, 'Teacher with user account created successfully', user);
    } catch (error: any) {
      if (error instanceof ResourceLimitError) {
        return res.status(402).json({
          error: 'RESOURCE_LIMIT_REACHED',
          featureKey: error.role,
          message: error.message,
        });
      }
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

      // Audit log
      auditService.log({
        schoolId: req.schoolId,
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'UPDATE_TEACHER',
        entityType: 'Teacher',
        entityId: id,
        details: `Updated teacher ${id}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }).catch((err) => logger.warn('Audit log failed', { error: err.message }));

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

      // Audit log
      auditService.log({
        schoolId: req.schoolId,
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'ASSIGN_SUBJECT_TO_TEACHER',
        entityType: 'TeacherSubjectAssignment',
        entityId: assignment.id,
        details: `Assigned subject ${subjectId} to teacher ${teacherId} for term ${termId}`,
        metadata: { classId, subjectId, teacherId, termId, academicYearId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }).catch((err) => logger.warn('Audit log failed', { error: err.message }));

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