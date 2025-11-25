import { Request, Response } from 'express';
import { AssessmentService } from '../services/assessment.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';
import { AssessmentType, CompetencyLevel } from '@prisma/client';
import { RequestWithUser } from '../middleware/school-context';

// ========== ASSESSMENT DEFINITION CONTROLLERS ==========

/**
 * Create a new assessment definition
 */
export const createAssessmentDefinition = async (req: RequestWithUser, res: Response) => {
    try {
        const assessmentService = AssessmentService.withRequest(req);
        const { name, type, maxMarks, termId, classSubjectId, strandId } = req.body;

    // Validate required fields
    if (!name || !type || !termId || !classSubjectId) {
      return ResponseUtil.validationError(
        res,
        'name, type, termId, and classSubjectId are required'
      );
    }

    // Validate assessment type
    if (!Object.values(AssessmentType).includes(type)) {
      return ResponseUtil.validationError(
        res,
        `Invalid assessment type. Must be one of: ${Object.values(AssessmentType).join(', ')}`
      );
    }

    // For non-CBC assessments, maxMarks is required
    if (type !== 'COMPETENCY_BASED' && !maxMarks) {
      return ResponseUtil.validationError(res, 'maxMarks is required for non-CBC assessments');
    }

    const assessmentDef = await assessmentService.createAssessmentDefinition({
      name,
      type,
      maxMarks,
      termId,
      classSubjectId,
      strandId,
    });

    logger.info('Assessment definition created', {
      assessmentDefId: assessmentDef.id,
      createdBy: req.user?.userId,
    });

    return ResponseUtil.created(res, 'Assessment definition created successfully', assessmentDef);
  } catch (err: any) {
    logger.error('Error creating assessment definition', { error: err.message });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get assessment definition by ID
 */
export const getAssessmentDefinitionById = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const assessmentService = AssessmentService.withRequest(req);
    const assessmentDef = await assessmentService.getAssessmentDefinitionById(id);

    if (!assessmentDef) {
      return ResponseUtil.notFound(res, 'Assessment definition');
    }

    return ResponseUtil.success(res, 'Assessment definition fetched successfully', assessmentDef);
  } catch (err: any) {
    logger.error('Error fetching assessment definition', { 
      error: err.message, 
      id: req.params.id 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get all assessment definitions for a class subject
 */
export const getClassSubjectAssessmentDefinitions = async (req: RequestWithUser, res: Response) => {
  try {
    const { classSubjectId } = req.params;
    const assessmentService = AssessmentService.withRequest(req);
    const assessments = await assessmentService.getClassSubjectAssessmentDefinitions(classSubjectId);

    return ResponseUtil.success(
      res,
      'Assessment definitions fetched successfully',
      assessments,
      assessments.length
    );
  } catch (err: any) {
    logger.error('Error fetching class subject assessments', { 
      error: err.message, 
      classSubjectId: req.params.classSubjectId 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};
/// TODO: Add Update Assessment Def & Delete to the Service file
/**
 * Update assessment definition
 */
/*
export const updateAssessmentDefinition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, maxMarks, strandId } = req.body;

    const existing = await assessmentService.getAssessmentDefinitionById(id);
    if (!existing) {
      return ResponseUtil.notFound(res, 'Assessment definition');
    }

    const updated = await assessmentService.updateAssessmentDefinition(id, {
      name,
      type,
      maxMarks,
      strandId,
    });

    logger.info('Assessment definition updated', { assessmentDefId: id, updatedBy: req.user?.userId });

    return ResponseUtil.success(res, 'Assessment definition updated successfully', updated);
  } catch (err: any) {
    logger.error('Error updating assessment definition', { 
      error: err.message, 
      id: req.params.id 
    });
    return ResponseUtil.serverError(res, err.message);
  }
}; 
*/
/**
 * Delete assessment definition
 */
/*
export const deleteAssessmentDefinition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await assessmentService.getAssessmentDefinitionById(id);
    const existingResult = await assessmentService.getAssessmentDefinitionResults(id);
    if (!existing) {
      return ResponseUtil.notFound(res, 'Assessment definition');
    }

    // Check if there are any results
    if (existingResult && existingResult.length > 0) {
      return ResponseUtil.validationError(
        res,
        'Cannot delete assessment definition with existing results. Please delete results first.'
      );
    }

    await assessmentService.deleteAssessmentDefinition(id);

    logger.info('Assessment definition deleted', { assessmentDefId: id, deletedBy: req.user?.id });

    return ResponseUtil.success(res, 'Assessment definition deleted successfully');
  } catch (err: any) {
    logger.error('Error deleting assessment definition', { 
      error: err.message, 
      id: req.params.id 
    });
    return ResponseUtil.serverError(res, err.message);
  }
}; */

// ========== ASSESSMENT RESULT CONTROLLERS ==========

/**
 * Create a single assessment result
 */
export const createAssessmentResult = async (req: RequestWithUser, res: Response) => {
  try {
    const assessmentService = AssessmentService.withRequest(req);
    const { studentId, assessmentDefId, numericValue, grade, competencyLevel, comment } = req.body;
    const assessedById = req.user?.userId;

    // Validate required fields
    if (!studentId || !assessmentDefId || !assessedById) {
      return ResponseUtil.validationError(
        res,
        'studentId, assessmentDefId, and assessedById are required'
      );
    }

    // Validate that at least one scoring method is provided
    if (!numericValue && !grade && !competencyLevel) {
      return ResponseUtil.validationError(
        res,
        'At least one of numericValue, grade, or competencyLevel must be provided'
      );
    }

    // Validate competency level if provided
    if (competencyLevel && !Object.values(CompetencyLevel).includes(competencyLevel)) {
      return ResponseUtil.validationError(
        res,
        `Invalid competency level. Must be one of: ${Object.values(CompetencyLevel).join(', ')}`
      );
    }

    const result = await assessmentService.createAssessmentResult({
      studentId,
      assessmentDefId,
      numericValue,
      grade,
      competencyLevel,
      comment,
      assessedById,
    });

    logger.info('Assessment result created', {
      resultId: result.id,
      studentId,
      assessedById,
    });

    return ResponseUtil.created(res, 'Assessment result created successfully', result);
  } catch (err: any) {
    logger.error('Error creating assessment result', { error: err.message });
    
    // Handle unique constraint violation (student already has result for this assessment)
    if (err.code === 'P2002') {
      return ResponseUtil.conflict(res, 'Student already has a result for this assessment');
    }
    
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Create bulk assessment results
 */
export const createBulkAssessmentResults = async (req: RequestWithUser, res: Response) => {
  try {
    const assessmentService = AssessmentService.withRequest(req);
    const { results } = req.body;
    const assessedById = req.user?.userId;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return ResponseUtil.validationError(res, 'results array is required and must not be empty');
    }

    if (!assessedById) {
      return ResponseUtil.unauthorized(res, 'User not authenticated');
    }

    // Add assessedById to all results
    const resultsWithAssessor = results.map(result => ({
      ...result,
      assessedById,
    }));

    // Validate all results have required fields
    const invalidResults = resultsWithAssessor.filter(
      r => !r.studentId || !r.assessmentDefId || (!r.numericValue && !r.grade && !r.competencyLevel)
    );

    if (invalidResults.length > 0) {
      return ResponseUtil.validationError(
        res,
        `${invalidResults.length} results are missing required fields`
      );
    }

    const created = await assessmentService.createBulkAssessmentResults(resultsWithAssessor);

    logger.info('Bulk assessment results created', {
      count: created.count,
      assessedById,
    });

    return ResponseUtil.created(
      res,
      `${created.count} assessment results created successfully`,
      { count: created.count }
    );
  } catch (err: any) {
    logger.error('Error creating bulk assessment results', { error: err.message });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get assessment result by ID
 */
export const getAssessmentResultById = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const assessmentService = AssessmentService.withRequest(req);
    const result = await assessmentService.getAssessmentResultById(id);

    if (!result) {
      return ResponseUtil.notFound(res, 'Assessment result');
    }

    return ResponseUtil.success(res, 'Assessment result fetched successfully', result);
  } catch (err: any) {
    logger.error('Error fetching assessment result', { 
      error: err.message, 
      id: req.params.id 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Update assessment result
 */
export const updateAssessmentResult = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const { numericValue, grade, competencyLevel, comment } = req.body;
    const assessmentService = AssessmentService.withRequest(req);

    const updated = await assessmentService.updateAssessmentResult(id, {
      numericValue,
      grade,
      competencyLevel,
      comment,
    });

    logger.info('Assessment result updated', { resultId: id, updatedBy: req.user?.userId });

    return ResponseUtil.success(res, 'Assessment result updated successfully', updated);
  } catch (err: any) {
    logger.error('Error updating assessment result', { 
      error: err.message, 
      id: req.params.id 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Delete assessment result
 */
export const deleteAssessmentResult = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const assessmentService = AssessmentService.withRequest(req);
    await assessmentService.deleteAssessmentResult(id);

    logger.info('Assessment result deleted', { resultId: id, deletedBy: req.user?.userId });

    return ResponseUtil.success(res, 'Assessment result deleted successfully');
  } catch (err: any) {
    logger.error('Error deleting assessment result', { 
      error: err.message, 
      id: req.params.id 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get student assessment results with filters
 */
export const getStudentAssessmentResults = async (req: RequestWithUser, res: Response) => {
  try {
    const { studentId } = req.params;
    const { termId, classSubjectId, assessmentType, page, limit } = req.query;
    const assessmentService = AssessmentService.withRequest(req);
    const results = await assessmentService.getStudentAssessmentResults(studentId, {
      termId: termId as string,
      classSubjectId: classSubjectId as string,
      assessmentType: assessmentType as AssessmentType,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    return ResponseUtil.paginated(
      res,
      'Student assessment results fetched successfully',
      results.results,
      results.pagination
    );
  } catch (err: any) {
    logger.error('Error fetching student assessment results', { 
      error: err.message, 
      studentId: req.params.studentId 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get all results for an assessment definition
 */
export const getAssessmentDefinitionResults = async (req: RequestWithUser, res: Response) => {
  try {
    const { assessmentDefId } = req.params;
    const assessmentService = AssessmentService.withRequest(req);
    const results = await assessmentService.getAssessmentDefinitionResults(assessmentDefId);

    return ResponseUtil.success(
      res,
      'Assessment results fetched successfully',
      results,
      results.length
    );
  } catch (err: any) {
    logger.error('Error fetching assessment definition results', { 
      error: err.message, 
      assessmentDefId: req.params.assessmentDefId 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

// ========== STATISTICS & REPORTS ==========

/**
 * Calculate student term average
 */
export const calculateStudentTermAverage = async (req: RequestWithUser, res: Response) => {
  try {
    const { studentId, termId } = req.params;
    const assessmentService = AssessmentService.withRequest(req);
    const average = await assessmentService.calculateStudentTermAverage(studentId, termId);

    return ResponseUtil.success(res, 'Student term average calculated successfully', average);
  } catch (err: any) {
    logger.error('Error calculating student term average', { 
      error: err.message, 
      studentId: req.params.studentId,
      termId: req.params.termId 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get class subject statistics
 */
export const getClassSubjectStatistics = async (req: RequestWithUser, res: Response) => {
  try {
    const { classSubjectId } = req.params;
    const { termId } = req.query;
    const assessmentService = AssessmentService.withRequest(req);

    const statistics = await assessmentService.getClassSubjectStatistics(
      classSubjectId,
      termId as string
    );

    return ResponseUtil.success(
      res,
      'Class subject statistics fetched successfully',
      statistics
    );
  } catch (err: any) {
    logger.error('Error fetching class subject statistics', { 
      error: err.message, 
      classSubjectId: req.params.classSubjectId 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Generate student term report
 */
export const generateStudentTermReport = async (req: RequestWithUser, res: Response) => {
  try {
    const { studentId, termId } = req.params;
    const assessmentService = AssessmentService.withRequest(req);
    const report = await assessmentService.generateStudentTermReport(studentId, termId);

    logger.info('Student term report generated', {
      studentId,
      termId,
      generatedBy: req.user?.userId,
    });

    return ResponseUtil.success(res, 'Student term report generated successfully', report);
  } catch (err: any) {
    logger.error('Error generating student term report', { 
      error: err.message, 
      studentId: req.params.studentId,
      termId: req.params.termId 
    });
    
    if (err.message === 'Student not found') {
      return ResponseUtil.notFound(res, 'Student');
    }
    
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get assessment analytics for a class
 */
export const getClassAssessmentAnalytics = async (req: RequestWithUser, res: Response) => {
  try {
    const { classId } = req.params;
    const { termId, academicYearId } = req.query;

    // This would be a more complex analytics method
    // For now, return a basic structure
    const analytics = {
      classId,
      termId,
      academicYearId,
      message: 'Analytics endpoint - to be implemented with specific requirements',
    };

    return ResponseUtil.success(res, 'Class assessment analytics fetched successfully', analytics);
  } catch (err: any) {
    logger.error('Error fetching class assessment analytics', { 
      error: err.message, 
      classId: req.params.classId 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Export assessment results (CSV/Excel)
 */
export const exportAssessmentResults = async (req: RequestWithUser, res: Response) => {
  try {
    const { assessmentDefId } = req.params;
    const { format = 'csv' } = req.query;
    const assessmentService = AssessmentService.withRequest(req);
    const results = await assessmentService.getAssessmentDefinitionResults(assessmentDefId);

    if (results.length === 0) {
      return ResponseUtil.notFound(res, 'Assessment results');
    }

    // Format the data for export
    const exportData = results.map(result => ({
      'Student Name': `${result.student.firstName} ${result.student.lastName}`,
      'Admission No': result.student.admissionNo,
      'Numeric Value': result.numericValue ?? '',
      'Grade': result.grade ?? '',
      'Competency Level': result.competencyLevel ?? '',
      'Comment': result.comment ?? '',
      'Date': result.createdAt.toISOString(),
    }));

    logger.info('Assessment results exported', {
      assessmentDefId,
      format,
      count: results.length,
      exportedBy: req.user?.userId,
    });

    return ResponseUtil.success(
      res,
      'Assessment results prepared for export',
      {
        format,
        count: exportData.length,
        data: exportData,
      }
    );
  } catch (err: any) {
    logger.error('Error exporting assessment results', { 
      error: err.message, 
      assessmentDefId: req.params.assessmentDefId 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};