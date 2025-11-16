// controllers/user-creation.controller.ts
import { Request, Response } from 'express';
import { userCreationService } from '../services/user-creation.service';

export class UserCreationController {
  /**
   * POST /api/users
   * Create user with role-specific profile
   */
  async createUserWithProfile(req: Request, res: Response) {
    try {
      const { user, profile } = req.body;

      // Validate required fields
      if (!user || !user.email || !user.password || !user.role) {
        return res.status(400).json({
          message: 'User data with email, password, and role is required',
        });
      }

      // Create user with profile
      const createdUser = await userCreationService.createUserWithProfile(user, profile);

      // Remove password from response
      const { password, ...userResponse } = createdUser;

      return res.status(201).json(userResponse);
    } catch (error: any) {
      console.error('User creation error:', error);
      return res.status(400).json({ message: error.message });
    }
  }

  /**
   * PUT /api/users/:id
   * Update user with role-specific profile
   */
  async updateUserWithProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user, profile } = req.body;

      const updatedUser = await userCreationService.updateUserWithProfile(id, user, profile);

      // Remove password from response
      const { password, ...userResponse } = updatedUser;

      res.json(userResponse);
    } catch (error: any) {
      console.error('User update error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * POST /api/users/bulk
   * Bulk create users with profiles
   */
  async bulkCreateUsersWithProfiles(req: Request, res: Response) {
    try {
      const { users } = req.body;
      const createdBy = (req as any).user.userId;

      if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({
          message: 'Users array is required',
        });
      }

      const result = await userCreationService.bulkCreateUsersWithProfiles(users, createdBy);

      return res.json(result);
    } catch (error: any) {
      console.error('Bulk user creation error:', error);
      return res.status(400).json({ message: error.message });
    }
  }
}

// Usage examples in route file
/**
 * Example request bodies:
 * 
 * 1. Create Student:
 * POST /api/users
 * {
 *   "user": {
 *     "email": "student@school.com",
 *     "password": "Pass123!@#",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "role": "STUDENT",
 *     "schoolId": "school-uuid"
 *   },
 *   "profile": {
 *     "admissionNo": "STU2024001",
 *     "gender": "MALE",
 *     "dob": "2010-05-15",
 *     "county": "Nairobi"
 *   }
 * }
 * 
 * 2. Create Teacher:
 * POST /api/users
 * {
 *   "user": {
 *     "email": "teacher@school.com",
 *     "password": "Pass123!@#",
 *     "firstName": "Jane",
 *     "lastName": "Smith",
 *     "role": "TEACHER",
 *     "schoolId": "school-uuid"
 *   },
 *   "profile": {
 *     "tscNumber": "TSC123456",
 *     "employmentType": "PERMANENT",
 *     "qualification": "Bachelor of Education",
 *     "specialization": "Mathematics"
 *   }
 * }
 * 
 * 3. Create Parent/Guardian:
 * POST /api/users
 * {
 *   "user": {
 *     "email": "parent@example.com",
 *     "password": "Pass123!@#",
 *     "firstName": "Mary",
 *     "lastName": "Johnson",
 *     "role": "PARENT"
 *   },
 *   "profile": {
 *     "relationship": "Mother",
 *     "occupation": "Doctor",
 *     "employer": "Nairobi Hospital"
 *   }
 * }
 * 
 * 4. Create Admin (no profile needed):
 * POST /api/users
 * {
 *   "user": {
 *     "email": "admin@school.com",
 *     "password": "Pass123!@#",
 *     "firstName": "Admin",
 *     "lastName": "User",
 *     "role": "ADMIN",
 *     "schoolId": "school-uuid"
 *   }
 * }
 */