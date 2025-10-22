import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { successResponse, errorResponse } from '../utils/response';

export const assignClassSubject = async (req: Request, res: Response) => {
  try {
    const { classId, subjectId, teacherId, academicYearId, termId } = req.body;

    const existing = await prisma.classSubject.findFirst({
      where: { classId, subjectId, academicYearId, termId },
    });

    if (existing) return errorResponse(res, 400, 'This subject already assigned to this class and term');

    const mapping = await prisma.classSubject.create({
      data: {
        classId: Number(classId),
        subjectId: Number(subjectId),
        teacherId: Number(teacherId),
        academicYearId: Number(academicYearId),
        termId: Number(termId),
      },
    });

    return successResponse(res, 201, 'Subject assigned successfully', mapping);
  } catch (err) {
    return errorResponse(res, 500, 'Error assigning class subject', err);
  }
};

export const getClassSubjects = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const mappings = await prisma.classSubject.findMany({
      where: { classId: Number(classId) },
      include: { subject: true, teacher: true, term: true },
    });
    return successResponse(res, 200, 'Class subjects fetched', mappings);
  } catch (err) {
    return errorResponse(res, 500, 'Error fetching class subjects', err);
  }
};
