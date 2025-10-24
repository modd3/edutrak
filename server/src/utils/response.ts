import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
  timestamp: Date;
}

export class ResponseUtil {
  static success<T>(res: Response, message: string, data?: T, count?: number): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      count,
      timestamp: new Date(),
    };

    if (count === undefined || count === 0) {
      delete response.count;
    }

    return res.status(200).json(response);
  }

  static created<T>(res: Response, message: string, data?: T): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date(),
    };

    return res.status(201).json(response);
  }

  static paginated<T>(
    res: Response, 
    message: string, 
    data: T[], 
    pagination: { page: number; limit: number; total: number }
  ): Response {
    const response: ApiResponse<T[]> = {
      success: true,
      message,
      data,
      count: data.length,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        pages: Math.ceil(pagination.total / pagination.limit),
      },
      timestamp: new Date(),
    };

    return res.status(200).json(response);
  }

  static error(res: Response, message: string, statusCode: number = 400, error?: string): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error,
      timestamp: new Date(),
    };

    return res.status(statusCode).json(response);
  }

  static notFound(res: Response, resource: string = 'Resource'): Response {
    return this.error(res, `${resource} not found`, 404);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized access'): Response {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Insufficient permissions'): Response {
    return this.error(res, message, 403);
  }

  static serverError(res: Response, error?: string): Response {
    return this.error(res, 'Internal server error', 500, error);
  }

  static validationError(res: Response, message: string = 'Validation failed'): Response {
    return this.error(res, message, 422);
  }

  static conflict(res: Response, message: string = 'Resource already exists'): Response {
    return this.error(res, message, 409);
  }
}

export const ErrorMessages = {
  NOT_FOUND: (resource: string) => `${resource} not found`,
  ALREADY_EXISTS: (resource: string) => `${resource} already exists`,
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Insufficient permissions',
  VALIDATION_FAILED: 'Validation failed',
  SERVER_ERROR: 'Internal server error',
};