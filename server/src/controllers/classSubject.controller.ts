// src/controllers/class-subject.controller.ts
import { Request, Response } from 'express';
import { ClassSubjectService } from '../services/class-subject.service';
import { ResponseUtil} from '../utils/response'; 
import { RequestWithUser } from '@/middleware/school-context';

const service = new ClassSubjectService();

export class ClassSubjectController {
  
  // POST /api/class-subjects
  async assignSubject(req: RequestWithUser, res: Response) {
    try {
      const { 
        classId, 
        subjectId, 
        academicYearId, 
        termId, 
        streamId, 
        teacherId
      } = req.body;

      const schoolId = req.user?.schoolId;

      if (!schoolId) return ResponseUtil.error(res, 'School context required', 400);

      const result = await service.assignSubjectToClass({
        classId,
        subjectId,
        academicYearId,
        termId,
        streamId,
        teacherId,
        schoolId
      });

      return ResponseUtil.success(res, 'Subject assigned to class successfully', result);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 500);
    }
  }

  // PATCH /api/class-subjects/:id/teacher
  async assignTeacher(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const { teacherId } = req.body;

      if (!teacherId) return ResponseUtil.error(res, 'Teacher ID is required', 400);

      const result = await service.assignTeacher(id, teacherId);

      return ResponseUtil.success(res, 'Teacher assigned successfully', result);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  // GET /api/classes/:classId/subjects
  async getByClass(req: RequestWithUser, res: Response) {
    try {
      const { classId } = req.params;
      const { academicYearId, termId } = req.query;

      if (!academicYearId || !termId) {
        return ResponseUtil.error(res, 'Academic Year and Term are required', 400);
      }

      const result = await service.getClassSubjects(
        classId, 
        academicYearId as string, 
        termId as string
      );

      return ResponseUtil.success(res, 'Class subjects fetched successfully', result);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }
  

/**
 * Get students who have selected a specific class subject
 * Used for grade entry - only shows students who are taking this subject
 */
async getClassSubjectStudents  (req: RequestWithUser, res: Response) {
  try {
    const { classSubjectId } = req.params;
    const schoolId = req.user!.schoolId!;

    // Get the class subject details
    const classSubject = await ClassSubjectService.getClassSubjectById(
      classSubjectId,
      schoolId
    );

    if (!classSubject) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Class subject not found',
      });
      return;
    }

    // Get all students enrolled in this class
    const enrollments = await ClassSubjectService.getStudentEnrollmentsForClassSubject(
      classSubject.classId,
      classSubject.streamId,
      schoolId,
      classSubject.subjectCategory !== 'CORE' ? classSubject.subjectId : undefined
    );

    // For all subjects, the enrollments returned are already filtered
    // by StudentClassSubject relationship (handled in service)
    const filteredEnrollments = enrollments;

    res.json({
      data: filteredEnrollments,
      meta: {
        classSubject: {
          id: classSubject.id,
          subjectName: classSubject.subject.name,
          subjectCategory: classSubject.subjectCategory,
          className: classSubject.class.name,
        },
        totalStudents: filteredEnrollments.length,
        isCoreSubject: classSubject.subjectCategory === 'CORE',
      },
    });
  } catch (error) {
    console.error('Error fetching class subject students:', error);
    res.status(500).json({
      error: 'FETCH_FAILED',
      message: 'Failed to fetch students',
    });
  }
};

/**
 * Get class subjects taught by a specific teacher
 */
async getTeacherClassSubjects  (req: RequestWithUser, res: Response) {
  try {
    const { teacherId } = req.params;
    const { termId } = req.query;
    const schoolId = req.user!.schoolId!;

    const classSubjects = await ClassSubjectService.getClassSubjectsByTeacher(
      teacherId,
      schoolId,
      termId as string
    );

    res.json({
      data: classSubjects,
      total: classSubjects.length,
    });
  } catch (error) {
    console.error('Error fetching teacher class subjects:', error);
    res.status(500).json({
      error: 'FETCH_FAILED',
      message: 'Failed to fetch class subjects',
    });
  }
};

/**
 * Auto-assign core subjects to all students in a class
 */
async assignCoreSubjects (req: RequestWithUser, res: Response)  {
  try {
    const { classId } = req.params;
    const schoolId = req.user!.schoolId!;

    // Get all CORE subjects for this class
    const coreSubjects = await ClassSubjectService.getCoreSubjectsForClass(
      classId,
      schoolId
    );

    const coreSubjectIds = coreSubjects.map((cs) => cs.subjectId);

    if (coreSubjectIds.length === 0) {
      res.status(400).json({
        error: 'NO_CORE_SUBJECTS',
        message: 'No core subjects found for this class',
      });
      return;
    }

    // Get all students enrolled in this class
    const enrollments = await ClassSubjectService.getActiveStudentEnrollments(
      classId,
      schoolId
    );

    if (enrollments.length === 0) {
      res.status(400).json({
        error: 'NO_STUDENTS',
        message: 'No active students found in this class',
      });
      return;
    }

    // Note: Core subject auto-enrollment is now handled in StudentService.enrollStudent()
    // via StudentClassSubjectService.autoEnrollCoreSubjects()
    // This endpoint is deprecated and can be removed in favor of auto-enrollment on class enrollment
    res.json({
      message: 'Core subject auto-enrollment is handled during student class enrollment',
      data: {
        studentsWithAutoEnrollment: enrollments.length,
        coreSubjectsCount: coreSubjectIds.length,
        coreSubjectIds,
      },
    });
    return;
  } catch (error) {
    console.error('Error assigning core subjects:', error);
    res.status(500).json({
      error: 'ASSIGN_FAILED',
      message: 'Failed to assign core subjects',
    });
  }
};
}