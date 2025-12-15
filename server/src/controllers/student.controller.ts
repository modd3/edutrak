import { Request, Response } from 'express';
import { StudentService } from '../services/student.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';
import { Role } from '@prisma/client';
import { RequestWithUser } from '@/middleware/school-context';

export class StudentController {
  private getService(req: RequestWithUser) {
    return new StudentService(req);
  }

  async getStudents(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const filters = req.query;
      const studentService = this.getService(req);
      const result = await studentService.getStudents({
        schoolId: req.schoolId,
        gender: filters.gender as any,
        hasSpecialNeeds: filters.hasSpecialNeeds ? filters.hasSpecialNeeds === 'true' : undefined,
        classId: filters.classId as string,
        streamId: filters.streamId as string,
        status: filters.status as any,
        page: filters.page ? parseInt(filters.page as string) : undefined,
        limit: filters.limit ? parseInt(filters.limit as string) : undefined,
        search: filters.search as string,
      });
      
      return ResponseUtil.paginated(res, 'Students retrieved successfully', result.data, result.pagination);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getStudentById(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return ResponseUtil.error(res, 'Student ID is required', 400);
      }

      const studentService = this.getService(req);
      const student = await studentService.getStudentById(
        id,
        req.schoolId,
        req.isSuperAdmin || false
      );

      if (!student) {
        return ResponseUtil.notFound(res, 'Student');
      }

      return ResponseUtil.success(res, 'Student retrieved successfully', student);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getStudentByAdmissionNo(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { admissionNo } = req.params;

      if (!admissionNo) {
        return ResponseUtil.error(res, 'Admission number is required', 400);
      }

      const studentService = this.getService(req);
      const student = await studentService.getStudentByAdmissionNo(admissionNo);

      if (!student) {
        return ResponseUtil.notFound(res, 'Student');
      }

      return ResponseUtil.success(res, 'Student retrieved successfully', student);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async updateStudent(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return ResponseUtil.error(res, 'Student ID is required', 400);
      }

      const studentService = this.getService(req);
      const student = await studentService.updateStudent(id, req.body, req.schoolId, req.isSuperAdmin);

      return ResponseUtil.success(res, 'Student updated successfully', student);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Student');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async enrollStudent(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { studentId, classId, academicYearId } = req.body;

      if (!studentId || !classId || !academicYearId) {
        return ResponseUtil.validationError(res, 'Required fields: studentId, classId, academicYearId');
      }

      const studentService = this.getService(req);
      const enrollment = await studentService.enrollStudent(req.body);
      return ResponseUtil.created(res, 'Student enrolled successfully', enrollment);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async updateEnrollmentStatus(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { enrollmentId } = req.params;
      const { status } = req.body;

      if (!enrollmentId) {
        return ResponseUtil.error(res, 'Enrollment ID is required', 400);
      }

      if (!status) {
        return ResponseUtil.validationError(res, 'Status is required');
      }

      const studentService = this.getService(req);
      const enrollment = await studentService.updateEnrollmentStatus(enrollmentId, status);
      return ResponseUtil.success(res, 'Enrollment status updated successfully', enrollment);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Enrollment');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async promoteStudent(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { studentId, currentClassId, newClassId, academicYearId } = req.body;

      if (!studentId || !currentClassId || !newClassId || !academicYearId) {
        return ResponseUtil.validationError(res, 'Required fields: studentId, currentClassId, newClassId, academicYearId');
      }

      const studentService = this.getService(req);
      const promotion = await studentService.promoteStudent(req.body);
      return ResponseUtil.created(res, 'Student promoted successfully', promotion);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async transferStudent(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { studentId, newSchoolId, transferReason } = req.body;

      if (!studentId || !newSchoolId || !transferReason) {
        return ResponseUtil.validationError(res, 'Required fields: studentId, newSchoolId, transferReason');
      }

      const studentService = this.getService(req);
      const transfer = await studentService.transferStudent({
        ...req.body,
        transferDate: new Date(),
      });
      return ResponseUtil.success(res, 'Student transferred successfully', transfer);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Student');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getStudentsByClass(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { classId } = req.params;

      if (!classId) {
        return ResponseUtil.error(res, 'Class ID is required', 400);
      }

      const studentService = this.getService(req);
      const students = await studentService.getStudentsByClass(classId);

      return ResponseUtil.success(res, 'Students retrieved successfully', students, students.length);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getStudentPerformance(req: RequestWithUser, res: Response): Promise<Response> {
    try {
      const { studentId } = req.params;
      const { academicYearId } = req.query;

      if (!studentId) {
        return ResponseUtil.error(res, 'Student ID is required', 400);
      }

      const studentService = this.getService(req);
      const performance = await studentService.getStudentPerformance(studentId, academicYearId as string);
      return ResponseUtil.success(res, 'Student performance retrieved successfully', performance);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }
  async deleteStudent(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;

      const studentService = this.getService(req);
      await studentService.deleteStudent(
        id,
        req.schoolId,
        req.isSuperAdmin || false
      );

      res.json({ message: 'Student deleted successfully' });
    } catch (error: any) {
      res.status(400).json({
        error: 'DELETE_STUDENT_FAILED',
        message: error.message,
      });
    }
  }

  /**
   * Get student statistics
   */
  async getStudentStatistics(req: RequestWithUser, res: Response) {
    try {
      const studentService = this.getService(req);
      const stats = await studentService.getStudentStatistics(
        req.schoolId,
        req.isSuperAdmin || false
      );

      res.json({ data: stats });
    } catch (error: any) {
      res.status(400).json({
        error: 'GET_STATS_FAILED',
        message: error.message,
      });
    }
  }
}
