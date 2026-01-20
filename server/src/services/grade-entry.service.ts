// src/services/grade-entry.service.ts

import { PrismaClient, AssessmentResult, CompetencyLevel, Curriculum } from '@prisma/client';
import {
  CreateAssessmentResultInput,
  UpdateAssessmentResultInput,
  GradeEntryInput,
  GetResultsQuery,
  CSVGradeEntryRow,
} from '../validation/assessment.validation';

export class GradeEntryService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create or update a single assessment result
   */
  async createOrUpdateResult(
    data: CreateAssessmentResultInput,
    assessedById: string,
    schoolId: string
  ): Promise<AssessmentResult> {
    // Verify assessment belongs to school
    const assessment = await this.prisma.assessmentDefinition.findFirst({
      where: {
        id: data.assessmentDefId,
        schoolId,
      },
      include: {
        classSubject: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Verify student belongs to school
    const student = await this.prisma.student.findFirst({
      where: {
        id: data.studentId,
        schoolId,
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Validate marks against max marks
    if (data.numericValue !== undefined && assessment.maxMarks) {
      if (data.numericValue > assessment.maxMarks) {
        throw new Error(
          `Marks (${data.numericValue}) cannot exceed maximum marks (${assessment.maxMarks})`
        );
      }
    }

    // Auto-convert marks to grade/competency based on curriculum
    const processedData = await this.processGradeData(
      data,
      assessment.classSubject.class.curriculum,
      assessment.maxMarks
    );

    // Create or update
    return this.prisma.assessmentResult.upsert({
      where: {
        studentId_assessmentDefId: {
          studentId: data.studentId,
          assessmentDefId: data.assessmentDefId,
        },
      },
      create: {
        studentId: data.studentId,
        assessmentDefId: data.assessmentDefId,
        numericValue: processedData.numericValue,
        grade: processedData.grade,
        competencyLevel: processedData.competencyLevel,
        comment: data.comment,
        assessedById,
        schoolId,
      },
      update: {
        numericValue: processedData.numericValue,
        grade: processedData.grade,
        competencyLevel: processedData.competencyLevel,
        comment: data.comment,
        assessedById,
        updatedAt: new Date(),
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
        assessmentDef: {
          include: {
            classSubject: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Bulk grade entry for multiple students
   */
  async bulkGradeEntry(
    data: GradeEntryInput,
    assessedById: string,
    schoolId: string
  ): Promise<{
    successful: number;
    failed: number;
    results: AssessmentResult[];
    errors: Array<{ studentId: string; error: string }>;
  }> {
    const results: AssessmentResult[] = [];
    const errors: Array<{ studentId: string; error: string }> = [];

    // Verify assessment
    const assessment = await this.prisma.assessmentDefinition.findFirst({
      where: {
        id: data.assessmentDefId,
        schoolId,
      },
      include: {
        classSubject: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Process each entry
    await this.prisma.$transaction(async (tx) => {
      for (const entry of data.entries) {
        try {
          // Validate marks
          if (assessment.maxMarks && entry.marks > assessment.maxMarks) {
            errors.push({
              studentId: entry.studentId,
              error: `Marks (${entry.marks}) exceed maximum (${assessment.maxMarks})`,
            });
            continue;
          }

          // Process grade data
          const processedData = await this.processGradeData(
            {
              studentId: entry.studentId,
              assessmentDefId: data.assessmentDefId,
              numericValue: entry.marks,
              comment: entry.comment,
            },
            assessment.classSubject.class.curriculum,
            assessment.maxMarks
          );

          // Upsert result
          const result = await tx.assessmentResult.upsert({
            where: {
              studentId_assessmentDefId: {
                studentId: entry.studentId,
                assessmentDefId: data.assessmentDefId,
              },
            },
            create: {
              studentId: entry.studentId,
              assessmentDefId: data.assessmentDefId,
              numericValue: processedData.numericValue,
              grade: processedData.grade,
              competencyLevel: processedData.competencyLevel,
              comment: entry.comment,
              assessedById,
              schoolId,
            },
            update: {
              numericValue: processedData.numericValue,
              grade: processedData.grade,
              competencyLevel: processedData.competencyLevel,
              comment: entry.comment,
              assessedById,
              updatedAt: new Date(),
            },
          });

          results.push(result);
        } catch (error) {
          errors.push({
            studentId: entry.studentId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    });

    return {
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  /**
   * CSV bulk upload
   */
  async csvBulkUpload(
    csvData: CSVGradeEntryRow[],
    assessmentDefId: string,
    assessedById: string,
    schoolId: string
  ): Promise<{
    successful: number;
    failed: number;
    results: AssessmentResult[];
    errors: Array<{ row: number; admissionNo: string; error: string }>;
  }> {
    const results: AssessmentResult[] = [];
    const errors: Array<{ row: number; admissionNo: string; error: string }> = [];

    // Verify assessment
    const assessment = await this.prisma.assessmentDefinition.findFirst({
      where: {
        id: assessmentDefId,
        schoolId,
      },
      include: {
        classSubject: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Get all students by admission numbers
    const admissionNos = csvData.map((row) => row.studentAdmissionNo);
    const students = await this.prisma.student.findMany({
      where: {
        admissionNo: { in: admissionNos },
        schoolId,
      },
    });

    const studentMap = new Map(students.map((s) => [s.admissionNo, s]));

    // Process each row
    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        try {
          const student = studentMap.get(row.studentAdmissionNo);
          if (!student) {
            errors.push({
              row: i + 2, // +2 for header row and 0-index
              admissionNo: row.studentAdmissionNo,
              error: 'Student not found',
            });
            continue;
          }

          // Validate marks
          if (assessment.maxMarks && row.marks > assessment.maxMarks) {
            errors.push({
              row: i + 2,
              admissionNo: row.studentAdmissionNo,
              error: `Marks (${row.marks}) exceed maximum (${assessment.maxMarks})`,
            });
            continue;
          }

          // Process grade data
          const processedData = await this.processGradeData(
            {
              studentId: student.id,
              assessmentDefId,
              numericValue: row.marks,
              comment: row.comment,
            },
            assessment.classSubject.class.curriculum,
            assessment.maxMarks
          );

          // Upsert result
          const result = await tx.assessmentResult.upsert({
            where: {
              studentId_assessmentDefId: {
                studentId: student.id,
                assessmentDefId,
              },
            },
            create: {
              studentId: student.id,
              assessmentDefId,
              numericValue: processedData.numericValue,
              grade: processedData.grade,
              competencyLevel: processedData.competencyLevel,
              comment: row.comment,
              assessedById,
              schoolId,
            },
            update: {
              numericValue: processedData.numericValue,
              grade: processedData.grade,
              competencyLevel: processedData.competencyLevel,
              comment: row.comment,
              assessedById,
              updatedAt: new Date(),
            },
          });

          results.push(result);
        } catch (error) {
          errors.push({
            row: i + 2,
            admissionNo: row.studentAdmissionNo,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    });

    return {
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  /**
   * Get results with filtering
   */
  async getResults(
    schoolId: string,
    query: GetResultsQuery
  ): Promise<{
    results: AssessmentResult[];
    total: number;
    page: number;
    pages: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { schoolId };

    if (query.studentId) where.studentId = query.studentId;
    if (query.assessmentDefId) where.assessmentDefId = query.assessmentDefId;

    if (query.termId || query.academicYearId || query.classId) {
      where.assessmentDef = {};
      if (query.termId) where.assessmentDef.termId = query.termId;
      if (query.academicYearId) where.assessmentDef.academicYearId = query.academicYearId;
      if (query.classId) {
        where.assessmentDef.classSubject = { classId: query.classId };
      }
    }

    const [results, total] = await Promise.all([
      this.prisma.assessmentResult.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              admissionNo: true,
              firstName: true,
              lastName: true,
            },
          },
          assessmentDef: {
            include: {
              classSubject: {
                include: {
                  subject: true,
                  class: true,
                },
              },
              term: true,
            },
          },
          assessedBy: {
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
      }),
      this.prisma.assessmentResult.count({ where }),
    ]);

    return {
      results,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Update assessment result
   */
  async updateResult(
    id: string,
    data: UpdateAssessmentResultInput,
    schoolId: string
  ): Promise<AssessmentResult> {
    const existing = await this.prisma.assessmentResult.findFirst({
      where: { id, schoolId },
      include: {
        assessmentDef: {
          include: {
            classSubject: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new Error('Result not found');
    }

    // Validate new marks if provided
    if (data.numericValue !== undefined && existing.assessmentDef.maxMarks) {
      if (data.numericValue > existing.assessmentDef.maxMarks) {
        throw new Error(
          `Marks cannot exceed maximum (${existing.assessmentDef.maxMarks})`
        );
      }
    }

    // Process grade data
    const processedData = await this.processGradeData(
      {
        studentId: existing.studentId,
        assessmentDefId: existing.assessmentDefId,
        numericValue: data.numericValue ?? existing.numericValue ?? undefined,
        grade: data.grade,
        competencyLevel: data.competencyLevel,
        comment: data.comment,
      },
      existing.assessmentDef.classSubject.class.curriculum,
      existing.assessmentDef.maxMarks
    );

    return this.prisma.assessmentResult.update({
      where: { id },
      data: {
        ...(data.numericValue !== undefined && { numericValue: processedData.numericValue }),
        ...(processedData.grade && { grade: processedData.grade }),
        ...(processedData.competencyLevel && { competencyLevel: processedData.competencyLevel }),
        ...(data.comment !== undefined && { comment: data.comment }),
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
        assessmentDef: {
          include: {
            classSubject: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Delete assessment result
   */
  async deleteResult(id: string, schoolId: string): Promise<void> {
    const result = await this.prisma.assessmentResult.findFirst({
      where: { id, schoolId },
    });

    if (!result) {
      throw new Error('Result not found');
    }

    await this.prisma.assessmentResult.delete({
      where: { id },
    });
  }

  /**
   * Process and auto-convert grade data based on curriculum
   */
  private async processGradeData(
    data: Partial<CreateAssessmentResultInput>,
    curriculum: Curriculum,
    maxMarks?: number | null
  ): Promise<{
    numericValue?: number;
    grade?: string;
    competencyLevel?: CompetencyLevel;
  }> {
    const result: {
      numericValue?: number;
      grade?: string;
      competencyLevel?: CompetencyLevel;
    } = {
      numericValue: data.numericValue,
      grade: data.grade,
      competencyLevel: data.competencyLevel,
    };

    // For CBC, convert marks to competency levels
    if (curriculum === Curriculum.CBC && data.numericValue !== undefined && maxMarks) {
      const percentage = (data.numericValue / maxMarks) * 100;
      result.competencyLevel = this.getCompetencyLevel(percentage);
    }

    // For 8-4-4, convert marks to letter grades
    if (curriculum === Curriculum.EIGHT_FOUR_FOUR && data.numericValue !== undefined && maxMarks) {
      const percentage = (data.numericValue / maxMarks) * 100;
      result.grade = this.getLetterGrade(percentage);
    }

    return result;
  }

  /**
   * Get CBC competency level from percentage
   */
  private getCompetencyLevel(percentage: number): CompetencyLevel {
    if (percentage >= 80) return CompetencyLevel.EXCEEDING_EXPECTATIONS;
    if (percentage >= 60) return CompetencyLevel.MEETING_EXPECTATIONS;
    if (percentage >= 40) return CompetencyLevel.APPROACHING_EXPECTATIONS;
    return CompetencyLevel.BELOW_EXPECTATIONS;
  }

  /**
   * Get 8-4-4 letter grade from percentage
   */
  private getLetterGrade(percentage: number): string {
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'E';
  }
}
