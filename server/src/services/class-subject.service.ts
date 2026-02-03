// src/services/class-subject.service.ts
import { PrismaClient, ClassSubject } from '@prisma/client';
import prisma from '../database/client';
import logger from '../utils/logger';

export class ClassSubjectService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Assign a subject to a class (and optionally a specific stream)
   * This creates the record required for assessments.
   * Now includes SubjectOffering validation
   */
  async assignSubjectToClass(data: {
    classId: string;
    subjectId: string;
    academicYearId: string;
    termId: string;
    streamId?: string; // Optional: if null, applies to entire class
    teacherId?: string; // Optional: assign teacher immediately
    schoolId: string;
    subjectCategory: 'CORE' | 'ELECTIVE' | 'OPTIONAL' | 'TECHNICAL' | 'APPLIED';
  }): Promise<ClassSubject> {
    
    // Validate subject offering exists for this school
   let offering = await this.prisma.subjectOffering.findFirst({
      where: {
        schoolId: data.schoolId,
        subjectId: data.subjectId,
      },
    });

    // If not offered, auto-create the offering instead of throwing an error
    if (!offering) {
      offering = await this.prisma.subjectOffering.create({
        data: {
          schoolId: data.schoolId,
          subjectId: data.subjectId,
          isActive: true,
        },
      });
    } else if (!offering.isActive) {
      // If it exists but was disabled, re-enable it
      await this.prisma.subjectOffering.update({
        where: { id: offering.id },
        data: { isActive: true },
      });
    }
    // Validate class exists and belongs to school
    const classRecord = await this.prisma.class.findFirst({
      where: {
        id: data.classId,
        schoolId: data.schoolId,
      },
    });

    if (!classRecord) {
      throw new Error('Class not found or does not belong to this school');
    }

    // Check for existing assignment to prevent duplicates
    const existing = await this.prisma.classSubject.findFirst({
      where: {
        classId: data.classId,
        subjectId: data.subjectId,
        termId: data.termId,
        academicYearId: data.academicYearId,
        streamId: data.streamId || null,
      }
    });

    if (existing) {
      throw new Error('Subject is already assigned to this class/stream for this term.');
    }

    const classSubject = await this.prisma.classSubject.create({
      data: {
        classId: data.classId,
        subjectId: data.subjectId,
        academicYearId: data.academicYearId,
        termId: data.termId,
        schoolId: data.schoolId,
        streamId: data.streamId || null,
        teacherId: data.teacherId || null,
        subjectCategory: data.subjectCategory,
      },
      include: {
        subject: true,
        class: true,
        stream: true,
        teacherProfile: {
          include: {
            user: true
          }
        }
      }
    });

    logger.info('Subject assigned to class', { 
      classSubjectId: classSubject.id, 
      classId: data.classId,
      subjectId: data.subjectId 
    });

    return classSubject;
  }

  /**
   * Assign or Update the Teacher for a specific Class Subject
   */
  async assignTeacher(classSubjectId: string, teacherId: string): Promise<ClassSubject> {
    // 1. Verify Teacher belongs to the same school (optional validation)
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId }
    });

    if (!teacher) throw new Error('Teacher not found');

    // 2. Update the record
    const updated = await this.prisma.classSubject.update({
      where: { id: classSubjectId },
      data: { teacherId },
      include: {
        subject: true,
        teacherProfile: {
          include: {
            user: true
          }
        }
      }
    });

    logger.info('Teacher assigned to subject', { 
      classSubjectId, 
      teacherId 
    });

    return updated;
  }

  /**
   * Get all subjects assigned to a specific class (for the UI list)
   */
  async getClassSubjects(classId: string, academicYearId: string, termId: string) {
    return await this.prisma.classSubject.findMany({
      where: {
        classId,
        academicYearId,
        termId
      },
      include: {
        subject: true,
        term: true,
        stream: true, // To see if it's a stream-specific assignment
        teacherProfile: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        _count: {
          select: { assessments: true } // Useful to see if assessments have started
        }
      },
      orderBy: {
        subject: { name: 'asc' }
      }
    });
  }


   /* Get class subject details by ID
   */
  static async getClassSubjectById(classSubjectId: string, schoolId: string) {
    return await prisma.classSubject.findFirst({
      where: {
        id: classSubjectId,
        schoolId,
      },
      include: {
        subject: true,
        class: true,
      },
    });
  }

  /**
   * Get student enrollments for a class subject
   */
  /**
   * Get student enrollments for a class subject
   * Updated to use StudentClassSubject relationship
   */
  static async getStudentEnrollmentsForClassSubject(
    classId: string,
    streamId: string | null,
    schoolId: string,
    subjectId?: string
  ) {
    // If subjectId is provided, get enrolled students through StudentClassSubject
    if (subjectId) {
      // Find the ClassSubject records for this subject in the class
      const classSubjects = await prisma.classSubject.findMany({
        where: {
          classId,
          subjectId,
          schoolId,
          ...(streamId && { streamId }),
        },
        select: { id: true },
      });

      if (classSubjects.length === 0) {
        return [];
      }

      // Get students enrolled in these class subjects
      return await prisma.studentClassSubject.findMany({
        where: {
          classSubjectId: { in: classSubjects.map((cs) => cs.id) },
          status: 'ACTIVE',
          schoolId,
        },
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

    // Get all active student enrollments in the class
    const whereClause: any = {
      classId,
      status: 'ACTIVE',
      schoolId,
    };

    if (streamId) {
      whereClause.streamId = streamId;
    }

    return await prisma.studentClass.findMany({
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
    });
  }

  /**
   * Get class subjects taught by a teacher
   */
  static async getClassSubjectsByTeacher(
    teacherId: string,
    schoolId: string,
    termId?: string
  ) {
    const whereClause: any = {
      teacherId,
      schoolId,
    };

    if (termId) {
      whereClause.termId = termId;
    }

    return await prisma.classSubject.findMany({
      where: whereClause,
      include: {
        subject: true,
        class: true,
        stream: true,
        term: true,
        _count: {
          select: {
            assessments: true,
          },
        },
      },
      orderBy: [
        { class: { name: 'asc' } },
        { subject: { name: 'asc' } },
      ],
    });
  }

  /**
   * Get core subjects for a class
   */
  static async getCoreSubjectsForClass(classId: string, schoolId: string) {
    return await prisma.classSubject.findMany({
      where: {
        classId,
        schoolId,
        subjectCategory: 'CORE',
      },
      select: {
        subjectId: true,
      },
    });
  }

  /**
   * Get active student enrollments for a class
   */
  static async getActiveStudentEnrollments(classId: string, schoolId: string) {
    return await prisma.studentClass.findMany({
      where: {
        classId,
        status: 'ACTIVE',
        schoolId,
      },
    });
  }

  /**
   * Update student's selected subjects
   * DEPRECATED: Use StudentClassSubjectService instead
   */
  static async updateStudentSelectedSubjects(
    enrollmentId: string,
    selectedSubjects: string[]
  ) {
    logger.warn('updateStudentSelectedSubjects is deprecated. Use StudentClassSubjectService instead.', {
      enrollmentId,
    });

    // For backwards compatibility, attempt to enroll through StudentClassSubjectService
    // This is a transitional method
    return await prisma.studentClass.findUnique({
      where: { id: enrollmentId },
    });
  }

  /**
   * Batch update student selected subjects
   * DEPRECATED: Use StudentClassSubjectService instead
   */
  static async batchUpdateStudentSelectedSubjects(
    updates: Array<{ enrollmentId: string; selectedSubjects: string[] }>
  ) {
    logger.warn('batchUpdateStudentSelectedSubjects is deprecated. Use StudentClassSubjectService instead.', {
      count: updates.length,
    });

    // Return empty for backwards compatibility
    return [];
  }
}