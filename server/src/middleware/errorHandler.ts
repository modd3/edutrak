import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId
  });

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        const field = (error.meta?.target as string[])?.join(', ') || 'field';
        return ResponseUtil.conflict(res, `A record with this ${field} already exists`);
      case 'P2025':
        return ResponseUtil.notFound(res, 'Record not found');
      case 'P2003':
        return ResponseUtil.error(res, 'Foreign key constraint failed', 400);
      case 'P2014':
        return ResponseUtil.error(res, 'Invalid ID provided', 400);
      case 'P2016':
        return ResponseUtil.error(res, 'Query interpretation error', 400);
      default:
        logger.error('Prisma error', { code: error.code, meta: error.meta });
        return ResponseUtil.serverError(res, `Database error: ${error.code}`);
    }
  }

  // Prisma unknown errors
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return ResponseUtil.serverError(res, 'Unknown database error occurred');
  }

  // Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return ResponseUtil.validationError(res, 'Invalid data provided');
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return ResponseUtil.unauthorized(res, 'Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    return ResponseUtil.unauthorized(res, 'Token expired');
  }

  // Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return ResponseUtil.error(res, 'File too large', 413);
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return ResponseUtil.error(res, 'Unexpected field', 400);
  }

  // Default to 500 server error
  const message = process.env.NODE_ENV === 'development' ? error.message : 'Internal server error';
  return ResponseUtil.serverError(res, message);
};