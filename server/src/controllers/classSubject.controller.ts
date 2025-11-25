import { Request, Response } from 'express';
import prisma from '../database/client';
import { ResponseUtil } from '../utils/response';
import { error } from 'console';

export const assignClassSubject = async (req: Request, res: Response) => {
  try {
    const { classId, subjectId, teacherId, academicYearId, termId } = req.body;

    const existing = await prisma.classSubject.findFirst({
      where: { classId, subjectId, academicYearId, termId },
    });

    if (existing) return ResponseUtil.error(res, 'This subject already assigned to this class and term', 400);

    const mapping = await prisma.classSubject.create({
      data: {
        classId,
        subjectId,
        teacherId,
        academicYearId,
        termId,
      },
    });

    return ResponseUtil.success(res, 'Subject assigned successfully', mapping);
  } catch (err) {
    return ResponseUtil.serverError(res, 'Error assigning class subject');
  }
};

export const getClassSubjects = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const mappings = await prisma.classSubject.findMany({
      where: { classId: String(classId) },
      include: { subject: true, teacherProfile: true, term: true },
    });
    return ResponseUtil.success(res, 'Class subjects fetched', mappings);
  } catch (err) {
    return ResponseUtil.serverError(res, 'Error fetching class subjects');
  }
};
