import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { Prisma } from '@prisma/client';
import { env } from '../config/env';

/**
 * Global error handling middleware
 * Must be registered last with 4 arguments (err, req, res, next)
 */
export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void => {
  // ========================
  // Operational AppErrors
  // ========================
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  // ========================
  // Prisma Errors
  // ========================
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const field = (err.meta?.target as string[])?.join(', ') ?? 'trường';
        sendError(res, `Giá trị của ${field} đã tồn tại trong hệ thống`, 409);
        return;
      }
      case 'P2025':
        sendError(res, 'Không tìm thấy bản ghi', 404);
        return;
      case 'P2003':
        sendError(res, 'Vi phạm ràng buộc khóa ngoại', 400);
        return;
      default:
        sendError(res, 'Lỗi cơ sở dữ liệu', 500);
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    sendError(res, 'Dữ liệu không hợp lệ cho cơ sở dữ liệu', 400);
    return;
  }

  // ========================
  // JWT Errors (handled here as fallback)
  // ========================
  if (err instanceof Error) {
    if (err.name === 'JsonWebTokenError') {
      sendError(res, 'Token không hợp lệ', 401);
      return;
    }
    if (err.name === 'TokenExpiredError') {
      sendError(res, 'Token đã hết hạn', 401);
      return;
    }
  }

  // ========================
  // Unknown / Unexpected Errors
  // ========================
  const message = env.isDevelopment() && err instanceof Error
    ? err.message
    : 'Đã xảy ra lỗi máy chủ nội bộ';

  if (env.isDevelopment() && err instanceof Error) {
    console.error('❌ Unexpected Error:', err.stack);
  } else {
    console.error('❌ Unexpected Error:', err);
  }

  sendError(res, message, 500);
};
