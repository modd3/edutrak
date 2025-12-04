// src/controllers/user-creation.controller.ts
import { Response } from 'express';
import { RequestWithUser } from '../middleware/school-context';
import { userCreationService } from '../services/user-creation.service';
import logger from '../utils/logger';
import { ResponseUtil } from '../utils/response';

export class UserCreationController {
  /**
   * Create user with profile
   * This is the ONLY endpoint for creating users
   */
  async createUserWithProfile(req: RequestWithUser, res: Response) {
    try {
      const { user: userData, profile: profileData } = req.body;

      // School context from middleware
      const schoolId = req.schoolId;
      const isSuperAdmin = req.isSuperAdmin || false;

      // Create user with profile in atomic transaction
      const user = await userCreationService.createUserWithProfile(
        userData,
        profileData,
        schoolId,
        isSuperAdmin
      );

      logger.info('User created via API', {
        userId: user.id,
        role: user.role,
        createdBy: req.user?.userId,
        schoolId,
      });

      ResponseUtil.created(res, 'User Created Successfully', user);

    } catch (error: any) {
      logger.error('User creation error', { error: error.message });
      ResponseUtil.error(res, 'Error Creating User!', res.statusCode, error);
    }
  }

  /**
   * Update user with profile
   */
  async updateUserWithProfile(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const { user: userData, profile: profileData } = req.body;

      const user = await userCreationService.updateUserWithProfile(
        id,
        userData,
        profileData,
        req.schoolId,
        req.isSuperAdmin || false
      );

      res.json({
        data: user,
        message: 'User updated successfully',
      });
    } catch (error: any) {
      logger.error('User update error', { error: error.message });
      res.status(400).json({
        error: 'USER_UPDATE_FAILED',
        message: error.message,
      });
    }
  }

  /**
   * Bulk create users with profiles
   */
  async bulkCreateUsers(req: RequestWithUser, res: Response) {
    try {
      const { users } = req.body;

      const results = await userCreationService.bulkCreateUsersWithProfiles(
        users,
        req.schoolId,
        req.isSuperAdmin || false,
        req.user?.userId
      );

      res.status(201).json({
        data: results,
        message: `Created ${results.successful.length} users, ${results.failed.length} failed`,
      });
    } catch (error: any) {
      logger.error('Bulk user creation error', { error: error.message });
      res.status(400).json({
        error: 'BULK_CREATION_FAILED',
        message: error.message,
      });
    }
  }
}

export const userCreationController = new UserCreationController();