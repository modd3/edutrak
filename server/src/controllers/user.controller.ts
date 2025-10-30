import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';
import { Role } from '@prisma/client';

const userService = new UserService();

export class UserController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return ResponseUtil.validationError(res, 'Email and password are required');
      }
      
      const result = await userService.login(email, password);
      return ResponseUtil.success(res, 'Login successful', result);
    } catch (error: any) {
      logger.warn('Login failed', { email: req.body.email, error: error.message });
      return ResponseUtil.unauthorized(res, error.message);
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const currentUser = req.user!;
      const result = await userService.createUser(req.body, {
        userId: currentUser.userId,
        role: currentUser.role as Role
      });
      
      return ResponseUtil.created(res, 'User created successfully', result);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'User with this email, ID number, or TSC number already exists');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getUsers(req: Request, res: Response) {
    try {
      const { role, schoolId, isActive, page, limit, search } = req.query;

      // Validate role against the Role enum
      const roleEnum = role && Object.values(Role).includes(role as Role) ? (role as Role) : undefined;

      const result = await userService.getUsers({
        role: roleEnum,
        schoolId: schoolId as string,
        isActive: isActive ? isActive === 'true' : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
      });
      
      return ResponseUtil.paginated(res, 'Users retrieved successfully', result.users, result.pagination);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.validationError(res, 'User ID is required');
      }
      
      const user = await userService.getUserById(id);
      
      if (!user) {
        return ResponseUtil.notFound(res, 'User');
      }

      return ResponseUtil.success(res, 'User retrieved successfully', user);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.validationError(res, 'User ID is required');
      }
      
      const user = await userService.updateUser(id, req.body);
      
      return ResponseUtil.success(res, 'User updated successfully', user);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'User');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async updatePassword(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.validationError(res, 'User ID is required');
      }
      
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return ResponseUtil.validationError(res, 'Current password and new password are required');
      }
      
      const user = await userService.updatePassword(id, currentPassword, newPassword);
      return ResponseUtil.success(res, 'Password updated successfully', user);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async activateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.validationError(res, 'User ID is required');
      }
      
      const user = await userService.setUserActiveStatus(id, true);
      
      return ResponseUtil.success(res, 'User activated successfully', user);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'User');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async deactivateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.validationError(res, 'User ID is required');
      }
      
      const user = await userService.setUserActiveStatus(id, false);
      
      return ResponseUtil.success(res, 'User deactivated successfully', user);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'User');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const currentUser = req.user!;
      const profile = await userService.getCompleteUserProfile(currentUser.userId);
      
      if (!profile) {
        return ResponseUtil.notFound(res, 'User');
      }

      return ResponseUtil.success(res, 'Profile retrieved successfully', profile);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getUserStats(req: Request, res: Response) {
    try {
      const { schoolId } = req.query;
      const stats = await userService.getUserStats(schoolId as string);
      
      return ResponseUtil.success(res, 'User statistics retrieved successfully', stats);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }
}