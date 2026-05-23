import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

/**
 * Factory function for role-based authorization middleware.
 * Pass in allowed roles. The user must be authenticated first (authMiddleware).
 *
 * @example
 * router.post('/phim', authMiddleware, requireRoles(Role.ADMIN), createPhim)
 */
export const requireRoles = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Bạn chưa đăng nhập');
      }

      const userRole = req.user.vaiTro as Role;

      if (!roles.includes(userRole)) {
        throw new ForbiddenError(
          `Vai trò '${userRole}' không có quyền truy cập. Yêu cầu: ${roles.join(', ')}`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
