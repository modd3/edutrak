import { PrismaClient, AssessmentDefinition, AssessmentResult, AssessmentType, CompetencyLevel } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../database/client';
import logger from '../utils/logger';

export class AssessmentService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  // Assessment Definition methods
  async createAssessmentDefinition(data: {
    name: string;
    type: AssessmentType;
    maxMarks?: number;
    termId: string;
    classSubjectId: string;
    strandId?: string;
  }): Promise<AssessmentDefinition> {
    const assessmentDef = await this.prisma.assessmentDefinition.create({
      data: {
        id: uuidv4(),
        ...data,
      },
      include: {
        term: true,
        classSubject: {
          include: {
            subject: true,
            class: true,
          },
        },
        strand: true,
      },
    });

    logger.info('Assessment definition created successfully', { 
      assessmentDefId: assessmentDef.id, 
      name: assessmentDef.name,
      type: assessmentDef.type 
    });

    return assessmentDef;
  }

  async getAssessmentDefinitionById(id: string): Promise<AssessmentDefinition | null> {
    return await this.prisma.assessmentDefinition.findUnique({
      where: { id },
      include: {
        term: true,
        classSubject: {
          include: {
            subject: true,
            class: true,
            teacherProfile: {
              include: {
                user: true,
              },
            },
          },
        },
        strand: true,
        results: {
          include: {
            student: true,
          },
        },
      },
    });
  }

  async getClassSubjectAssessmentDefinitions(classSubjectId: string) {
    return await this.prisma.assessmentDefinition.findMany({
      where: { classSubjectId },
      include: {
        term: true,
        strand: true,
        _count: {
          select: {
            results: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Assessment Result methods
  async createAssessmentResult(data: {
    studentId: string;
    assessmentDefId: string;
    numericValue?: number;
    grade?: string;
    competencyLevel?: CompetencyLevel;
    comment?: string;
    assessedById: string;
  }): Promise<AssessmentResult> {
    // Get assessment definition to determine grading system
    const assessmentDef = await this.prisma.assessmentDefinition.findUnique({
      where: { id: data.assessmentDefId },
    });

    if (!assessmentDef) {
      throw new Error('Assessment definition not found');
    }

    // Calculate grade if not provided and numeric value is available
    let grade = data.grade;
    let competencyLevel = data.competencyLevel;

    if (assessmentDef.type === 'COMPETENCY_BASED') {
      if (!competencyLevel && data.numericValue && assessmentDef.maxMarks) {
        competencyLevel = this.calculateCompetencyLevel(data.numericValue, assessmentDef.maxMarks);
      }
    } else {
      if (!grade && data.numericValue && assessmentDef.maxMarks) {
        grade = this.calculateGrade(data.numericValue, assessmentDef.maxMarks);
      }
    }

    const result = await this.prisma.assessmentResult.create({
      data: {
        id: uuidv4(),
        studentId: data.studentId,
        assessmentDefId: data.assessmentDefId,
        numericValue: data.numericValue,
        grade,
        competencyLevel,
        comment: data.comment,
        assessedById: data.assessedById,
      },
      include: {
        student: true,
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

    logger.info('Assessment result created successfully', { 
      resultId: result.id, 
      studentId: data.studentId,
      assessmentDefId: data.assessmentDefId 
    });

    return result;
  }

  async createBulkAssessmentResults(results: {
    studentId: string;
    assessmentDefId: string;
    numericValue?: number;
    grade?: string;
    competencyLevel?: CompetencyLevel;
    comment?: string;
    assessedById: string;
  }[]) {
    // Get assessment definition once
    const assessmentDef = await this.prisma.assessmentDefinition.findUnique({
      where: { id: results[0]?.assessmentDefId },
    });

    if (!assessmentDef) {
      throw new Error('Assessment definition not found');
    }

    const resultsWithGrades = results.map(result => {
      let grade = result.grade;
      let competencyLevel = result.competencyLevel;

      if (assessmentDef.type === 'COMPETENCY_BASED') {
        if (!competencyLevel && result.numericValue && assessmentDef.maxMarks) {
          competencyLevel = this.calculateCompetencyLevel(result.numericValue, assessmentDef.maxMarks);
        }
      } else {
        if (!grade && result.numericValue && assessmentDef.maxMarks) {
          grade = this.calculateGrade(result.numericValue, assessmentDef.maxMarks);
        }
      }

      return {
        id: uuidv4(),
        ...result,
        grade,
        competencyLevel,
      };
    });

    const created = await this.prisma.assessmentResult.createMany({
      data: resultsWithGrades,
    });

    logger.info('Bulk assessment results created successfully', { 
      count: created.count,
      assessmentDefId: results[0]?.assessmentDefId 
    });

    return created;
  }

  async getAssessmentResultById(id: string): Promise<AssessmentResult | null> {
    return await this.prisma.assessmentResult.findUnique({
      where: { id },
      include: {
        student: true,
        assessmentDef: {
          include: {
            classSubject: {
              include: {
                subject: true,
                class: true,
              },
            },
            term: true,
            strand: true,
          },
        },
        assessedBy: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async updateAssessmentResult(id: string, data: {
    numericValue?: number;
    grade?: string;
    competencyLevel?: CompetencyLevel;
    comment?: string;
  }): Promise<AssessmentResult> {
    // Get the result and its assessment definition
    const existing = await this.prisma.assessmentResult.findUnique({
      where: { id },
      include: {
        assessmentDef: true,
      },
    });

    if (!existing) {
      throw new Error('Assessment result not found');
    }

    // Recalculate grade/competency if marks are updated
    let grade = data.grade;
    let competencyLevel = data.competencyLevel;

    if (data.numericValue !== undefined && existing.assessmentDef.maxMarks) {
      if (existing.assessmentDef.type === 'COMPETENCY_BASED') {
        if (!competencyLevel) {
          competencyLevel = this.calculateCompetencyLevel(data.numericValue, existing.assessmentDef.maxMarks);
        }
      } else {
        if (!grade) {
          grade = this.calculateGrade(data.numericValue, existing.assessmentDef.maxMarks);
        }
      }
    }

    const result = await this.prisma.assessmentResult.update({
      where: { id },
      data: {
        ...(data.numericValue !== undefined && { numericValue: data.numericValue }),
        ...(grade !== undefined && { grade }),
        ...(competencyLevel !== undefined && { competencyLevel }),
        ...(data.comment !== undefined && { comment: data.comment }),
      },
    });

    logger.info('Assessment result updated successfully', { resultId: id });
    return result;
  }

  async deleteAssessmentResult(id: string): Promise<AssessmentResult> {
    const result = await this.prisma.assessmentResult.delete({
      where: { id },
    });

    logger.info('Assessment result deleted successfully', { resultId: id });
    return result;
  }

  async getStudentAssessmentResults(studentId: string, filters?: {
    termId?: string;
    classSubjectId?: string;
    assessmentType?: AssessmentType;
    page?: number;
    limit?: number;
  }) {
    const where: any = { studentId };
    
    if (filters?.termId || filters?.classSubjectId || filters?.assessmentType) {
      where.assessmentDef = {};
      if (filters.termId) where.assessmentDef.termId = filters.termId;
      if (filters.classSubjectId) where.assessmentDef.classSubjectId = filters.classSubjectId;
      if (filters.assessmentType) where.assessmentDef.type = filters.assessmentType;
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      this.prisma.assessmentResult.findMany({
        where,
        include: {
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
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.assessmentResult.count({ where })
    ]);

    return {
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  async getAssessmentDefinitionResults(assessmentDefId: string) {
    return await this.prisma.assessmentResult.findMany({
      where: { assessmentDefId },
      include: {
        student: true,
      },
      orderBy: { 
        student: {
          firstName: 'asc',
        },
      },
    });
  }

  async calculateStudentTermAverage(studentId: string, termId: string) {
    const results = await this.prisma.assessmentResult.findMany({
      where: {
        studentId,
        assessmentDef: {
          termId,
        },
        numericValue: { not: null },
      },
      include: {
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

    const validResults = results.filter(r => r.numericValue !== null && r.assessmentDef.maxMarks && r.assessmentDef.maxMarks > 0);
    
    if (validResults.length === 0) {
      return { 
        average: 0, 
        totalSubjects: 0,
        grade: 'N/A',
        results: [] 
      };
    }

    const totalPercentage = validResults.reduce((sum, result) => {
      return sum + (result.numericValue! / result.assessmentDef.maxMarks!) * 100;
    }, 0);

    const average = totalPercentage / validResults.length;
    const grade = this.calculateGradeFromPercentage(average);

    return {
      average,
      totalSubjects: validResults.length,
      grade,
      results: validResults,
    };
  }

  async getClassSubjectStatistics(classSubjectId: string, termId?: string) {
    const where: any = {
      assessmentDef: {
        classSubjectId,
        ...(termId && { termId }),
      },
    };

    const results = await this.prisma.assessmentResult.findMany({
      where,
      include: {
        assessmentDef: true,
      },
    });

    const validResults = results.filter(r => r.numericValue !== null);
    
    if (validResults.length === 0) {
      return {
        totalStudents: results.length,
        average: 0,
        highest: 0,
        lowest: 0,
        gradeDistribution: {},
      };
    }

    const marks = validResults.map(r => r.numericValue!);
    const average = marks.reduce((a, b) => a + b, 0) / marks.length;
    const highest = Math.max(...marks);
    const lowest = Math.min(...marks);

    const gradeDistribution = validResults.reduce((acc, result) => {
      const grade = result.grade || result.competencyLevel || 'Ungraded';
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalStudents: results.length,
      average,
      highest,
      lowest,
      gradeDistribution,
      passRate: validResults.filter(r => {
        const assessmentDef = r.assessmentDef;
        return assessmentDef.maxMarks && (r.numericValue! / assessmentDef.maxMarks) >= 0.5;
      }).length / validResults.length * 100,
    };
  }

  calculateGrade(marks: number, maxMarks: number): string {
    const percentage = (marks / maxMarks) * 100;
    return this.calculateGradeFromPercentage(percentage);
  }

  calculateGradeFromPercentage(percentage: number): string {
    if (percentage >= 80) return 'A';
    if (percentage >= 75) return 'A-';
    if (percentage >= 70) return 'B+';
    if (percentage >= 65) return 'B';
    if (percentage >= 60) return 'B-';
    if (percentage >= 55) return 'C+';
    if (percentage >= 50) return 'C';
    if (percentage >= 45) return 'C-';
    if (percentage >= 40) return 'D+';
    if (percentage >= 35) return 'D';
    if (percentage >= 30) return 'D-';
    return 'E';
  }

  calculateCompetencyLevel(marks: number, maxMarks: number): CompetencyLevel {
    const percentage = (marks / maxMarks) * 100;
    
    if (percentage >= 85) return 'EXCEEDING_EXPECTATIONS';
    if (percentage >= 70) return 'MEETING_EXPECTATIONS';
    if (percentage >= 50) return 'APPROACHING_EXPECTATIONS';
    return 'BELOW_EXPECTATIONS';
  }

  async generateStudentTermReport(studentId: string, termId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            class: true,
            stream: true,
            academicYear: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const assessmentResults = await this.getStudentAssessmentResults(studentId, { termId });
    const average = await this.calculateStudentTermAverage(studentId, termId);

    // Calculate subject-wise performance
    const subjectPerformance = assessmentResults.results.reduce((acc, result) => {
      const subjectName = result.assessmentDef.classSubject.subject.name;
      if (!acc[subjectName]) {
        acc[subjectName] = {
          subject: subjectName,
          totalMarks: 0,
          totalMaxMarks: 0,
          count: 0,
          results: [],
        };
      }
      
      if (result.numericValue && result.assessmentDef.maxMarks) {
        acc[subjectName].totalMarks += result.numericValue;
        acc[subjectName].totalMaxMarks += result.assessmentDef.maxMarks;
        acc[subjectName].count += 1;
      }
      
      acc[subjectName].results.push({
        name: result.assessmentDef.name,
        type: result.assessmentDef.type,
        marks: result.numericValue,
        maxMarks: result.assessmentDef.maxMarks,
        grade: result.grade,
        competencyLevel: result.competencyLevel,
        date: result.createdAt,
      });

      return acc;
    }, {} as any);

    // Calculate subject averages
    Object.keys(subjectPerformance).forEach(subject => {
      const subjectData = subjectPerformance[subject];
      subjectData.average = subjectData.count > 0 ? (subjectData.totalMarks / subjectData.totalMaxMarks) * 100 : 0;
      subjectData.grade = this.calculateGradeFromPercentage(subjectData.average);
    });

    return {
      student,
      termResults: assessmentResults.results,
      termAverage: average,
      subjectPerformance: Object.values(subjectPerformance),
      summary: {
        totalSubjects: Object.keys(subjectPerformance).length,
        completedAssessments: assessmentResults.results.length,
        overallGrade: average.grade,
        attendance: '95%', // This would come from attendance module
        behavior: 'Good', // This would come from behavior tracking
      },
    };
  }
}