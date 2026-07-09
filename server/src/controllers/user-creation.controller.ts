// src/controllers/user-creation.controller.ts
import { Response } from 'express';
import { RequestWithUser } from '../middleware/school-context';
import { userCreationService } from '../services/user-creation.service';
import { auditService } from '../services/audit.service';
import logger from '../utils/logger';
import { ResponseUtil } from '../utils/response';
import { webhookEmitter } from '../services/webhook-emitter.service';

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

      await webhookEmitter.emitUserEvent(user, "created");

      // Also emit student event if user is a student
      const createUser = user as any;
      if (createUser.role === 'STUDENT' && createUser.student) {
        await webhookEmitter.emitStudentEvent(createUser.student, "created");
      }

      // Audit log
      auditService.log({
        schoolId,
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'CREATE_USER',
        entityType: 'User',
        entityId: user.id,
        entityName: `${user.firstName} ${user.lastName}`,
        details: `Created ${user.role} user: ${user.firstName} ${user.lastName} (${user.email})`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }).catch((err) => logger.warn('Audit log failed', { error: err.message }));

      ResponseUtil.created(res, 'User Created Successfully', user);

    } catch (error: any) {
      logger.error('User creation error', { error: error.message });
      console.log("Error in User Creation: ", error);
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

      await webhookEmitter.emitUserEvent(user, "updated");

      // Also emit student event if user is a student
      const updatedUser = user as any;
      if (updatedUser.role === 'STUDENT' && updatedUser.student) {
        await webhookEmitter.emitStudentEvent(updatedUser.student, "updated");
      }


      // Audit log
      auditService.log({
        schoolId: req.schoolId,
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'UPDATE_USER',
        entityType: 'User',
        entityId: id,
        entityName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        details: `Updated user ${id}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }).catch((err) => logger.warn('Audit log failed', { error: err.message }));

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

      // Emit events for each successfully created user
      for (const user of results.successful) {
        await webhookEmitter.emitUserEvent(user, "created");
        
        const bulkUser = user as any;
        if (bulkUser.role === 'STUDENT' && bulkUser.student) {
          await webhookEmitter.emitStudentEvent(bulkUser.student, "created");
        }
      }

      // Audit log
      auditService.log({
        schoolId: req.schoolId,
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'BULK_CREATE_USERS',
        entityType: 'User',
        details: `Bulk created ${results.successful.length} users (${results.failed.length} failed)`,
        metadata: { successful: results.successful.length, failed: results.failed.length },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }).catch((err) => logger.warn('Audit log failed', { error: err.message }));

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