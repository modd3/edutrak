import { Request, Response } from 'express';
import prisma from '../database/client';
import { ResponseUtil, ErrorMessages } from '../utils/response';
import logger from '../utils/logger';

/**
 * Assign a student to a class for an academic year
 */
export const assignStudentToClass = async (req: Request, res: Response) => {
  try {
    const { studentId, classId, academicYearId, streamId, selectedSubjects } = req.body;

    // Validate required fields
    if (!studentId || !classId || !academicYearId) {
      return ResponseUtil.validationError(res, 'studentId, classId, and academicYearId are required');
    }

    // Check if student already has an active assignment for this academic year
    const existing = await prisma.studentClass.findFirst({
      where: { 
        studentId, 
        academicYearId, 
        status: 'ACTIVE' 
      },
    });

    if (existing) {
      return ResponseUtil.conflict(res, 'Student already assigned to a class this year');
    }

    // Create the assignment
    const record = await prisma.studentClass.create({
      data: {
        studentId,
        classId,
        academicYearId,
        streamId,
        selectedSubjects: selectedSubjects || [],
        status: 'ACTIVE',
      },
      include: {
        student: true,
        class: {
          include: {
            school: true,
          },
        },
        stream: true,
        academicYear: true,
      },
    });

    logger.info('Student assigned to class', {
      studentId,
      classId,
      academicYearId,
      recordId: record.id,
    });

    return ResponseUtil.created(res, 'Student assigned to class successfully', record);
  } catch (err: any) {
    logger.error('Error assigning student to class', { error: err.message, studentId: req.body.studentId });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get all students in a class for a given year
 */
export const getStudentsInClass = async (req: Request, res: Response) => {
  try {
    const { classId, academicYearId } = req.params;
    const { status = 'ACTIVE' } = req.query;

    // Validate parameters
    if (!classId || !academicYearId) {
      return ResponseUtil.validationError(res, 'classId and academicYearId are required');
    }

    const students = await prisma.studentClass.findMany({
      where: {
        classId,
        academicYearId,
        status: status as any,
      },
      include: { 
        student: {
          include: {
            guardians: {
              include: {
                guardian: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        stream: true,
        class: true,
      },
      orderBy: {
        student: {
          firstName: 'asc',
        },
      },
    });

    logger.info('Students in class fetched', {
      classId,
      academicYearId,
      count: students.length,
    });

    return ResponseUtil.success(
      res, 
      'Students fetched successfully', 
      students, 
      students.length
    );
  } catch (err: any) {
    logger.error('Error fetching students in class', { 
      error: err.message, 
      classId: req.params.classId 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get a single student's class assignment
 */
export const getStudentClassAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.studentClass.findUnique({
      where: { id },
      include: {
        student: true,
        class: {
          include: {
            school: true,
            classTeacher: {
              include: {
                user: true,
              },
            },
          },
        },
        stream: {
          include: {
            streamTeacher: {
              include: {
                user: true,
              },
            },
          },
        },
        academicYear: true,
        promotedTo: true,
      },
    });

    if (!assignment) {
      return ResponseUtil.notFound(res, 'Student class assignment');
    }

    return ResponseUtil.success(res, 'Assignment fetched successfully', assignment);
  } catch (err: any) {
    logger.error('Error fetching student class assignment', { 
      error: err.message, 
      id: req.params.id 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Update student class assignment (e.g., change stream, add selected subjects)
 */
export const updateStudentClassAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { streamId, selectedSubjects, status } = req.body;

    const existing = await prisma.studentClass.findUnique({
      where: { id },
    });

    if (!existing) {
      return ResponseUtil.notFound(res, 'Student class assignment');
    }

    const updated = await prisma.studentClass.update({
      where: { id },
      data: {
        ...(streamId !== undefined && { streamId }),
        ...(selectedSubjects !== undefined && { selectedSubjects }),
        ...(status !== undefined && { status }),
      },
      include: {
        student: true,
        class: true,
        stream: true,
      },
    });

    logger.info('Student class assignment updated', { id, updates: req.body });

    return ResponseUtil.success(res, 'Assignment updated successfully', updated);
  } catch (err: any) {
    logger.error('Error updating student class assignment', { 
      error: err.message, 
      id: req.params.id 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Promote a student to another class for the next year
 */
export const promoteStudent = async (req: Request, res: Response) => {
  try {
    const { studentId, currentClassId, toClassId, nextAcademicYearId, promotionDate } = req.body;

    // Validate required fields
    if (!studentId || !currentClassId || !toClassId || !nextAcademicYearId) {
      return ResponseUtil.validationError(
        res, 
        'studentId, currentClassId, toClassId, and nextAcademicYearId are required'
      );
    }

    // Find the current active enrollment
    const currentEnrollment = await prisma.studentClass.findFirst({
      where: { 
        studentId, 
        classId: currentClassId, 
        status: 'ACTIVE' 
      },
    });

    if (!currentEnrollment) {
      return ResponseUtil.notFound(res, 'Active student enrollment');
    }

    // Check if student already has an enrollment in the next academic year
    const existingNextYear = await prisma.studentClass.findFirst({
      where: {
        studentId,
        academicYearId: nextAcademicYearId,
        status: 'ACTIVE',
      },
    });

    if (existingNextYear) {
      return ResponseUtil.conflict(res, 'Student already has an active enrollment for next academic year');
    }

    // Use transaction to ensure both operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Mark old record as promoted
      await tx.studentClass.update({
        where: { id: currentEnrollment.id },
        data: { 
          status: 'PROMOTED', 
          promotedToId: toClassId,
          promotionDate: promotionDate ? new Date(promotionDate) : new Date(),
        },
      });

      // Create new record for next year
      const promoted = await tx.studentClass.create({
        data: {
          studentId,
          classId: toClassId,
          academicYearId: nextAcademicYearId,
          status: 'ACTIVE',
          // Optionally carry over stream assignment or selected subjects
          selectedSubjects: currentEnrollment.selectedSubjects,
        },
        include: {
          student: true,
          class: {
            include: {
              school: true,
            },
          },
          academicYear: true,
        },
      });

      return promoted;
    });

    logger.info('Student promoted successfully', {
      studentId,
      fromClassId: currentClassId,
      toClassId,
      nextAcademicYearId,
    });

    return ResponseUtil.success(res, 'Student promoted successfully', result);
  } catch (err: any) {
    logger.error('Error promoting student', { 
      error: err.message, 
      studentId: req.body.studentId 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Transfer a student from one school to another
 */
export const transferStudent = async (req: Request, res: Response) => {
  try {
    const { studentId, currentClassId, transferDate, transferReason } = req.body;

    if (!studentId || !currentClassId) {
      return ResponseUtil.validationError(res, 'studentId and currentClassId are required');
    }

    // Mark current enrollment as transferred
    const updated = await prisma.studentClass.updateMany({
      where: { 
        studentId, 
        classId: currentClassId, 
        status: 'ACTIVE' 
      },
      data: { 
        status: 'TRANSFERRED',
        transferDate: transferDate ? new Date(transferDate) : new Date(),
      },
    });

    if (updated.count === 0) {
      return ResponseUtil.notFound(res, 'Active student enrollment');
    }

    logger.info('Student transferred', {
      studentId,
      classId: currentClassId,
      transferDate,
    });

    return ResponseUtil.success(
      res, 
      'Student marked as transferred successfully', 
      { studentId, status: 'TRANSFERRED', transferDate }
    );
  } catch (err: any) {
    logger.error('Error transferring student', { 
      error: err.message, 
      studentId: req.body.studentId 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get student enrollment history
 */
export const getStudentEnrollmentHistory = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const history = await prisma.studentClass.findMany({
      where: { studentId },
      include: {
        class: {
          include: {
            school: true,
          },
        },
        stream: true,
        academicYear: true,
        promotedTo: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (history.length === 0) {
      return ResponseUtil.notFound(res, 'Student enrollment history');
    }

    return ResponseUtil.success(
      res, 
      'Enrollment history fetched successfully', 
      history, 
      history.length
    );
  } catch (err: any) {
    logger.error('Error fetching student enrollment history', { 
      error: err.message, 
      studentId: req.params.studentId 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};