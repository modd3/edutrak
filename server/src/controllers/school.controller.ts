import { Request, Response } from 'express';
import { SchoolService } from '../services/school.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';

const schoolService = new SchoolService();

export class SchoolController {
  async createSchool(req: Request, res: Response) {
    try {
      const currentUser = req.user!;
      
      const school = await schoolService.createSchool(req.body, {
        userId: currentUser.userId,
        role: currentUser.role
      });
      return ResponseUtil.created(res, 'School created successfully', school);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'School with this registration number, KNEC code, or NEMIS code already exists');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getSchools(req: Request, res: Response) {
    try {
      const filters = req.query;
      const result = await schoolService.getSchools({
        county: filters.county as string,
        type: filters.type as any,
        ownership: filters.ownership as any,
        boardingStatus: filters.boardingStatus as any,
        gender: filters.gender as any,
        page: filters.page ? parseInt(filters.page as string) : undefined,
        limit: filters.limit ? parseInt(filters.limit as string) : undefined,
        search: filters.search as string,
      });
      
      return ResponseUtil.paginated(res, 'Schools retrieved successfully', result.schools, result.pagination);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getSchoolById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const school = await schoolService.getSchoolById(id);
      
      if (!school) {
        return ResponseUtil.notFound(res, 'School');
      }

      return ResponseUtil.success(res, 'School retrieved successfully', school);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async updateSchool(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const school = await schoolService.updateSchool(id, req.body);
      
      return ResponseUtil.success(res, 'School updated successfully', school);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'School');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async deleteSchool(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await schoolService.deleteSchool(id);
      
      return ResponseUtil.success(res, 'School deleted successfully');
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'School');
      }
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getSchoolStatistics(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const statistics = await schoolService.getSchoolStatistics(id);
      
      return ResponseUtil.success(res, 'School statistics retrieved successfully', statistics);
    } catch (error: any) {
      if (error.message === 'School not found') {
        return ResponseUtil.notFound(res, 'School');
      }
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getSchoolPerformance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { academicYearId } = req.query;
      
      const performance = await schoolService.getSchoolPerformance(id, academicYearId as string);
      return ResponseUtil.success(res, 'School performance retrieved successfully', performance);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }
}