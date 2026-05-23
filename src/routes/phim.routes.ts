import { Router } from 'express';
import * as phimController from '../controllers/phim.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createPhimSchema,
  updatePhimSchema,
  phimQuerySchema,
} from '../validators/phim.validator';
import { Role } from '@prisma/client';

const router = Router();

/**
 * @route   GET /api/v1/phim
 * @desc    Lấy danh sách phim (có thể lọc, tìm kiếm, phân trang)
 * @access  Public (Optional auth to allow Admin to see inactive movies)
 */
router.get(
  '/',
  optionalAuthMiddleware,
  validate(phimQuerySchema, 'query'),
  phimController.getDanhSachPhim,
);

/**
 * @route   GET /api/v1/phim/:maPhim
 * @desc    Lấy chi tiết một phim theo mã
 * @access  Public (Optional auth to allow Admin to see inactive movie details)
 */
router.get(
  '/:maPhim',
  optionalAuthMiddleware,
  phimController.getChiTietPhim,
);

/**
 * @route   POST /api/v1/phim
 * @desc    Tạo phim mới
 * @access  Private - ADMIN only
 */
router.post(
  '/',
  authMiddleware,
  requireRoles(Role.ADMIN),
  validate(createPhimSchema),
  phimController.taoPhim,
);

/**
 * @route   PUT /api/v1/phim/:maPhim
 * @desc    Cập nhật toàn bộ thông tin phim
 * @access  Private - ADMIN only
 */
router.put(
  '/:maPhim',
  authMiddleware,
  requireRoles(Role.ADMIN),
  validate(updatePhimSchema),
  phimController.capNhatPhim,
);

/**
 * @route   PATCH /api/v1/phim/:maPhim/soft-delete
 * @desc    Ẩn phim (soft delete - set KhaDung = false)
 * @access  Private - ADMIN only
 */
router.patch(
  '/:maPhim/soft-delete',
  authMiddleware,
  requireRoles(Role.ADMIN),
  phimController.anPhim,
);

/**
 * @route   PATCH /api/v1/phim/:maPhim/restore
 * @desc    Khôi phục phim (set KhaDung = true)
 * @access  Private - ADMIN only
 */
router.patch(
  '/:maPhim/restore',
  authMiddleware,
  requireRoles(Role.ADMIN),
  phimController.khoiPhucPhim,
);

/**
 * @route   DELETE /api/v1/phim/:maPhim
 * @desc    Xóa vĩnh viễn phim khỏi cơ sở dữ liệu
 * @access  Private - ADMIN only
 */
router.delete(
  '/:maPhim',
  authMiddleware,
  requireRoles(Role.ADMIN),
  phimController.xoaPhim,
);

export default router;
