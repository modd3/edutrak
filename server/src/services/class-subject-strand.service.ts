// src/services/class-subject-strand.service.ts
import { PrismaClient, ClassSubjectStrand, Strand } from '@prisma/client';
import prisma from '../database/client';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing strand assignments to class subjects
 * Enables strand-based assessment and reporting
 */
export class ClassSubjectStrandService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Assign a strand to a class subject
   */
  async assignStrandToClassSubject(data: {
    classSubjectId: string;
    strandId: string;
    schoolId: string;
  }): Promise<ClassSubjectStrand> {
    // Validate class subject exists
    const classSubject = await this.prisma.classSubject.findFirst({
      where: {
        id: data.classSubjectId,
        schoolId: data.schoolId,
      },
      include: {
        subject: true,
      },
    });

    if (!classSubject) {
      throw new Error('Class subject not found or does not belong to this school');
    }

    // Validate strand exists and belongs to the subject
    const strand = await this.prisma.strand.findFirst({
      where: {
        id: data.strandId,
        subjectId: classSubject.subjectId,
      },
    });

    if (!strand) {
      throw new Error('Strand not found or does not belong to this subject');
    }

    // Check for duplicate assignment
    const existing = await this.prisma.classSubjectStrand.findFirst({
      where: {
        classSubjectId: data.classSubjectId,
        strandId: data.strandId,
      },
    });

    if (existing) {
      throw new Error('This strand is already assigned to this class subject');
    }

    const assignment = await this.prisma.classSubjectStrand.create({
      data: {
        id: uuidv4(),
        classSubjectId: data.classSubjectId,
        strandId: data.strandId,
      },
      include: {
        classSubject: {
          include: {
            subject: true,
            class: true,
          },
        },
        strand: true,
      },
    });

    logger.info('Strand assigned to class subject', {
      classSubjectId: data.classSubjectId,
      strandId: data.strandId,
    });

    return assignment;
  }

  /**
   * Bulk assign strands to a class subject
   */
  async bulkAssignStrandsToClassSubject(data: {
    classSubjectId: string;
    strandIds: string[];
    schoolId: string;
  }): Promise<ClassSubjectStrand[]> {
    // Validate class subject
    const classSubject = await this.prisma.classSubject.findFirst({
      where: {
        id: data.classSubjectId,
        schoolId: data.schoolId,
      },
      include: {
        subject: true,
      },
    });

    if (!classSubject) {
      throw new Error('Class subject not found');
    }

    // Validate all strands exist and belong to the subject
    const strands = await this.prisma.strand.findMany({
      where: {
        id: { in: data.strandIds },
        subjectId: classSubject.subjectId,
      },
    });

    if (strands.length !== data.strandIds.length) {
      throw new Error('One or more strands not found or do not belong to this subject');
    }

    // Create assignments in transaction
    const assignments = await this.prisma.$transaction(
      data.strandIds.map((strandId) =>
        this.prisma.classSubjectStrand.upsert({
          where: {
            classSubjectId_strandId: {
              classSubjectId: data.classSubjectId,
              strandId,
            },
          },
          update: {},
          create: {
            id: uuidv4(),
            classSubjectId: data.classSubjectId,
            strandId,
          },
          include: {
            strand: true,
          },
        })
      ),
      {
        isolationLevel: 'Serializable',
      }
    );

    logger.info('Bulk assigned strands to class subject', {
      classSubjectId: data.classSubjectId,
      count: assignments.length,
    });

    return assignments;
  }

  /**
   * Get all strands for a class subject
   */
  async getStrandsForClassSubject(
    classSubjectId: string,
    schoolId: string
  ): Promise<Strand[]> {
    // Validate class subject exists in school
    const classSubject = await this.prisma.classSubject.findFirst({
      where: {
        id: classSubjectId,
        schoolId,
      },
    });

    if (!classSubject) {
      throw new Error('Class subject not found');
    }

    const assignments = await this.prisma.classSubjectStrand.findMany({
      where: {
        classSubjectId,
      },
      include: {
        strand: true,
      },
    });

    return assignments.map((a) => a.strand);
  }

  /**
   * Get all class subjects assigned to a strand
   */
  async getClassSubjectsForStrand(
    strandId: string,
    schoolId: string
  ): Promise<ClassSubjectStrand[]> {
    // Validate strand exists
    const strand = await this.prisma.strand.findUnique({
      where: { id: strandId },
    });

    if (!strand) {
      throw new Error('Strand not found');
    }

    return this.prisma.classSubjectStrand.findMany({
      where: {
        strandId,
        classSubject: {
          schoolId,
        },
      },
      include: {
        classSubject: {
          include: {
            subject: true,
            class: true,
            stream: true,
          },
        },
      },
    });
  }

  /**
   * Remove strand from class subject
   */
  async removeStrandFromClassSubject(
    classSubjectId: string,
    strandId: string,
    schoolId: string
  ): Promise<void> {
    // Validate class subject exists in school
    const classSubject = await this.prisma.classSubject.findFirst({
      where: {
        id: classSubjectId,
        schoolId,
      },
    });

    if (!classSubject) {
      throw new Error('Class subject not found');
    }

    // Get assignment to ensure it exists
    const assignment = await this.prisma.classSubjectStrand.findFirst({
      where: {
        classSubjectId,
        strandId,
      },
    });

    if (!assignment) {
      throw new Error('Strand assignment not found');
    }

    // Check if any assessments use this strand for this class subject
    const assessments = await this.prisma.assessmentDefinition.count({
      where: {
        classSubjectId,
        strandId,
      },
    });

    if (assessments > 0) {
      throw new Error(
        `Cannot remove strand. ${assessments} assessment(s) are using this strand for this class subject. Update or delete assessments first.`
      );
    }

    await this.prisma.classSubjectStrand.delete({
      where: {
        classSubjectId_strandId: {
          classSubjectId,
          strandId,
        },
      },
    });

    logger.info('Strand removed from class subject', {
      classSubjectId,
      strandId,
    });
  }

  /**
   * Get count of strands for a class subject
   */
  async getStrandCountForClassSubject(classSubjectId: string): Promise<number> {
    return this.prisma.classSubjectStrand.count({
      where: { classSubjectId },
    });
  }

  /**
   * Get strands with assessments for a class subject
   */
  async getStrandsWithAssessments(classSubjectId: string, schoolId: string) {
    const classSubject = await this.prisma.classSubject.findFirst({
      where: {
        id: classSubjectId,
        schoolId,
      },
    });

    if (!classSubject) {
      throw new Error('Class subject not found');
    }

    const assignments = await this.prisma.classSubjectStrand.findMany({
      where: {
        classSubjectId,
      },
      include: {
        strand: true,
        classSubject: {
          select: {
            id: true,
          },
        },
      },
    });

    // For each strand, get assessment count
    const strandsWithCounts = await Promise.all(
      assignments.map(async (assignment) => {
        const assessmentCount = await this.prisma.assessmentDefinition.count({
          where: {
            classSubjectId,
            strandId: assignment.strandId,
          },
        });

        return {
          ...assignment.strand,
          assessmentCount,
        };
      })
    );

    return strandsWithCounts;
  }

  /**
   * Verify all strands for a class subject are valid
   */
  async validateStrandAssignments(classSubjectId: string): Promise<boolean> {
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
    });

    if (!classSubject) {
      return false;
    }

    // Get all strand assignments
    const assignments = await this.prisma.classSubjectStrand.findMany({
      where: { classSubjectId },
      include: {
        strand: true,
      },
    });

    // Check all strands belong to the subject
    for (const assignment of assignments) {
      if (assignment.strand.subjectId !== classSubject.subjectId) {
        return false;
      }
    }

    return true;
  }
}
