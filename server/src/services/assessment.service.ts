import { PrismaClient, Assessment, AssessmentType, CompetencyLevel, Student, User, Class, Stream, AcademicYear, ClassSubject, Subject, Term } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../database/client';
import logger from '../utils/logger';

export class AssessmentService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createAssessment(data: {
    name: string;
    type: AssessmentType;
    studentId: string;
    classSubjectId: string;
    termId: string;
    marksObtained?: number;
    maxMarks: number;
    competencyLevel?: CompetencyLevel;
    grade?: string;
    remarks?: string;
    assessedBy?: string;
    assessedDate?: Date;
  }): Promise<Assessment> {
    // Calculate grade if not provided and marks are available
    let grade = data.grade;
    if (!grade && data.marksObtained && data.maxMarks) {
      grade = this.calculateGrade(data.marksObtained, data.maxMarks, data.type);
    }

    const assessment = await this.prisma.assessment.create({
      data: {
        id: uuidv4(),
        ...data,
        grade,
      },
    });

    logger.info('Assessment created successfully', { 
      assessmentId: assessment.id, 
      studentId: data.studentId,
      type: data.type 
    });

    return assessment;
  }

  async createBulkAssessments(assessments: {
    name: string;
    type: AssessmentType;
    studentId: string;
    classSubjectId: string;
    termId: string;
    marksObtained?: number;
    maxMarks: number;
    competencyLevel?: CompetencyLevel;
    grade?: string;
    remarks?: string;
    assessedBy?: string;
    assessedDate?: Date;
  }[]) {
    const assessmentsWithGrades = assessments.map(assessment => {
      let grade = assessment.grade;
      if (!grade && assessment.marksObtained && assessment.maxMarks) {
        grade = this.calculateGrade(assessment.marksObtained, assessment.maxMarks, assessment.type);
      }

      return {
        id: uuidv4(),
        ...assessment,
        grade,
      };
    });

    const result = await this.prisma.assessment.createMany({
      data: assessmentsWithGrades,
    });

    logger.info('Bulk assessments created successfully', { 
      count: result.count,
      classSubjectId: assessments[0]?.classSubjectId 
    });

    return result;
  }

  async getAssessmentById(id: string): Promise<Assessment | null> {
    return await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        classSubject: {
          include: {
            subject: true,
            class: true,
            teacher: true,
          },
        },
        term: true,
      },
    });
  }

  async updateAssessment(id: string, data: Partial<Assessment>): Promise<Assessment> {
    // Recalculate grade if marks are updated
    if (data.marksObtained != null && data.maxMarks != null && !data.grade) {
      const assessment = await this.prisma.assessment.findUnique({ where: { id } });
      if (assessment) {
        data.grade = this.calculateGrade(data.marksObtained as number, data.maxMarks, assessment.type);
      }
    }

    const assessment = await this.prisma.assessment.update({
      where: { id },
      data,
    });

    logger.info('Assessment updated successfully', { assessmentId: id });
    return assessment;
  }

  async deleteAssessment(id: string): Promise<Assessment> {
    const assessment = await this.prisma.assessment.delete({
      where: { id },
    });

    logger.info('Assessment deleted successfully', { assessmentId: id });
    return assessment;
  }

  async getStudentAssessments(studentId: string, filters?: {
    termId?: string;
    classSubjectId?: string;
    type?: AssessmentType;
    page?: number;
    limit?: number;
  }) {
    const where: any = { studentId };
    
    if (filters?.termId) where.termId = filters.termId;
    if (filters?.classSubjectId) where.classSubjectId = filters.classSubjectId;
    if (filters?.type) where.type = filters.type;

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const [assessments, total] = await Promise.all([
      this.prisma.assessment.findMany({
        where,
        include: {
          classSubject: {
            include: {
              subject: true,
              class: true,
            },
          },
          term: true,
        },
        skip,
        take: limit,
        orderBy: { assessedDate: 'desc' },
      }),
      this.prisma.assessment.count({ where })
    ]);

    return {
      assessments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  async getClassSubjectAssessments(classSubjectId: string) {
    return await this.prisma.assessment.findMany({
      where: { classSubjectId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { assessedDate: 'desc' },
    });
  }

  async calculateStudentTermAverage(studentId: string, termId: string) {
    const assessments = await this.prisma.assessment.findMany({
      where: {
        studentId,
        termId,
        marksObtained: { not: null },
      },
      include: {
        classSubject: {
          include: {
            subject: true,
          },
        },
      },
    });

    const validAssessments = assessments.filter(a => a.marksObtained !== null && a.maxMarks > 0);
    
    if (validAssessments.length === 0) {
      return { 
        average: 0, 
        totalSubjects: 0,
        grade: 'N/A',
        assessments: [] 
      };
    }

    const totalPercentage = validAssessments.reduce((sum, assessment) => {
      return sum + (assessment.marksObtained! / assessment.maxMarks) * 100;
    }, 0);

    const average = totalPercentage / validAssessments.length;
    const grade = this.calculateGradeFromPercentage(average);

    return {
      average,
      totalSubjects: validAssessments.length,
      grade,
      assessments: validAssessments,
    };
  }

  async getClassSubjectStatistics(classSubjectId: string) {
    const assessments = await this.prisma.assessment.findMany({
      where: { classSubjectId },
    });

    const validAssessments = assessments.filter(a => a.marksObtained !== null);
    
    if (validAssessments.length === 0) {
      return {
        totalStudents: assessments.length,
        average: 0,
        highest: 0,
        lowest: 0,
        gradeDistribution: {},
      };
    }

    const marks = validAssessments.map(a => a.marksObtained!);
    const average = marks.reduce((a, b) => a + b, 0) / marks.length;
    const highest = Math.max(...marks);
    const lowest = Math.min(...marks);

    const gradeDistribution = validAssessments.reduce((acc, assessment) => {
      const grade = assessment.grade || 'Ungraded';
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalStudents: assessments.length,
      average,
      highest,
      lowest,
      gradeDistribution,
      passRate: (validAssessments.filter(a => (a.marksObtained! / a.maxMarks) >= 0.5).length / validAssessments.length) * 100,
    };
  }

  calculateGrade(marks: number, maxMarks: number, type: AssessmentType): string {
    const percentage = (marks / maxMarks) * 100;

    if (type === 'COMPETENCY_BASED') {
      if (percentage >= 85) return 'EXCEEDING_EXPECTATIONS';
      if (percentage >= 70) return 'MEETING_EXPECTATIONS';
      if (percentage >= 50) return 'APPROACHING_EXPECTATIONS';
      return 'BELOW_EXPECTATIONS';
    } else {
      // 8-4-4 grading system
      return this.calculateGradeFromPercentage(percentage);
    }
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

  async convertMarksToGrade(marks: number, maxMarks: number, curriculum: string) {
    const percentage = (marks / maxMarks) * 100;

    if (curriculum === 'CBC') {
      if (percentage >= 85) return 'EXCEEDING_EXPECTATIONS';
      if (percentage >= 70) return 'MEETING_EXPECTATIONS';
      if (percentage >= 50) return 'APPROACHING_EXPECTATIONS';
      return 'BELOW_EXPECTATIONS';
    } else {
      return this.calculateGradeFromPercentage(percentage);
    }
  }

  async generateStudentTermReport(studentId: string, termId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
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

    const assessments = await this.getStudentAssessments(studentId, { termId });
    const average = await this.calculateStudentTermAverage(studentId, termId);

    // Calculate subject-wise performance
    const subjectPerformance = assessments.assessments.reduce((acc, assessment) => {
      const subjectName = assessment.classSubject.subject.name;
      if (!acc[subjectName]) {
        acc[subjectName] = {
          subject: subjectName,
          totalMarks: 0,
          totalMaxMarks: 0,
          count: 0,
          assessments: [],
        };
      }
      
      if (assessment.marksObtained) {
        acc[subjectName].totalMarks += assessment.marksObtained;
        acc[subjectName].totalMaxMarks += assessment.maxMarks;
        acc[subjectName].count += 1;
      }
      
      acc[subjectName].assessments.push({
        name: assessment.name,
        type: assessment.type,
        marks: assessment.marksObtained,
        maxMarks: assessment.maxMarks,
        grade: assessment.grade,
        date: assessment.assessedDate,
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
      termAssessments: assessments.assessments,
      termAverage: average,
      subjectPerformance: Object.values(subjectPerformance),
      summary: {
        totalSubjects: Object.keys(subjectPerformance).length,
        completedAssessments: assessments.assessments.length,
        overallGrade: average.grade,
        attendance: '95%', // This would come from attendance module
        behavior: 'Good', // This would come from behavior tracking
      },
    };
  }

}