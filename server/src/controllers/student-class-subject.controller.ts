// src/controllers/student-class-subject.controller.ts
import { Response } from 'express';
import { StudentClassSubjectService } from '../services/student-class-subject.service';
import { ResponseUtil } from '../utils/response';
import { RequestWithUser } from '../middleware/school-context';
import {
  enrollStudentInSubjectSchema,
  bulkEnrollStudentsInSubjectSchema,
  dropStudentFromSubjectSchema,
  updateSubjectEnrollmentStatusSchema,
  getStudentSubjectEnrollmentsQuerySchema,
  getStudentsEnrolledInSubjectQuerySchema,
  bulkUpdateSubjectStatusSchema,
} from '../validation/student-class-subject.validation';

const service = new StudentClassSubjectService();

export class StudentClassSubjectController {
  /**
   * Enroll a single student in a subject
   */
  async enrollStudentInSubject(req: RequestWithUser, res: Response) {
    try {
      const data = enrollStudentInSubjectSchema.parse(req.body);

      // Validate school access
      if (data.schoolId !== req.schoolId && !req.isSuperAdmin) {
        return ResponseUtil.forbidden(res, 'You do not have access to this school');
      }

      const enrollment = await service.enrollStudentInSubject(data);
      return ResponseUtil.created(res, 'Student enrolled in subject successfully', enrollment);
    } catch (error: any) {
      if (error.message.includes('already enrolled')) {
        return ResponseUtil.conflict(res, error.message);
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Bulk enroll students in a subject
   */
  async bulkEnrollStudentsInSubject(req: RequestWithUser, res: Response) {
    try {
      const data = bulkEnrollStudentsInSubjectSchema.parse(req.body);

      // Validate school access
      if (data.schoolId !== req.schoolId && !req.isSuperAdmin) {
        return ResponseUtil.forbidden(res, 'You do not have access to this school');
      }

      const result = await service.bulkEnrollStudentsInSubject(data);
      return ResponseUtil.created(res, 'Students bulk enrolled successfully', result);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Drop a student from a subject
   */
  async dropStudentFromSubject(req: RequestWithUser, res: Response) {
    try {
      const data = dropStudentFromSubjectSchema.parse(req.body);

      // Validate school access
      if (data.schoolId !== req.schoolId && !req.isSuperAdmin) {
        return ResponseUtil.forbidden(res, 'You do not have access to this school');
      }

      const result = await service.dropStudentFromSubject(
        data.enrollmentId,
        data.classSubjectId,
        data.schoolId
      );
      return ResponseUtil.success(res, 'Student dropped from subject', result);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get all subjects a student is enrolled in
   */
  async getStudentSubjectEnrollments(req: RequestWithUser, res: Response) {
    try {
      const { enrollmentId, status, page = '1', limit = '20' } = req.query;

      if (!enrollmentId || typeof enrollmentId !== 'string') {
        return ResponseUtil.validationError(res, 'Enrollment ID is required');
      }

      const enrollments = await service.getStudentSubjectEnrollments(
        enrollmentId,
        req.schoolId!,
        status as any
      );

      return ResponseUtil.success(res, 'Student subject enrollments retrieved', {
        data: enrollments,
        total: enrollments.length,
      });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get students enrolled in a specific subject
   */
  async getStudentsEnrolledInSubject(req: RequestWithUser, res: Response) {
    try {
      const query = getStudentsEnrolledInSubjectQuerySchema.parse({
        ...req.query,
        schoolId: req.schoolId,
      });

      const result = await service.getSubjectStudentsWithPagination(
        query.classSubjectId,
        req.schoolId!,
        query.page || 1,
        query.limit || 20,
        query.status
      );

      return ResponseUtil.success(res, 'Students enrolled in subject retrieved', result);
    } catch (error: any) {
      console.log("Req.query: ", req.query);
      console.log("Error: ", error);
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Update subject enrollment status
   */
  async updateSubjectEnrollmentStatus(req: RequestWithUser, res: Response) {
    try {
      const data = updateSubjectEnrollmentStatusSchema.parse(req.body);

      // Validate school access
      if (data.schoolId !== req.schoolId && !req.isSuperAdmin) {
        return ResponseUtil.forbidden(res, 'You do not have access to this school');
      }

      const result = await service.updateSubjectEnrollmentStatus(
        data.enrollmentId,
        data.classSubjectId,
        data.schoolId,
        data.status
      );

      return ResponseUtil.success(res, 'Subject enrollment status updated', result);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get subject enrollment count for a class subject
   */
  async getSubjectEnrollmentCount(req: RequestWithUser, res: Response) {
    try {
      const { classSubjectId, status } = req.query;

      if (!classSubjectId || typeof classSubjectId !== 'string') {
        return ResponseUtil.validationError(res, 'Class subject ID is required');
      }

      const count = await service.getSubjectEnrollmentCount(
        classSubjectId,
        req.schoolId!,
        status as any
      );

      return ResponseUtil.success(res, 'Subject enrollment count retrieved', {
        classSubjectId,
        count,
      });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get all subjects enrolled across all classes (for a student)
   */
  async getAllStudentSubjectEnrollments(req: RequestWithUser, res: Response) {
    try {
      const { studentId } = req.params;

      if (!studentId) {
        return ResponseUtil.validationError(res, 'Student ID is required');
      }

      const enrollments = await service.getAllStudentSubjectEnrollments(
        studentId,
        req.schoolId!
      );

      return ResponseUtil.success(res, 'All student subject enrollments retrieved', {
        data: enrollments,
        total: enrollments.length,
      });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Bulk update subject enrollment statuses
   */
  async bulkUpdateSubjectStatus(req: RequestWithUser, res: Response) {
    try {
      const data = bulkUpdateSubjectStatusSchema.parse(req.body);

      // Validate school access
      if (data.schoolId !== req.schoolId && !req.isSuperAdmin) {
        return ResponseUtil.forbidden(res, 'You do not have access to this school');
      }

      const results = await Promise.all(
        data.updates.map((update) =>
          service.updateSubjectEnrollmentStatus(
            update.enrollmentId,
            update.classSubjectId,
            data.schoolId,
            update.status
          )
        )
      );

      return ResponseUtil.success(res, 'Bulk status update completed', {
        updated: results.length,
        results,
      });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get available elective/optional subjects for a student
   */
  async getAvailableSubjectsForStudent(req: RequestWithUser, res: Response) {
    try {
      const { enrollmentId, classId } = req.query;

      if (!enrollmentId || typeof enrollmentId !== 'string') {
        return ResponseUtil.validationError(res, 'Enrollment ID is required');
      }
      if (!classId || typeof classId !== 'string') {
        return ResponseUtil.validationError(res, 'Class ID is required');
      }

      const availableSubjects = await service.getAvailableSubjectsForStudent(
        enrollmentId,
        classId,
        req.schoolId!
      );

      return ResponseUtil.success(
        res,
        'Available subjects retrieved successfully',
        {
          data: availableSubjects,
          total: availableSubjects.length,
        }
      );
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }
}
