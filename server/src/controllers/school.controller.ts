import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { successResponse, errorResponse } from '../utils/response';

/**
 * Create a new school with Kenyan-specific details
 */
export const createSchool = async (req: Request, res: Response) => {
  try {
    const {
      name,
      registrationNo,
      type,
      county,
      subCounty,
      ward,
      knecCode,
      nemisCode,
      phone,
      email,
      ownership,
      boardingStatus,
      gender,
    } = req.body;

    // Check for duplicate
    const existing = await prisma.school.findFirst({
      where: {
        OR: [
          { registrationNo },
          { knecCode },
          { nemisCode },
        ],
      },
    });

    if (existing) {
      return errorResponse(res, 400, 'School with this registration/KNEC/NEMIS code already exists');
    }

    const school = await prisma.school.create({
      data: {
        name,
        registrationNo,
        type,
        county,
        subCounty,
        ward,
        knecCode,
        nemisCode,
        phone,
        email,
        ownership,
        boardingStatus,
        gender,
      },
    });

    return successResponse(res, 201, 'School created successfully', school);
  } catch (err) {
    return errorResponse(res, 500, 'Error creating school', err);
  }
};

/**
 * Get schools with filtering
 */
export const getSchools = async (req: Request, res: Response) => {
  try {
    const { county, type, ownership } = req.query;

    const where: any = {};
    if (county) where.county = county;
    if (type) where.type = type;
    if (ownership) where.ownership = ownership;

    const schools = await prisma.school.findMany({
      where,
      include: {
        _count: {
          select: {
            students: true,
            users: true,
            classes: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return successResponse(res, 200, 'Schools fetched successfully', schools);
  } catch (err) {
    return errorResponse(res, 500, 'Error fetching schools', err);
  }
};

/**
 * Get school statistics
 */
export const getSchoolStats = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;

    const stats = await prisma.school.findUnique({
      where: { id: Number(schoolId) },
      include: {
        _count: {
          select: {
            students: true,
            users: true,
            classes: true,
            streams: true,
          },
        },
      },
    });

    if (!stats) {
      return errorResponse(res, 404, 'School not found');
    }

    // Get enrollment by gender
    const maleCount = await prisma.student.count({
      where: { schoolId: Number(schoolId), gender: 'MALE' },
    });

    const femaleCount = await prisma.student.count({
      where: { schoolId: Number(schoolId), gender: 'FEMALE' },
    });

    // Get teacher count
    const teacherCount = await prisma.user.count({
      where: { schoolId: Number(schoolId), role: 'TEACHER', isActive: true },
    });

    return successResponse(res, 200, 'School statistics fetched', {
      ...stats,
      genderDistribution: {
        male: maleCount,
        female: femaleCount,
      },
      teacherCount,
    });
  } catch (err) {
    return errorResponse(res, 500, 'Error fetching school statistics', err);
  }
};

/**
 * Update school details
 */
export const updateSchool = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const updateData = req.body;

    const school = await prisma.school.update({
      where: { id: Number(schoolId) },
      data: updateData,
    });

    return successResponse(res, 200, 'School updated successfully', school);
  } catch (err) {
    return errorResponse(res, 500, 'Error updating school', err);
  }
};