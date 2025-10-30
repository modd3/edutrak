import { Request, Response } from 'express';
import { StudentService } from '../services/student.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';
import { Role } from '@prisma/client';

const studentService = new StudentService();

export class StudentController {
  async createStudent(req: Request, res: Response): Promise<Response> {
    try {
      const { admissionNo, firstName, lastName, gender, schoolId } = req.body;
      
      if (!admissionNo || !firstName || !lastName || !gender || !schoolId) {
        return ResponseUtil.validationError(res, 'Required fields: admissionNo, firstName, lastName, gender, schoolId');
      }

      const student = await studentService.createStudent(req.body);
      return ResponseUtil.created(res, 'Student created successfully', student);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'Student with this admission number, UPI, or NEMIS UPI already exists');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async createStudentWithUser(req: Request, res: Response): Promise<Response> {
    try {
      const currentUser = req.user!;
      const { admissionNo, firstName, lastName, gender, schoolId, email } = req.body;
      
      if (!admissionNo || !firstName || !lastName || !gender || !schoolId || !email) {
        return ResponseUtil.validationError(res, 'Required fields: admissionNo, firstName, lastName, gender, schoolId, email');
      }

      const student = await studentService.createStudentWithUser(req.body, {
        userId: currentUser.userId,
        role: currentUser.role as Role
      });
      return ResponseUtil.created(res, 'Student with user account created successfully', student);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'Student or user with these details already exists');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getStudents(req: Request, res: Response): Promise<Response> {
    try {
      const filters = req.query;
      const result = await studentService.getStudents({
        schoolId: filters.schoolId as string,
        gender: filters.gender as any,
        hasSpecialNeeds: filters.hasSpecialNeeds ? filters.hasSpecialNeeds === 'true' : undefined,
        classId: filters.classId as string,
        streamId: filters.streamId as string,
        status: filters.status as any,
        page: filters.page ? parseInt(filters.page as string) : undefined,
        limit: filters.limit ? parseInt(filters.limit as string) : undefined,
        search: filters.search as string,
      });
      
      return ResponseUtil.paginated(res, 'Students retrieved successfully', result.students, result.pagination);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getStudentById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Student ID is required', 400);
      }
      
      const student = await studentService.getStudentById(id);
      
      if (!student) {
        return ResponseUtil.notFound(res, 'Student');
      }

      return ResponseUtil.success(res, 'Student retrieved successfully', student);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getStudentByAdmissionNo(req: Request, res: Response): Promise<Response> {
    try {
      const { admissionNo } = req.params;
      
      if (!admissionNo) {
        return ResponseUtil.error(res, 'Admission number is required', 400);
      }
      
      const student = await studentService.getStudentByAdmissionNo(admissionNo);
      
      if (!student) {
        return ResponseUtil.notFound(res, 'Student');
      }

      return ResponseUtil.success(res, 'Student retrieved successfully', student);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async updateStudent(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Student ID is required', 400);
      }
      
      const student = await studentService.updateStudent(id, req.body);
      
      return ResponseUtil.success(res, 'Student updated successfully', student);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Student');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async enrollStudent(req: Request, res: Response): Promise<Response> {
    try {
      const { studentId, classId, academicYearId } = req.body;
      
      if (!studentId || !classId || !academicYearId) {
        return ResponseUtil.validationError(res, 'Required fields: studentId, classId, academicYearId');
      }

      const enrollment = await studentService.enrollStudent(req.body);
      return ResponseUtil.created(res, 'Student enrolled successfully', enrollment);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async updateEnrollmentStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { enrollmentId } = req.params;
      const { status } = req.body;
      
      if (!enrollmentId) {
        return ResponseUtil.error(res, 'Enrollment ID is required', 400);
      }
      
      if (!status) {
        return ResponseUtil.validationError(res, 'Status is required');
      }

      const enrollment = await studentService.updateEnrollmentStatus(enrollmentId, status);
      return ResponseUtil.success(res, 'Enrollment status updated successfully', enrollment);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Enrollment');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async promoteStudent(req: Request, res: Response): Promise<Response> {
    try {
      const { studentId, currentClassId, newClassId, academicYearId } = req.body;
      
      if (!studentId || !currentClassId || !newClassId || !academicYearId) {
        return ResponseUtil.validationError(res, 'Required fields: studentId, currentClassId, newClassId, academicYearId');
      }

      const promotion = await studentService.promoteStudent(req.body);
      return ResponseUtil.created(res, 'Student promoted successfully', promotion);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async transferStudent(req: Request, res: Response): Promise<Response> {
    try {
      const { studentId, newSchoolId, transferReason } = req.body;
      
      if (!studentId || !newSchoolId || !transferReason) {
        return ResponseUtil.validationError(res, 'Required fields: studentId, newSchoolId, transferReason');
      }

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

  async addGuardianToStudent(req: Request, res: Response): Promise<Response> {
    try {
      const { studentId, guardianId } = req.body;
      
      if (!studentId || !guardianId) {
        return ResponseUtil.validationError(res, 'Required fields: studentId, guardianId');
      }

      const relationship = await studentService.addGuardianToStudent(req.body);
      return ResponseUtil.created(res, 'Guardian added to student successfully', relationship);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'Guardian already assigned to this student');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getStudentsByClass(req: Request, res: Response): Promise<Response> {
    try {
      const { classId } = req.params;
      
      if (!classId) {
        return ResponseUtil.error(res, 'Class ID is required', 400);
      }
      
      const students = await studentService.getStudentsByClass(classId);
      
      return ResponseUtil.success(res, 'Students retrieved successfully', students, students.length);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getStudentPerformance(req: Request, res: Response): Promise<Response> {
    try {
      const { studentId } = req.params;
      const { academicYearId } = req.query;
      
      if (!studentId) {
        return ResponseUtil.error(res, 'Student ID is required', 400);
      }
      
      const performance = await studentService.getStudentPerformance(studentId, academicYearId as string);
      return ResponseUtil.success(res, 'Student performance retrieved successfully', performance);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async bulkCreateStudents(req: Request, res: Response): Promise<Response> {
    try {
      const currentUser = req.user!;
      const { students, schoolId } = req.body;
      
      if (!students || !Array.isArray(students) || students.length === 0) {
        return ResponseUtil.validationError(res, 'Students array is required');
      }
      if (!schoolId) {
        return ResponseUtil.validationError(res, 'School ID is required');
      }

      const result = await studentService.bulkCreateStudents(students, schoolId, currentUser.userId);
      return ResponseUtil.success(res, 'Bulk student creation completed', result);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }
}