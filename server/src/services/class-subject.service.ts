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
    
    // Check for existing assignment to prevent duplicates
    const existing = await this.prisma.classSubject.findUnique({
      where: {
        classId_streamId_subjectId_termId_academicYearId: {
          classId: data.classId,
          subjectId: data.subjectId,
          termId: data.termId,
          academicYearId: data.academicYearId,
          streamId: data.streamId || "", // Handle unique constraint quirk if streamId is usually null
        } as any // Type casting might be needed depending on Prisma version regarding null in composite unique
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
  static async getStudentEnrollmentsForClassSubject(
    classId: string,
    streamId: string | null,
    schoolId: string,
    subjectId?: string
  ) {
    const whereClause: any = {
      classId,
      streamId: streamId || undefined,
      status: 'ACTIVE',
      schoolId,
    };

    // Add subject filter if provided (for elective/optional subjects)
    if (subjectId) {
      whereClause.selectedSubjects = { has: subjectId };
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
   */
  static async updateStudentSelectedSubjects(
    enrollmentId: string,
    selectedSubjects: string[]
  ) {
    return await prisma.studentClass.update({
      where: { id: enrollmentId },
      data: {
        selectedSubjects,
      },
    });
  }

  /**
   * Batch update student selected subjects
   */
  static async batchUpdateStudentSelectedSubjects(
    updates: Array<{ enrollmentId: string; selectedSubjects: string[] }>
  ) {
    return await prisma.$transaction(
      updates.map(update =>
        prisma.studentClass.update({
          where: { id: update.enrollmentId },
          data: {
            selectedSubjects: update.selectedSubjects,
          },
        })
      )
    );
  }
}

