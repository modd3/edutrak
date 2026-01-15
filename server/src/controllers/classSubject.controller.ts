// src/controllers/class-subject.controller.ts
import { Request, Response } from 'express';
import { ClassSubjectService } from '../services/class-subject.service';
import { ResponseUtil} from '../utils/response'; // Assuming you have these helpers

const service = new ClassSubjectService();

export class ClassSubjectController {
  
  // POST /api/class-subjects
  async assignSubject(req: Request, res: Response) {
    try {
      const { 
        classId, 
        subjectId, 
        academicYearId, 
        termId, 
        streamId, 
        teacherId, 
        subjectCategory 
      } = req.body;

      const schoolId = req.user?.schoolId; // Assumes auth middleware attaches user

      if (!schoolId) return ResponseUtil.error(res, 'School context required', 400);

      const result = await service.assignSubjectToClass({
        classId,
        subjectId,
        academicYearId,
        termId,
        streamId,
        teacherId,
        schoolId,
        subjectCategory
      });

      return ResponseUtil.success(res, 'Subject assigned to class successfully', result);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 500);
    }
  }

  // PATCH /api/class-subjects/:id/teacher
  async assignTeacher(req: Request, res: Response) {
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
  async getByClass(req: Request, res: Response) {
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
}