import { PrismaClient, Subject, SubjectCategory, LearningArea, SubjectGroup, Curriculum } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../database/client';
import logger from '../utils/logger';

export class SubjectService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createSubject(data: {
    name: string;
    code: string;
    category: SubjectCategory;
    learningArea?: LearningArea;
    subjectGroup?: SubjectGroup;
    curriculum: Curriculum[];
    description?: string;
  }): Promise<Subject> {
    const subject = await this.prisma.subject.create({
      data: {
        id: uuidv4(),
        ...data,
      },
    });

    logger.info('Subject created successfully', { subjectId: subject.id, code: subject.code });
    return subject;
  }

  async getSubjects(filters?: {
    curriculum?: Curriculum;
    learningArea?: LearningArea;
    category?: SubjectCategory;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.curriculum) where.curriculum = { has: filters.curriculum };
    if (filters?.learningArea) where.learningArea = filters.learningArea;
    if (filters?.category) where.category = filters.category;

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const [subjects, total] = await Promise.all([
      this.prisma.subject.findMany({
        where,
        include: {
          offerings: {
            include: {
              school: true,
            },
          },
          classLinks: {
            include: {
              class: true,
              teacherProfile: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.subject.count({ where })
    ]);

    return {
      subjects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  async getSubjectById(id: string): Promise<Subject | null> {
    return await this.prisma.subject.findUnique({
      where: { id },
      include: {
        offerings: {
          include: {
            school: true,
          },
        },
        classLinks: {
          include: {
            class: true,
            teacherProfile: {
              include: {
                user: true,
              },
            },
            assessments: {
              include: {
                results: {
                  include: {
                    student: true,
                  },
                  take: 10,
                },
              },
              take: 10, // Recent assessment definitions
            },
          },
        },
        strands: {
          include: {
            classSubjects: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });
  }

  async getSubjectByCode(code: string): Promise<Subject | null> {
    return await this.prisma.subject.findUnique({
      where: { code },
      include: {
        offerings: {
          include: {
            school: true,
          },
        },
      },
    });
  }

  async updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
    const subject = await this.prisma.subject.update({
      where: { id },
      data,
    });

    logger.info('Subject updated successfully', { subjectId: id });
    return subject;
  }

  async deleteSubject(id: string): Promise<Subject> {
    const subject = await this.prisma.subject.delete({
      where: { id },
    });

    logger.info('Subject deleted successfully', { subjectId: id });
    return subject;
  }

  async addSubjectToSchool(data: {
    schoolId: string;
    subjectId: string;
  }) {
    const offering = await this.prisma.subjectOffering.create({
      data: {
        id: uuidv4(),
        ...data,
      },
      include: {
        school: true,
        subject: true,
      },
    });

    logger.info('Subject added to school successfully', { 
      schoolId: data.schoolId, 
      subjectId: data.subjectId 
    });

    return offering;
  }

  async getSchoolSubjects(schoolId: string) {
    return await this.prisma.subjectOffering.findMany({
      where: { schoolId },
      include: {
        subject: true,
      },
      orderBy: {
        subject: {
          name: 'asc',
        },
      },
    });
  }

  async toggleSubjectOffering(id: string, isActive: boolean) {
    const offering = await this.prisma.subjectOffering.update({
      where: { id },
      data: { isActive },
      include: {
        subject: true,
        school: true,
      },
    });

    logger.info('Subject offering status updated', { 
      offeringId: id, 
      isActive,
      subject: offering.subject.name 
    });

    return offering;
  }

  async removeSubjectFromSchool(schoolId: string, subjectId: string) {
    const offering = await this.prisma.subjectOffering.delete({
      where: {
        schoolId_subjectId: {
          schoolId,
          subjectId,
        },
      },
    });

    logger.info('Subject removed from school successfully', { schoolId, subjectId });
    return offering;
  }

  async getCBCSubjectsByLearningArea(learningArea: LearningArea) {
    return await this.prisma.subject.findMany({
      where: {
        learningArea,
        curriculum: { has: 'CBC' },
      },
      include: {
        offerings: {
          include: {
            school: true,
          },
        },
        strands: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async get844SubjectsByGroup(subjectGroup: SubjectGroup) {
    return await this.prisma.subject.findMany({
      where: {
        subjectGroup,
        curriculum: { has: 'EIGHT_FOUR_FOUR' },
      },
      include: {
        offerings: {
          include: {
            school: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getSubjectPerformance(subjectId: string, academicYearId?: string) {
    const where: any = {
      assessmentDef: {
        classSubject: {
          subjectId,
          ...(academicYearId && { academicYearId }),
        },
      },
    };

    const results = await this.prisma.assessmentResult.findMany({
      where,
      include: {
        student: true,
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

    const performanceByClass = results.reduce((acc, result) => {
      const className = result.assessmentDef.classSubject.class.name;
      
      if (!acc[className]) {
        acc[className] = {
          className,
          totalMarks: 0,
          totalMaxMarks: 0,
          count: 0,
          students: {},
        };
      }
      
      if (result.numericValue && result.assessmentDef.maxMarks) {
        acc[className].totalMarks += result.numericValue;
        acc[className].totalMaxMarks += result.assessmentDef.maxMarks;
        acc[className].count += 1;

        const studentId = result.studentId;
        const studentName = `${result.student.firstName} ${result.student.lastName}`;
        
        if (!acc[className].students[studentId]) {
          acc[className].students[studentId] = {
            studentName,
            totalMarks: 0,
            totalMaxMarks: 0,
            count: 0,
          };
        }
        
        acc[className].students[studentId].totalMarks += result.numericValue;
        acc[className].students[studentId].totalMaxMarks += result.assessmentDef.maxMarks;
        acc[className].students[studentId].count += 1;
      }

      return acc;
    }, {} as any);

    // Calculate averages
    Object.keys(performanceByClass).forEach(className => {
      const classData = performanceByClass[className];
      classData.average = classData.count > 0 ? (classData.totalMarks / classData.totalMaxMarks) * 100 : 0;
      
      Object.keys(classData.students).forEach(studentId => {
        const studentData = classData.students[studentId];
        studentData.average = studentData.count > 0 ? (studentData.totalMarks / studentData.totalMaxMarks) * 100 : 0;
      });
    });

    const performanceArray = Object.values(performanceByClass);
    const overallAverage = performanceArray.length > 0
      ? performanceArray.reduce((total: number, classData: any) => total + classData.average, 0) / performanceArray.length
      : 0;

    return {
      subjectId,
      performanceByClass: performanceArray,
      totalAssessments: results.length,
      overallAverage,
    };
  }

  async getCurriculumSubjects(curriculum: Curriculum) {
    return await this.prisma.subject.findMany({
      where: {
        curriculum: { has: curriculum },
      },
      include: {
        offerings: {
          include: {
            school: true,
          },
        },
        strands: curriculum === 'CBC' ? true : false,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  // Strand management for CBC subjects
  async createStrand(data: {
    name: string;
    description?: string;
    subjectId: string;
  }) {
    const strand = await this.prisma.strand.create({
      data: {
        id: uuidv4(),
        ...data,
      },
      include: {
        subject: true,
      },
    });

    logger.info('Strand created successfully', { 
      strandId: strand.id, 
      subjectId: data.subjectId 
    });

    return strand;
  }

  async getSubjectStrands(subjectId: string) {
    return await this.prisma.strand.findMany({
      where: { subjectId },
      include: {
        classSubjects: {
          include: {
            classSubject: {
              include: {
                class: true,
              },
            },
          },
        },
        assessmentDefinitions: {
          include: {
            classSubject: {
              include: {
                class: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateStrand(id: string, data: { name?: string; description?: string }) {
    const strand = await this.prisma.strand.update({
      where: { id },
      data,
    });

    logger.info('Strand updated successfully', { strandId: id });
    return strand;
  }

  async deleteStrand(id: string) {
    const strand = await this.prisma.strand.delete({
      where: { id },
    });

    logger.info('Strand deleted successfully', { strandId: id });
    return strand;
  }
}