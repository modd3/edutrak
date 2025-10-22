import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { successResponse, errorResponse } from '../utils/response';

export const createClass = async (req: Request, res: Response) => {
  try {
    const { name, grade, academicYearId, schoolId, classTeacherId } = req.body;

    const existing = await prisma.class.findFirst({
      where: { name, academicYearId },
    });
    if (existing) return errorResponse(res, 400, 'Class already exists for this year');

    const newClass = await prisma.class.create({
      data: {
        name,
        grade,
        academicYearId: Number(academicYearId),
        schoolId: Number(schoolId),
        classTeacherId: classTeacherId ? Number(classTeacherId) : null,
      },
    });

    return successResponse(res, 201, 'Class created successfully', newClass);
  } catch (err) {
    return errorResponse(res, 500, 'Error creating class', err);
  }
};

export const getClasses = async (_req: Request, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      include: { academicYear: true, school: true, classTeacher: true },
      orderBy: { name: 'asc' },
    });
    return successResponse(res, 200, 'Classes fetched successfully', classes);
  } catch (err) {
    return errorResponse(res, 500, 'Error fetching classes', err);
  }
};
