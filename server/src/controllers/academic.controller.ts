import { Request, Response } from 'express';
import { AcademicService } from '../services/academic.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';

const academicService = new AcademicService();

export class AcademicController {
  // Academic Years
  async createAcademicYear(req: Request, res: Response): Promise<Response> {
    try {
      const { year, startDate, endDate } = req.body;
      
      if (!year || !startDate || !endDate) {
        return ResponseUtil.validationError(res, 'Required fields: year, startDate, endDate');
      }

      const academicYear = await academicService.createAcademicYear(req.body);
      return ResponseUtil.created(res, 'Academic year created successfully', academicYear);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'Academic year already exists');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getAcademicYears(req: Request, res: Response): Promise<Response> {
    try {
      const academicYears = await academicService.getAcademicYears();
      return ResponseUtil.success(res, 'Academic years retrieved successfully', academicYears, academicYears.length);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getActiveAcademicYear(req: Request, res: Response): Promise<Response> {
    try {
      const academicYear = await academicService.getActiveAcademicYear();
      
      if (!academicYear) {
        return ResponseUtil.notFound(res, 'Active academic year');
      }

      return ResponseUtil.success(res, 'Active academic year retrieved successfully', academicYear);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getAcademicYearById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Academic year ID is required', 400);
      }
      
      const academicYear = await academicService.getAcademicYearById(id);
      
      if (!academicYear) {
        return ResponseUtil.notFound(res, 'Academic year');
      }

      return ResponseUtil.success(res, 'Academic year retrieved successfully', academicYear);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async setActiveAcademicYear(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Academic year ID is required', 400);
      }
      
      const academicYear = await academicService.setActiveAcademicYear(id);
      
      return ResponseUtil.success(res, 'Academic year set as active successfully', academicYear);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Academic year');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  // Terms
  async createTerm(req: Request, res: Response): Promise<Response> {
    try {
      const { name, termNumber, startDate, endDate, academicYearId } = req.body;
      
      if (!name || !termNumber || !startDate || !endDate || !academicYearId) {
        return ResponseUtil.validationError(res, 'Required fields: name, termNumber, startDate, endDate, academicYearId');
      }

      const term = await academicService.createTerm(req.body);
      return ResponseUtil.created(res, 'Term created successfully', term);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'Term already exists for this academic year');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getTermById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Term ID is required', 400);
      }
      
      const term = await academicService.getTermById(id);
      
      if (!term) {
        return ResponseUtil.notFound(res, 'Term');
      }

      return ResponseUtil.success(res, 'Term retrieved successfully', term);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getTermsByAcademicYear(req: Request, res: Response): Promise<Response> {
    try {
      const { academicYearId } = req.params;
      
      if (!academicYearId) {
        return ResponseUtil.error(res, 'Academic year ID is required', 400);
      }
      
      const terms = await academicService.getTermsByAcademicYear(academicYearId);
      
      return ResponseUtil.success(res, 'Terms retrieved successfully', terms, terms.length);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  // Classes
  async createClass(req: Request, res: Response): Promise<Response> {
    try {
      const { name, level, curriculum, academicYearId, schoolId } = req.body;
      
      if (!name || !level || !curriculum || !academicYearId || !schoolId) {
        return ResponseUtil.validationError(res, 'Required fields: name, level, curriculum, academicYearId, schoolId');
      }

      const classData = await academicService.createClass(req.body);
      return ResponseUtil.created(res, 'Class created successfully', classData);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'Class already exists for this academic year and school');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getClassById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Class ID is required', 400);
      }
      
      const classData = await academicService.getClassById(id);
      
      if (!classData) {
        return ResponseUtil.notFound(res, 'Class');
      }

      return ResponseUtil.success(res, 'Class retrieved successfully', classData);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getSchoolClasses(req: Request, res: Response): Promise<Response> {
    try {
      const { schoolId } = req.params;
      const { academicYearId } = req.query;
      
      if (!schoolId) {
        return ResponseUtil.error(res, 'School ID is required', 400);
      }
      
      const classes = await academicService.getSchoolClasses(
        schoolId, 
        academicYearId as string
      );
      
      return ResponseUtil.success(res, 'School classes retrieved successfully', classes, classes.length);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async updateClass(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Class ID is required', 400);
      }
      
      const classData = await academicService.updateClass(id, req.body);
      
      return ResponseUtil.success(res, 'Class updated successfully', classData);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Class');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  // Streams
  async createStream(req: Request, res: Response): Promise<Response> {
    try {
      const { name, classId, schoolId } = req.body;
      
      if (!name || !classId || !schoolId) {
        return ResponseUtil.validationError(res, 'Required fields: name, classId, schoolId');
      }

      const stream = await academicService.createStream(req.body);
      return ResponseUtil.created(res, 'Stream created successfully', stream);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return ResponseUtil.conflict(res, 'Stream already exists for this class');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getStreamById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Stream ID is required', 400);
      }
      
      const stream = await academicService.getStreamById(id);
      
      if (!stream) {
        return ResponseUtil.notFound(res, 'Stream');
      }

      return ResponseUtil.success(res, 'Stream retrieved successfully', stream);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getClassStreams(req: Request, res: Response): Promise<Response> {
    try {
      const { classId } = req.params;
      
      if (!classId) {
        return ResponseUtil.error(res, 'Class ID is required', 400);
      }
      
      const streams = await academicService.getClassStreams(classId);
      
      return ResponseUtil.success(res, 'Class streams retrieved successfully', streams, streams.length);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async updateStream(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Stream ID is required', 400);
      }
      
      const stream = await academicService.updateStream(id, req.body);
      
      return ResponseUtil.success(res, 'Stream updated successfully', stream);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Stream');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async deleteStream(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return ResponseUtil.error(res, 'Stream ID is required', 400);
      }
      
      await academicService.deleteStream(id);
      
      return ResponseUtil.success(res, 'Stream deleted successfully');
    } catch (error: any) {
      if (error.code === 'P2025') {
        return ResponseUtil.notFound(res, 'Stream');
      }
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  // Statistics
  async getAcademicStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const { academicYearId } = req.query;
      const statistics = await academicService.getAcademicStatistics(academicYearId as string);
      
      return ResponseUtil.success(res, 'Academic statistics retrieved successfully', statistics);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getClassPerformance(req: Request, res: Response): Promise<Response> {
    try {
      const { classId } = req.params;
      const { termId } = req.query;
      
      if (!classId) {
        return ResponseUtil.error(res, 'Class ID is required', 400);
      }
      
      const performance = await academicService.getClassPerformance(classId, termId as string);
      return ResponseUtil.success(res, 'Class performance retrieved successfully', performance);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }
}