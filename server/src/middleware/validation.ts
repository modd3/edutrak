import { Request, Response, NextFunction } from 'express';
import { validationResult, body, param, query } from 'express-validator';
import { ResponseUtil } from '../utils/response';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error: any) => ({
      field: error.path || error.param || 'unknown',
      message: error.msg,
      value: error.value
    }));
    
    ResponseUtil.validationError(res, JSON.stringify(errorMessages));
    return;
  }
  next();
};

// User validation rules
export const validateLogin = [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

export const validateCreateUser = [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters')
    .trim(),
  body('lastName')
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters')
    .trim(),
  body('role')
    .isIn(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPPORT_STAFF'])
    .withMessage('Invalid role'),
  body('schoolId')
    .optional()
    .isUUID().withMessage('Invalid school ID'),
  handleValidationErrors
];

export const validateUpdateUser = [
  body('email')
    .optional()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('firstName')
    .optional()
    .notEmpty().withMessage('First name cannot be empty')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters')
    .trim(),
  body('lastName')
    .optional()
    .notEmpty().withMessage('Last name cannot be empty')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters')
    .trim(),
  body('role')
    .optional()
    .isIn(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPPORT_STAFF'])
    .withMessage('Invalid role'),
  handleValidationErrors
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
];

export const validateUUIDParam = [
  param('id')
    .isUUID().withMessage('Invalid ID format'),
  handleValidationErrors
];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

export const validateSchoolCreate = [
  body('name')
    .notEmpty().withMessage('School name is required')
    .isLength({ max: 255 }).withMessage('School name cannot exceed 255 characters')
    .trim(),
  body('type')
    .isIn(['PRIMARY', 'SECONDARY', 'TVET', 'SPECIAL_NEEDS', 'PRE_PRIMARY'])
    .withMessage('Invalid school type'),
  body('county')
    .notEmpty().withMessage('County is required')
    .trim(),
  body('ownership')
    .isIn(['PUBLIC', 'PRIVATE', 'FAITH_BASED', 'NGO'])
    .withMessage('Invalid ownership type'),
  body('boardingStatus')
    .isIn(['DAY', 'BOARDING', 'BOTH'])
    .withMessage('Invalid boarding status'),
  body('gender')
    .isIn(['BOYS', 'GIRLS', 'MIXED'])
    .withMessage('Invalid gender type'),
  handleValidationErrors
];