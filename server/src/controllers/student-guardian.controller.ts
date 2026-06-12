// src/controllers/student-guardian.controller.ts
// Centralized controller for student-guardian relationship management
import { Response } from 'express';
import { RequestWithUser } from '../middleware/school-context';
import { StudentGuardianService } from '../services/student-guardian.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';

export class StudentGuardianController {
  private getService(req: RequestWithUser) {
    return new StudentGuardianService(req);
  }

  /**
   * POST /student-guardians/link
   * Link an existing guardian to an existing student
   */
  async linkGuardianToStudent(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { studentId, guardianId, relationship, isPrimary } = req.body;

      if (!studentId || !guardianId) {
        return ResponseUtil.validationError(res, 'Required fields: studentId, guardianId');
      }

      const service = this.getService(req);
      const result = await service.linkGuardianToStudent({
        studentId,
        guardianId,
        relationship,
        isPrimary,
      });

      return ResponseUtil.created(res, 'Guardian linked to student successfully', result);
    } catch (error: any) {
      if (error.message.includes('already linked')) {
        return ResponseUtil.conflict(res, error.message);
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * POST /student-guardians/create-and-link
   * Create a new guardian user and link to student in one step
   */
  async createGuardianAndLink(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { studentId, email, password, firstName, lastName, middleName, phone, idNumber, relationship, occupation, employer, workPhone, isPrimary } = req.body;

      if (!studentId || !email || !password || !firstName || !lastName || !relationship) {
        return ResponseUtil.validationError(res, 'Required fields: studentId, email, password, firstName, lastName, relationship');
      }

      const service = this.getService(req);
      const result = await service.createGuardianAndLink({
        studentId,
        email,
        password,
        firstName,
        lastName,
        middleName,
        phone,
        idNumber,
        relationship,
        occupation,
        employer,
        workPhone,
        isPrimary,
      });

      return ResponseUtil.created(res, 'Guardian created and linked successfully', result);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'A user with this email already exists');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * PATCH /student-guardians/:studentId/:guardianId
   * Update a student-guardian relationship
   */
  async updateRelationship(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { studentId, guardianId } = req.params;
      const { relationship, isPrimary, isVerified } = req.body;

      if (!studentId || !guardianId) {
        return ResponseUtil.error(res, 'Student ID and Guardian ID are required', 400);
      }

      const service = this.getService(req);
      const result = await service.updateRelationship({
        studentId,
        guardianId,
        relationship,
        isPrimary,
        isVerified,
      });

      return ResponseUtil.success(res, 'Relationship updated successfully', result);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Relationship');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * POST /student-guardians/:studentId/:guardianId/verify
   * Verify a student-guardian relationship
   */
  async verifyRelationship(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { studentId, guardianId } = req.params;

      if (!studentId || !guardianId) {
        return ResponseUtil.error(res, 'Student ID and Guardian ID are required', 400);
      }

      const service = this.getService(req);
      const result = await service.verifyRelationship(studentId, guardianId);

      return ResponseUtil.success(res, 'Relationship verified successfully', result);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Relationship');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * DELETE /student-guardians/:studentId/:guardianId
   * Unlink a guardian from a student
   */
  async unlinkGuardian(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { studentId, guardianId } = req.params;

      if (!studentId || !guardianId) {
        return ResponseUtil.error(res, 'Student ID and Guardian ID are required', 400);
      }

      const service = this.getService(req);
      await service.unlinkGuardian(studentId, guardianId);

      return ResponseUtil.success(res, 'Guardian unlinked from student successfully');
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Relationship');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * GET /student-guardians/student/:studentId
   * Get all guardians for a student
   */
  async getStudentGuardians(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { studentId } = req.params;

      if (!studentId) {
        return ResponseUtil.error(res, 'Student ID is required', 400);
      }

      const service = this.getService(req);
      const guardians = await service.getStudentGuardians(studentId);

      return ResponseUtil.success(res, 'Guardians retrieved successfully', guardians, guardians.length);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * GET /student-guardians/guardian/:guardianId
   * Get all students for a guardian
   */
  async getGuardianStudents(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { guardianId } = req.params;

      if (!guardianId) {
        return ResponseUtil.error(res, 'Guardian ID is required', 400);
      }

      const service = this.getService(req);
      const students = await service.getGuardianStudents(guardianId);

      return ResponseUtil.success(res, 'Students retrieved successfully', students, students.length);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }
}