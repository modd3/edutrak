import { AcademicYear, Term, Class, Stream, Curriculum, Pathway, TermName } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { BaseService } from './base.service';
import logger from '../utils/logger';
import { RequestWithUser } from '../middleware/school-context';

export class AcademicService extends BaseService {
  private req?: RequestWithUser;

  constructor(req?: RequestWithUser) {
    super();
    this.req = req;
  }

  // Helper to get school context from request
  private getSchoolContext() {
    return {
      schoolId: this.req?.schoolId,
      isSuperAdmin: this.req?.isSuperAdmin || false,
      userId: this.req?.user?.userId,
      role: this.req?.user?.role,
    };
  }

  // Academic Years - Now school-specific
  async createAcademicYear(data: {
    year: number;
    startDate: Date;
    endDate: Date;
    isActive?: boolean;
  }): Promise<AcademicYear> {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    if (!isSuperAdmin && !schoolId) {
      throw new Error('School context required for non-super admins');
    }

    if (data.isActive) {
      const where = this.buildWhereClause({ isActive: true }, schoolId, isSuperAdmin);
      await this.prisma.academicYear.updateMany({
        where,
        data: { isActive: false },
      });
    }

    const academicYear = await this.prisma.academicYear.create({
      data: {
        id: uuidv4(),
        ...data,
        schoolId: schoolId!, // Auto-assign school for non-super admins
      },
    });

    logger.info('Academic year created successfully', { 
      academicYearId: academicYear.id, 
      year: academicYear.year,
      schoolId,
      isActive: academicYear.isActive 
    });

    return academicYear;
  }

  async getAcademicYears() {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where = this.buildWhereClause({}, schoolId, isSuperAdmin);
    
    return await this.prisma.academicYear.findMany({
      where,
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
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where = this.buildWhereClause({ isActive: true }, schoolId, isSuperAdmin);
    
    return await this.prisma.academicYear.findFirst({
      where,
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
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where = this.buildWhereClause({ id }, schoolId, isSuperAdmin);
    
    return await this.prisma.academicYear.findUnique({
      where,
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
            student: true,
            class: true,
          },
          take: 10,
        },
      },
    });
  }

  async setActiveAcademicYear(id: string): Promise<AcademicYear> {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    if (!isSuperAdmin && !schoolId) {
      throw new Error('School context required for non-super admins');
    }

    // Verify the academic year belongs to the school (for non-super admins)
    if (!isSuperAdmin) {
      const hasAccess = await this.validateSchoolAccess(id, 'academicYear', schoolId, isSuperAdmin);
      if (!hasAccess) {
        throw new Error('Academic year not found or access denied');
      }
    }

    // Deactivate all active years in the same school context
    const deactivateWhere = this.buildWhereClause({ isActive: true }, schoolId, isSuperAdmin);
    await this.prisma.academicYear.updateMany({
      where: deactivateWhere,
      data: { isActive: false },
    });

    const academicYear = await this.prisma.academicYear.update({
      where: { id },
      data: { isActive: true },
    });

    logger.info('Active academic year set', { 
      academicYearId: id, 
      year: academicYear.year,
      schoolId 
    });
    
    return academicYear;
  }

  // Terms - School-specific through academic year relation
  async createTerm(data: {
    name: TermName;
    termNumber: number;
    startDate: Date;
    endDate: Date;
    academicYearId: string;
  }): Promise<Term> {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    // Verify the academic year belongs to the school
    if (!isSuperAdmin) {
      const academicYear = await this.prisma.academicYear.findFirst({
        where: this.buildWhereClause({ id: data.academicYearId }, schoolId, isSuperAdmin),
      });

      if (!academicYear) {
        throw new Error('Academic year not found or access denied');
      }
    }

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
            teacherProfile: {
              include: {
                user: true,
              },
            },
          },
        },
        AssessmentDefinitions: {
          include: {
            results: {
              include: {
                student: true,
              },
              take: 10,
            },
          },
          take: 10,
        },
      },
    });
  }

  async getTermsByAcademicYear(academicYearId: string): Promise<Term[]> {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    // Verify academic year access first
    if (!isSuperAdmin) {
      const academicYear = await this.prisma.academicYear.findFirst({
        where: this.buildWhereClause({ id: academicYearId }, schoolId, isSuperAdmin),
      });

      if (!academicYear) {
        throw new Error('Academic year not found or access denied');
      }
    }

    return await this.prisma.term.findMany({
      where: { academicYearId },
      orderBy: { termNumber: 'asc' },
      include: {
        _count: {
          select: {
            AssessmentDefinitions: true,
            classSubjects: true,
          },
        },
      },
    });
  }

  // Classes - School-specific
  async createClass(data: {
    name: string;
    level: string;
    curriculum: Curriculum;
    academicYearId: string;
    classTeacherId?: string;
    pathway?: Pathway;
  }): Promise<Class> {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    if (!isSuperAdmin && !schoolId) {
      throw new Error('School context required for non-super admins');
    }

    // Verify academic year access
    if (!isSuperAdmin) {
      const academicYear = await this.prisma.academicYear.findFirst({
        where: this.buildWhereClause({ id: data.academicYearId }, schoolId, isSuperAdmin),
      });

      if (!academicYear) {
        throw new Error('Academic year not found or access denied');
      }
    }

    const classData = await this.prisma.class.create({
      data: {
        id: uuidv4(),
        ...data,
        schoolId: schoolId!, // Auto-assign school
      },
    });

    logger.info('Class created successfully', { 
      classId: classData.id, 
      name: classData.name,
      schoolId 
    });

    return classData;
  }

  async getClassById(id: string): Promise<Class | null> {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where = this.buildWhereClause({ id }, schoolId, isSuperAdmin);
    
    return await this.prisma.class.findUnique({
      where,
      include: {
        academicYear: true,
        school: true,
        classTeacher: {
          include: {
            user: true,
          },
        },
        streams: {
          include: {
            _count: {
              select: { students: true },
            },
            streamTeacher: {
              include: {
                user: {
                  include: {
                    teacher: true
                  }
                },
              },
            },
          },
        },
        students: {
          where: { status: 'ACTIVE' },
          include: {
            student: true,
          },
        },
        subjects: {
          include: {
            subject: true,
            teacherProfile: {
              include: {
                user: true,
              },
            },
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

  async getSchoolClasses(academicYearId?: string) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where = this.buildWhereClause({}, schoolId, isSuperAdmin);
    
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    return await this.getPaginated('class', {
      where,
      include: {
        academicYear: true,
        classTeacher: {
          include: {
            user: true,
          },
        },
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
      schoolId,
      isSuperAdmin,
    });
  }

  async updateClass(id: string, data: Partial<Class>): Promise<Class> {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    // Verify access
    if (!isSuperAdmin) {
      const hasAccess = await this.validateSchoolAccess(id, 'class', schoolId, isSuperAdmin);
      if (!hasAccess) {
        throw new Error('Class not found or access denied');
      }
    }

    const classData = await this.prisma.class.update({
      where: { id },
      data,
    });

    logger.info('Class updated successfully', { classId: id, schoolId });
    return classData;
  }

  // Streams - School-specific
  async createStream(data: {
    name: string;
    capacity?: number;
    classId: string;
    streamTeacherId?: string;
  }): Promise<Stream> {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    if (!isSuperAdmin && !schoolId) {
      throw new Error('School context required for non-super admins');
    }

    // Verify the class belongs to the school
    const classWhere = this.buildWhereClause({ id: data.classId }, schoolId, isSuperAdmin);
    const classData = await this.prisma.class.findFirst({
      where: classWhere,
    });

    if (!classData) {
      throw new Error('Class not found or access denied');
    }

    const stream = await this.prisma.stream.create({
      data: {
        id: uuidv4(),
        ...data,
        schoolId: schoolId!, // Auto-assign school
      },
    });

    logger.info('Stream created successfully', { 
      streamId: stream.id, 
      name: stream.name,
      classId: data.classId,
      schoolId 
    });

    return stream;
  }

  async getStreamById(id: string): Promise<Stream | null> {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where = this.buildWhereClause({ id }, schoolId, isSuperAdmin);
    
    return await this.prisma.stream.findUnique({
      where,
      include: {
        class: true,
        school: true,
        streamTeacher: {
          include: {
            user: true,
          },
        },
        students: {
          where: { status: 'ACTIVE' },
          include: {
            student: true,
          },
        },
      },
    });
  }

  async getClassStreams(classId: string): Promise<Stream[]> {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where = this.buildWhereClause({ classId }, schoolId, isSuperAdmin);
    
    return await this.prisma.stream.findMany({
      where,
      include: {
        streamTeacher: {
          include: {
            user: true,
          },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateStream(id: string, data: Partial<Stream>): Promise<Stream> {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    // Verify access
    if (!isSuperAdmin) {
      const hasAccess = await this.validateSchoolAccess(id, 'stream', schoolId, isSuperAdmin);
      if (!hasAccess) {
        throw new Error('Stream not found or access denied');
      }
    }

    const stream = await this.prisma.stream.update({
      where: { id },
      data,
    });

    logger.info('Stream updated successfully', { streamId: id, schoolId });
    return stream;
  }

  async deleteStream(id: string): Promise<Stream> {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    // Verify access
    if (!isSuperAdmin) {
      const hasAccess = await this.validateSchoolAccess(id, 'stream', schoolId, isSuperAdmin);
      if (!hasAccess) {
        throw new Error('Stream not found or access denied');
      }
    }

    const stream = await this.prisma.stream.delete({
      where: { id },
    });

    logger.info('Stream deleted successfully', { streamId: id, schoolId });
    return stream;
  }

  // Academic Statistics - School-specific
  async getAcademicStatistics(academicYearId?: string) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    
    const baseWhere = this.buildWhereClause({}, schoolId, isSuperAdmin);
    const academicYearWhere = academicYearId ? { academicYearId } : {};
    
    const assessmentWhere = this.buildWhereClause(
      academicYearId ? { 
        classSubject: { 
          academicYearId: academicYearId 
        } 
      } : {},
      schoolId,
      isSuperAdmin
    );

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalAssessments,
      classDistribution,
      assessmentTrends
    ] = await Promise.all([
      this.prisma.studentClass.count({ 
        where: { 
          ...baseWhere, 
          ...academicYearWhere,
          status: 'ACTIVE' 
        } 
      }),
      this.prisma.teacher.count({ 
        where: this.buildWhereClause({}, schoolId, isSuperAdmin)
      }),
      this.prisma.class.count({ 
        where: { ...baseWhere, ...academicYearWhere } 
      }),
      this.prisma.assessmentDefinition.count({ 
        where: assessmentWhere 
      }),
      this.prisma.class.findMany({
        where: { ...baseWhere, ...academicYearWhere },
        include: {
          _count: {
            select: {
              students: true,
            },
          },
        },
      }),
      this.prisma.assessmentDefinition.groupBy({
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

  // Class Performance - School-specific
  async getClassPerformance(classId: string, termId?: string) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    // Verify class access first
    if (!isSuperAdmin) {
      const hasAccess = await this.validateSchoolAccess(classId, 'class', schoolId, isSuperAdmin);
      if (!hasAccess) {
        throw new Error('Class not found or access denied');
      }
    }

    const where: any = {
      assessmentDef: {
        classSubject: {
          classId,
        },
      },
    };

    if (termId) {
      where.assessmentDef = {
        ...where.assessmentDef,
        termId,
      };
    }

    const assessmentResults = await this.prisma.assessmentResult.findMany({
      where,
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

    
    const performanceByStudent = assessmentResults.reduce((acc, result) => {
      const studentId = result.studentId;
      const studentName = `${result.student.firstName} ${result.student.lastName}`;
      
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
      
      // Handle both numeric scores (8-4-4) and competency levels (CBC)
      if (result.numericValue !== null && result.assessmentDef.maxMarks) {
        acc[studentId].totalMarks += result.numericValue;
        acc[studentId].totalMaxMarks += result.assessmentDef.maxMarks;
        acc[studentId].count += 1;

        const subjectName = result.assessmentDef.classSubject.subject.name;
        if (!acc[studentId].subjects[subjectName]) {
          acc[studentId].subjects[subjectName] = {
            totalMarks: 0,
            totalMaxMarks: 0,
            count: 0,
            competencyLevels: [],
          };
        }
        
        acc[studentId].subjects[subjectName].totalMarks += result.numericValue;
        acc[studentId].subjects[subjectName].totalMaxMarks += result.assessmentDef.maxMarks;
        acc[studentId].subjects[subjectName].count += 1;
      }
      
      // Track competency levels for CBC
      if (result.competencyLevel) {
        const subjectName = result.assessmentDef.classSubject.subject.name;
        if (!acc[studentId].subjects[subjectName]) {
          acc[studentId].subjects[subjectName] = {
            totalMarks: 0,
            totalMaxMarks: 0,
            count: 0,
            competencyLevels: [],
          };
        }
        acc[studentId].subjects[subjectName].competencyLevels.push(result.competencyLevel);
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

    const performanceArray = Object.values(performanceByStudent);
    const classAverage = performanceArray.length > 0
      ? performanceArray.reduce((total: number, student: any) => total + student.average, 0) / performanceArray.length
      : 0;

    return {
      classId,
      performance: [], // Your calculated performance array
      classAverage: 0, // Your calculated average
    };
  }

  // Static method to create service with request context
  static withRequest(req: RequestWithUser): AcademicService {
    return new AcademicService(req);
  }
}
