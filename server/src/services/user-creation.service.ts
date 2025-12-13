import { PrismaClient, Role } from '@prisma/client';
import { BaseService } from './base.service';
import { hashPassword } from '../utils/hash';
import { v4 as uuidv4 } from 'uuid';
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
  admissionNo?: string; // Optional - auto-generated if not provided
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
  employeeNumber: string;
  employmentType: 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'BOM' | 'PTA';
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

/**
 * CRITICAL SERVICE
 * This is the ONLY service that should create users with profiles
 * Ensures atomicity and data consistency through transactions
 */
export class UserCreationService extends BaseService {
  /**
   * Create user with role-specific profile in a single atomic transaction
   * This is the PRIMARY method for creating any user in the system
   */
  async createUserWithProfile(
    userData: BaseUserData,
    profileData?: StudentProfileData | TeacherProfileData | GuardianProfileData,
    schoolId?: string, // From middleware for school validation
    isSuperAdmin: boolean = false
  ) {
    // Validate school context
    if (!isSuperAdmin) {
      if (!schoolId) {
        throw new Error('School context required for non-super-admin users');
      }
      // Ensure userData.schoolId matches context schoolId
      userData.schoolId = schoolId;
    }

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
      let profile = null;
      switch (userData.role) {
        case 'STUDENT':
          profile = await this.createStudentProfile(
            tx,
            user,
            profileData as StudentProfileData
          );
          break;

        case 'TEACHER':
          profile = await this.createTeacherProfile(
            tx,
            user,
            profileData as TeacherProfileData
          );
          break;

        case 'PARENT':
          profile = await this.createGuardianProfile(
            tx,
            user,
            profileData as GuardianProfileData
          );
          break;

        case 'ADMIN':
        case 'SUPER_ADMIN':
        case 'SUPPORT_STAFF':
          // These roles don't need additional profiles
          break;

        default:
          throw new Error(`Unsupported role: ${userData.role}`);
      }

      // 3. Fetch the complete user with all relations
      const completeUser = await tx.user.findUnique({
        where: { id: user.id },
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
          student: true,
          teacher: true,
          guardian: true,
        },
      });

      logger.info('User created with profile', {
        userId: user.id,
        email: user.email,
        role: user.role,
        schoolId: userData.schoolId,
      });

      // Remove password before returning
      if (completeUser) {
        const { password, ...userWithoutPassword } = completeUser;
        return userWithoutPassword;
      }

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
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
      if (!profileData || !('gender' in profileData)) {
        throw new Error('Student profile data with gender is required');
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
   * Create student profile (PRIVATE - only called within transaction)
   */
  private async createStudentProfile(
    tx: any,
    user: any,
    profileData: StudentProfileData
  ) {
    // Auto-generate admission number if not provided
    let admissionNo = profileData.admissionNo;

    if (!admissionNo && user.schoolId) {
      admissionNo = await sequenceGenerator.generateNext(
        SequenceType.ADMISSION_NUMBER,
        user.schoolId
      );
      logger.info('Auto-generated admission number', { admissionNo, schoolId: user.schoolId });
    }

    // Validate uniqueness if manually provided
    if (admissionNo) {
      const existing = await tx.student.findUnique({
        where: { admissionNo },
      });

      if (existing) {
        throw new Error(`Student with admission number ${admissionNo} already exists`);
      }
    }

    // Auto-generate UPI if not provided
    let upiNumber = profileData.upiNumber;
    if (!upiNumber && user.schoolId && admissionNo) {
      const year = new Date().getFullYear();
      const schoolCode = user.schoolId.substring(0, 4).toUpperCase();
      upiNumber = `KE-${schoolCode}-${year}-${admissionNo}`;
    }

    return await tx.student.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        schoolId: user.schoolId,

        // Required name fields
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,

        // Student-specific fields
        admissionNo: admissionNo!,
        upiNumber,
        kemisUpi: profileData.kemisUpi,
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
   * Create teacher profile (PRIVATE - only called within transaction)
   */
  private async createTeacherProfile(
    tx: any,
    user: any,
    profileData: TeacherProfileData
  ) {
    // Validate TSC number uniqueness
    const existing = await tx.teacher.findUnique({
      where: { tscNumber: profileData.tscNumber },
    });

    if (existing) {
      throw new Error(`Teacher with TSC number ${profileData.tscNumber} already exists`);
    }

    return await tx.teacher.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        tscNumber: profileData.tscNumber,
        employeeNumber: profileData.employeeNumber,
        employmentType: profileData.employmentType,
        qualification: profileData.qualification,
        specialization: profileData.specialization,
        dateJoined: profileData.dateJoined || new Date(),
      },
    });
  }

  /**
   * Create guardian profile (PRIVATE - only called within transaction)
   */
  private async createGuardianProfile(
    tx: any,
    user: any,
    profileData: GuardianProfileData
  ) {
    return await tx.guardian.create({
      data: {
        id: uuidv4(),
        userId: user.id,
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
    schoolId?: string,
    isSuperAdmin: boolean = false,
    createdBy?: string
  ) {
    const results = {
      successful: [] as any[],
      failed: [] as any[],
    };

    for (const userData of usersData) {
      try {
        const user = await this.createUserWithProfile(
          userData.user,
          userData.profile,
          schoolId,
          isSuperAdmin
        );
        results.successful.push(user);
      } catch (error: any) {
        results.failed.push({
          data: userData,
          error: error.message,
        });
      }
    }

    logger.info('Bulk user creation completed', {
      successful: results.successful.length,
      failed: results.failed.length,
      schoolId,
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
    profileData?: Partial<StudentProfileData | TeacherProfileData | GuardianProfileData>,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // Get current user to know their role
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      // Validate school access
      if (!isSuperAdmin && schoolId && currentUser.schoolId !== schoolId) {
        throw new Error('Access denied: User does not belong to your school');
      }

      // Prevent changing school unless super admin
      if (!isSuperAdmin && userData.schoolId && userData.schoolId !== currentUser.schoolId) {
        throw new Error('Cannot transfer user to another school');
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
              data: {
                ...profileData as Partial<StudentProfileData>,
                // Sync name fields
                ...(userData.firstName && { firstName: userData.firstName }),
                ...(userData.lastName && { lastName: userData.lastName }),
                ...(userData.middleName !== undefined && { middleName: userData.middleName }),
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
      }

      // Return complete user
      const completeUser = await tx.user.findUnique({
        where: { id: userId },
        include: {
          school: true,
          student: true,
          teacher: true,
          guardian: true,
        },
      });

      if (completeUser) {
        const { password, ...userWithoutPassword } = completeUser;
        return userWithoutPassword;
      }

      return user;
    });

  }
}

export const userCreationService = new UserCreationService();
