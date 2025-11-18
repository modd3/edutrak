// services/user-creation.service.ts
import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../utils/hash';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../database/client';
import logger from '../utils/logger';
import { sequenceGenerator, SequenceType } from './sequence-generator.service';

interface BaseUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  idNumber?: string;
  role: Role;
  schoolId?: string;
}

interface StudentProfileData {
  admissionNo: string;
  upiNumber?: string;
  kemisUpi?: string;
  gender: 'MALE' | 'FEMALE';
  dob?: Date;
  birthCertNo?: string;
  nationality?: string;
  county?: string;
  subCounty?: string;
  hasSpecialNeeds?: boolean;
  specialNeedsType?: string;
  medicalCondition?: string;
  allergies?: string;
}

interface TeacherProfileData {
  tscNumber: string;
  employmentType: 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'BOM' | 'PTA';
  employeeNumber?: string;
  qualification?: string;
  specialization?: string;
  dateJoined?: Date;
}

interface GuardianProfileData {
  relationship: string;
  occupation?: string;
  employer?: string;
  workPhone?: string;
}

export class UserCreationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Create user with role-specific profile in a single transaction
   */
  async createUserWithProfile(
    userData: BaseUserData,
    profileData?: StudentProfileData | TeacherProfileData | GuardianProfileData
  ) {
    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Validate required profile data based on role
    this.validateProfileData(userData.role, profileData);

    // Use transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      // 1. Create the base user
      const user = await tx.user.create({
        data: {
          id: uuidv4(),
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          middleName: userData.middleName,
          phone: userData.phone,
          idNumber: userData.idNumber,
          role: userData.role,
          schoolId: userData.schoolId,
        },
      });

      // 2. Create role-specific profile based on user role
      switch (userData.role) {
        case 'STUDENT':
          await this.createStudentProfile(tx, user.id, profileData as StudentProfileData, userData.schoolId, userData);
          break;

        case 'TEACHER':
          await this.createTeacherProfile(tx, user.id, profileData as TeacherProfileData);
          break;

        case 'PARENT':
          await this.createGuardianProfile(tx, user.id, profileData as GuardianProfileData);
          break;

        case 'ADMIN':
        case 'SUPER_ADMIN':
        case 'SUPPORT_STAFF':
          // These roles don't need additional profiles
          break;

        default:
          throw new Error(`Unsupported role: ${userData.role}`);
      }

      // 3. Fetch the complete user with profile
      const completeUser = await tx.user.findUnique({
        where: { id: user.id },
        include: {
          school: true,
          student: true,
          teacher: true,
          guardian: true,
        },
      });

      logger.info('User created with profile', {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return completeUser;
    });
  }

  /**
   * Validate that required profile data is provided for the role
   */
  private validateProfileData(
    role: Role,
    profileData?: StudentProfileData | TeacherProfileData | GuardianProfileData
  ) {
    if (role === 'STUDENT') {
      if (!profileData /*|| !('admissionNo' in profileData)*/) {
        throw new Error('Student profile data with admissionNo is required');
      }
      if (!('gender' in profileData)) {
        throw new Error('Student gender is required');
      }
    }

    if (role === 'TEACHER') {
      if (!profileData || !('tscNumber' in profileData)) {
        throw new Error('Teacher profile data with tscNumber is required');
      }
      if (!('employmentType' in profileData)) {
        throw new Error('Teacher employmentType is required');
      }
    }

    if (role === 'PARENT') {
      if (!profileData || !('relationship' in profileData)) {
        throw new Error('Guardian profile data with relationship is required');
      }
    }
  }

  /**
   * Create student profile
   */
  private async createStudentProfile(
    tx: any,
    userId: string,
    profileData: StudentProfileData,
    schoolId?: string,
    userData?: BaseUserData
  ) {
    // Auto-generate admission number if not provided
    let admissionNo = profileData.admissionNo;
    
    if (!admissionNo) {
      admissionNo = await sequenceGenerator.generateAdmissionNumber(schoolId);
      logger.info(`Auto-generated admission number: ${admissionNo}`, { admissionNo, schoolId });
    } else {
      // Validate uniqueness if manually provided
      const existing = await tx.student.findUnique({
        where: { admissionNo },
      });
      
      if (existing) {
        throw new Error(`Student with admission number ${admissionNo} already exists`);
      }
    }

    // Auto-generate UPI if not provided
    let upiNumber = profileData.upiNumber;
    if (!upiNumber) {
      // Format: COUNTRY-SCHOOL-YEAR-SEQUENCE
      const year = new Date().getFullYear();
      const schoolCode = schoolId?.substring(0, 4).toUpperCase() || 'XXXX';
      const sequence = await sequenceGenerator.generateNext(
        SequenceType.ADMISSION_NUMBER,
        schoolId
      );
      upiNumber = `KE-${schoolCode}-${year}-${sequence}`;
    }

    return await tx.student.create({
      data: {
        id: uuidv4(),
        userId,
        schoolId,
        admissionNo,
        upiNumber,
        kemisUpi: profileData.kemisUpi,
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        middleName: userData?.middleName || '',
        gender: profileData.gender,
        dob: profileData.dob,
        birthCertNo: profileData.birthCertNo,
        nationality: profileData.nationality || 'Kenyan',
        county: profileData.county,
        subCounty: profileData.subCounty,
        hasSpecialNeeds: profileData.hasSpecialNeeds || false,
        specialNeedsType: profileData.specialNeedsType,
        medicalCondition: profileData.medicalCondition,
        allergies: profileData.allergies,
      },
    });
  }


  /**
   * Create teacher profile
   */
  private async createTeacherProfile(
    tx: any,
    userId: string,
    profileData: TeacherProfileData,
    schoolId?: string
  ) {
    // Validate TSC number uniqueness
    if (profileData.tscNumber) {
      const existing = await tx.teacher.findUnique({
        where: { tscNumber: profileData.tscNumber },
      });

      if (existing) {
        throw new Error(`Teacher with TSC number ${profileData.tscNumber} already exists`);
      }
    }

    // Auto-generate employee number for internal tracking
    const employeeNumber = await sequenceGenerator.generateEmployeeNumber(schoolId);

    return await tx.teacher.create({
      data: {
        id: uuidv4(),
        userId,
        tscNumber: profileData.tscNumber,
        employeeNumber, // Store for internal reference
        employmentType: profileData.employmentType,
        qualification: profileData.qualification,
        specialization: profileData.specialization,
        dateJoined: profileData.dateJoined || new Date(),
      },
    });
  }

  /**
   * Create guardian profile
   */
  private async createGuardianProfile(
    tx: any,
    userId: string,
    profileData: GuardianProfileData
  ) {
    return await tx.guardian.create({
      data: {
        id: uuidv4(),
        userId,
        relationship: profileData.relationship,
        occupation: profileData.occupation,
        employer: profileData.employer,
        workPhone: profileData.workPhone,
      },
    });
  }

  /**
   * Bulk create users with profiles
   */
  async bulkCreateUsersWithProfiles(
    usersData: Array<{
      user: BaseUserData;
      profile?: StudentProfileData | TeacherProfileData | GuardianProfileData;
    }>,
    createdBy: string
  ) {
    const results = {
      successful: [] as any[],
      failed: [] as any[],
    };

    for (const userData of usersData) {
      try {
        const user = await this.createUserWithProfile(userData.user, userData.profile);
        results.successful.push(user);
      } catch (error: any) {
        results.failed.push({
          data: userData,
          error: error.message,
        });
      }
    }

    logger.info('Bulk user creation with profiles completed', {
      successful: results.successful.length,
      failed: results.failed.length,
      createdBy,
    });

    return results;
  }

  /**
   * Update user and profile
   */
  async updateUserWithProfile(
    userId: string,
    userData: Partial<BaseUserData>,
    profileData?: Partial<StudentProfileData | TeacherProfileData | GuardianProfileData>
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // Get current user to know their role
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      // Update user
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          middleName: userData.middleName,
          phone: userData.phone,
          idNumber: userData.idNumber,
          schoolId: userData.schoolId,
        },
      });

      // Update role-specific profile if data provided
      if (profileData) {
        switch (currentUser.role) {
          case 'STUDENT':
            await tx.student.update({
              where: { userId },
              data: {...profileData as Partial<StudentProfileData>,
                ...(userData.firstName && { firstName: userData.firstName }),
                ...(userData.lastName && { lastName: userData.lastName}),
                ...(userData.middleName && { middleName: userData.middleName}),
              },
            });
            break;

          case 'TEACHER':
            await tx.teacher.update({
              where: { userId },
              data: profileData as Partial<TeacherProfileData>,
            });
            break;

          case 'PARENT':
            await tx.guardian.update({
              where: { userId },
              data: profileData as Partial<GuardianProfileData>,
            });
            break;
        }
      } else if (
        currentUser.role === 'STUDENT' &&
        userData.firstName || userData.lastName || userData.middleName !== undefined
      ) {
        await tx.student.update ({
          where: {userId},
          data: {
            ...(userData.firstName && { firstName: userData.firstName}),
            ...(userData.lastName && { lastName: userData.lastName}),
            ...(userData.middleName && { middleName: userData.middleName}),
          }
        });
      }

      // Return complete user
      return await tx.user.findUnique({
        where: { id: userId },
        include: {
          school: true,
          student: true,
          teacher: true,
          guardian: true,
        },
      });
    });
  }
}

// Export singleton instance
export const userCreationService = new UserCreationService();