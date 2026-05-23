import { Request, Response } from 'express';
import { sendError } from '../utils/response';

/**
 * 404 Not Found middleware
 * Catches all unmatched routes
 */
export const notFoundMiddleware = (req: Request, res: Response): void => {
  sendError(
    res,
    `Không tìm thấy route: ${req.method} ${req.originalUrl}`,
    404,
  );
};
