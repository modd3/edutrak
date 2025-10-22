import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { successResponse, errorResponse } from '../utils/response';

export const createTerm = async (req: Request, res: Response) => {
  try {
    const { name, academicYearId, startDate, endDate } = req.body;

    const existing = await prisma.term.findFirst({
      where: { name, academicYearId },
    });
    if (existing) return errorResponse(res, 400, 'Term already exists for this year');

    const term = await prisma.term.create({
      data: {
        name,
        academicYearId: Number(academicYearId),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    return successResponse(res, 201, 'Term created successfully', term);
  } catch (err) {
    return errorResponse(res, 500, 'Error creating term', err);
  }
};

export const getTerms = async (_req: Request, res: Response) => {
  try {
    const terms = await prisma.term.findMany({
      include: { academicYear: true },
      orderBy: { startDate: 'desc' },
    });
    return successResponse(res, 200, 'Terms fetched successfully', terms);
  } catch (err) {
    return errorResponse(res, 500, 'Error fetching terms', err);
  }
};
