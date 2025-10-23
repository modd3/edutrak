import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { successResponse, errorResponse } from '../utils/response';
import { hashPassword } from '../utils/hash';

/**
 * Register a new student with Kenyan-specific details
 */
export const registerStudent = async (req: Request, res: Response) => {
  try {
    const {
      admissionNo,
      upiNumber,
      nemisUpi,
      firstName,
      middleName,
      lastName,
      gender,
      dob,
      birthCertNo,
      nationality,
      county,
      subCounty,
      hasSpecialNeeds,
      specialNeedsType,
      medicalCondition,
      allergies,
      schoolId,
      guardians, // Array of guardian details
    } = req.body;

    // Check for duplicate admission number or UPI
    const existing = await prisma.student.findFirst({
      where: {
        OR: [
          { admissionNo },
          { upiNumber },
          { nemisUpi },
        ],
      },
    });

    if (existing) {
      return errorResponse(res, 400, 'Student with this admission number or UPI already exists');
    }

    // Create student with transaction for guardians
    const result = await prisma.$transaction(async (tx) => {
      // Create student
      const student = await tx.student.create({
        data: {
          admissionNo,
          upiNumber,
          nemisUpi,
          firstName,
          middleName,
          lastName,
          gender,
          dob: dob ? new Date(dob) : null,
          birthCertNo,
          nationality: nationality || 'Kenyan',
          county,
          subCounty,
          hasSpecialNeeds: hasSpecialNeeds || false,
          specialNeedsType,
          medicalCondition,
          allergies,
          schoolId: schoolId ? Number(schoolId) : null,
        },
      });

      // Create guardians if provided
      if (guardians && guardians.length > 0) {
        for (const guardianData of guardians) {
          // Create user account for guardian
          const hashedPassword = await hashPassword(guardianData.password || 'password123');
          
          const user = await tx.user.create({
            data: {
              email: guardianData.email,
              password: hashedPassword,
              firstName: guardianData.firstName,
              lastName: guardianData.lastName,
              phone: guardianData.phone,
              idNumber: guardianData.idNumber,
              role: 'PARENT',
              schoolId: schoolId ? Number(schoolId) : null,
            },
          });

          const guardian = await tx.guardian.create({
            data: {
              userId: user.id,
              relationship: guardianData.relationship,
              occupation: guardianData.occupation,
              employer: guardianData.employer,
              workPhone: guardianData.workPhone,
            },
          });

          // Link student to guardian
          await tx.studentGuardian.create({
            data: {
              studentId: student.id,
              guardianId: guardian.id,
              isPrimary: guardianData.isPrimary || false,
            },
          });
        }
      }

      return student;
    });

    return successResponse(res, 201, 'Student registered successfully', result);
  } catch (err) {
    return errorResponse(res, 500, 'Error registering student', err);
  }
};

/**
 * Get students with advanced filtering
 */
export const getStudents = async (req: Request, res: Response) => {
  try {
    const { 
      schoolId, 
      classId, 
      gender, 
      hasSpecialNeeds, 
      county,
      search 
    } = req.query;

    const where: any = {};
    if (schoolId) where.schoolId = Number(schoolId);
    if (gender) where.gender = gender;
    if (hasSpecialNeeds !== undefined) where.hasSpecialNeeds = hasSpecialNeeds === 'true';
    if (county) where.county = county;

    // Search by name or admission number
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { admissionNo: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Filter by class if provided
    if (classId) {
      where.enrollments = {
        some: {
          classId: Number(classId),
          status: 'ACTIVE',
        },
      };
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        school: { select: { name: true } },
        guardians: {
          include: {
            guardian: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, phone: true, email: true },
                },
              },
            },
          },
        },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            class: true,
            stream: true,
          },
        },
      },
      orderBy: { admissionNo: 'asc' },
    });

    return successResponse(res, 200, 'Students promoted successfully', {
      updated: results.length,
      newEnrollments: newEnrollments.length,
    });
  } catch (err) {
    return errorResponse(res, 500, 'Error promoting students', err);
  }
};

/**
 * Get students needing special attention
 */
export const getSpecialNeedsStudents = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.query;

    const where: any = { hasSpecialNeeds: true };
    if (schoolId) where.schoolId = Number(schoolId);

    const students = await prisma.student.findMany({
      where,
      include: {
        school: { select: { name: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { class: true, stream: true },
        },
      },
    });

    return successResponse(res, 200, 'Special needs students fetched', students);
  } catch (err) {
    return errorResponse(res, 500, 'Error fetching special needs students', err);
  }
}; 'Students fetched successfully', students);
  } catch (err) {
    return errorResponse(res, 500, 'Error fetching students', err);
  }
};

/**
 * Get student details with complete profile
 */
export const getStudentProfile = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: Number(studentId) },
      include: {
        school: true,
        guardians: {
          include: {
            guardian: {
              include: {
                user: {
                  select: { 
                    firstName: true, 
                    lastName: true, 
                    phone: true, 
                    email: true,
                    idNumber: true,
                  },
                },
              },
            },
          },
        },
        enrollments: {
          include: {
            class: {
              include: {
                curriculum: true,
              },
            },
            stream: true,
            academicYear: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        assessments: {
          include: {
            classSubject: {
              include: {
                subject: true,
              },
            },
            term: true,
          },
          orderBy: { assessedDate: 'desc' },
          take: 10, // Last 10 assessments
        },
      },
    });

    if (!student) {
      return errorResponse(res, 404, 'Student not found');
    }

    return successResponse(res, 200, 'Student profile fetched', student);
  } catch (err) {
    return errorResponse(res, 500, 'Error fetching student profile', err);
  }
};

/**
 * Update student details
 */
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const updateData = req.body;

    // Convert date strings to Date objects if present
    if (updateData.dob) {
      updateData.dob = new Date(updateData.dob);
    }

    const student = await prisma.student.update({
      where: { id: Number(studentId) },
      data: updateData,
    });

    return successResponse(res, 200, 'Student updated successfully', student);
  } catch (err) {
    return errorResponse(res, 500, 'Error updating student', err);
  }
};

/**
 * Enroll student in a class
 */
export const enrollStudent = async (req: Request, res: Response) => {
  try {
    const { studentId, classId, streamId, academicYearId, selectedSubjects } = req.body;

    // Check if student is already enrolled in active class for this year
    const existing = await prisma.studentClass.findFirst({
      where: {
        studentId: Number(studentId),
        academicYearId: Number(academicYearId),
        status: 'ACTIVE',
      },
    });

    if (existing) {
      return errorResponse(res, 400, 'Student already enrolled in an active class this year');
    }

    const enrollment = await prisma.studentClass.create({
      data: {
        studentId: Number(studentId),
        classId: Number(classId),
        streamId: streamId ? Number(streamId) : null,
        academicYearId: Number(academicYearId),
        selectedSubjects: selectedSubjects || [],
      },
      include: {
        class: true,
        stream: true,
        student: true,
      },
    });

    return successResponse(res, 201, 'Student enrolled successfully', enrollment);
  } catch (err) {
    return errorResponse(res, 500, 'Error enrolling student', err);
  }
};

/**
 * Promote students in bulk
 */
export const promoteStudents = async (req: Request, res: Response) => {
  try {
    const { studentIds, fromClassId, toClassId, nextAcademicYearId } = req.body;

    const results = await prisma.$transaction(
      studentIds.map((studentId: number) => 
        prisma.studentClass.updateMany({
          where: {
            studentId,
            classId: fromClassId,
            status: 'ACTIVE',
          },
          data: {
            status: 'PROMOTED',
            promotedToId: toClassId,
            promotionDate: new Date(),
          },
        })
      )
    );

    // Create new enrollments
    const newEnrollments = await prisma.$transaction(
      studentIds.map((studentId: number) =>
        prisma.studentClass.create({
          data: {
            studentId,
            classId: toClassId,
            academicYearId: nextAcademicYearId,
            status: 'ACTIVE',
          },
        })
      )
    );

    return successResponse(res, 200, 'Students promoted successfully', {
      updated: results.length,
      newEnrollments: newEnrollments.length,
    });
  } catch (err) {
    return errorResponse(res, 500, 'Error promoting students', err);
  }
};
  