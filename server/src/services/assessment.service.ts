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
    userId: string,
    role: string
  ): Promise<AssessmentDefinition> {

    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    const teacherProfile = !isAdmin ? await this.prisma.teacher.findUnique({
      where: {userId},
      select: {id: true},
    }) : null;

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

    if (!isAdmin && classSubject.teacherId === null) {
      throw new Error(
        'This class Subject has no assigned teacher yet. ' +
        'Ask an admin to assign you before creating this assessment.'
      )
    }

    if (!isAdmin) {
      if (!teacherProfile) {
        throw new Error(
          'Teacher Profile not found for this user.'
        )
      }
      if (classSubject.teacherId !== teacherProfile.id) {
        throw new Error(
          'You are not assigned to this class subject. ' +
          'Only the assigned teacher can create the assessment for it.'
        );
      }
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
   * Update assessment status (workflow transition)
   * Valid transitions:
   *   DRAFT → PUBLISHED
   *   PUBLISHED → GRADING_IN_PROGRESS
   *   GRADING_IN_PROGRESS → RESULTS_PUBLISHED
   *   RESULTS_PUBLISHED → CLOSED
   *   Any → DRAFT (admin only, to reopen)
   */
  async updateAssessmentStatus(
    id: string,
    newStatus: string,
    schoolId: string,
    userId: string,
    role: string
  ): Promise<any> {
    const assessment = await this.prisma.assessmentDefinition.findFirst({
      where: { id, schoolId },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const validTransitions: Record<string, string[]> = {
      DRAFT: ['PUBLISHED'],
      PUBLISHED: ['GRADING_IN_PROGRESS', 'DRAFT'],
      GRADING_IN_PROGRESS: ['RESULTS_PUBLISHED'],
      RESULTS_PUBLISHED: ['CLOSED'],
      CLOSED: [],
    };

    const allowed = validTransitions[assessment.status] || [];
    
    // Admins can reopen to DRAFT from any state
    if (role !== 'TEACHER' && newStatus === 'DRAFT' && assessment.status !== 'DRAFT') {
      // Admin override allowed
    } else if (!allowed.includes(newStatus)) {
      throw new Error(
        `Cannot transition from ${assessment.status} to ${newStatus}. Allowed: ${allowed.join(', ')}`
      );
    }

    const updateData: any = { status: newStatus };

    // Set timestamp fields based on status
    if (newStatus === 'PUBLISHED') {
      updateData.publishedAt = new Date();
    } else if (newStatus === 'RESULTS_PUBLISHED') {
      updateData.resultsPublishedAt = new Date();
    }

    return this.prisma.assessmentDefinition.update({
      where: { id },
      data: updateData,
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
    });
  }

  /**
   * Get assessments for a specific class
   */
  async getClassAssessments(
    classId: string,
    termId: string,
    schoolId: string,
    role,
    userId
  ): Promise<AssessmentDefinition[]> {
    const isTeacher = role === 'TEACHER';
    let teacherProfileId: string | null = null;

    if (isTeacher && userId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
        select: { id: true}
      });
      teacherProfileId = teacher?.id ?? null;
    }

    return this.prisma.assessmentDefinition.findMany({
      where: {
        schoolId,
        termId,
        classSubject: {
          classId,
          ...(isTeacher && teacherProfileId
            ? {teacherId: teacherProfileId}
            : {}
          ),
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
   * Get assessments for a specific strand within a class subject
   */
  async getStrandAssessments(
    classSubjectId: string,
    strandId: string,
    schoolId: string
  ): Promise<AssessmentDefinition[]> {
    // Validate strand is assigned to class subject
    const assignment = await this.prisma.classSubjectStrand.findFirst({
      where: {
        classSubjectId,
        strandId,
      },
    });

    if (!assignment) {
      throw new Error('Strand is not assigned to this class subject');
    }

    return this.prisma.assessmentDefinition.findMany({
      where: {
        schoolId,
        classSubjectId,
        strandId,
      },
      include: {
        term: true,
        strand: true,
        classSubject: {
          include: {
            subject: true,
          },
        },
        _count: {
          select: { results: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all strands with assessments for a class subject
   */
  async getStrandAssessmentSummary(classSubjectId: string, schoolId: string) {
    // Validate class subject
    const classSubject = await this.prisma.classSubject.findFirst({
      where: {
        id: classSubjectId,
        schoolId,
      },
    });

    if (!classSubject) {
      throw new Error('Class subject not found');
    }

    // Get all strands assigned to this class subject
    const strands = await this.prisma.classSubjectStrand.findMany({
      where: { classSubjectId },
      include: {
        strand: true,
      },
    });

    // Get assessment counts for each strand
    const summary = await Promise.all(
      strands.map(async (assignment) => {
        const assessments = await this.prisma.assessmentDefinition.findMany({
          where: {
            classSubjectId,
            strandId: assignment.strandId,
            schoolId,
          },
          include: {
            _count: {
              select: { results: true },
            },
          },
        });

        return {
          strand: assignment.strand,
          assessmentCount: assessments.length,
          assessments,
          totalResults: assessments.reduce((sum, a) => sum + a._count.results, 0),
        };
      })
    );

    return summary;
  }

  /**
   * Get assessment results by strand for reporting
   */
  async getStrandResultsSummary(
    classSubjectId: string,
    strandId: string,
    schoolId: string
  ) {
    // Validate strand is assigned and get strand details
    const assignment = await this.prisma.classSubjectStrand.findFirst({
      where: {
        classSubjectId,
        strandId,
      },
      include: {
        strand: true,
      },
    });

    if (!assignment) {
      throw new Error('Strand is not assigned to this class subject');
    }

    // Get assessments for this strand
    const assessments = await this.prisma.assessmentDefinition.findMany({
      where: {
        classSubjectId,
        strandId,
        schoolId,
      },
      select: { id: true, name: true },
    });

    // Get results grouped by assessment
    const results = await Promise.all(
      assessments.map(async (assessment) => {
        const resultData = await this.prisma.assessmentResult.findMany({
          where: {
            assessmentDefId: assessment.id,
            schoolId,
          },
          include: {
            student: {
              select: {
                id: true,
                admissionNo: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        return {
          assessment,
          resultCount: resultData.length,
          results: resultData,
        };
      })
    );

    return {
      strand: assignment.strand,
      classSubjectId,
      assessments: results,
    };
  }

  // ========================================
  // Assessment Weight Management
  // ========================================

  /**
   * Get all weights for a term and class subject
   */
  async getAssessmentWeights(termId: string, classSubjectId: string, schoolId: string) {
    return this.prisma.assessmentWeight.findMany({
      where: { termId, classSubjectId, schoolId },
      orderBy: { assessmentType: 'asc' },
    });
  }

  /**
   * Upsert assessment weight (create or update)
   */
  async upsertAssessmentWeight(
    assessmentType: string,
    termId: string,
    classSubjectId: string,
    weight: number,
    schoolId: string
  ) {
    if (weight < 0 || weight > 100) {
      throw new Error('Weight must be between 0 and 100');
    }

    return this.prisma.assessmentWeight.upsert({
      where: {
        assessmentType_termId_classSubjectId: {
          assessmentType: assessmentType as any,
          termId,
          classSubjectId,
        },
      },
      update: { weight },
      create: {
        assessmentType: assessmentType as any,
        termId,
        classSubjectId,
        weight,
        schoolId,
      },
    });
  }

  /**
   * Bulk upsert assessment weights
   */
  async bulkUpsertWeights(
    weights: Array<{ assessmentType: string; termId: string; classSubjectId: string; weight: number }>,
    schoolId: string
  ) {
    const results = await this.prisma.$transaction(
      weights.map((w) =>
        this.prisma.assessmentWeight.upsert({
          where: {
            assessmentType_termId_classSubjectId: {
              assessmentType: w.assessmentType as any,
              termId: w.termId,
              classSubjectId: w.classSubjectId,
            },
          },
          update: { weight: w.weight },
          create: {
            assessmentType: w.assessmentType as any,
            termId: w.termId,
            classSubjectId: w.classSubjectId,
            weight: w.weight,
            schoolId,
          },
        })
      )
    );
    return results;
  }

  /**
   * Delete an assessment weight
   */
  async deleteAssessmentWeight(id: string, schoolId: string) {
    const weight = await this.prisma.assessmentWeight.findFirst({
      where: { id, schoolId },
    });
    if (!weight) throw new Error('Weight not found');
    return this.prisma.assessmentWeight.delete({ where: { id } });
  }

  /**
   * Calculate weighted term score for a student in a class subject
   */
  async calculateWeightedScore(studentId: string, classSubjectId: string, termId: string, schoolId: string) {
    const weights = await this.prisma.assessmentWeight.findMany({
      where: { termId, classSubjectId, schoolId },
    });

    if (weights.length === 0) {
      return null; // No weights configured
    }

    const weightMap = new Map(weights.map((w) => [w.assessmentType, w.weight]));
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

    // Get all results for this student in assessments of this class subject in this term
    const results = await this.prisma.assessmentResult.findMany({
      where: {
        studentId,
        assessmentDef: {
          classSubjectId,
          termId,
          schoolId,
        },
      },
      include: {
        assessmentDef: {
          select: { type: true, maxMarks: true },
        },
      },
    });

    if (results.length === 0) return null;

    // Group results by assessment type and calculate average percentage per type
    const typeAvgs = new Map<string, number>();
    const typeCounts = new Map<string, number>();

    for (const result of results) {
      if (result.numericValue == null || !result.assessmentDef.maxMarks) continue;
      const type = result.assessmentDef.type;
      const pct = (result.numericValue / result.assessmentDef.maxMarks) * 100;
      typeAvgs.set(type, (typeAvgs.get(type) || 0) + pct);
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    }

    let weightedSum = 0;
    for (const [type, totalPct] of typeAvgs) {
      const avg = totalPct / (typeCounts.get(type) || 1);
      const weight = weightMap.get(type as any) || 0;
      weightedSum += (avg * weight) / 100;
    }

    return {
      weightedScore: Math.round(weightedSum * 100) / 100,
      totalWeight,
      configuredWeights: weights.length,
      resultsUsed: results.filter((r) => r.numericValue != null).length,
    };
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
   * Get all students eligible for an assessment (enrolled in the subject)
   * Uses StudentClassSubject relationship
   */
  async getStudentsForAssessment(
    assessmentDefId: string,
    schoolId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    // Get the assessment and its class subject
    const assessment = await this.prisma.assessmentDefinition.findFirst({
      where: {
        id: assessmentDefId,
        schoolId,
      },
      include: {
        classSubject: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Get all students enrolled in this class subject
    const [students, total] = await Promise.all([
      this.prisma.studentClassSubject.findMany({
        where: {
          classSubjectId: assessment.classSubjectId,
          schoolId,
          status: 'ACTIVE',
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
        },
        skip,
        take: limit,
        orderBy: {
          student: {
            admissionNo: 'asc',
          },
        },
      }),
      this.prisma.studentClassSubject.count({
        where: {
          classSubjectId: assessment.classSubjectId,
          schoolId,
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      students: students.map((s) => s.student),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
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

