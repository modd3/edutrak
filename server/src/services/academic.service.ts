import { PrismaClient, AcademicYear, Term, Class, Stream, Curriculum, Pathway, TermName } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../database/client';
import logger from '../utils/logger';

export class AcademicService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  // Academic Years
  async createAcademicYear(data: {
    year: number;
    startDate: Date;
    endDate: Date;
    isActive?: boolean;
  }): Promise<AcademicYear> {
    if (data.isActive) {
      await this.prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const academicYear = await this.prisma.academicYear.create({
      data: {
        id: uuidv4(),
        ...data,
      },
    });

    logger.info('Academic year created successfully', { 
      academicYearId: academicYear.id, 
      year: academicYear.year,
      isActive: academicYear.isActive 
    });

    return academicYear;
  }

  async getAcademicYears() {
    return await this.prisma.academicYear.findMany({
      orderBy: { year: 'desc' },
      include: {
        _count: {
          select: {
            classes: true,
            terms: true,
            studentClasses: true,
          },
        },
      },
    });
  }

  async getActiveAcademicYear(): Promise<AcademicYear | null> {
    return await this.prisma.academicYear.findFirst({
      where: { isActive: true },
      include: {
        terms: {
          orderBy: { termNumber: 'asc' },
        },
        classes: {
          include: {
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });
  }

  async getAcademicYearById(id: string): Promise<AcademicYear | null> {
    return await this.prisma.academicYear.findUnique({
      where: { id },
      include: {
        terms: {
          orderBy: { termNumber: 'asc' },
        },
        classes: {
          include: {
            school: true,
            streams: true,
            _count: {
              select: { students: true },
            },
          },
        },
        studentClasses: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
            class: true,
          },
          take: 10, // Recent enrollments
        },
      },
    });
  }

  async setActiveAcademicYear(id: string): Promise<AcademicYear> {
    await this.prisma.academicYear.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const academicYear = await this.prisma.academicYear.update({
      where: { id },
      data: { isActive: true },
    });

    logger.info('Active academic year set', { academicYearId: id, year: academicYear.year });
    return academicYear;
  }

  // Terms
  async createTerm(data: {
    name: TermName;
    termNumber: number;
    startDate: Date;
    endDate: Date;
    academicYearId: string;
  }): Promise<Term> {
    const term = await this.prisma.term.create({
      data: {
        id: uuidv4(),
        ...data,
      },
    });

    logger.info('Term created successfully', { 
      termId: term.id, 
      name: term.name,
      academicYearId: data.academicYearId 
    });

    return term;
  }

  async getTermById(id: string): Promise<Term | null> {
    return await this.prisma.term.findUnique({
      where: { id },
      include: {
        academicYear: true,
        classSubjects: {
          include: {
            class: true,
            subject: true,
            teacher: true,  // ✅ Fixed: removed nested user include
          },
        },
        assessments: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
            classSubject: {
              include: {
                subject: true,
              },
            },
          },
          take: 10, // Recent assessments
        },
      },
    });
  }

  async getTermsByAcademicYear(academicYearId: string): Promise<Term[]> {
    return await this.prisma.term.findMany({
      where: { academicYearId },
      orderBy: { termNumber: 'asc' },
      include: {
        _count: {
          select: {
            assessments: true,
            classSubjects: true,
          },
        },
      },
    });
  }

  // Classes
  async createClass(data: {
    name: string;
    level: string;
    curriculum: Curriculum;
    academicYearId: string;
    schoolId: string;
    classTeacherId?: string;
    pathway?: Pathway;
  }): Promise<Class> {
    const classData = await this.prisma.class.create({
      data: {
        id: uuidv4(),
        ...data,
      },
    });

    logger.info('Class created successfully', { 
      classId: classData.id, 
      name: classData.name,
      schoolId: data.schoolId 
    });

    return classData;
  }

  async getClassById(id: string): Promise<Class | null> {
    return await this.prisma.class.findUnique({
      where: { id },
      include: {
        academicYear: true,
        school: true,
        classTeacher: true,  // ✅ Fixed: removed nested user include
        streams: {
          include: {
            _count: {
              select: { students: true },
            },
            streamTeacher: true,  // ✅ Fixed: removed nested user include
          },
        },
        students: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
        subjects: {
          include: {
            subject: true,
            teacher: true,  // ✅ Fixed: removed nested user include
            _count: {
              select: {
                assessments: true,
              },
            },
          },
        },
      },
    });
  }

  async getSchoolClasses(schoolId: string, academicYearId?: string) {
    const where: any = { schoolId };
    if (academicYearId) where.academicYearId = academicYearId;

    const classes = await this.prisma.class.findMany({
      where,
      include: {
        academicYear: true,
        classTeacher: true,  // ✅ Fixed: removed nested user include
        _count: {
          select: {
            students: true,
            streams: true,
            subjects: true,
          },
        },
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' },
      ],
    });

    return classes;
  }

  async updateClass(id: string, data: Partial<Class>): Promise<Class> {
    const classData = await this.prisma.class.update({
      where: { id },
      data,
    });

    logger.info('Class updated successfully', { classId: id });
    return classData;
  }

  // Streams
  async createStream(data: {
    name: string;
    capacity?: number;
    classId: string;
    schoolId: string;
    streamTeacherId?: string;
  }): Promise<Stream> {
    const stream = await this.prisma.stream.create({
      data: {
        id: uuidv4(),
        ...data,
      },
    });

    logger.info('Stream created successfully', { 
      streamId: stream.id, 
      name: stream.name,
      classId: data.classId 
    });

    return stream;
  }

  async getStreamById(id: string): Promise<Stream | null> {
    return await this.prisma.stream.findUnique({
      where: { id },
      include: {
        class: true,
        school: true,
        streamTeacher: true,  // ✅ Fixed: removed nested user include
        students: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  async getClassStreams(classId: string): Promise<Stream[]> {
    return await this.prisma.stream.findMany({
      where: { classId },
      include: {
        streamTeacher: true,  // ✅ Fixed: removed nested user include
        _count: {
          select: { students: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateStream(id: string, data: Partial<Stream>): Promise<Stream> {
    const stream = await this.prisma.stream.update({
      where: { id },
      data,
    });

    logger.info('Stream updated successfully', { streamId: id });
    return stream;
  }

  async deleteStream(id: string): Promise<Stream> {
    const stream = await this.prisma.stream.delete({
      where: { id },
    });

    logger.info('Stream deleted successfully', { streamId: id });
    return stream;
  }

  // Academic Statistics
 // Academic Statistics
async getAcademicStatistics(academicYearId?: string) {
  const where = academicYearId ? { academicYearId } : {};
  
  // Assessment filters need to go through classSubject relation
  const assessmentWhere = academicYearId 
    ? { 
        classSubject: { 
          academicYearId: academicYearId 
        } 
      } 
    : {};

  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalAssessments,
    classDistribution,
    assessmentTrends
  ] = await Promise.all([
    this.prisma.studentClass.count({ where: { ...where, status: 'ACTIVE' } }),
    this.prisma.teacher.count(),
    this.prisma.class.count({ where }),
    this.prisma.assessment.count({ where: assessmentWhere }),
    this.prisma.class.findMany({
      where,
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    }),
    this.prisma.assessment.groupBy({
      by: ['type'],
      where: assessmentWhere,
      _count: {
        id: true,
      },
    }),
  ]);

  return {
    totalStudents,
    totalTeachers,
    totalClasses,
    totalAssessments,
    classDistribution: classDistribution.map(cls => ({
      className: cls.name,
      studentCount: cls._count.students,
    })),
    assessmentTypes: assessmentTrends.map(trend => ({
      type: trend.type,
      count: trend._count?.id || 0,
    })),
  };
}
  async getClassPerformance(classId: string, termId?: string) {
    const where: any = {
      classSubject: {
        classId,
      },
    };

    if (termId) {
      where.termId = termId;
    }

    const assessments = await this.prisma.assessment.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
          },
        },
        classSubject: {
          include: {
            subject: true,
          },
        },
      },
    });

    const performanceByStudent = assessments.reduce((acc, assessment) => {
      const studentId = assessment.studentId;
      const studentName = `${assessment.student.user?.firstName} ${assessment.student.user?.lastName}`;
      
      if (!acc[studentId]) {
        acc[studentId] = {
          studentId,
          studentName,
          totalMarks: 0,
          totalMaxMarks: 0,
          count: 0,
          subjects: {},
        };
      }
      
      if (assessment.marksObtained && assessment.maxMarks) {
        acc[studentId].totalMarks += assessment.marksObtained;
        acc[studentId].totalMaxMarks += assessment.maxMarks;
        acc[studentId].count += 1;

        const subjectName = assessment.classSubject.subject.name;
        if (!acc[studentId].subjects[subjectName]) {
          acc[studentId].subjects[subjectName] = {
            totalMarks: 0,
            totalMaxMarks: 0,
            count: 0,
          };
        }
        
        acc[studentId].subjects[subjectName].totalMarks += assessment.marksObtained;
        acc[studentId].subjects[subjectName].totalMaxMarks += assessment.maxMarks;
        acc[studentId].subjects[subjectName].count += 1;
      }

      return acc;
    }, {} as any);

    // Calculate averages
    Object.values(performanceByStudent).forEach((student: any) => {
      student.average = student.count > 0 ? (student.totalMarks / student.totalMaxMarks) * 100 : 0;
      
      Object.keys(student.subjects).forEach(subject => {
        const subjectData = student.subjects[subject];
        subjectData.average = subjectData.count > 0 ? (subjectData.totalMarks / subjectData.totalMaxMarks) * 100 : 0;
      });
    });

    return {
      classId,
      performance: Object.values(performanceByStudent),
      classAverage: Object.values(performanceByStudent).reduce((total: number, student: any) => total + student.average, 0) / Object.keys(performanceByStudent).length,
    };
  }
}