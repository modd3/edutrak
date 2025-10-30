import { PrismaClient, School, SchoolType, Ownership, BoardingStatus, SchoolGender, Role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../database/client';
import logger from '../utils/logger';

export class SchoolService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createSchool(data: {
    name: string;
    registrationNo?: string;
    type: SchoolType;
    county: string;
    subCounty?: string;
    ward?: string;
    knecCode?: string;
    nemisCode?: string;
    phone?: string;
    email?: string;
    address?: string;
    ownership: Ownership;
    boardingStatus: BoardingStatus;
    gender: SchoolGender;
  }, createdBy: { userId: string; role: Role }): Promise<School> {
    
    if (createdBy.role !== 'SUPER_ADMIN') {
      throw new Error('Only super admins can create schools');
    }

    const school = await this.prisma.school.create({
      data: {
        id: uuidv4(),
        ...data,
      },
    });

    logger.info('School created successfully', { 
      schoolId: school.id, 
      name: school.name,
      createdBy: createdBy.userId 
    });

    return school;
  }

  async getSchools(filters?: {
    county?: string;
    type?: SchoolType;
    ownership?: Ownership;
    boardingStatus?: BoardingStatus;
    gender?: SchoolGender;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const where: any = {
      ...(filters?.county && { county: filters.county }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.ownership && { ownership: filters.ownership }),
      ...(filters?.boardingStatus && { boardingStatus: filters.boardingStatus }),
      ...(filters?.gender && { gender: filters.gender }),
    };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { registrationNo: { contains: filters.search, mode: 'insensitive' } },
        { knecCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const [schools, total] = await Promise.all([
      this.prisma.school.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              students: true,
              classes: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.school.count({ where })
    ]);

    return {
      schools,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  async getSchoolById(id: string): Promise<School | null> {
    return await this.prisma.school.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            student: true,
            teacher: true,
            guardian: true,
          },
        },
        classes: {
          include: {
            _count: {
              select: { students: true },
            },
            academicYear: true,
            classTeacher: {
              include: {
                teacher: true,
              },
            },
          },
        },
        students: {
          include: {
            enrollments: {
              include: {
                class: true,
                stream: true,
              },
            },
          },
        },
        subjectOfferings: {
          include: {
            subject: true,
          },
        },
        streams: {
          include: {
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });
  }

  async updateSchool(id: string, data: Partial<School>): Promise<School> {
    const school = await this.prisma.school.update({
      where: { id },
      data,
    });

    logger.info('School updated successfully', { schoolId: id });

    return school;
  }

  async deleteSchool(id: string): Promise<School> {
    const school = await this.prisma.school.delete({
      where: { id },
    });

    logger.info('School deleted successfully', { schoolId: id });

    return school;
  }

  async getSchoolStatistics(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: {
              where: { isActive: true },
            },
            students: true,
            classes: true,
            streams: true,
          },
        },
        users: {
          where: { isActive: true },
          select: {
            role: true,
          },
        },
        students: {
          select: {
            gender: true,
            hasSpecialNeeds: true,
          },
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

    if (!school) {
      throw new Error('School not found');
    }

    const roleCounts = school.users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const genderCounts = school.students.reduce((acc, student) => {
      acc[student.gender] = (acc[student.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const classStats = school.classes.map(cls => ({
      name: cls.name,
      studentCount: cls._count.students,
    }));

    return {
      totalUsers: school._count.users,
      totalStudents: school._count.students,
      totalClasses: school._count.classes,
      totalStreams: school._count.streams,
      usersByRole: roleCounts,
      studentsByGender: genderCounts,
      studentsWithSpecialNeeds: school.students.filter(s => s.hasSpecialNeeds).length,
      classStatistics: classStats,
    };
  }

  async getSchoolPerformance(id: string, academicYearId?: string) {
    // This would include performance metrics, average scores, etc.
    // Implementation depends on specific requirements
    return {
      schoolId: id,
      averagePerformance: 75.5,
      topPerformingClass: 'Form 4 East',
      improvementRate: 5.2,
    };
  }
}