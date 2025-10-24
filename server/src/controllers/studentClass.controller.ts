import { Request, Response } from 'express';
import prisma from '../prismaClient.ts.old';
import { successResponse, errorResponse } from '../utils/response';

/**
 * Assign a student to a class for an academic year
 */
export const assignStudentToClass = async (req: Request, res: Response) => {
  try {
    const { studentId, classId, academicYearId } = req.body;

    const existing = await prisma.studentClass.findFirst({
      where: { studentId, academicYearId, status: 'active' },
    });

    if (existing)
      return errorResponse(res, 400, 'Student already assigned to a class this year');

    const record = await prisma.studentClass.create({
      data: {
        studentId: Number(studentId),
        classId: Number(classId),
        academicYearId: Number(academicYearId),
      },
    });

    return successResponse(res, 201, 'Student assigned to class successfully', record);
  } catch (err) {
    return errorResponse(res, 500, 'Error assigning student to class', err);
  }
};

/**
 * Get all students in a class for a given year
 */
export const getStudentsInClass = async (req: Request, res: Response) => {
  try {
    const { classId, academicYearId } = req.params;

    const students = await prisma.studentClass.findMany({
      where: {
        classId: Number(classId),
        academicYearId: Number(academicYearId),
        status: 'active',
      },
      include: { student: { include: { user: true } } },
    });

    return successResponse(res, 200, 'Students fetched successfully', students);
  } catch (err) {
    return errorResponse(res, 500, 'Error fetching students in class', err);
  }
};

/**
 * Promote a student to another class for the next year
 */
export const promoteStudent = async (req: Request, res: Response) => {
  try {
    const { studentId, fromClassId, toClassId, nextAcademicYearId } = req.body;

    // Mark old record as promoted
    await prisma.studentClass.updateMany({
      where: { studentId, classId: fromClassId, status: 'active' },
      data: { status: 'promoted', promotedToId: toClassId },
    });

    // Create new record
    const promoted = await prisma.studentClass.create({
      data: {
        studentId,
        classId: toClassId,
        academicYearId: nextAcademicYearId,
        status: 'active',
      },
    });

    return successResponse(res, 200, 'Student promoted successfully', promoted);
  } catch (err) {
    return errorResponse(res, 500, 'Error promoting student', err);
  }
};
