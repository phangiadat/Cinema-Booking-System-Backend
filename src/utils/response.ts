import { Response } from 'express';

// ========================
// Standard Response Format
// ========================

export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

/**
 * Send a success response
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
  };
  return res.status(statusCode).json(response);
};


/**
 * Send a created response (201)
 */
export const sendCreated = <T>(
  res: Response,
  message: string,
  data?: T,
): Response => {
  return sendSuccess(res, message, data, 201);
};

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Send a paginated success response
 */
export const sendPaginatedSuccess = <T>(
  res: Response,
  message: string,
  data: T[],
  pagination: PaginationMetadata,
  statusCode = 200,
): Response => {
  const response: PaginatedApiResponse<T> = {
    success: true,
    message,
    data,
    pagination,
  };
  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown,
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    ...(errors !== undefined && { errors }),
  };
  return res.status(statusCode).json(response);
};
