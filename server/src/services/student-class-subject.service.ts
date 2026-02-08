// src/services/student-class-subject.service.ts
import { PrismaClient, StudentClassSubject, SubjectEnrollmentStatus } from '@prisma/client';
import prisma from '../database/client';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing student enrollments in specific subjects within classes
 * This replaces the previous selectedSubjects JSON array approach with proper relational data
 */
export class StudentClassSubjectService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Enroll a student in a specific subject (for elective/optional subjects)
   * CORE subjects are automatically enrolled when student joins a class
   */
  async enrollStudentInSubject(data: {
    studentId: string;
    classSubjectId: string;
    enrollmentId: string; // Link to StudentClass
    schoolId: string;
  }): Promise<StudentClassSubject> {
    // Validate that the enrollment exists and belongs to the student
    const enrollment = await this.prisma.studentClass.findFirst({
      where: {
        id: data.enrollmentId,
        studentId: data.studentId,
        schoolId: data.schoolId,
      },
    });

    if (!enrollment) {
      throw new Error('Student enrollment not found or does not belong to this school');
    }

    // Validate that the class subject exists and belongs to the class
    const classSubject = await this.prisma.classSubject.findFirst({
      where: {
        id: data.classSubjectId,
        classId: enrollment.classId,
        schoolId: data.schoolId,
      },
      include: {
        subject: true,
      },
    });

    if (!classSubject) {
      throw new Error('Subject not found in this class');
    }

    // Check for duplicate enrollment
    const existing = await this.prisma.studentClassSubject.findFirst({
      where: {
        studentId: data.studentId,
        classSubjectId: data.classSubjectId,
        enrollmentId: data.enrollmentId,
      },
    });

    if (existing) {
      throw new Error('Student is already enrolled in this subject');
    }

    const enrollment_subject = await this.prisma.studentClassSubject.create({
      data: {
        id: uuidv4(),
        studentId: data.studentId,
        classSubjectId: data.classSubjectId,
        enrollmentId: data.enrollmentId,
        schoolId: data.schoolId,
        status: 'ACTIVE',
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
          },
        },
        classSubject: {
          include: {
            subject: true,
          },
        },
      },
    });

    logger.info('Student enrolled in subject', {
      studentId: data.studentId,
      classSubjectId: data.classSubjectId,
      enrollmentId: data.enrollmentId,
    });

    return enrollment_subject;
  }

  /**
   * Bulk enroll students in a subject
   * Handles re-enrollment by updating dropped subjects back to ACTIVE
   */
  async bulkEnrollStudentsInSubject(data: {
    enrollmentIds: string[];
    classSubjectId: string;
    schoolId: string;
  }): Promise<{ enrolled: number; failed: number; enrollments: StudentClassSubject[] }> {
    const enrollments: StudentClassSubject[] = [];
    let failed = 0;

    // Get all enrollments to extract student IDs
    const studentEnrollments = await this.prisma.studentClass.findMany({
      where: {
        id: { in: data.enrollmentIds },
        schoolId: data.schoolId,
      },
      select: {
        id: true,
        studentId: true,
      },
    });

    const results = await this.prisma.$transaction(
      studentEnrollments.map((enrollment) =>
        // Use upsert to handle re-enrollment of dropped subjects
        this.prisma.studentClassSubject.upsert({
          where: {
            studentId_classSubjectId_enrollmentId: {
              studentId: enrollment.studentId,
              classSubjectId: data.classSubjectId,
              enrollmentId: enrollment.id,
            },
          },
          update: {
            status: 'ACTIVE',
            droppedAt: null,
            enrolledAt: new Date(),
          },
          create: {
            id: uuidv4(),
            studentId: enrollment.studentId,
            classSubjectId: data.classSubjectId,
            enrollmentId: enrollment.id,
            schoolId: data.schoolId,
            status: 'ACTIVE',
          },
          include: {
            student: true,
            classSubject: {
              include: {
                subject: true,
              },
            },
          },
        })
      ),
      {
        isolationLevel: 'Serializable',
      }
    );

    logger.info('Bulk enrolled students in subject', {
      count: results.length,
      classSubjectId: data.classSubjectId,
    });

    return {
      enrolled: results.length,
      failed,
      enrollments: results,
    };
  }

  /**
   * Drop a student from a specific subject
   */
  async dropStudentFromSubject(
    enrollmentId: string,
    classSubjectId: string,
    schoolId: string
  ): Promise<StudentClassSubject> {
    const enrollment = await this.prisma.studentClassSubject.findFirst({
      where: {
        enrollmentId,
        classSubjectId,
        schoolId,
      },
    });

    if (!enrollment) {
      throw new Error('Subject enrollment not found');
    }

    const updated = await this.prisma.studentClassSubject.update({
      where: { id: enrollment.id },
      data: {
        status: 'DROPPED',
        droppedAt: new Date(),
      },
      include: {
        student: true,
        classSubject: {
          include: {
            subject: true,
          },
        },
      },
    });

    logger.info('Student dropped from subject', {
      enrollmentId,
      classSubjectId,
      studentId: enrollment.studentId,
    });

    return updated;
  }

  /**
   * Get all active subjects a student is enrolled in for a specific class enrollment
   */
  async getStudentSubjectEnrollments(
    enrollmentId: string,
    schoolId: string,
    status?: SubjectEnrollmentStatus
  ): Promise<StudentClassSubject[]> {
    const whereClause: any = {
      enrollmentId,
      schoolId,
    };

    if (status) {
      whereClause.status = status;
    }

    return this.prisma.studentClassSubject.findMany({
      where: whereClause,
      include: {
        classSubject: {
          include: {
            subject: true,
            teacherProfile: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        classSubject: {
          subject: {
            name: 'asc',
          },
        },
      },
    });
  }

  /**
   * Get all active subjects enrolled in for a student across all enrollments
   */
  async getAllStudentSubjectEnrollments(
    studentId: string,
    schoolId: string
  ): Promise<StudentClassSubject[]> {
    return this.prisma.studentClassSubject.findMany({
      where: {
        studentId,
        schoolId,
        status: 'ACTIVE',
      },
      include: {
        enrollment: {
          include: {
            class: true,
            academicYear: true,
          },
        },
        classSubject: {
          include: {
            subject: true,
            term: true,
          },
        },
      },
      orderBy: [
        { enrollment: { academicYear: { year: 'desc' } } },
        { classSubject: { subject: { name: 'asc' } } },
      ],
    });
  }

  /**
   * Get students enrolled in a specific subject
   */
  async getStudentsEnrolledInSubject(
    classSubjectId: string,
    schoolId: string,
    status?: SubjectEnrollmentStatus
  ): Promise<StudentClassSubject[]> {
    const whereClause: any = {
      classSubjectId,
      schoolId,
    };

    if (status) {
      whereClause.status = status;
    }

    return this.prisma.studentClassSubject.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            admissionNo: true,
            firstName: true,
            middleName: true,
            lastName: true,
            gender: true,
          },
        },
        enrollment: {
          select: {
            id: true,
            classId: true,
            streamId: true,
          },
        },
      },
      orderBy: {
        student: {
          admissionNo: 'asc',
        },
      },
    });
  }

  /**
   * Update subject enrollment status (e.g., COMPLETED, FAILED)
   */
  async updateSubjectEnrollmentStatus(
    enrollmentId: string,
    classSubjectId: string,
    schoolId: string,
    status: SubjectEnrollmentStatus
  ): Promise<StudentClassSubject> {
    const enrollment = await this.prisma.studentClassSubject.findFirst({
      where: {
        enrollmentId,
        classSubjectId,
        schoolId,
      },
    });

    if (!enrollment) {
      throw new Error('Subject enrollment not found');
    }

    return this.prisma.studentClassSubject.update({
      where: { id: enrollment.id },
      data: { status },
      include: {
        student: true,
        classSubject: {
          include: {
            subject: true,
          },
        },
      },
    });
  }

  /**
   * Auto-enroll all core subjects when student joins a class
   * Called from StudentClass creation
   */
  async autoEnrollCoreSubjects(
    enrollmentId: string,
    classId: string,
    schoolId: string,
    studentId: string
  ): Promise<StudentClassSubject[]> {
    // Get all core subjects for this class
    const coreSubjects = await this.prisma.classSubject.findMany({
      where: {
        classId,
        schoolId,
        subjectCategory: 'CORE',
      },
    });

    if (coreSubjects.length === 0) {
      return [];
    }

    const enrollments = await this.prisma.$transaction(
      coreSubjects.map((subject) =>
        this.prisma.studentClassSubject.create({
          data: {
            id: uuidv4(),
            studentId,
            classSubjectId: subject.id,
            enrollmentId,
            schoolId,
            status: 'ACTIVE',
          },
          include: {
            student: true,
            classSubject: {
              include: {
                subject: true,
              },
            },
          },
        })
      ),
      {
        isolationLevel: 'Serializable',
      }
    );

    logger.info('Auto-enrolled core subjects', {
      studentId,
      enrollmentId,
      count: enrollments.length,
    });

    return enrollments;
  }

  /**
   * Get student count for a subject
   */
  async getSubjectEnrollmentCount(
    classSubjectId: string,
    schoolId: string,
    status?: SubjectEnrollmentStatus
  ): Promise<number> {
    return this.prisma.studentClassSubject.count({
      where: {
        classSubjectId,
        schoolId,
        ...(status && { status }),
      },
    });
  }

  /**
   * Get students for a class subject with pagination
   */
  async getSubjectStudentsWithPagination(
    classSubjectId: string,
    schoolId: string,
    page: number = 1,
    limit: number = 20,
    status?: SubjectEnrollmentStatus
  ) {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      classSubjectId,
      schoolId,
    };

    if (status) {
      whereClause.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.studentClassSubject.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              admissionNo: true,
              firstName: true,
              middleName: true,
              lastName: true,
              gender: true,
            },
          },
        },
        orderBy: {
          student: {
            admissionNo: 'asc',
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.studentClassSubject.count({ where: whereClause }),
    ]);
    console.log("SchoolId: ", schoolId);
    console.log("StudentClassSubjectData: ", data);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get available elective/optional subjects for a student in a specific class enrollment
   */
  async getAvailableSubjectsForStudent(
    enrollmentId: string,
    classId: string,
    schoolId: string
  ): Promise<any[]> {
    // 1. Get all subjects the student is already enrolled in for this class enrollment
    const enrolledSubjects = await this.prisma.studentClassSubject.findMany({
      where: {
        enrollmentId,
        schoolId,
        status: 'ACTIVE',
      },
      select: {
        classSubjectId: true,
      },
    });
    const enrolledSubjectIds = enrolledSubjects.map((s) => s.classSubjectId);

    // 2. Get all non-core subjects offered for the class
    const availableSubjects = await this.prisma.classSubject.findMany({
      where: {
        classId,
        schoolId,
        subjectCategory: {
          not: 'CORE',
        },
        // 3. Exclude subjects the student is already enrolled in
        id: {
          notIn: enrolledSubjectIds,
        },
      },
      include: {
        subject: true,
        teacherProfile: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        subject: {
          name: 'asc',
        },
      },
    });

    return availableSubjects;
  }
}
