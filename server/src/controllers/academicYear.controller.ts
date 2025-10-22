import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { successResponse, errorResponse } from '../utils/response';

export const createAcademicYear = async (req: Request, res: Response) => {
  try {
    const { name, startDate, endDate } = req.body;

    const existing = await prisma.academicYear.findFirst({ where: { name } });
    if (existing) return errorResponse(res, 400, 'Academic year already exists');

    const year = await prisma.academicYear.create({
      data: { name, startDate: new Date(startDate), endDate: new Date(endDate) },
    });

    return successResponse(res, 201, 'Academic year created successfully', year);
  } catch (err) {
    return errorResponse(res, 500, 'Error creating academic year', err);
  }
};

export const getAcademicYears = async (_req: Request, res: Response) => {
  try {
    const years = await prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' },
    });
    return successResponse(res, 200, 'Academic years fetched successfully', years);
  } catch (err) {
    return errorResponse(res, 500, 'Error fetching academic years', err);
  }
};
