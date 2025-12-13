// src/controllers/academic.controller.ts
import { Request, Response } from 'express';
import { AcademicService } from '../services/academic.service';
import { RequestWithUser } from '../middleware/school-context';
import { Curriculum, Pathway, TermName } from '@prisma/client';
import logger from '../utils/logger';
import { stream } from 'winston';
import { ResponseUtil } from '../utils/response';

export class AcademicController {
  // Academic Years
  static async createAcademicYear(req: RequestWithUser, res: Response) {
    try {
      const { year, startDate, endDate, isActive } = req.body;
      
      const academicService = AcademicService.withRequest(req);
      const academicYear = await academicService.createAcademicYearWithTerms({
        year: parseInt(year),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: Boolean(isActive),
        terms: req.body.terms,
      });

      res.status(201).json({
        success: true,
        data: academicYear,
        message: 'Academic year created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating academic year:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        message: 'Failed to create academic year',
      });
    }
  }

  static async getAcademicYears(req: RequestWithUser, res: Response) {
    try {
      const academicService = AcademicService.withRequest(req);
      const academicYears = await academicService.getAcademicYears();

      ResponseUtil.success(res, 'Academic Years Fetched Successfully!', academicYears);
    } catch (error: any) {
      logger.error('Error fetching academic years:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to fetch academic years',
      });
    }
  }

  static async getActiveAcademicYear(req: RequestWithUser, res: Response) {
    try {
      const academicService = AcademicService.withRequest(req);
      const activeYear = await academicService.getActiveAcademicYear();

      if (!activeYear) {
        return res.status(404).json({
          success: false,
          error: 'NO_ACTIVE_YEAR',
          message: 'No active academic year found',
        });
      }

      res.json({
        success: true,
        data: activeYear,
        message: 'Active academic year fetched successfully',
      });
    } catch (error: any) {
      logger.error('Error fetching active academic year:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to fetch active academic year',
      });
    }
    return 1; 
  }

  static async getAcademicYearById(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const academicService = AcademicService.withRequest(req);
      const academicYear = await academicService.getAcademicYearById(id);

      if (!academicYear) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Academic year not found',
        });
      }

      res.json({
        success: true,
        data: academicYear,
        message: 'Academic year fetched successfully',
      });
    } catch (error: any) {
      logger.error('Error fetching academic year:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to fetch academic year',
      });
    }
    return 1;
  }

  static async setActiveAcademicYear(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const academicService = AcademicService.withRequest(req);
      const academicYear = await academicService.setActiveAcademicYear(id);

      res.json({
        success: true,
        data: academicYear,
        message: 'Academic year activated successfully',
      });
    } catch (error: any) {
      logger.error('Error setting active academic year:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        message: 'Failed to set active academic year',
      });
    }
  }

  // Terms
  static async createTerm(req: RequestWithUser, res: Response) {
    try {
      const { name, termNumber, startDate, endDate, academicYearId } = req.body;
      
      const academicService = AcademicService.withRequest(req);
      const term = await academicService.createTerm({
        name: name as TermName,
        termNumber: parseInt(termNumber),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        academicYearId,
      });

      res.status(201).json({
        success: true,
        data: term,
        message: 'Term created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating term:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        message: 'Failed to create term',
      });
    }
  }

  static async getTermById(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const academicService = AcademicService.withRequest(req);
      const term = await academicService.getTermById(id);

      if (!term) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Term not found',
        });
      }

      res.json({
        success: true,
        data: term,
        message: 'Term fetched successfully',
      });
    } catch (error: any) {
      logger.error('Error fetching term:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to fetch term',
      });
    }
    return 1;
  }

  static async getTermsByAcademicYear(req: RequestWithUser, res: Response) {
    try {
      const { academicYearId } = req.params;
      const academicService = AcademicService.withRequest(req);
      const terms = await academicService.getTermsByAcademicYear(academicYearId);

      res.json({
        success: true,
        data: terms,
        message: 'Terms fetched successfully',
      });
    } catch (error: any) {
      logger.error('Error fetching terms:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to fetch terms',
      });
    }
  }

  // Classes
  static async createClass(req: RequestWithUser, res: Response) {
    try {
      const { name, level, curriculum, academicYearId, classTeacherId, pathway } = req.body;
      
      const academicService = AcademicService.withRequest(req);
      const classData = await academicService.createClass({
        name,
        level,
        curriculum: curriculum as Curriculum,
        academicYearId,
        classTeacherId,
        pathway: pathway as Pathway,
      });

      res.status(201).json({
        success: true,
        data: classData,
        message: 'Class created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating class:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        message: 'Failed to create class',
      });
    }
  }

  static async getClassById(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const academicService = AcademicService.withRequest(req);
      const classData = await academicService.getClassById(id);

      if (!classData) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Class not found',
        });
      }

      res.json({
        success: true,
        data: classData,
        message: 'Class fetched successfully',
      });
    } catch (error: any) {
      logger.error('Error fetching class:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to fetch class',
      });
    }
    return 1;
  }

  static async getSchoolClasses(req: RequestWithUser, res: Response) {
    try {
      const { academicYearId } = req.query;
      const academicService = AcademicService.withRequest(req);
      
      const classes = await academicService.getSchoolClasses(
        academicYearId as string
      );

      res.json({
        success: true,
        data: classes,
        message: 'Classes fetched successfully',
      });
    } catch (error: any) {
      logger.error('Error fetching classes:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to fetch classes',
      });
    }
  }

  static async updateClass(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const academicService = AcademicService.withRequest(req);
      const classData = await academicService.updateClass(id, updateData);

      res.json({
        success: true,
        data: classData,
        message: 'Class updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating class:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        message: 'Failed to update class',
      });
    }
  }

  // Streams
  static async createStream(req: RequestWithUser, res: Response) {
    try {
      const { name, capacity, classId, streamTeacherId } = req.body;
      
      const academicService = AcademicService.withRequest(req);
      const stream = await academicService.createStream({
        name,
        capacity: capacity ? parseInt(capacity) : undefined,
        classId,
        streamTeacherId,
      });

      res.status(201).json({
        success: true,
        data: stream,
        message: 'Stream created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating stream:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        message: 'Failed to create stream',
      });
    }
  }

  static async getStreamById(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const academicService = AcademicService.withRequest(req);
      const stream = await academicService.getStreamById(id);

      if (!stream) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Stream not found',
        });
      }

      res.json({
        success: true,
        data: stream,
        message: 'Stream fetched successfully',
      });
    } catch (error: any) {
      logger.error('Error fetching stream:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to fetch stream',
      });
    }
    return res.json(stream);
  }

  static async getClassStreams(req: RequestWithUser, res: Response) {
    try {
      const { classId } = req.params;
      const academicService = AcademicService.withRequest(req);
      const streams = await academicService.getClassStreams(classId);

      res.json({
        success: true,
        data: streams,
        message: 'Class streams fetched successfully',
      });
    } catch (error: any) {
      logger.error('Error fetching class streams:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to fetch class streams',
      });
    }
  }

  static async updateStream(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const academicService = AcademicService.withRequest(req);
      const stream = await academicService.updateStream(id, updateData);

      res.json({
        success: true,
        data: stream,
        message: 'Stream updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating stream:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        message: 'Failed to update stream',
      });
    }
  }

  static async deleteStream(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const academicService = AcademicService.withRequest(req);
      const stream = await academicService.deleteStream(id);

      res.json({
        success: true,
        data: stream,
        message: 'Stream deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting stream:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        message: 'Failed to delete stream',
      });
    }
  }

  // Statistics and Analytics
  static async getAcademicStatistics(req: RequestWithUser, res: Response) {
    try {
      const { academicYearId } = req.query;
      const academicService = AcademicService.withRequest(req);
      
      const statistics = await academicService.getAcademicStatistics(
        academicYearId as string
      );

      res.json({
        success: true,
        data: statistics,
        message: 'Academic statistics fetched successfully',
      });
    } catch (error: any) {
      logger.error('Error fetching academic statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to fetch academic statistics',
      });
    }
  }

  static async getClassPerformance(req: RequestWithUser, res: Response) {
    try {
      const { classId } = req.params;
      const { termId } = req.query;
      
      const academicService = AcademicService.withRequest(req);
      const performance = await academicService.getClassPerformance(
        classId, 
        termId as string
      );

      res.json({
        success: true,
        data: performance,
        message: 'Class performance fetched successfully',
      });
    } catch (error: any) {
      logger.error('Error fetching class performance:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to fetch class performance',
      });
    }
  }

  // Bulk Operations
  static async createMultipleClasses(req: RequestWithUser, res: Response) {
    try {
      const { classes } = req.body;
      
      if (!Array.isArray(classes) || classes.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_DATA',
          message: 'Classes array is required',
        });
      }

      const academicService = AcademicService.withRequest(req);
      const results = [];

      for (const classData of classes) {
        try {
          const createdClass = await academicService.createClass(classData);
          results.push({ success: true, data: createdClass });
        } catch (error: any) {
          results.push({ 
            success: false, 
            error: error.message,
            data: classData 
          });
        }
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      res.status(201).json({
        success: true,
        data: {
          created: successful.length,
          failed: failed.length,
          results,
        },
        message: `Bulk class creation completed: ${successful.length} successful, ${failed.length} failed`,
      });
    } catch (error: any) {
      logger.error('Error in bulk class creation:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        message: 'Failed to create classes in bulk',
      });
    }
    return res.statusMessage;
  }

  // Utility endpoints
  static async getAcademicOverview(req: RequestWithUser, res: Response) {
    try {
      const academicService = AcademicService.withRequest(req);
      
      const [activeYear, statistics, recentClasses] = await Promise.all([
        academicService.getActiveAcademicYear(),
        academicService.getAcademicStatistics(),
        academicService.getSchoolClasses().then(result => result.data.slice(0, 5)),
      ]);

      res.json({
        success: true,
        data: {
          activeAcademicYear: activeYear,
          statistics,
          recentClasses,
        },
        message: 'Academic overview fetched successfully',
      });
    } catch (error: any) {
      logger.error('Error fetching academic overview:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to fetch academic overview',
      });
    }
  }
}

export default AcademicController;
