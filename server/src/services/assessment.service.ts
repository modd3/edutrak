// src/services/assessment.service.ts
import { PrismaClient, AssessmentDefinition, AssessmentType, Prisma } from '@prisma/client';
import {
  CreateAssessmentDefinitionInput,
  UpdateAssessmentDefinitionInput,
  GetAssessmentsQuery
} from '../validation/assessment.validation';

export class AssessmentService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new assessment definition
   */
  async createAssessment(
    data: CreateAssessmentDefinitionInput,
    schoolId: string,
    userId: string
  ): Promise<AssessmentDefinition> {
    // Verify class subject belongs to this school
    const classSubject = await this.prisma.classSubject.findFirst({
      where: {
        id: data.classSubjectId,
        schoolId,
      },
      include: {
        term: true,
        academicYear: true,
      },
    });

    if (!classSubject) {
      throw new Error('Class subject not found or does not belong to your school');
    }

    // Verify term belongs to school
    if (data.termId !== classSubject.termId) {
      throw new Error('Term does not match class subject term');
    }

    // Verify strand if provided
    if (data.strandId) {
      const strand = await this.prisma.strand.findFirst({
        where: {
          id: data.strandId,
          subjectId: classSubject.subjectId,
        },
      });

      if (!strand) {
        throw new Error('Strand not found or does not belong to this subject');
      }
    }

    // Check for duplicate assessment name in same class subject
    const existing = await this.prisma.assessmentDefinition.findFirst({
      where: {
        name: data.name,
        classSubjectId: data.classSubjectId,
        termId: data.termId,
        schoolId,
      },
    });

    if (existing) {
      throw new Error('Assessment with this name already exists for this class subject and term');
    }

    // Create assessment
    return this.prisma.assessmentDefinition.create({
      data: {
        name: data.name,
        type: data.type,
        maxMarks: data.maxMarks,
        termId: data.termId,
        classSubjectId: data.classSubjectId,
        strandId: data.strandId,
        academicYearId: data.academicYearId || classSubject.academicYearId,
        schoolId,
      },
      include: {
        classSubject: {
          include: {
            subject: true,
            class: true,
            stream: true,
          },
        },
        term: true,
        strand: true,
      },
    });
  }

  /**
   * Bulk create assessments (e.g., create same assessment for multiple class subjects)
   */
  async bulkCreateAssessments(
    assessments: CreateAssessmentDefinitionInput[],
    schoolId: string
  ): Promise<{ created: number; assessments: AssessmentDefinition[] }> {
    const created: AssessmentDefinition[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const assessment of assessments) {
        // Verify class subject
        const classSubject = await tx.classSubject.findFirst({
          where: {
            id: assessment.classSubjectId,
            schoolId,
          },
        });

        if (!classSubject) {
          throw new Error(`Class subject ${assessment.classSubjectId} not found`);
        }

        const result = await tx.assessmentDefinition.create({
          data: {
            name: assessment.name,
            type: assessment.type,
            maxMarks: assessment.maxMarks,
            termId: assessment.termId,
            classSubjectId: assessment.classSubjectId,
            strandId: assessment.strandId,
            academicYearId: assessment.academicYearId || classSubject.academicYearId,
            schoolId,
          },
        });

        created.push(result);
      }
    });

    return {
      created: created.length,
      assessments: created,
    };
  }

  /**
   * Get assessments with filtering and pagination
   */
  async getAssessments(
    schoolId: string,
    query: GetAssessmentsQuery
  ): Promise<{
    assessments: AssessmentDefinition[];
    total: number;
    page: number;
    pages: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AssessmentDefinitionWhereInput = {
      schoolId,
      ...(query.termId && { termId: query.termId }),
      ...(query.classSubjectId && { classSubjectId: query.classSubjectId }),
      ...(query.type && { type: query.type }),
      ...(query.academicYearId && { academicYearId: query.academicYearId }),
    };

    const [assessments, total] = await Promise.all([
      this.prisma.assessmentDefinition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          classSubject: {
            include: {
              subject: true,
              class: true,
              stream: true,
            },
          },
          term: true,
          strand: true,
          _count: {
            select: { results: true },
          },
        },
      }),
      this.prisma.assessmentDefinition.count({ where }),
    ]);

    return {
      assessments,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single assessment by ID
   */
  async getAssessmentById(
    id: string,
    schoolId: string
  ): Promise<AssessmentDefinition | null> {
    return this.prisma.assessmentDefinition.findFirst({
      where: {
        id,
        schoolId,
      },
      include: {
        classSubject: {
          include: {
            subject: true,
            class: true,
            stream: true,
            teacherProfile: {
              include: {
                user: true,
              },
            },
          },
        },
        term: true,
        academicYear: true,
        strand: true,
        _count: {
          select: { results: true },
        },
      },
    });
  }

  /**
   * Update assessment definition
   */
  async updateAssessment(
    id: string,
    data: UpdateAssessmentDefinitionInput,
    schoolId: string
  ): Promise<AssessmentDefinition> {
    // Verify ownership
    const existing = await this.prisma.assessmentDefinition.findFirst({
      where: { id, schoolId },
      include: { results: true },
    });

    if (!existing) {
      throw new Error('Assessment not found');
    }

    // If changing maxMarks, verify no results exceed new max
    if (data.maxMarks !== undefined && data.maxMarks < (existing.maxMarks || 0)) {
      const maxResult = await this.prisma.assessmentResult.findFirst({
        where: {
          assessmentDefId: id,
          numericValue: { gt: data.maxMarks },
        },
      });

      if (maxResult) {
        throw new Error(
          `Cannot reduce max marks below ${maxResult.numericValue}. Some students have higher scores.`
        );
      }
    }

    return this.prisma.assessmentDefinition.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type }),
        ...(data.maxMarks !== undefined && { maxMarks: data.maxMarks }),
        ...(data.termId && { termId: data.termId }),
        ...(data.classSubjectId && { classSubjectId: data.classSubjectId }),
        ...(data.strandId !== undefined && { strandId: data.strandId }),
        ...(data.academicYearId && { academicYearId: data.academicYearId }),
      },
      include: {
        classSubject: {
          include: {
            subject: true,
            class: true,
            stream: true,
          },
        },
        term: true,
        strand: true,
      },
    });
  }

  /**
   * Delete assessment definition
   */
  async deleteAssessment(id: string, schoolId: string): Promise<void> {
    const assessment = await this.prisma.assessmentDefinition.findFirst({
      where: { id, schoolId },
      include: {
        _count: {
          select: { results: true },
        },
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    if (assessment._count.results > 0) {
      throw new Error(
        `Cannot delete assessment. It has ${assessment._count.results} recorded results. Delete results first.`
      );
    }

    await this.prisma.assessmentDefinition.delete({
      where: { id },
    });
  }

  /**
   * Get assessments for a specific class
   */
  async getClassAssessments(
    classId: string,
    termId: string,
    schoolId: string
  ): Promise<AssessmentDefinition[]> {
    return this.prisma.assessmentDefinition.findMany({
      where: {
        schoolId,
        termId,
        classSubject: {
          classId,
        },
      },
      include: {
        classSubject: {
          include: {
            subject: true,
            stream: true,
          },
        },
        term: true,
        _count: {
          select: { results: true },
        },
      },
      orderBy: [
        { classSubject: { subject: { name: 'asc' } } },
        { name: 'asc' },
      ],
    });
  }

  /**
   * Get assessments for a specific subject in a class
   */
  async getSubjectAssessments(
    classSubjectId: string,
    schoolId: string
  ): Promise<AssessmentDefinition[]> {
    return this.prisma.assessmentDefinition.findMany({
      where: {
        schoolId,
        classSubjectId,
      },
      include: {
        term: true,
        strand: true,
        _count: {
          select: { results: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if assessment exists
   */
  async assessmentExists(id: string, schoolId: string): Promise<boolean> {
    const count = await this.prisma.assessmentDefinition.count({
      where: { id, schoolId },
    });
    return count > 0;
  }

  /**
   * Get assessment statistics
   */
  async getAssessmentStats(schoolId: string, academicYearId?: string) {
    const where: Prisma.AssessmentDefinitionWhereInput = {
      schoolId,
      ...(academicYearId && { academicYearId }),
    };

    const [total, byType, withResults] = await Promise.all([
      this.prisma.assessmentDefinition.count({ where }),
      this.prisma.assessmentDefinition.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
      this.prisma.assessmentDefinition.count({
        where: {
          ...where,
          results: {
            some: {},
          },
        },
      }),
    ]);

    return {
      total,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<AssessmentType, number>),
      withResults,
      withoutResults: total - withResults,
    };
  }
}

