import { Request, Response } from 'express';
import { GuardianService } from '../services/guardian.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';

const guardianService = new GuardianService();

export class GuardianController {
  async createGuardian(req: Request, res: Response) {
    try {
      const { userId, relationship } = req.body;
      
      if (!userId || !relationship) {
        return ResponseUtil.validationError(res, 'Required fields: userId, relationship');
      }

      const guardian = await guardianService.createGuardian(req.body);
      return ResponseUtil.created(res, 'Guardian created successfully', guardian);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'Guardian with this user already exists');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async createGuardianWithUser(req: Request, res: Response) {
    try {
      const currentUser = req.user!;
      const { email, password, firstName, lastName, relationship } = req.body;
      
      if (!email || !password || !firstName || !lastName || !relationship) {
        return ResponseUtil.validationError(res, 'Required fields: email, password, firstName, lastName, relationship');
      }

      const guardian = await guardianService.createGuardianWithUser(req.body, {
        userId: currentUser.userId,
        role: currentUser.role
      });
      return ResponseUtil.created(res, 'Guardian with user account created successfully', guardian);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'Guardian or user with these details already exists');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getGuardians(req: Request, res: Response) {
    try {
      const filters = req.query;
      const result = await guardianService.getGuardians({
        schoolId: filters.schoolId as string,
        page: filters.page ? parseInt(filters.page as string) : undefined,
        limit: filters.limit ? parseInt(filters.limit as string) : undefined,
        search: filters.search as string,
      });
      
      return ResponseUtil.paginated(res, 'Guardians retrieved successfully', result.guardians, result.pagination);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getGuardianById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const guardian = await guardianService.getGuardianById(id);
      
      if (!guardian) {
        return ResponseUtil.notFound(res, 'Guardian');
      }

      return ResponseUtil.success(res, 'Guardian retrieved successfully', guardian);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getGuardianByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const guardian = await guardianService.getGuardianByUserId(userId);
      
      if (!guardian) {
        return ResponseUtil.notFound(res, 'Guardian');
      }

      return ResponseUtil.success(res, 'Guardian retrieved successfully', guardian);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async updateGuardian(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const guardian = await guardianService.updateGuardian(id, req.body);
      
      return ResponseUtil.success(res, 'Guardian updated successfully', guardian);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Guardian');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getGuardianStudents(req: Request, res: Response) {
    try {
      const { guardianId } = req.params;
      const students = await guardianService.getGuardianStudents(guardianId);
      
      return ResponseUtil.success(res, 'Guardian students retrieved successfully', students, students.length);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getStudentGuardians(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const guardians = await guardianService.getStudentGuardians(studentId);
      
      return ResponseUtil.success(res, 'Student guardians retrieved successfully', guardians, guardians.length);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async setPrimaryGuardian(req: Request, res: Response) {
    try {
      const { studentId, guardianId } = req.body;
      
      if (!studentId || !guardianId) {
        return ResponseUtil.validationError(res, 'Required fields: studentId, guardianId');
      }

      await guardianService.setPrimaryGuardian({ studentId, guardianId });
      return ResponseUtil.success(res, 'Primary guardian set successfully');
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Student or guardian not found');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async removeGuardianFromStudent(req: Request, res: Response) {
    try {
      const { studentId, guardianId } = req.params;
      
      await guardianService.removeGuardianFromStudent(studentId, guardianId);
      return ResponseUtil.success(res, 'Guardian removed from student successfully');
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Relationship not found');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getGuardianNotifications(req: Request, res: Response) {
    try {
      const { guardianId } = req.params;
      const notifications = await guardianService.getGuardianNotifications(guardianId);
      
      return ResponseUtil.success(res, 'Guardian notifications retrieved successfully', notifications);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }
}