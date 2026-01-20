// src/services/report-generation.service.ts

import { PrismaClient, Curriculum, CompetencyLevel } from '@prisma/client';

interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  assessments: Array<{
    assessmentId: string;
    assessmentName: string;
    type: string;
    marks: number;
    maxMarks: number;
    grade?: string;
    competencyLevel?: CompetencyLevel;
    percentage: number;
  }>;
  totalMarks: number;
  totalMaxMarks: number;
  average: number;
  grade?: string;
  competencyLevel?: CompetencyLevel;
  position?: number;
  comment?: string;
}

interface StudentReportCard {
  student: {
    id: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
    middleName?: string;
  };
  class: {
    id: string;
    name: string;
    level: string;
    curriculum: Curriculum;
  };
  term: {
    id: string;
    name: string;
    termNumber: number;
  };
  academicYear: {
    id: string;
    year: number;
  };
  subjects: SubjectPerformance[];
  overallPerformance: {
    totalMarks: number;
    totalMaxMarks: number;
    averagePercentage: number;
    overallGrade?: string;
    overallPosition?: number;
    totalStudents: number;
  };
  generatedAt: Date;
}

interface ClassPerformanceReport {
  class: {
    id: string;
    name: string;
    level: string;
    curriculum: Curriculum;
  };
  term: {
    id: string;
    name: string;
    termNumber: number;
  };
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    totalStudents: number;
    studentsAssessed: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
    gradeDistribution?: Record<string, number>;
    competencyDistribution?: Record<CompetencyLevel, number>;
  }>;
  overallStatistics: {
    totalStudents: number;
    averagePerformance: number;
    topPerformers: Array<{
      studentId: string;
      studentName: string;
      admissionNo: string;
      averageScore: number;
    }>;
  };
}

export class ReportGenerationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate student report card
   */
  async generateStudentReportCard(
    studentId: string,
    termId: string,
    schoolId: string
  ): Promise<StudentReportCard> {
    // Get student details
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            class: true,
            academicYear: true,
          },
        },
      },
    });

    if (!student || student.enrollments.length === 0) {
      throw new Error('Student not found or not enrolled');
    }

    const enrollment = student.enrollments[0];
    const classId = enrollment.classId;

    // Get term details
    const term = await this.prisma.term.findFirst({
      where: { id: termId, schoolId },
      include: { academicYear: true },
    });

    if (!term) {
      throw new Error('Term not found');
    }

    // Get all assessments for this student in this term
    const results = await this.prisma.assessmentResult.findMany({
      where: {
        studentId,
        schoolId,
        assessmentDef: {
          termId,
          classSubject: {
            classId,
          },
        },
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
      orderBy: {
        assessmentDef: {
          classSubject: {
            subject: {
              name: 'asc',
            },
          },
        },
      },
    });

    // Group results by subject
    const subjectMap = new Map<string, SubjectPerformance>();

    for (const result of results) {
      const subject = result.assessmentDef.classSubject.subject;
      const subjectId = subject.id;

      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subjectId,
          subjectName: subject.name,
          subjectCode: subject.code,
          assessments: [],
          totalMarks: 0,
          totalMaxMarks: 0,
          average: 0,
        });
      }

      const subjectPerf = subjectMap.get(subjectId)!;
      const maxMarks = result.assessmentDef.maxMarks || 100;
      const marks = result.numericValue || 0;

      subjectPerf.assessments.push({
        assessmentId: result.assessmentDef.id,
        assessmentName: result.assessmentDef.name,
        type: result.assessmentDef.type,
        marks,
        maxMarks,
        grade: result.grade || undefined,
        competencyLevel: result.competencyLevel || undefined,
        percentage: (marks / maxMarks) * 100,
      });

      subjectPerf.totalMarks += marks;
      subjectPerf.totalMaxMarks += maxMarks;
    }

    // Calculate subject averages and positions
    const subjects: SubjectPerformance[] = [];
    for (const [subjectId, subjectPerf] of subjectMap) {
      subjectPerf.average = (subjectPerf.totalMarks / subjectPerf.totalMaxMarks) * 100;

      // Get subject position
      const position = await this.getSubjectPosition(
        studentId,
        subjectId,
        termId,
        classId,
        schoolId
      );
      subjectPerf.position = position;

      // Assign grade based on curriculum
      if (enrollment.class.curriculum === Curriculum.CBC) {
        subjectPerf.competencyLevel = this.getCompetencyLevel(subjectPerf.average);
      } else if (enrollment.class.curriculum === Curriculum.EIGHT_FOUR_FOUR) {
        subjectPerf.grade = this.getLetterGrade(subjectPerf.average);
      }

      subjects.push(subjectPerf);
    }

    // Calculate overall performance
    const totalMarks = subjects.reduce((sum, s) => sum + s.totalMarks, 0);
    const totalMaxMarks = subjects.reduce((sum, s) => sum + s.totalMaxMarks, 0);
    const averagePercentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;

    // Get overall position
    const overallPosition = await this.getOverallPosition(
      studentId,
      termId,
      classId,
      schoolId
    );

    // Get total students in class
    const totalStudents = await this.prisma.studentClass.count({
      where: {
        classId,
        status: 'ACTIVE',
        schoolId,
      },
    });

    return {
      student: {
        id: student.id,
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: student.middleName || undefined,
      },
      class: {
        id: enrollment.class.id,
        name: enrollment.class.name,
        level: enrollment.class.level,
        curriculum: enrollment.class.curriculum,
      },
      term: {
        id: term.id,
        name: term.name,
        termNumber: term.termNumber,
      },
      academicYear: {
        id: term.academicYear.id,
        year: term.academicYear.year,
      },
      subjects,
      overallPerformance: {
        totalMarks,
        totalMaxMarks,
        averagePercentage,
        overallGrade: enrollment.class.curriculum === Curriculum.EIGHT_FOUR_FOUR 
          ? this.getLetterGrade(averagePercentage) 
          : undefined,
        overallPosition,
        totalStudents,
      },
      generatedAt: new Date(),
    };
  }

  /**
   * Generate class performance report
   */
  async generateClassPerformanceReport(
    classId: string,
    termId: string,
    schoolId: string
  ): Promise<ClassPerformanceReport> {
    // Get class details
    const classData = await this.prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classData) {
      throw new Error('Class not found');
    }

    // Get term details
    const term = await this.prisma.term.findFirst({
      where: { id: termId, schoolId },
    });

    if (!term) {
      throw new Error('Term not found');
    }

    // Get all students in class
    const students = await this.prisma.studentClass.findMany({
      where: {
        classId,
        status: 'ACTIVE',
        schoolId,
      },
      include: {
        student: true,
      },
    });

    const totalStudents = students.length;

    // Get all class subjects for this term
    const classSubjects = await this.prisma.classSubject.findMany({
      where: {
        classId,
        termId,
        schoolId,
      },
      include: {
        subject: true,
        assessments: {
          include: {
            results: true,
          },
        },
      },
    });

    // Calculate performance for each subject
    const subjects = [];
    for (const cs of classSubjects) {
      const allResults = cs.assessments.flatMap((a) => a.results);
      const uniqueStudents = new Set(allResults.map((r) => r.studentId));
      const studentsAssessed = uniqueStudents.size;

      if (allResults.length === 0) {
        continue;
      }

      // Calculate scores as percentages
      const scores = allResults.map((r) => {
        const assessment = cs.assessments.find((a) => a.id === r.assessmentDefId);
        const maxMarks = assessment?.maxMarks || 100;
        return ((r.numericValue || 0) / maxMarks) * 100;
      });

      const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const highestScore = Math.max(...scores);
      const lowestScore = Math.min(...scores);
      const passRate = (scores.filter((s) => s >= 50).length / scores.length) * 100;

      // Grade distribution
      let gradeDistribution: Record<string, number> | undefined;
      let competencyDistribution: Record<CompetencyLevel, number> | undefined;

      if (classData.curriculum === Curriculum.EIGHT_FOUR_FOUR) {
        gradeDistribution = {
          A: scores.filter((s) => s >= 80).length,
          B: scores.filter((s) => s >= 70 && s < 80).length,
          C: scores.filter((s) => s >= 60 && s < 70).length,
          D: scores.filter((s) => s >= 50 && s < 60).length,
          E: scores.filter((s) => s < 50).length,
        };
      } else if (classData.curriculum === Curriculum.CBC) {
        competencyDistribution = {
          [CompetencyLevel.EXCEEDING_EXPECTATIONS]: scores.filter((s) => s >= 80).length,
          [CompetencyLevel.MEETING_EXPECTATIONS]: scores.filter((s) => s >= 60 && s < 80).length,
          [CompetencyLevel.APPROACHING_EXPECTATIONS]: scores.filter((s) => s >= 40 && s < 60).length,
          [CompetencyLevel.BELOW_EXPECTATIONS]: scores.filter((s) => s < 40).length,
        };
      }

      subjects.push({
        subjectId: cs.subject.id,
        subjectName: cs.subject.name,
        totalStudents,
        studentsAssessed,
        averageScore,
        highestScore,
        lowestScore,
        passRate,
        gradeDistribution,
        competencyDistribution,
      });
    }

    // Calculate overall statistics
    const overallAveragePerformance =
      subjects.reduce((sum, s) => sum + s.averageScore, 0) / subjects.length || 0;

    // Get top performers
    const studentAverages = await Promise.all(
      students.map(async (enrollment) => {
        const results = await this.prisma.assessmentResult.findMany({
          where: {
            studentId: enrollment.studentId,
            schoolId,
            assessmentDef: {
              termId,
              classSubject: {
                classId,
              },
            },
          },
          include: {
            assessmentDef: true,
          },
        });

        const totalMarks = results.reduce((sum, r) => sum + (r.numericValue || 0), 0);
        const totalMaxMarks = results.reduce(
          (sum, r) => sum + (r.assessmentDef.maxMarks || 100),
          0
        );
        const average = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;

        return {
          studentId: enrollment.student.id,
          studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
          admissionNo: enrollment.student.admissionNo,
          averageScore: average,
        };
      })
    );

    const topPerformers = studentAverages
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10);

    return {
      class: {
        id: classData.id,
        name: classData.name,
        level: classData.level,
        curriculum: classData.curriculum,
      },
      term: {
        id: term.id,
        name: term.name,
        termNumber: term.termNumber,
      },
      subjects,
      overallStatistics: {
        totalStudents,
        averagePerformance: overallAveragePerformance,
        topPerformers,
      },
    };
  }

  /**
   * Get student's position in a specific subject
   */
  private async getSubjectPosition(
    studentId: string,
    subjectId: string,
    termId: string,
    classId: string,
    schoolId: string
  ): Promise<number> {
    // Get all students' total marks for this subject
    const classSubject = await this.prisma.classSubject.findFirst({
      where: {
        classId,
        subjectId,
        termId,
        schoolId,
      },
    });

    if (!classSubject) return 0;

    const allResults = await this.prisma.assessmentResult.findMany({
      where: {
        schoolId,
        assessmentDef: {
          classSubjectId: classSubject.id,
          termId,
        },
      },
      include: {
        assessmentDef: true,
      },
    });

    // Group by student
    const studentTotals = new Map<string, number>();
    for (const result of allResults) {
      const current = studentTotals.get(result.studentId) || 0;
      studentTotals.set(result.studentId, current + (result.numericValue || 0));
    }

    const studentScore = studentTotals.get(studentId) || 0;
    const sortedScores = Array.from(studentTotals.values()).sort((a, b) => b - a);
    
    return sortedScores.indexOf(studentScore) + 1;
  }

  /**
   * Get student's overall position in class
   */
  private async getOverallPosition(
    studentId: string,
    termId: string,
    classId: string,
    schoolId: string
  ): Promise<number> {
    // Get all students in class
    const students = await this.prisma.studentClass.findMany({
      where: {
        classId,
        status: 'ACTIVE',
        schoolId,
      },
    });

    // Calculate total marks for each student
    const studentTotals = await Promise.all(
      students.map(async (enrollment) => {
        const results = await this.prisma.assessmentResult.findMany({
          where: {
            studentId: enrollment.studentId,
            schoolId,
            assessmentDef: {
              termId,
              classSubject: {
                classId,
              },
            },
          },
        });

        const total = results.reduce((sum, r) => sum + (r.numericValue || 0), 0);
        return { studentId: enrollment.studentId, total };
      })
    );

    const studentScore = studentTotals.find((s) => s.studentId === studentId)?.total || 0;
    const sortedScores = studentTotals.map((s) => s.total).sort((a, b) => b - a);
    
    return sortedScores.indexOf(studentScore) + 1;
  }

  /**
   * Helper: Get competency level from percentage
   */
  private getCompetencyLevel(percentage: number): CompetencyLevel {
    if (percentage >= 80) return CompetencyLevel.EXCEEDING_EXPECTATIONS;
    if (percentage >= 60) return CompetencyLevel.MEETING_EXPECTATIONS;
    if (percentage >= 40) return CompetencyLevel.APPROACHING_EXPECTATIONS;
    return CompetencyLevel.BELOW_EXPECTATIONS;
  }

  /**
   * Helper: Get letter grade from percentage
   */
  private getLetterGrade(percentage: number): string {
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'E';
  }
}
